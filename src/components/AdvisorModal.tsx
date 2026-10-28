"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Loader2, X } from "lucide-react";
import { HEADCOUNT_BANDS, HEADCOUNT_CONTEXT_NOTE } from "@/lib/advisor";
import { registrySectors } from "@/lib/data";
import type {
  AdvisorGoalId,
  AdvisorResponse,
  GccData,
  HeadcountBand,
} from "@/lib/types";

export function AdvisorModal({
  data,
  open,
  onClose,
  onSelectCompany,
}: {
  data: GccData;
  open: boolean;
  onClose: () => void;
  onSelectCompany: (company: string) => void;
}) {
  const sectors = registrySectors(data);
  const goals = data.meta.advisor_goals_supported;
  const [sector, setSector] = useState(sectors[0] ?? "");
  const [headcountBand, setHeadcountBand] = useState<HeadcountBand>("500-1000");
  const [priority, setPriority] = useState<AdvisorGoalId>(
    (goals[0]?.id as AdvisorGoalId) ?? "momentum",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdvisorResponse | null>(null);

  const exampleReady = useMemo(
    () => sectors.includes("Technology") && goals.some((goal) => goal.id === "peers"),
    [sectors, goals],
  );

  if (!open) return null;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sector, headcountBand, priority }),
      });
      const payload = (await response.json()) as AdvisorResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Advisor request failed.");
      }
      setResult(payload);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Advisor request failed.");
    } finally {
      setLoading(false);
    }
  }

  function fillExample() {
    if (sectors.includes("Technology")) setSector("Technology");
    setHeadcountBand("500-1000");
    if (goals.some((goal) => goal.id === "peers")) setPriority("peers");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center">
      <div
        role="dialog"
        aria-labelledby="advisor-title"
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#164A38] bg-[#0C2E22] p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="advisor-title" className="font-serif text-2xl text-[#F4F1E8]">
              City-Fit Advisor
            </h2>
            <p className="mt-1 text-sm text-[#A8B8A9]">
              Rankings are computed from this dataset first. Gemini only explains them.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#A8B8A9] hover:bg-[#103E2E] hover:text-[#F4F1E8]"
            aria-label="Close advisor"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {sectors.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#164A38] px-4 py-8 text-sm text-[#A8B8A9]">
            No sectors in the registry, so the advisor cannot run.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-xs text-[#A8B8A9]">
              Sector
              <select
                value={sector}
                onChange={(event) => setSector(event.target.value)}
                className="mt-1 w-full rounded-full border border-[#164A38] bg-[#103E2E] px-3 py-2 text-sm text-[#F4F1E8]"
              >
                {sectors.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-[#A8B8A9]">
              Planned headcount
              <select
                value={headcountBand}
                onChange={(event) =>
                  setHeadcountBand(event.target.value as HeadcountBand)
                }
                className="mt-1 w-full rounded-full border border-[#164A38] bg-[#103E2E] px-3 py-2 text-sm text-[#F4F1E8]"
              >
                {HEADCOUNT_BANDS.map((band) => (
                  <option key={band} value={band}>
                    {band}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[11px] leading-4">
                {HEADCOUNT_CONTEXT_NOTE}
              </span>
            </label>
            <label className="text-xs text-[#A8B8A9]">
              Priority
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as AdvisorGoalId)
                }
                className="mt-1 w-full rounded-full border border-[#164A38] bg-[#103E2E] px-3 py-2 text-sm text-[#F4F1E8]"
              >
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fillExample}
            disabled={!exampleReady}
            className="rounded-full border border-[#164A38] px-4 py-2 text-sm text-[#F4F1E8] disabled:opacity-40"
          >
            Try an example
          </button>
          <button
            type="button"
            onClick={generate}
            disabled={loading || sectors.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-[#DDF285] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Generate recommendation
          </button>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-[#A8B8A9]">Generating recommendation…</p>
        ) : null}
        {error ? (
          <p className="mt-6 rounded-2xl border border-red-400/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {result ? <AdvisorResult result={result} onSelectCompany={onSelectCompany} /> : null}
      </div>
    </div>
  );
}

function AdvisorResult({
  result,
  onSelectCompany,
}: {
  result: AdvisorResponse;
  onSelectCompany: (company: string) => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      {result.fallback ? (
        <p className="rounded-full bg-[#DDF285]/15 px-3 py-1 text-xs text-[#DDF285]">
          Generated from fallback
        </p>
      ) : null}
      <p className="text-sm leading-6 text-[#C9D4C8]">{result.summary}</p>
      {result.withheld ? (
        <p className="rounded-2xl border border-dashed border-[#164A38] px-4 py-6 text-sm text-[#A8B8A9]">
          {result.withholdReason}
        </p>
      ) : result.cities.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#164A38] px-4 py-6 text-sm text-[#A8B8A9]">
          No ranked cities for this request.
        </p>
      ) : (
        <ol className="space-y-3">
          {result.cities.map((city, index) => (
            <li
              key={city.city}
              className="rounded-2xl border border-[#164A38] bg-[#103E2E] p-4"
            >
              <p className="text-xs uppercase tracking-wide text-[#DDF285]">
                #{index + 1}
              </p>
              <h3 className="font-serif text-xl text-[#F4F1E8]">{city.city}</h3>
              <p className="mt-2 text-sm leading-6 text-[#C9D4C8]">{city.reason}</p>
              <ul className="mt-3 space-y-1 text-xs text-[#A8B8A9]">
                {city.metricLabels.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
              <a
                href={city.policy.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm text-[#DDF285] hover:underline"
              >
                {city.policy.name}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <p className="mt-1 text-xs text-[#A8B8A9]">Scope: {city.policy.scope}</p>
              {city.dataGap ? (
                <p className="mt-2 text-xs text-amber-300">{city.dataGap}</p>
              ) : null}
              {city.supportingCompanies.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {city.supportingCompanies.map((company) => (
                    <button
                      key={company.id}
                      type="button"
                      onClick={() => onSelectCompany(company.company)}
                      className="rounded-full border border-[#164A38] px-2.5 py-1 text-xs text-[#F4F1E8] hover:border-[#DDF285]"
                    >
                      {company.company}
                    </button>
                  ))}
                </div>
              ) : null}
              {city.supportingSignals.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {city.supportingSignals.map((signal) => (
                    <a
                      key={`${signal.company}-${signal.date}-${signal.summary}`}
                      href={signal.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-[#DDF285]/40 px-2.5 py-1 text-xs text-[#DDF285]"
                    >
                      {signal.company} · {signal.type}
                    </a>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {result.data_gaps.length > 0 ? (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-100">
          <p className="font-medium">Data gaps</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">
            {result.data_gaps.map((gap, index) => (
             <li key={`${index}-${gap}`}>{gap}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs leading-5 text-[#A8B8A9]">
        Based only on the GCC Atlas registry. Not financial or legal advice.
        Planned headcount is {HEADCOUNT_CONTEXT_NOTE.toLowerCase()}.
      </p>
    </div>
  );
}
