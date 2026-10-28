"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Info } from "lucide-react";
import {
  registryCities,
  registryConfidences,
  registrySectors,
} from "@/lib/data";
import type { GccData, RegistryRecord, UnverifiedCandidate } from "@/lib/types";

function ConfidencePill({ value }: { value: string }) {
  const styles =
    value === "High"
      ? "border-emerald-400/70 text-emerald-300"
      : value === "Medium"
        ? "border-amber-400/70 text-amber-300"
        : "border-[#A8B8A9] text-[#A8B8A9]";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {value}
    </span>
  );
}

function HeadcountCell({ row }: { row: RegistryRecord }) {
  if (row.headcount === null || row.headcount === undefined) {
    if (row.headcount_note) {
      return (
        <span className="inline-flex items-center gap-1 text-[#A8B8A9]" title={row.headcount_note}>
          Not disclosed
          <Info className="h-3.5 w-3.5" />
        </span>
      );
    }
    return <span className="text-[#A8B8A9]">Not disclosed</span>;
  }
  return (
    <span title={row.headcount_note || undefined}>
      {row.headcount.toLocaleString()}
    </span>
  );
}

export function RegistryTable({
  data,
  highlightCompany,
}: {
  data: GccData;
  highlightCompany?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("All");
  const [sector, setSector] = useState("All");
  const [confidence, setConfidence] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [candidatesOpen, setCandidatesOpen] = useState(false);

  const cities = registryCities(data);
  const sectors = registrySectors(data);
  const confidences = registryConfidences(data);

  const filtered = useMemo(() => {
    const q = (highlightCompany || query).trim().toLowerCase();
    return data.registry.filter((row) => {
      if (q && !row.company.toLowerCase().includes(q)) return false;
      if (city !== "All" && row.city !== city) return false;
      if (sector !== "All" && row.sector !== sector) return false;
      if (confidence !== "All" && row.confidence !== confidence) return false;
      return true;
    });
  }, [data.registry, query, city, sector, confidence, highlightCompany]);

  return (
    <section className="rounded-2xl border border-[#164A38] bg-[#0C2E22] p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-[#F4F1E8]">Verified Registry</h2>
          <p className="mt-1 text-sm text-[#A8B8A9]">
            Showing {filtered.length} of {data.registry.length}
            {highlightCompany ? ` · filtered to “${highlightCompany}”` : ""}
          </p>
        </div>
        <p className="max-w-md text-xs leading-5 text-[#A8B8A9]">
          {data.meta.confidence_rule.High
            ? `High: ${data.meta.confidence_rule.High}`
            : null}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-[#A8B8A9]">
          Search company
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Company name"
            className="mt-1 w-full rounded-full border border-[#164A38] bg-[#103E2E] px-3 py-2 text-sm text-[#F4F1E8] outline-none placeholder:text-[#A8B8A9] focus:border-[#DDF285]"
          />
        </label>
        <FilterSelect
          label="City"
          value={city}
          onChange={setCity}
          options={cities}
        />
        <FilterSelect
          label="Sector"
          value={sector}
          onChange={setSector}
          options={sectors}
        />
        <FilterSelect
          label="Confidence"
          value={confidence}
          onChange={setConfidence}
          options={confidences}
        />
      </div>

      {data.registry.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#164A38] px-4 py-10 text-center text-sm text-[#A8B8A9]">
          The registry is empty in this dataset.
        </p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#164A38] px-4 py-10 text-center text-sm text-[#A8B8A9]">
          No verified records match these filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-[#A8B8A9]">
              <tr className="border-b border-[#164A38]">
                <th className="py-2 pr-3 font-medium">Company</th>
                <th className="py-2 pr-3 font-medium">Sector</th>
                <th className="py-2 pr-3 font-medium">City</th>
                <th className="py-2 pr-3 font-medium">Primary Function</th>
                <th className="py-2 pr-3 font-medium">Headcount</th>
                <th className="py-2 pr-3 font-medium">Confidence</th>
                <th className="py-2 pr-3 font-medium">Source</th>
                <th className="py-2 font-medium">Last Checked</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const isOpen = expanded === row.id;
                return (
                  <RowBlock
                    key={row.id}
                    row={row}
                    isOpen={isOpen}
                    onToggle={() =>
                      setExpanded((current) => (current === row.id ? null : row.id))
                    }
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CandidatesFooter
        candidates={data.candidates_unverified}
        open={candidatesOpen}
        onToggle={() => setCandidatesOpen((value) => !value)}
      />
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="text-xs text-[#A8B8A9]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-full border border-[#164A38] bg-[#103E2E] px-3 py-2 text-sm text-[#F4F1E8] outline-none focus:border-[#DDF285]"
      >
        <option value="All">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function RowBlock({
  row,
  isOpen,
  onToggle,
}: {
  row: RegistryRecord;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-[#164A38]/80 hover:bg-[#103E2E]"
      >
        <td className="py-3 pr-3 font-medium text-[#F4F1E8]">
          <span className="inline-flex items-center gap-2">
            <ChevronDown
              className={`h-4 w-4 text-[#DDF285] transition ${isOpen ? "rotate-180" : ""}`}
            />
            {row.company}
          </span>
        </td>
        <td className="py-3 pr-3 text-[#C9D4C8]">{row.sector}</td>
        <td className="py-3 pr-3 text-[#C9D4C8]">{row.city}</td>
        <td className="py-3 pr-3 text-[#C9D4C8]">{row.primary_function}</td>
        <td className="py-3 pr-3">
          <HeadcountCell row={row} />
        </td>
        <td className="py-3 pr-3">
          <ConfidencePill value={row.confidence} />
        </td>
        <td className="py-3 pr-3">
          <span className="inline-flex items-center gap-2">
            <a
              href={row.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="text-[#DDF285] hover:underline"
              aria-label={`Open source for ${row.company}`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            {row.manual_check === "pending" ? (
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-300">
                Pending
              </span>
            ) : null}
          </span>
        </td>
        <td className="py-3 text-[#C9D4C8]">{row.last_checked}</td>
      </tr>
      {isOpen ? (
        <tr className="border-b border-[#164A38] bg-[#103E2E]/60">
          <td colSpan={8} className="px-4 py-4 text-sm leading-6 text-[#C9D4C8]">
            <p className="text-[#F4F1E8]">{row.summary}</p>
            <p className="mt-2">
              Confidence reason: {row.confidence_reason}
            </p>
            <p className="mt-1">
              Parent HQ: {row.parent_hq_country}
              {row.year_established ? ` · Established ${row.year_established}` : ""}
              {row.other_cities.length
                ? ` · Other cities: ${row.other_cities.join(", ")}`
                : ""}
            </p>
            <p className="mt-1">
              Source: {row.source_name}
              {row.source_date ? ` (${row.source_date})` : ""} · {row.source_type}
            </p>
            {row.headcount_note ? (
              <p className="mt-1">Headcount note: {row.headcount_note}</p>
            ) : null}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function CandidatesFooter({
  candidates,
  open,
  onToggle,
}: {
  candidates: UnverifiedCandidate[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-6 border-t border-[#164A38] pt-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left text-sm text-[#F4F1E8]"
      >
        <span>Candidates not yet verified ({candidates.length})</span>
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        candidates.length === 0 ? (
          <p className="mt-3 text-sm text-[#A8B8A9]">No unverified candidates.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {candidates.map((item) => (
              <li
                key={`${item.company}-${item.city}`}
                className="rounded-2xl border border-[#164A38] px-3 py-2 text-sm"
              >
                <span className="text-[#F4F1E8]">{item.company}</span>
                <span className="text-[#A8B8A9]"> · {item.city}</span>
                <p className="mt-1 text-xs text-[#A8B8A9]">{item.reason}</p>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
