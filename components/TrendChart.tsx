"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type TrendPoint = {
  month_label: string;
  open_leakage: number | string;
  recovered_amount: number | string;
};

const fmtCompact = (n: number) => {
  const v = Math.abs(n);
  if (v >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
};

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const series = data.map((d) => ({
    month: d.month_label,
    Open: Number(d.open_leakage ?? 0),
    Recovered: Number(d.recovered_amount ?? 0),
  }));

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 6, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="#EFEAE0" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#94A3B8"
            tickLine={false}
            axisLine={{ stroke: "#E5E1D8" }}
            fontSize={11}
            dy={4}
          />
          <YAxis
            stroke="#94A3B8"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tickFormatter={(v: number) => fmtCompact(v)}
          />
          <Tooltip
            cursor={{ stroke: "#CBD5E1", strokeDasharray: "3 3" }}
            contentStyle={{
              borderRadius: 6,
              border: "1px solid #E5E1D8",
              fontSize: 12,
              boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
            }}
            formatter={(value: number, name: string) => [fmtCompact(value), name]}
          />
          <Line
            type="monotone"
            dataKey="Open"
            stroke="#DC2626"
            strokeWidth={2.25}
            dot={{ r: 3, stroke: "#DC2626", strokeWidth: 1.5, fill: "#fff" }}
            activeDot={{ r: 4 }}
            name="Open"
          />
          <Line
            type="monotone"
            dataKey="Recovered"
            stroke="#16A34A"
            strokeWidth={2.25}
            dot={{ r: 3, stroke: "#16A34A", strokeWidth: 1.5, fill: "#fff" }}
            activeDot={{ r: 4 }}
            name="Recovered"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
