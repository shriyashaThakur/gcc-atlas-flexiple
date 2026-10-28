import type {
  AdvisorGoalId,
  AdvisorRequest,
  CityRankRow,
  GccData,
  HeadcountBand,
} from "@/lib/types";

export const HEADCOUNT_BANDS: HeadcountBand[] = ["<500", "500-1000", "1000+"];

export const HEADCOUNT_CONTEXT_NOTE =
  "Context only; does not change ranking";

const LIMITED_EVIDENCE = "Limited registry evidence for this city";

export function isGccSpecificScope(scope: string): boolean {
  return scope.startsWith("GCC-specific");
}

function formatMsf(value: number | null): string {
  return value === null ? "not available in this dataset" : `${value} msf`;
}

function templateReason(row: CityRankRow, priority: AdvisorGoalId): string {
  switch (priority) {
    case "momentum":
      return `${row.city} has ${row.checkedSignalCount} checked pipeline signal(s) and ${row.registryCount} verified registry record(s). Combined momentum score: ${row.score}.`;
    case "depth":
      return `${row.city} ranks on office-market depth using CBRE absorption, Q3 2026: ${formatMsf(row.absorptionMsf)}.`;
    case "supply":
      return `${row.city} ranks on new office supply using CBRE new supply, Q3 2026: ${formatMsf(row.newSupplyMsf)}.`;
    case "peers":
      return `${row.city} has ${row.peerCount} verified registry record(s) in the selected sector.`;
    case "incentives":
      return `${row.city} is scored on listed key incentives in a GCC-specific policy (${row.incentiveCount} listed). Policy: ${row.policy.name}.`;
  }
}

function metricLabels(row: CityRankRow, priority: AdvisorGoalId): string[] {
  const labels = [
    `Verified registry records: ${row.registryCount}`,
    `Checked pipeline signals: ${row.checkedSignalCount}`,
  ];
  if (priority === "depth" || priority === "momentum") {
    labels.push(
      `CBRE absorption, Q3 2026: ${formatMsf(row.absorptionMsf)}`,
    );
  }
  if (priority === "supply" || priority === "momentum") {
    labels.push(
      `CBRE new supply, Q3 2026: ${formatMsf(row.newSupplyMsf)}`,
    );
  }
  if (priority === "peers") {
    labels.push(`Sector peers in registry: ${row.peerCount}`);
  }
  if (priority === "incentives") {
    labels.push(`Listed GCC-specific key incentives: ${row.incentiveCount}`);
  }
  return labels;
}

export function buildCityRows(data: GccData, sector: string): CityRankRow[] {
  return data.cities.map((city) => {
    const registryRows = data.registry.filter((row) => row.city === city.city);
    const checkedSignals = data.signals.filter(
      (signal) => signal.checked === true && signal.city === city.city,
    );
    const peers = registryRows.filter((row) => row.sector === sector);
    const gccSpecific = isGccSpecificScope(city.policy.scope);
    const incentiveCount = city.policy.key_incentives.length;
    const comparable = gccSpecific && incentiveCount > 0;
    let notComparableReason: string | null = null;
    if (gccSpecific && incentiveCount === 0) {
      notComparableReason =
        `${city.city} has a GCC-specific policy but an empty key_incentives list, so it is not comparable.`;
    } else if (!gccSpecific) {
      notComparableReason = `${city.city} policy scope is not GCC-specific (${city.policy.scope}).`;
    }

    const registryCount = registryRows.length;
    const dataGap = registryCount < 3 ? LIMITED_EVIDENCE : null;
    const absorptionMsf = city.leasing_q3_2026.cbre_absorption_msf;
    const newSupplyMsf = city.leasing_q3_2026.cbre_new_supply_msf;

    const row: CityRankRow = {
      city: city.city,
      score: 0,
      registryCount,
      checkedSignalCount: checkedSignals.length,
      peerCount: peers.length,
      absorptionMsf,
      newSupplyMsf,
      incentiveCount,
      policy: city.policy,
      comparable,
      notComparableReason,
      dataGap,
      supportingCompanies: registryRows.map((item) => ({
        id: item.id,
        company: item.company,
        sector: item.sector,
      })),
      supportingSignals: checkedSignals.map((signal) => ({
        company: signal.company,
        date: signal.date,
        type: signal.type,
        summary: signal.summary,
        source_url: signal.source_url,
      })),
      metricLabels: [],
      templateReason: "",
    };
    return row;
  });
}

function scoreRow(row: CityRankRow, priority: AdvisorGoalId): number {
  switch (priority) {
    case "momentum":
      return row.checkedSignalCount + row.registryCount;
    case "depth":
      return row.absorptionMsf ?? Number.NEGATIVE_INFINITY;
    case "supply":
      return row.newSupplyMsf ?? Number.NEGATIVE_INFINITY;
    case "peers":
      return row.peerCount;
    case "incentives":
      return row.incentiveCount;
  }
}

function sortRows(rows: CityRankRow[]): CityRankRow[] {
  return [...rows].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.registryCount !== a.registryCount) {
      return b.registryCount - a.registryCount;
    }
    return a.city.localeCompare(b.city);
  });
}

export type RankingResult = {
  ranked: CityRankRow[];
  dataGaps: string[];
  withheld: boolean;
  withholdReason: string | null;
};

export function rankCities(
  data: GccData,
  request: AdvisorRequest,
): RankingResult {
  const rows = buildCityRows(data, request.sector).map((row) => {
    const scored: CityRankRow = {
      ...row,
      score: scoreRow(row, request.priority),
    };
    scored.metricLabels = metricLabels(scored, request.priority);
    scored.templateReason = templateReason(scored, request.priority);
    if (request.priority === "peers") {
      scored.supportingCompanies = scored.supportingCompanies.filter(
        (company) => company.sector === request.sector,
      );
    }
    return scored;
  });

  const dataGaps = rows
    .filter((row) => row.dataGap)
    .map((row) => `${row.city}: ${row.dataGap}`);

  if (request.priority === "peers") {
    const anyPeers = rows.some((row) => row.peerCount > 0);
    if (!anyPeers) {
      return {
        ranked: [],
        dataGaps: [
          ...dataGaps,
          `No verified registry records match the sector "${request.sector}". Ranking is withheld.`,
        ],
        withheld: true,
        withholdReason: `No verified registry records match the sector "${request.sector}". Ranking is withheld.`,
      };
    }
  }

  let pool = rows;
  if (request.priority === "incentives") {
    const notComparable = rows.filter((row) => !row.comparable);
    for (const row of notComparable) {
      if (row.notComparableReason) {
        dataGaps.push(row.notComparableReason);
      }
    }
    pool = rows.filter((row) => row.comparable);
  }

  const ranked = sortRows(pool);
  return { ranked, dataGaps, withheld: false, withholdReason: null };
}

export function fallbackSummary(
  request: AdvisorRequest,
  ranking: RankingResult,
  goalLabel: string,
): string {
  if (ranking.withheld) {
    return ranking.withholdReason ?? "Ranking withheld.";
  }
  const top = ranking.ranked.slice(0, 3).map((row) => row.city);
  return `Deterministic ranking for "${goalLabel}" (sector: ${request.sector}; planned headcount ${request.headcountBand} is ${HEADCOUNT_CONTEXT_NOTE.toLowerCase()}). Top cities: ${top.join(", ") || "none"}. Figures are taken only from the GCC Atlas dataset.`;
}

export function parseModelJson(text: string): {
  summary?: unknown;
  cities?: unknown;
  data_gaps?: unknown;
} | null {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  try {
    const parsed: unknown = JSON.parse(stripped);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as {
      summary?: unknown;
      cities?: unknown;
      data_gaps?: unknown;
    };
  } catch {
    return null;
  }
}
