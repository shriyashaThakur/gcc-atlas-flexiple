"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { deriveSourceType } from "@/lib/sourceType";
import type { Disagreement, DisagreementSource } from "@/lib/types";

function SourceCard({ source, unit }: { source: DisagreementSource; unit: string }) {
  const tag = deriveSourceType(source.name);
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="min-w-[240px] flex-1 rounded-2xl border border-[#164A38] bg-[#0C2E22] p-4 transition hover:border-[#DDF285]/60 md:min-w-0"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="rounded-full border border-[#164A38] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[#DDF285]">
          {tag}
        </span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#DDF285]/80" />
      </div>
      <p className="font-serif text-2xl text-[#F4F1E8]">{source.value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs text-[#C9D4C8]">{unit}</p>
      <p className="mt-2 text-sm font-medium text-[#F4F1E8]">{source.name}</p>
      <p className="mt-1 text-xs leading-5 text-[#A8B8A9]">{source.note}</p>
    </a>
  );
}

function DisagreementRow({ item }: { item: Disagreement }) {
  if (!item.sources.length) {
    return (
      <p className="rounded-2xl border border-dashed border-[#164A38] px-4 py-6 text-sm text-[#A8B8A9]">
        No sources listed for this disagreement.
      </p>
    );
  }
  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-serif text-xl text-[#F4F1E8]">{item.title}</h3>
        <p className="mt-1 text-sm text-[#A8B8A9]">{item.why}</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-3">
        {item.sources.map((source) => (
          <SourceCard
            key={`${source.name}-${source.value}`}
            source={source}
            unit={item.unit}
          />
        ))}
      </div>
    </section>
  );
}

export function ConflictPanel({ disagreements }: { disagreements: Disagreement[] }) {
  const [open, setOpen] = useState(false);

  if (!disagreements.length) {
    return (
      <section className="rounded-2xl border border-dashed border-[#164A38] bg-[#0C2E22] p-6 text-sm text-[#A8B8A9]">
        No published disagreements in this dataset.
      </section>
    );
  }

  const india = disagreements[0];
  const bengaluru = disagreements[1];
  const rest = disagreements.slice(2);

  return (
    <section className="space-y-8">
      {india ? <DisagreementRow item={india} /> : null}
      {bengaluru ? <DisagreementRow item={bengaluru} /> : null}
      <p className="max-w-3xl text-sm leading-6 text-[#C9D4C8]">
        Some reports count companies, others count centres, and dates differ. So
        every record in GCC Atlas shows its source and a confidence level.
      </p>
      {rest.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-full border border-[#164A38] px-4 py-2 text-sm text-[#F4F1E8] hover:border-[#DDF285]"
          >
            {open ? "Hide disagreements" : "More disagreements"}
          </button>
          {open ? (
            <div className="mt-6 space-y-8">
              {rest.map((item) => (
                <DisagreementRow key={item.title} item={item} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
