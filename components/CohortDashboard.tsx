"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { BarList } from "@/components/BarList";
import { MetricCard } from "@/components/MetricCard";
import { Slicer } from "@/components/Slicer";
import { number, pct } from "@/lib/format";

export type CohortShop = {
  shop_id: number;
  shop_code: string;
  shop_name: string;
  region: string;
  affiliate_tier: string;
  cohort_label: string;
  avg_cycle_time_days: string;
  csi_score: string;
  drp_compliance: string;
  rebate_capture_rate: string;
  length_of_rental: string;
  intervention_flag: boolean;
};

export type InterventionRow = {
  shop_code: string;
  shop_name: string;
  region: string;
  cohort_label: string;
  cycle_time_percentile: number;
  csi_percentile: number;
  drp_compliance_percentile: number;
  severity_score: string;
  recommended_intervention: string;
};

export function CohortDashboard({
  shops,
  interventions,
}: {
  shops: CohortShop[];
  interventions: InterventionRow[];
}) {
  const [region, setRegion] = useState("all");
  const [cohort, setCohort] = useState("all");
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  useEffect(() => {
    setRefreshedAt(format(new Date(), "MMM d · h:mm a"));
  }, []);

  const regions = useMemo(
    () => [
      { value: "all", label: "All regions" },
      ...Array.from(new Set(shops.map((r) => r.region))).sort().map((v) => ({ value: v, label: v })),
    ],
    [shops]
  );
  const cohortOptions = useMemo(
    () => [
      { value: "all", label: "All cohorts" },
      ...Array.from(new Set(shops.map((r) => r.cohort_label))).sort().map((v) => ({ value: v, label: v })),
    ],
    [shops]
  );

  const filteredShops = useMemo(() => {
    return shops.filter((s) => {
      if (region !== "all" && s.region !== region) return false;
      if (cohort !== "all" && s.cohort_label !== cohort) return false;
      return true;
    });
  }, [shops, region, cohort]);

  const filteredInterventions = useMemo(() => {
    return interventions.filter((r) => {
      if (region !== "all" && r.region !== region) return false;
      if (cohort !== "all" && r.cohort_label !== cohort) return false;
      return true;
    });
  }, [interventions, region, cohort]);

  // Aggregate cohorts from filtered shop set
  const cohortAggs = useMemo(() => {
    const map = new Map<
      string,
      {
        shop_count: number;
        sum_cycle: number;
        sum_csi: number;
        sum_drp: number;
        sum_capture: number;
        intervention_count: number;
      }
    >();
    for (const s of filteredShops) {
      const cur = map.get(s.cohort_label) ?? {
        shop_count: 0,
        sum_cycle: 0,
        sum_csi: 0,
        sum_drp: 0,
        sum_capture: 0,
        intervention_count: 0,
      };
      cur.shop_count += 1;
      cur.sum_cycle += Number(s.avg_cycle_time_days ?? 0);
      cur.sum_csi += Number(s.csi_score ?? 0);
      cur.sum_drp += Number(s.drp_compliance ?? 0);
      cur.sum_capture += Number(s.rebate_capture_rate ?? 0);
      if (s.intervention_flag) cur.intervention_count += 1;
      map.set(s.cohort_label, cur);
    }
    // Cross-reference filtered interventions for the actual top-N count
    const interventionCountByLabel = new Map<string, number>();
    for (const i of filteredInterventions) {
      interventionCountByLabel.set(i.cohort_label, (interventionCountByLabel.get(i.cohort_label) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([cohort_label, v]) => ({
        cohort_label,
        shop_count: v.shop_count,
        avg_cycle_time_days: (v.sum_cycle / v.shop_count).toFixed(1),
        avg_csi_score: (v.sum_csi / v.shop_count).toFixed(1),
        avg_drp_compliance: (v.sum_drp / v.shop_count).toFixed(1),
        avg_rebate_capture_rate: (v.sum_capture / v.shop_count).toFixed(1),
        intervention_priority_count: interventionCountByLabel.get(cohort_label) ?? 0,
      }))
      .sort((a, b) => b.intervention_priority_count - a.intervention_priority_count || b.shop_count - a.shop_count);
  }, [filteredShops, filteredInterventions]);

  const totalShops = filteredShops.length;
  const peerCohorts = cohortAggs.length;
  const totalInterventions = filteredInterventions.length;

  const activeFilters = [
    region !== "all" ? `Region · ${region}` : null,
    cohort !== "all" ? `Cohort · ${cohort}` : null,
  ].filter(Boolean) as string[];
  const onReset = () => {
    setRegion("all");
    setCohort("all");
  };

  return (
    <div>
      <div className="slicer mb-4 md:mb-5">
        <Slicer label="Region" value={region} options={regions} onChange={setRegion} />
        <Slicer label="Cohort" value={cohort} options={cohortOptions} onChange={setCohort} />
        <div className="flex min-w-[140px] flex-1 flex-col gap-1 border-r border-rule px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-meta text-ink-faint">Lens</span>
          <span className="truncate text-[13px] font-medium text-ink-muted">Peer-relative outliers</span>
        </div>
        <div className="flex min-w-[140px] flex-1 flex-col gap-1 border-r border-rule px-4 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-meta text-ink-faint">Threshold</span>
          <span className="truncate text-[13px] font-medium text-ink-muted">≥ 70th percentile</span>
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
            <span key={f} className="inline-flex items-center gap-1 rounded-full border border-rule bg-surface px-2 py-0.5 text-[11px] text-ink">{f}</span>
          ))}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <MetricCard label="Affiliates classified" value={number(totalShops)} helper="across CCG affiliate network" index={0} />
        <MetricCard label="Peer cohorts" value={number(peerCohorts)} helper="behavioral, not just regional" index={1} />
        <MetricCard
          label="Enablement opportunities"
          value={number(totalInterventions)}
          helper="cycle / CSI / DRP outliers"
          tone={totalInterventions > 0 ? "warn" : "good"}
          index={2}
        />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <div className="border-b border-rule px-5 py-3">
            <h2 className="section-title">Cohorts by enablement opportunity</h2>
            <p className="section-sub">Where the performance team&rsquo;s outreach effort actually pays back.</p>
          </div>
          <div className="px-5 py-4">
            {cohortAggs.length === 0 ? (
              <div className="py-8 text-center text-[12.5px] text-ink-faint">No cohorts match the current filters.</div>
            ) : (
              <BarList
                rows={cohortAggs as unknown as Record<string, string | number | null>[]}
                labelKey="cohort_label"
                valueKey="intervention_priority_count"
                unit="count"
                color="#0E8C5A"
              />
            )}
          </div>
        </div>
        <div className="panel">
          <div className="border-b border-rule px-5 py-3">
            <h2 className="section-title">Cohort health snapshot</h2>
            <p className="section-sub">Peer-cohort medians for the four core operational KPIs.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="matrix">
              <thead>
                <tr>
                  <th>Cohort</th>
                  <th className="text-center">Shops</th>
                  <th className="text-center">Cycle</th>
                  <th className="text-center">CSI</th>
                  <th className="text-center">DRP</th>
                </tr>
              </thead>
              <tbody>
                {cohortAggs.map((row) => (
                  <tr key={row.cohort_label}>
                    <td className="font-semibold text-ink">{row.cohort_label}</td>
                    <td className="text-center font-mono tabular-nums">{row.shop_count}</td>
                    <td className="text-center font-mono tabular-nums">{row.avg_cycle_time_days}d</td>
                    <td className="text-center font-mono tabular-nums">{pct(row.avg_csi_score, 1)}</td>
                    <td className="text-center font-mono tabular-nums">{pct(row.avg_drp_compliance, 1)}</td>
                  </tr>
                ))}
                {cohortAggs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[12.5px] text-ink-faint">
                      No cohorts match the current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="panel mt-5">
        <div className="border-b border-rule px-5 py-3">
          <h2 className="section-title">Top affiliate enablement opportunities</h2>
          <p className="section-sub">
            How the dashboard becomes an outreach workflow rather than a chart gallery.
            <span className="ml-1 text-ink-faint">Higher percentile = more severe outlier within peer cohort.</span>
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="matrix w-full table-auto">
            <thead className="sticky top-0 z-[5]">
              <tr>
                <th>Affiliate shop</th>
                <th>Cohort</th>
                <th className="text-center">Cycle outlier %</th>
                <th className="text-center">CSI risk %</th>
                <th className="text-center">DRP risk %</th>
                <th>Recommended enablement</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterventions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[12.5px] text-ink-faint">
                    No enablement opportunities match the current filters.
                  </td>
                </tr>
              ) : (
                filteredInterventions.slice(0, 100).map((row) => (
                  <tr key={row.shop_code}>
                    <td className="min-w-[220px]">
                      <div className="font-semibold text-ink">{row.shop_name}</div>
                      <div className="text-[11.5px] text-ink-faint">
                        {row.shop_code} · {row.region}
                      </div>
                    </td>
                    <td>{row.cohort_label}</td>
                    <td className="text-center font-mono tabular-nums">{row.cycle_time_percentile}</td>
                    <td className="text-center font-mono tabular-nums">{row.csi_percentile}</td>
                    <td className="text-center font-mono tabular-nums">{row.drp_compliance_percentile}</td>
                    <td className="min-w-[300px] text-ink-muted">{row.recommended_intervention}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
