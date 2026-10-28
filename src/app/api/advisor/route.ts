import { GoogleGenAI } from "@google/genai";
import {
  fallbackSummary,
  HEADCOUNT_BANDS,
  HEADCOUNT_CONTEXT_NOTE,
  parseModelJson,
  rankCities,
} from "@/lib/advisor";
import { gccData, registrySectors } from "@/lib/data";
import type {
  AdvisorCityResult,
  AdvisorGoalId,
  AdvisorRequest,
  AdvisorResponse,
  HeadcountBand,
} from "@/lib/types";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const hitsByIp = new Map<string, number[]>();

const SYSTEM_PROMPT =
  "You are the GCC Atlas Advisor. Explain this pre-calculated ranking. Use ONLY the supplied data. Never invent figures. Return JSON: { summary: string, cities: [{ city: string, reason: string }], data_gaps: string[] }.";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function allowRequest(ip: string): boolean {
  const now = Date.now();
  const recent = (hitsByIp.get(ip) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hitsByIp.set(ip, recent);
    return false;
  }
  recent.push(now);
  hitsByIp.set(ip, recent);
  return true;
}

function isGoalId(value: unknown): value is AdvisorGoalId {
  return gccData.meta.advisor_goals_supported.some((goal) => goal.id === value);
}

function isHeadcountBand(value: unknown): value is HeadcountBand {
  return HEADCOUNT_BANDS.includes(value as HeadcountBand);
}

function buildDeterministicResponse(
  request: AdvisorRequest,
  ranking: ReturnType<typeof rankCities>,
  goalLabel: string,
  fallback: boolean,
): AdvisorResponse {
  const cities: AdvisorCityResult[] = ranking.ranked.slice(0, 3).map((row) => ({
    city: row.city,
    reason: row.templateReason,
    score: row.score,
    metricLabels: row.metricLabels,
    policy: row.policy,
    dataGap: row.dataGap,
    supportingCompanies: row.supportingCompanies,
    supportingSignals: row.supportingSignals,
  }));

  return {
    summary: fallbackSummary(request, ranking, goalLabel),
    cities,
    data_gaps: ranking.dataGaps,
    fallback,
    withheld: ranking.withheld,
    withholdReason: ranking.withholdReason,
    headcountNote: HEADCOUNT_CONTEXT_NOTE,
  };
}

function mergeModelExplanation(
  request: AdvisorRequest,
  ranking: ReturnType<typeof rankCities>,
  goalLabel: string,
  modelText: string,
): AdvisorResponse | null {
  const parsed = parseModelJson(modelText);
  if (!parsed) return null;

  const top = ranking.ranked.slice(0, 3);
  const allowed = new Set(top.map((row) => row.city));
  const reasons = new Map<string, string>();
  if (Array.isArray(parsed.cities)) {
    for (const item of parsed.cities) {
      if (!item || typeof item !== "object") continue;
      const record = item as { city?: unknown; reason?: unknown };
      if (typeof record.city !== "string" || !allowed.has(record.city)) continue;
      if (typeof record.reason === "string") {
        reasons.set(record.city, record.reason);
      }
    }
  }

  const summary =
    typeof parsed.summary === "string" && parsed.summary.trim()
      ? parsed.summary.trim()
      : fallbackSummary(request, ranking, goalLabel);

  const extraGaps = Array.isArray(parsed.data_gaps)
    ? parsed.data_gaps.filter((gap): gap is string => typeof gap === "string")
    : [];

  const cities: AdvisorCityResult[] = top.map((row) => ({
    city: row.city,
    reason: reasons.get(row.city) || row.templateReason,
    score: row.score,
    metricLabels: row.metricLabels,
    policy: row.policy,
    dataGap: row.dataGap,
    supportingCompanies: row.supportingCompanies,
    supportingSignals: row.supportingSignals,
  }));

  return {
    summary,
    cities,
    data_gaps: [...ranking.dataGaps, ...extraGaps],
    fallback: false,
    withheld: ranking.withheld,
    withholdReason: ranking.withholdReason,
    headcountNote: HEADCOUNT_CONTEXT_NOTE,
  };
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!allowRequest(ip)) {
    return Response.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as Partial<AdvisorRequest>;
  const sectors = registrySectors(gccData);
  if (!payload.sector || !sectors.includes(payload.sector)) {
    return Response.json({ error: "Sector must match a registry sector." }, { status: 400 });
  }
  if (!isHeadcountBand(payload.headcountBand)) {
    return Response.json({ error: "Invalid planned headcount band." }, { status: 400 });
  }
  if (!isGoalId(payload.priority)) {
    return Response.json(
      { error: "Priority must be one of meta.advisor_goals_supported." },
      { status: 400 },
    );
  }

  const advisorRequest: AdvisorRequest = {
    sector: payload.sector,
    headcountBand: payload.headcountBand,
    priority: payload.priority,
  };
  const goalLabel =
    gccData.meta.advisor_goals_supported.find((goal) => goal.id === advisorRequest.priority)
      ?.label ?? advisorRequest.priority;
  const ranking = rankCities(gccData, advisorRequest);
  const fallback = buildDeterministicResponse(
    advisorRequest,
    ranking,
    goalLabel,
    true,
  );

  if (ranking.withheld) {
    return Response.json({ ...fallback, fallback: false });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(fallback);
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const rankingForModel = ranking.ranked.slice(0, 3).map((row) => ({
    city: row.city,
    score: row.score,
    metricLabels: row.metricLabels,
    policyName: row.policy.name,
    policyScope: row.policy.scope,
    dataGap: row.dataGap,
    templateReason: row.templateReason,
  }));

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: JSON.stringify({
        request: advisorRequest,
        goalLabel,
        headcountNote: HEADCOUNT_CONTEXT_NOTE,
        ranking: rankingForModel,
        data_gaps: ranking.dataGaps,
      }),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        abortSignal: AbortSignal.timeout(20_000),
        temperature: 0.2,
      },
    });
    const text = response.text;
    if (!text) return Response.json(fallback);
    const merged = mergeModelExplanation(
      advisorRequest,
      ranking,
      goalLabel,
      text,
    );
    return Response.json(merged ?? fallback);
  } catch {
    return Response.json(fallback);
  }
}
