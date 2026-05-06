import { pct } from "@/lib/format";

type Row = {
  root_cause: string;
  transaction_count: number;
  estimated_leakage_amount: string | number;
  share_of_leakage: string | number;
};

// Power BI categorical palette (calm, data-grade — no neon).
const palette: Record<string, string> = {
  "Vendor/entity mapping": "#118DFF",
  "SKU/category mapping": "#12239E",
  "Claim workflow gap": "#0E8C5A",
  "Timing/window issue": "#E66C37",
  "Enrollment mismatch": "#744EC2",
};

export function RootCauseBars({ rows }: { rows: Row[] }) {
  const max = Math.max(...rows.map((r) => Number(r.share_of_leakage ?? 0)), 1);
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const share = Number(r.share_of_leakage ?? 0);
        const w = Math.max(4, Math.min(100, (share / max) * 100));
        const color = palette[r.root_cause] ?? "#475569";
        return (
          <div key={r.root_cause}>
            <div className="mb-1 flex items-center justify-between gap-3 text-[12.5px]">
              <span className="flex items-center gap-2 font-medium text-ink">
                <span className="legend-dot" style={{ background: color }} />
                {r.root_cause}
              </span>
              <span className="font-mono tabular-nums text-ink-muted">{pct(share, 0)}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${w}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
