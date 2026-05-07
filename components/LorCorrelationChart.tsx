"use client";

import { useMemo } from "react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

export type LorPoint = {
  shop_code: string;
  shop_name: string;
  region?: string;
  cohort_label: string;
  length_of_rental: string | number;
  rebate_eligible_spend: string | number;
};

const cohortColor: Record<string, string> = {
  "Independent Volume": "#118DFF",
  "Mid-Volume Multi-DRP": "#12239E",
  "High-Volume Certified": "#0E8C5A",
  "OEM Specialists": "#E66C37",
  "Low-Volume General": "#94A3B8",
  "Premier Tier": "#744EC2",
};

function pearsonR(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n === 0) return 0;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? 0 : num / denom;
}

const fmtCompact = (n: number) => {
  const v = Math.abs(n);
  if (v >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toFixed(0)}`;
};

export function LorCorrelationChart({ data }: { data: LorPoint[] }) {
  const cohorts = useMemo(() => Array.from(new Set(data.map((d) => d.cohort_label))), [data]);

  const points = useMemo(
    () =>
      data
        .map((d) => ({
          x: Number(d.length_of_rental ?? 0),
          y: Number(d.rebate_eligible_spend ?? 0),
          cohort: d.cohort_label,
          shop: d.shop_name,
          code: d.shop_code,
        }))
        .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.y > 0),
    [data]
  );

  const r = useMemo(() => pearsonR(points.map((p) => p.x), points.map((p) => p.y)), [points]);
  const r2 = (r * r).toFixed(2);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[12.5px]">
          <span className="rounded-md bg-canvas px-2 py-1 font-mono text-[12px] text-ink-muted">
            r = <span className="font-semibold text-ink">{r.toFixed(2)}</span>
          </span>
          <span className="rounded-md bg-canvas px-2 py-1 font-mono text-[12px] text-ink-muted">
            R² = <span className="font-semibold text-ink">{r2}</span>
          </span>
          <span className="text-[11.5px] text-ink-faint">
            n = {points.length.toLocaleString()} shops
          </span>
        </div>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 6, right: 14, left: 4, bottom: 22 }}>
            <CartesianGrid stroke="#EFEAE0" strokeDasharray="2 4" />
            <XAxis
              type="number"
              dataKey="x"
              name="LOR"
              unit="d"
              stroke="#94A3B8"
              tickLine={false}
              axisLine={{ stroke: "#E5E1D8" }}
              fontSize={11}
              label={{ value: "Length of rental (days)", position: "insideBottom", offset: -10, fontSize: 11, fill: "#64748B" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Rebate-eligible spend"
              stroke="#94A3B8"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickFormatter={(v: number) => fmtCompact(v)}
            />
            <ZAxis range={[24, 24]} />
            <Tooltip
              cursor={{ stroke: "#CBD5E1", strokeDasharray: "3 3" }}
              contentStyle={{
                borderRadius: 6,
                border: "1px solid #E5E1D8",
                fontSize: 12,
                boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
              }}
              formatter={(value: number, name: string) => {
                if (name === "Rebate-eligible spend") return [fmtCompact(value), name];
                if (name === "LOR") return [`${value.toFixed(1)}d`, name];
                return [value, name];
              }}
              labelFormatter={() => ""}
            />
            {cohorts.map((c) => {
              const subset = points.filter((p) => p.cohort === c);
              return (
                <Scatter
                  key={c}
                  name={c}
                  data={subset}
                  fill={cohortColor[c] ?? "#475569"}
                  fillOpacity={0.55}
                  stroke="#fff"
                  strokeWidth={0.5}
                />
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-muted">
        {cohorts.map((c) => (
          <span key={c} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: cohortColor[c] ?? "#475569" }} />
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}
