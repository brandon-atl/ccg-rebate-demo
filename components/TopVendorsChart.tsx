import { money } from "@/lib/format";

type VendorRow = {
  parent_vendor_name: string;
  vendor_category: string;
  leakage_transactions: number;
  estimated_leakage_amount: string;
  dominant_root_cause?: string;
};

const rootCauseColor: Record<string, string> = {
  "Vendor/entity mapping": "#118DFF",
  "SKU/category mapping": "#12239E",
  "Claim workflow gap": "#0E8C5A",
  "Timing/window issue": "#E66C37",
  "Enrollment mismatch": "#744EC2",
};

export function TopVendorsChart({ rows }: { rows: VendorRow[] }) {
  const max = Math.max(...rows.map((r) => Number(r.estimated_leakage_amount ?? 0)), 1);
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const value = Number(r.estimated_leakage_amount ?? 0);
        const w = Math.max(4, Math.min(100, (value / max) * 100));
        const color = rootCauseColor[r.dominant_root_cause ?? ""] ?? "#0078D4";
        return (
          <div key={r.parent_vendor_name}>
            <div className="mb-1 flex items-center justify-between gap-3 text-[12.5px]">
              <span className="flex min-w-0 items-center gap-2 truncate">
                <span className="font-medium text-ink">{r.parent_vendor_name}</span>
                <span className="truncate text-[11px] text-ink-faint">· {r.vendor_category}</span>
              </span>
              <span className="font-mono tabular-nums text-ink-muted">{money(value)}</span>
            </div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${w}%`, background: color }} />
            </div>
            {r.dominant_root_cause ? (
              <div className="mt-1 text-[10.5px] text-ink-faint">
                Dominant root cause: <span className="text-ink-muted">{r.dominant_root_cause}</span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
