import { money, number as fmtNumber, pct } from "@/lib/format";

type Unit = "currency" | "percent" | "count";

const formatters: Record<Unit, (v: number) => string> = {
  currency: (v) => money(v),
  percent: (v) => pct(v),
  count: (v) => fmtNumber(v),
};

export function BarList({
  rows,
  valueKey,
  labelKey,
  maxValue,
  unit = "currency",
  color = "#0078D4",
}: {
  rows: Record<string, string | number | null>[];
  valueKey: string;
  labelKey: string;
  maxValue?: number;
  unit?: Unit;
  color?: string;
}) {
  const computedMax = maxValue ?? Math.max(...rows.map((row) => Number(row[valueKey] ?? 0)), 1);
  const fmt = formatters[unit];
  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const value = Number(row[valueKey] ?? 0);
        const width = Math.max(4, Math.min(100, (value / computedMax) * 100));
        return (
          <div key={`${row[labelKey]}-${value}`}>
            <div className="mb-1 flex items-center justify-between gap-3 text-[12.5px]">
              <span className="truncate font-medium text-ink">{row[labelKey]}</span>
              <span className="font-mono tabular-nums text-ink-muted">{fmt(value)}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${width}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
