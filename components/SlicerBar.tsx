"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Slicer, type SlicerOption } from "@/components/Slicer";

export type SlicerSpec = {
  key: string;
  label: string;
  value: string;
  options: SlicerOption[];
  onChange: (v: string) => void;
};

// Client-only "now" — avoids SSR/hydration mismatch on the refreshed timestamp.
function useRefreshedLabel() {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    setLabel(format(new Date(), "MMM d · h:mm a"));
  }, []);
  return label;
}

export function SlicerBar({
  slicers,
  onReset,
}: {
  slicers: SlicerSpec[];
  onReset?: () => void;
}) {
  const refreshed = useRefreshedLabel();
  const anyActive = slicers.some(
    (s) => s.value !== s.options[0]?.value
  );

  return (
    <div className="slicer">
      {slicers.map((s) => (
        <Slicer
          key={s.key}
          label={s.label}
          value={s.value}
          options={s.options}
          onChange={s.onChange}
        />
      ))}
      <div className="flex min-w-[160px] flex-1 flex-col gap-1 border-r border-rule px-4 py-2 last:border-r-0">
        <span className="text-[10px] font-semibold uppercase tracking-meta text-ink-faint">Refreshed</span>
        <span suppressHydrationWarning className="truncate text-[13px] font-medium text-ink">{refreshed ?? "—"}</span>
      </div>
      {onReset && anyActive ? (
        <button
          type="button"
          onClick={onReset}
          className="border-l border-rule bg-canvas px-4 text-[12px] font-medium text-ink-muted hover:text-accent-azure"
          title="Reset all slicers"
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}

// Static context badges for pages where slicers don't make sense
// (data quality is a global pipeline check; architecture is a static doc).
// Visually distinct from the interactive slicers — no chevrons, muted text,
// "Context" pill so it's clearly read-only.
export function StaticContextStrip({
  cells,
}: {
  cells?: Array<{ label: string; value: string }>;
}) {
  const refreshed = useRefreshedLabel();
  const defaultCells = [
    { label: "Scope", value: "Full pipeline" },
    { label: "Maturity rule", value: "≥ 60 days" },
    { label: "Returns / voids", value: "excluded" },
    { label: "Layer", value: "bronze → silver → gold" },
    { label: "Refreshed", value: refreshed ?? "—" },
  ];
  const rows = cells ?? defaultCells;
  return (
    <div className="flex flex-wrap items-stretch gap-0 overflow-hidden rounded-md border border-rule bg-canvas/60">
      <div className="flex items-center px-3 py-2 text-[10.5px] font-semibold uppercase tracking-meta text-ink-faint">
        Context
      </div>
      {rows.map((c, i) => (
        <div
          key={c.label}
          className={`flex min-w-[140px] flex-1 flex-col gap-0.5 border-l border-rule px-4 py-2 ${i === rows.length - 1 ? "" : ""}`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-meta text-ink-faint">{c.label}</span>
          <span suppressHydrationWarning className="truncate text-[12.5px] font-medium text-ink-muted">{c.value}</span>
        </div>
      ))}
    </div>
  );
}

// Backward-compat shim. PageShell still imports StaticSlicerBar.
export function StaticSlicerBar() {
  return <StaticContextStrip />;
}
