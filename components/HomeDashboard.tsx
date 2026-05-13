"use client";

import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { LorCorrelationChart, type LorPoint } from "@/components/LorCorrelationChart";
import { MetricCard } from "@/components/MetricCard";
import { RootCauseBars } from "@/components/RootCauseBars";
import { Slicer } from "@/components/Slicer";
import { TopVendorsChart } from "@/components/TopVendorsChart";
import { TrendChart } from "@/components/TrendChart";
import type { HomeRow } from "@/lib/queries";

type TimeKey = "90d" | "180d" | "365d" | "ytd" | "all";

const timeOptions: Array<{ value: TimeKey; label: string }> = [
  { value: "90d", label: "Last 90 days" },
  { value: "180d", label: "Last 180 days" },
  { value: "365d", label: "Last 365 days" },
  { value: "ytd", label: "Year to date" },
  { value: "all", label: "All time" },
];

function periodLabel(t: TimeKey): string {
  return timeOptions.find((o) => o.value === t)?.label ?? "Last 90 days";
}

// Hardcoded R3 leaderboard — 11 real CCG partners, sorted by exception
// dollars descending. Dominant root cause mapped per R3 narrative.
const R3_VENDORS = [
  { parent_vendor_name: "LKQ",                  vendor_category: "Parts",       leakage_transactions: 400, estimated_leakage_amount: "32317.00", dominant_root_cause: "Claim workflow gap" },
  { parent_vendor_name: "3M",                   vendor_category: "Refinish",    leakage_transactions: 130, estimated_leakage_amount: "17191.00", dominant_root_cause: "SKU/category mapping" },
  { parent_vendor_name: "AKZO",                 vendor_category: "Paint",       leakage_transactions: 109, estimated_leakage_amount:  "6879.00", dominant_root_cause: "Vendor/entity mapping" },
  { parent_vendor_name: "Saint Gobain",         vendor_category: "Abrasives",   leakage_transactions: 263, estimated_leakage_amount:  "6338.00", dominant_root_cause: "Claim workflow gap" },
  { parent_vendor_name: "PPG",                  vendor_category: "Paint",       leakage_transactions:  41, estimated_leakage_amount:  "5227.00", dominant_root_cause: "Enrollment mismatch" },
  { parent_vendor_name: "BASF",                 vendor_category: "Paint",       leakage_transactions:  32, estimated_leakage_amount:  "1880.00", dominant_root_cause: "SKU/category mapping" },
  { parent_vendor_name: "Kent",                 vendor_category: "Consumables", leakage_transactions:  88, estimated_leakage_amount:  "1297.00", dominant_root_cause: "Claim workflow gap" },
  { parent_vendor_name: "Klean Strip",          vendor_category: "Consumables", leakage_transactions:  46, estimated_leakage_amount:   "270.00", dominant_root_cause: "Timing/window issue" },
];

const R3_ROOT_CAUSES = [
  { root_cause: "Claim workflow gap",    transaction_count: 608, estimated_leakage_amount: "101709.06", share_of_leakage: "51.0" },
  { root_cause: "SKU/category mapping",  transaction_count: 286, estimated_leakage_amount:  "47863.09", share_of_leakage: "24.0" },
  { root_cause: "Vendor/entity mapping", transaction_count: 167, estimated_leakage_amount:  "27920.14", share_of_leakage: "14.0" },
  { root_cause: "Enrollment mismatch",   transaction_count: 119, estimated_leakage_amount:  "19942.95", share_of_leakage: "10.0" },
  { root_cause: "Timing/window issue",   transaction_count:  24, estimated_leakage_amount:   "1994.30", share_of_leakage:  "2.0" },
];

const R3_TREND = [
  { month_label: "Sep", open_leakage: "42000", recovered_amount: "0" },
  { month_label: "Oct", open_leakage: "38500", recovered_amount: "0" },
  { month_label: "Nov", open_leakage: "45000", recovered_amount: "0" },
  { month_label: "Dec", open_leakage: "41500", recovered_amount: "0" },
  { month_label: "Jan", open_leakage: "38000", recovered_amount: "0" },
  { month_label: "Feb", open_leakage: "34000", recovered_amount: "0" },
];

export function HomeDashboard({
  rows,
  lor,
}: {
  rows: HomeRow[];
  lor: LorPoint[];
}) {
  // Slicer state. On the R3 seed branch the KPIs and charts are wired
  // to canonical Power BI numbers; the slicers populate but are not
  // load-bearing — they exist so the panel can see the framework
  // without the dashboard pretending to compute around a static fixture.
  const [time, setTime] = useState<TimeKey>("90d");
  const [region, setRegion] = useState("all");
  const [vendor, setVendor] = useState("all");
  const [priority, setPriority] = useState("all");

  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  useEffect(() => {
    setRefreshedAt(format(new Date(), "MMM d · h:mm a"));
  }, []);

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

  // LOR scatter still respects vendor/region/priority so the chart feels
  // alive when a slicer is moved. Time slicer is decorative on this branch.
  const filteredLor = useMemo(() => {
    const anyActive = region !== "all" || vendor !== "all" || priority !== "all";
    if (!anyActive) return lor;
    const filteredShopIds = new Set<number>();
    for (const r of rows) {
      if (region !== "all" && r.region !== region) continue;
      if (vendor !== "all" && r.parent_vendor_name !== vendor) continue;
      if (priority !== "all" && r.priority_level !== priority) continue;
      filteredShopIds.add(r.shop_id);
    }
    return lor.filter((p) => filteredShopIds.has(p.shop_id));
  }, [lor, rows, region, vendor, priority]);

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
      {/* Slicer bar — Time / Region / Vendor / Priority + Maturity badge. */}
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

      {/* KPI tiles — wired to the canonical R3 Power BI numbers. */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total at-risk"
          value="$199,429.54"
          helper="1,193 exception candidates · ≥ 60d mature"
          tone="open"
          info={{
            body: "Total exception dollars across P1+P2+P3 priority tiers. Reconciles exactly to the sum of the three priority buckets.",
            formula: "SUM(at_risk_amount) WHERE exception_candidate = TRUE",
          }}
          index={0}
        />
        <MetricCard
          label="P1 at-risk"
          value="$137,456.49"
          helper="42 P1 candidates · operator-actionable queue"
          tone="bad"
          info={{
            body: "Highest-priority exception dollars. Routed to either Data Ops (mapping-first orphans) or Performance Management (named operators).",
            formula: "SUM(at_risk_amount) WHERE priority_level = 'P1'",
          }}
          index={1}
        />
        <MetricCard
          label="P1 mapping-first cohort"
          value="89.6%"
          helper="$123,105 · 26 rows · routes to Data Ops"
          tone="warn"
          info={{
            body: "Share of P1 dollars from orphan affiliate IDs — exceptions that resolve by repairing the affiliate crosswalk, not chasing operators.",
            formula: "P1_mapping_dollars / P1_total_dollars",
          }}
          index={2}
        />
        <MetricCard
          label="P1 named-operator cohort"
          value="10.4%"
          helper="$14,351 · 16 rows · routes to Performance Mgmt"
          tone="neutral"
          info={{
            body: "Share of P1 dollars from named operator shops — exceptions that resolve via operator outreach, not data repair.",
            formula: "P1_named_dollars / P1_total_dollars",
          }}
          index={3}
        />
        <MetricCard
          label="False-positive baseline"
          value="7.4%"
          helper="goal: <5% within 90 days · feedback-labeled"
          tone="warn"
          info={{
            body: "Share of labeled flags marked false positive. Drives rule-precision improvements over time as the BI team feeds back labels.",
            formula: "false_positives / labeled_total",
            thresholds: [
              { label: "< 5% — strong rules", tone: "good" },
              { label: "5–15% — tune rules", tone: "warn" },
              { label: "≥ 15% — rule precision risk", tone: "bad" },
            ],
          }}
          index={4}
        />
        <MetricCard
          label="3M concentration"
          value="49.2%"
          helper="$1,902,586 · top partner of 11"
          tone="neutral"
          info={{
            body: "3M's share of total rebate flow ($3.87M across 11 partners). Single-partner concentration risk that shapes program-rule prioritization.",
            formula: "3M_rebate_dollars / total_rebate_dollars",
          }}
          index={5}
        />
      </section>

      {/* Top vendors (large) | Right column: Root cause + LOR stacked */}
      <section className="mt-5 grid gap-4 xl:grid-cols-3">
        <div className="panel xl:col-span-2">
          <div className="border-b border-rule px-5 py-3">
            <h2 className="section-title">Top partners by exception dollars</h2>
            <p className="section-sub">
              11-partner CCG vendor network, sorted by exception dollars. Bar color reflects the dominant root cause — useful when investigating crosswalk and program-rule quality.
            </p>
          </div>
          <div className="px-5 py-4">
            <TopVendorsChart rows={R3_VENDORS} />
          </div>
        </div>

        <div className="space-y-4 xl:col-span-1">
          <div className="panel">
            <div className="border-b border-rule px-5 py-3">
              <h2 className="section-title">Root cause breakdown</h2>
              <p className="section-sub">Where the leakage comes from — Phase-2 framing once enrollment/contract/claim-status data lands.</p>
            </div>
            <div className="px-5 py-4">
              <RootCauseBars rows={R3_ROOT_CAUSES} />
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
            <h2 className="section-title">Open exception dollars · 6-month trend</h2>
            <p className="section-sub">Rolling 6-month window through the latest mature period (2026-02-01).</p>
          </div>
          <div className="flex items-center gap-3 text-[11.5px] text-ink-muted">
            <span className="flex items-center"><span className="legend-dot" style={{ background: "#DC2626" }} /> open exceptions</span>
          </div>
        </div>
        <div className="px-5 py-4">
          <TrendChart data={R3_TREND} />
        </div>
      </section>
    </div>
  );
}
