"use client";

import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { LorCorrelationChart, type LorPoint } from "@/components/LorCorrelationChart";
import { MetricCard } from "@/components/MetricCard";
import { RootCauseBars } from "@/components/RootCauseBars";
import { Slicer } from "@/components/Slicer";
import { TopVendorsChart } from "@/components/TopVendorsChart";
import { TrendChart } from "@/components/TrendChart";
import type { HomeRow } from "@/lib/queries";
import { delta, money, moneyCompact, number, pct } from "@/lib/format";
import { captureRateTone, deltaTone, falsePositiveTone, p1Tone } from "@/lib/tones";

type TimeKey = "90d" | "180d" | "365d" | "ytd" | "all";

const timeOptions: Array<{ value: TimeKey; label: string }> = [
  { value: "90d", label: "Last 90 days" },
  { value: "180d", label: "Last 180 days" },
  { value: "365d", label: "Last 365 days" },
  { value: "ytd", label: "Year to date" },
  { value: "all", label: "All time" },
];

function timeCutoff(t: TimeKey): Date | null {
  const now = new Date();
  switch (t) {
    case "90d": return subMonths(now, 3);
    case "180d": return subMonths(now, 6);
    case "365d": return subMonths(now, 12);
    case "ytd": return new Date(now.getFullYear(), 0, 1);
    case "all": return null;
  }
}

function periodLabel(t: TimeKey): string {
  return timeOptions.find((o) => o.value === t)?.label ?? "Last 90 days";
}

export function HomeDashboard({
  rows,
  lor,
}: {
  rows: HomeRow[];
  lor: LorPoint[];
}) {
  // Filter state
  const [time, setTime] = useState<TimeKey>("90d");
  const [region, setRegion] = useState("all");
  const [vendor, setVendor] = useState("all");
  const [priority, setPriority] = useState("all");

  // Refresh timestamp (client-only)
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  useEffect(() => {
    setRefreshedAt(format(new Date(), "MMM d · h:mm a"));
  }, []);

  // Slicer option lists
  const regions = useMemo(
    () => [
      { value: "all", label: "All regions" },
      ...Array.from(new Set(rows.map((r) => r.region))).sort().map((v) => ({ value: v, label: v })),
    ],
    [rows]
  );
  const vendors = useMemo(
    () => [
      { value: "all", label: "All vendor programs" },
      ...Array.from(new Set(rows.map((r) => r.parent_vendor_name))).sort().map((v) => ({ value: v, label: v })),
    ],
    [rows]
  );
  const priorities = useMemo(
    () => [
      { value: "all", label: "All priorities" },
      { value: "P1", label: "P1 only" },
      { value: "P2", label: "P2 only" },
      { value: "P3", label: "P3 only" },
    ],
    []
  );

  // Apply filters
  const filteredRows = useMemo(() => {
    const cutoff = timeCutoff(time);
    return rows.filter((r) => {
      if (cutoff) {
        const d = parseISO(r.transaction_date);
        if (d < cutoff) return false;
      }
      if (region !== "all" && r.region !== region) return false;
      if (vendor !== "all" && r.parent_vendor_name !== vendor) return false;
      if (priority !== "all" && r.priority_level !== priority) return false;
      return true;
    });
  }, [rows, time, region, vendor, priority]);

  // Apply region/vendor filter to LOR (priority/time don't apply to LOR shop snapshot)
  const filteredLor = useMemo(() => {
    if (region === "all" && vendor === "all") return lor;
    // We don't have vendor-level data per shop in lor; only region maps cleanly.
    if (region !== "all") {
      return lor.filter((p) => p.region === region);
    }
    return lor;
  }, [lor, region, vendor]);

  // Aggregate for KPI tiles
  const summary = useMemo(() => {
    let leakageDollars = 0;
    let leakageCount = 0;
    let claimedDollars = 0;
    let recoveredYtd = 0;
    let labeledTotal = 0;
    let falsePositives = 0;
    const p1Shops = new Set<number>();
    const flaggedShops = new Set<number>();
    const ytdStart = new Date(new Date().getFullYear(), 0, 1);
    let captureBaseline = 0; // claimed + leakage (denominator)

    // For QoQ delta
    const now = new Date();
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const prevQStart = subMonths(qStart, 3);
    let thisQClaimed = 0, thisQLeak = 0, lastQClaimed = 0, lastQLeak = 0;

    for (const r of filteredRows) {
      const txDate = parseISO(r.transaction_date);
      const exp = Number(r.expected_rebate_amount ?? 0);
      const claim = Number(r.claimed_amount ?? 0);

      if (r.leakage_flag) {
        leakageDollars += exp;
        leakageCount += 1;
        flaggedShops.add(r.shop_id);
        if (r.priority_level === "P1") p1Shops.add(r.shop_id);
      }

      if (r.claim_status === "claimed") {
        claimedDollars += claim;
        if (r.claim_date && parseISO(r.claim_date) >= ytdStart) {
          recoveredYtd += claim;
        }
      }

      if (r.followup_status) {
        labeledTotal += 1;
        if (r.followup_status === "false_positive") falsePositives += 1;
      }

      if (txDate >= qStart) {
        if (r.claim_status === "claimed") thisQClaimed += claim;
        if (r.leakage_flag) thisQLeak += exp;
      } else if (txDate >= prevQStart) {
        if (r.claim_status === "claimed") lastQClaimed += claim;
        if (r.leakage_flag) lastQLeak += exp;
      }
    }

    captureBaseline = claimedDollars + leakageDollars;
    const captureRate = captureBaseline > 0 ? (claimedDollars / captureBaseline) * 100 : 0;
    const fpRate = labeledTotal > 0 ? (falsePositives / labeledTotal) * 100 : 0;
    const thisQDenom = thisQClaimed + thisQLeak;
    const lastQDenom = lastQClaimed + lastQLeak;
    const qoq =
      thisQDenom > 0 && lastQDenom > 0
        ? (thisQClaimed / thisQDenom) * 100 - (lastQClaimed / lastQDenom) * 100
        : 0;
    const projectedAnnual = Math.max(
      0,
      leakageDollars * (captureRate / 100) * (1 - fpRate / 100) * 4
    );
    return {
      leakageDollars,
      leakageCount,
      claimedDollars,
      recoveredYtd,
      captureRate,
      fpRate,
      qoq,
      projectedAnnual,
      p1Count: p1Shops.size,
      flaggedShopsCount: flaggedShops.size,
    };
  }, [filteredRows]);

  // Top vendors aggregation (only leakage rows)
  const topVendors = useMemo(() => {
    const map = new Map<
      string,
      { vendor_category: string; leakage_transactions: number; estimated_leakage_amount: number; root_counts: Map<string, number> }
    >();
    for (const r of filteredRows) {
      if (!r.leakage_flag) continue;
      const cur = map.get(r.parent_vendor_name) ?? {
        vendor_category: r.vendor_category,
        leakage_transactions: 0,
        estimated_leakage_amount: 0,
        root_counts: new Map<string, number>(),
      };
      cur.leakage_transactions += 1;
      cur.estimated_leakage_amount += Number(r.expected_rebate_amount ?? 0);
      cur.root_counts.set(r.root_cause, (cur.root_counts.get(r.root_cause) ?? 0) + 1);
      map.set(r.parent_vendor_name, cur);
    }
    return Array.from(map.entries())
      .map(([name, v]) => {
        const dom = Array.from(v.root_counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        return {
          parent_vendor_name: name,
          vendor_category: v.vendor_category,
          leakage_transactions: v.leakage_transactions,
          estimated_leakage_amount: v.estimated_leakage_amount.toFixed(2),
          dominant_root_cause: dom,
        };
      })
      .sort((a, b) => Number(b.estimated_leakage_amount) - Number(a.estimated_leakage_amount))
      .slice(0, 8);
  }, [filteredRows]);

  // Root cause breakdown
  const rootCauses = useMemo(() => {
    const map = new Map<string, { count: number; leak: number }>();
    for (const r of filteredRows) {
      if (!r.leakage_flag) continue;
      const cur = map.get(r.root_cause) ?? { count: 0, leak: 0 };
      cur.count += 1;
      cur.leak += Number(r.expected_rebate_amount ?? 0);
      map.set(r.root_cause, cur);
    }
    const total = Array.from(map.values()).reduce((s, v) => s + v.count, 0);
    return Array.from(map.entries())
      .map(([root_cause, v]) => ({
        root_cause,
        transaction_count: v.count,
        estimated_leakage_amount: v.leak.toFixed(2),
        share_of_leakage: total > 0 ? ((v.count / total) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.transaction_count - a.transaction_count);
  }, [filteredRows]);

  // 6-month trend
  const trend = useMemo(() => {
    const now = new Date();
    const months: Array<{ start: Date; label: string }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = startOfMonth(subMonths(now, i));
      months.push({ start: d, label: format(d, "MMM") });
    }
    return months.map((m) => {
      const next = subMonths(m.start, -1);
      let open = 0;
      let recovered = 0;
      for (const r of filteredRows) {
        const d = parseISO(r.transaction_date);
        if (d < m.start || d >= next) continue;
        if (r.leakage_flag) open += Number(r.expected_rebate_amount ?? 0);
        if (r.claim_status === "claimed") recovered += Number(r.claimed_amount ?? 0);
      }
      return {
        month_label: m.label,
        open_leakage: open.toFixed(2),
        recovered_amount: recovered.toFixed(2),
      };
    });
  }, [filteredRows]);

  // Active filter count for chip display
  const activeFilters = [
    region !== "all" ? `Region · ${region}` : null,
    vendor !== "all" ? `Vendor · ${vendor}` : null,
    priority !== "all" ? `Priority · ${priority}` : null,
    time !== "90d" ? `Time · ${periodLabel(time)}` : null,
  ].filter(Boolean) as string[];

  const onReset = () => {
    setTime("90d");
    setRegion("all");
    setVendor("all");
    setPriority("all");
  };

  return (
    <div>
      {/* Slicer bar — interactive Time / Region / Vendor / Priority,
          static Maturity / Refreshed badges. */}
      <div className="slicer mb-4 md:mb-5">
        <Slicer
          label="Time"
          value={time}
          options={timeOptions.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(v) => setTime(v as TimeKey)}
        />
        <Slicer label="Region" value={region} options={regions} onChange={setRegion} />
        <Slicer label="Vendor program" value={vendor} options={vendors} onChange={setVendor} />
        <Slicer label="Priority" value={priority} options={priorities} onChange={setPriority} />
        <div className="flex min-w-[140px] flex-1 flex-col gap-1 border-r border-rule px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-meta text-ink-faint">Maturity</span>
          <span className="truncate text-[13px] font-medium text-ink-muted">Mature ≥ 60 days</span>
        </div>
        <div className="flex min-w-[140px] flex-1 flex-col gap-1 px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-meta text-ink-faint">Refreshed</span>
          <span suppressHydrationWarning className="truncate text-[13px] font-medium text-ink-muted">{refreshedAt ?? "—"}</span>
        </div>
        {activeFilters.length > 0 ? (
          <button
            type="button"
            onClick={onReset}
            className="border-l border-rule bg-canvas px-4 text-[12px] font-medium text-ink-muted hover:text-accent-azure"
          >
            Reset
          </button>
        ) : null}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-meta text-ink-faint">Filters</span>
          {activeFilters.map((f) => (
            <span key={f} className="inline-flex items-center gap-1 rounded-full border border-rule bg-surface px-2 py-0.5 text-[11px] text-ink">
              {f}
            </span>
          ))}
        </div>
      ) : null}

      {/* KPI tiles */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Open matured leakage"
          value={moneyCompact(summary.leakageDollars)}
          helper="eligible · unclaimed · ≥ 60d"
          tone="open"
          info={{
            body: "Total dollar value of rebate-eligible spend on transactions that have passed the 60-day maturity window without a successful claim.",
            formula: "SUM(expected_rebate_amount WHERE leakage_flag = TRUE)",
          }}
          index={0}
        />
        <MetricCard
          label="Recovered YTD"
          value={moneyCompact(summary.recoveredYtd)}
          helper="claimed this calendar year"
          tone="recovered"
          info={{
            body: "Year-to-date claimed dollars. Closes the loop with the BI team's classification feedback.",
            formula: "SUM(claimed_amount WHERE claim_date >= year_start)",
          }}
          index={1}
        />
        <MetricCard
          label="Capture rate"
          value={pct(summary.captureRate, 1)}
          helper={`${delta(summary.qoq, 1)} QoQ`}
          tone={captureRateTone(summary.captureRate)}
          helperTone={deltaTone(summary.qoq)}
          info={{
            body: "Share of rebate-eligible spend that successfully converts to claimed rebate dollars.",
            formula: "claimed / (claimed + leaked)",
            thresholds: [
              { label: "≥ 85% — healthy", tone: "good" },
              { label: "70–85% — watch", tone: "warn" },
              { label: "< 70% — at risk", tone: "bad" },
            ],
          }}
          index={2}
        />
        <MetricCard
          label="P1 affiliates"
          value={number(summary.p1Count)}
          helper="affiliate shops with ≥ $500 leakage or 150d+ aged case"
          tone={p1Tone(summary.p1Count)}
          info={{
            body: "Distinct affiliate shops with at least one P1-priority case (≥ $500 leakage or 150+ days aged).",
            formula: "COUNT DISTINCT shop_id WHERE priority = 'P1'",
          }}
          index={3}
        />
        <MetricCard
          label="False-positive rate"
          value={pct(summary.fpRate, 1)}
          helper="of labeled flags"
          tone={falsePositiveTone(summary.fpRate)}
          info={{
            body: "Share of labeled BI follow-ups marked as rule misfires. Lower is better; drives rule-precision improvements over time.",
            formula: "false_positive / labeled_total",
            thresholds: [
              { label: "< 5% — strong rules", tone: "good" },
              { label: "5–15% — tune rules", tone: "warn" },
              { label: "≥ 15% — rule precision risk", tone: "bad" },
            ],
          }}
          index={4}
        />
        <MetricCard
          label="Projected annual recovery"
          value={moneyCompact(summary.projectedAnnual)}
          helper={`based on ${pct(summary.captureRate, 0)} capture · ${pct(summary.fpRate, 0)} FP`}
          tone="recovered"
          info={{
            body: "Forward-looking annualized recovery assuming current run-rate, capture rate, and false-positive rate hold.",
            formula: "open_leakage × capture × (1 − FP) × 4",
          }}
          index={5}
        />
      </section>

      {/* Top vendors (large) | Right column: Root cause + LOR stacked */}
      <section className="mt-5 grid gap-4 xl:grid-cols-3">
        <div className="panel xl:col-span-2">
          <div className="border-b border-rule px-5 py-3">
            <h2 className="section-title">Top vendors by leakage</h2>
            <p className="section-sub">
              Vendor concentration view. Bar color reflects the dominant root cause for each vendor — useful when investigating crosswalk and program-rule quality.
            </p>
          </div>
          <div className="px-5 py-4">
            {topVendors.length === 0 ? (
              <EmptyState message="No vendors match the current filters." />
            ) : (
              <TopVendorsChart rows={topVendors} />
            )}
          </div>
        </div>

        <div className="space-y-4 xl:col-span-1">
          <div className="panel">
            <div className="border-b border-rule px-5 py-3">
              <h2 className="section-title">Root cause breakdown</h2>
              <p className="section-sub">Where the leakage comes from — not just status.</p>
            </div>
            <div className="px-5 py-4">
              {rootCauses.length === 0 ? (
                <EmptyState message="No leakage matches the current filters." />
              ) : (
                <RootCauseBars rows={rootCauses} />
              )}
            </div>
          </div>
          <div className="panel">
            <div className="border-b border-rule px-5 py-3">
              <h2 className="section-title">LOR ↔ rebate-eligible spend</h2>
              <p className="section-sub">Length of rental as a leading indicator for rebate-eligible material spend.</p>
            </div>
            <div className="px-5 py-4">
              <LorCorrelationChart data={filteredLor} />
            </div>
          </div>
        </div>
      </section>

      {/* Trend full width */}
      <section className="panel mt-5">
        <div className="flex items-start justify-between gap-3 border-b border-rule px-5 py-3">
          <div>
            <h2 className="section-title">Open vs recovered leakage</h2>
            <p className="section-sub">Rolling 6-month window. Recovery is the lagging metric; watch the gap close.</p>
          </div>
          <div className="flex items-center gap-3 text-[11.5px] text-ink-muted">
            <span className="flex items-center"><span className="legend-dot" style={{ background: "#DC2626" }} /> open</span>
            <span className="flex items-center"><span className="legend-dot" style={{ background: "#16A34A" }} /> recovered</span>
          </div>
        </div>
        <div className="px-5 py-4">
          <TrendChart data={trend} />
        </div>
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center text-[12.5px] text-ink-faint">{message}</div>
  );
}
