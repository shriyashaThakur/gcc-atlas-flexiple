export type Confidence = "High" | "Medium" | "Low";

export type AdvisorGoalId =
  | "momentum"
  | "depth"
  | "supply"
  | "peers"
  | "incentives";

export type HeadcountBand = "<500" | "500-1000" | "1000+";

export type AdvisorGoal = {
  id: AdvisorGoalId;
  label: string;
  uses: string;
};

export type Meta = {
  name: string;
  checked_on: string;
  banner: string;
  confidence_rule: Record<string, string>;
  notes: string[];
  advisor_goals_supported: AdvisorGoal[];
};

export type RegistryRecord = {
  id: string;
  company: string;
  group_id: string;
  parent_hq_country: string;
  city: string;
  other_cities: string[];
  sector: string;
  primary_function: string;
  year_established: number | null;
  headcount: number | null;
  headcount_note: string;
  summary: string;
  source_name: string;
  source_url: string;
  source_type: string;
  source_date: string | null;
  confidence: Confidence;
  confidence_reason: string;
  manual_check: string;
  last_checked: string;
};

export type Signal = {
  company_id: string | null;
  company: string;
  city: string;
  date: string | null;
  type: string;
  summary: string;
  scale: string;
  source_name: string;
  source_url: string;
  checked: boolean;
  inference: string;
};

export type CityPolicy = {
  name: string;
  scope: string;
  year: number;
  key_incentives: string[];
  url: string;
};

export type CityLeasing = {
  cbre_absorption_msf: number | null;
  cw_gross_msf: number | null;
  cw_net_absorption_msf: number | null;
  cbre_new_supply_msf: number | null;
  top_sectors: string;
  cbre_share_of_national_gcc_leasing_pct: number | null;
  sources: string[];
  note: string;
};

export type CityGccCount = {
  value: number;
  unit: string;
  source: string;
  note: string;
};

export type CityRecord = {
  city: string;
  policy: CityPolicy;
  leasing_q3_2026: CityLeasing;
  rent: number | null;
  gcc_count: CityGccCount[];
};

export type DisagreementSource = {
  name: string;
  value: number;
  note: string;
  url: string;
};

export type Disagreement = {
  title: string;
  unit: string;
  why: string;
  sources: DisagreementSource[];
};

export type UnverifiedCandidate = {
  company: string;
  city: string;
  status: string;
  reason: string;
};

export type GccData = {
  meta: Meta;
  registry: RegistryRecord[];
  signals: Signal[];
  cities: CityRecord[];
  disagreements: Disagreement[];
  candidates_unverified: UnverifiedCandidate[];
};

export type DerivedSourceType = "Vendor claim" | "State claim" | "Report / press";

export type CityRankRow = {
  city: string;
  score: number;
  registryCount: number;
  checkedSignalCount: number;
  peerCount: number;
  absorptionMsf: number | null;
  newSupplyMsf: number | null;
  incentiveCount: number;
  policy: CityPolicy;
  comparable: boolean;
  notComparableReason: string | null;
  dataGap: string | null;
  supportingCompanies: { id: string; company: string; sector: string }[];
  supportingSignals: {
    company: string;
    date: string | null;
    type: string;
    summary: string;
    source_url: string;
  }[];
  metricLabels: string[];
  templateReason: string;
};

export type AdvisorRequest = {
  sector: string;
  headcountBand: HeadcountBand;
  priority: AdvisorGoalId;
};

export type AdvisorCityResult = {
  city: string;
  reason: string;
  score: number;
  metricLabels: string[];
  policy: CityPolicy;
  dataGap: string | null;
  supportingCompanies: CityRankRow["supportingCompanies"];
  supportingSignals: CityRankRow["supportingSignals"];
};

export type AdvisorResponse = {
  summary: string;
  cities: AdvisorCityResult[];
  data_gaps: string[];
  fallback: boolean;
  withheld: boolean;
  withholdReason: string | null;
  headcountNote: string;
};
