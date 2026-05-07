"use client";

import { useState } from "react";

export function InfoTip({
  title,
  body,
  formula,
  thresholds,
}: {
  title: string;
  body: string;
  formula?: string;
  thresholds?: Array<{ label: string; tone: "good" | "warn" | "bad" }>;
}) {
  const [open, setOpen] = useState(false);

  const dotByTone: Record<"good" | "warn" | "bad", string> = {
    good: "bg-emerald-500",
    warn: "bg-amber-500",
    bad: "bg-rose-500",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={`Info: ${title}`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-rule bg-canvas text-[9px] font-semibold text-ink-faint hover:border-accent-azure hover:text-accent-azure"
      >
        i
      </button>
      {open ? (
        <div
          role="tooltip"
          className="absolute right-0 top-5 z-30 w-64 rounded-md border border-rule bg-surface p-3 shadow-panel"
        >
          <div className="text-[12px] font-semibold text-ink">{title}</div>
          <div className="mt-1 text-[11.5px] leading-[1.45] text-ink-muted">{body}</div>
          {formula ? (
            <div className="mt-2 rounded bg-canvas px-2 py-1 font-mono text-[10.5px] text-ink-muted">
              {formula}
            </div>
          ) : null}
          {thresholds && thresholds.length ? (
            <div className="mt-2 space-y-1">
              {thresholds.map((t) => (
                <div key={t.label} className="flex items-center gap-1.5 text-[10.5px] text-ink-muted">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotByTone[t.tone]}`} />
                  {t.label}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
