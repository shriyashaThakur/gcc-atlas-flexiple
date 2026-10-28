"use client";

import { useMemo } from "react";
import { ExternalLink, Lock } from "lucide-react";
import type { Signal } from "@/lib/types";

export function PipelineFeed({ signals }: { signals: Signal[] }) {
  const items = useMemo(() => {
    return signals
      .filter((signal) => signal.checked === true)
      .slice()
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }, [signals]);

  return (
    <aside className="rounded-2xl border border-[#164A38] bg-[#0C2E22] p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-[#F4F1E8]">Pipeline Feed</h2>
          <p className="mt-1 text-xs text-[#A8B8A9]">Alerts for service providers</p>
        </div>
        <Lock className="mt-1 h-4 w-4 text-[#A8B8A9]" aria-hidden />
      </div>
      <button
        type="button"
        disabled
        className="mb-5 w-full cursor-not-allowed rounded-full border border-[#164A38] bg-[#103E2E] px-4 py-2 text-sm text-[#A8B8A9]"
      >
        Get alerts (coming soon)
      </button>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#164A38] px-3 py-8 text-center text-sm text-[#A8B8A9]">
          No checked pipeline signals.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((signal) => (
            <li
              key={`${signal.company_id ?? signal.company}-${signal.date ?? "undated"}-${signal.summary}`}
              className="rounded-2xl border border-[#164A38] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-[#F4F1E8]">{signal.company}</p>
                <span className="rounded-full bg-[#DDF285] px-2 py-0.5 text-[11px] font-medium text-black">
                  {signal.type}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#A8B8A9]">
                {signal.city} · {signal.date ?? "Date not stated"}
              </p>
              <p className="mt-2 text-sm leading-5 text-[#C9D4C8]">{signal.summary}</p>
              {signal.scale ? (
                <p className="mt-1 text-xs text-[#C9D4C8]">Scale: {signal.scale}</p>
              ) : null}
              <p className="mt-2 text-xs leading-5 text-[#DDF285]/90">
                Likely demand: {signal.inference}
              </p>
              <a
                href={signal.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-[#DDF285] hover:underline"
              >
                {signal.source_name}
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
