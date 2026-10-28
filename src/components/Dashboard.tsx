"use client";

import { useState } from "react";
import { AdvisorModal } from "@/components/AdvisorModal";
import { ConflictPanel } from "@/components/ConflictPanel";
import { PipelineFeed } from "@/components/PipelineFeed";
import { RegistryTable } from "@/components/RegistryTable";
import type { GccData } from "@/lib/types";

export function Dashboard({ data }: { data: GccData }) {
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [highlightCompany, setHighlightCompany] = useState<string | null>(null);

  return (
    <div className="min-h-full bg-[#103E2E] text-[#F4F1E8]">
      <header className="border-b border-[#164A38] px-4 py-4 sm:px-8">
        <p className="rounded-full border border-[#164A38] bg-[#0C2E22] px-4 py-2 text-xs leading-5 text-[#C9D4C8] sm:text-sm">
          {data.meta.banner}
        </p>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
              GCC Atlas
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#C9D4C8] sm:text-base">
              A verified, company-level record of India&apos;s GCC ecosystem
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdvisorOpen(true)}
            className="rounded-full bg-[#DDF285] px-5 py-2.5 text-sm font-medium text-black"
          >
            Ask City-Fit Advisor
          </button>
        </div>
      </header>

      <div className="px-4 py-8 sm:px-8">
        <ConflictPanel disagreements={data.disagreements} />

        <div className="mt-10 flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 lg:w-[70%]">
            {highlightCompany ? (
              <button
                type="button"
                onClick={() => setHighlightCompany(null)}
                className="mb-3 text-xs text-[#DDF285] hover:underline"
              >
                Clear company highlight
              </button>
            ) : null}
            <RegistryTable data={data} highlightCompany={highlightCompany} />
          </div>
          <div className="lg:w-[30%]">
            <PipelineFeed signals={data.signals} />
          </div>
        </div>
      </div>

      <AdvisorModal
        data={data}
        open={advisorOpen}
        onClose={() => setAdvisorOpen(false)}
        onSelectCompany={(company) => {
          setHighlightCompany(company);
          setAdvisorOpen(false);
        }}
      />
    </div>
  );
}
