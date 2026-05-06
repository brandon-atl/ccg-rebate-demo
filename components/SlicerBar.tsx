"use client";

import { format } from "date-fns";
import { Slicer, type SlicerOption } from "@/components/Slicer";

export type SlicerSpec = {
  key: string;
  label: string;
  value: string;
  options: SlicerOption[];
  onChange: (v: string) => void;
};

export function SlicerBar({
  slicers,
  onReset,
  asOf = new Date(),
}: {
  slicers: SlicerSpec[];
  onReset?: () => void;
  asOf?: Date;
}) {
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
        <span className="truncate text-[13px] font-medium text-ink">{format(asOf, "MMM d · h:mm a")}</span>
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

// Static (non-interactive) slicer used on pages where filtering isn't wired up yet.
export function StaticSlicerBar({ asOf = new Date() }: { asOf?: Date }) {
  const cells = [
    { label: "Time", value: "Last 90 days" },
    { label: "Region", value: "All" },
    { label: "Vendor program", value: "All" },
    { label: "Priority", value: "All" },
    { label: "Maturity", value: "Mature ≥ 60 days" },
    { label: "Refreshed", value: format(asOf, "MMM d · h:mm a") },
  ];
  return (
    <div className="slicer">
      {cells.map((c) => (
        <div key={c.label} className="slicer-cell">
          <span className="slicer-cell-label">{c.label}</span>
          <span className="slicer-cell-value">{c.value}</span>
        </div>
      ))}
    </div>
  );
}
