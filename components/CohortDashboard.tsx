"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { BarList } from "@/components/BarList";
import { MetricCard } from "@/components/MetricCard";
import { Slicer } from "@/components/Slicer";
import { number, pct } from "@/lib/format";

export type CohortAggRow = {
  cohort_label: string;
  shop_count: number;
  avg_cycle_time_days: string;
  avg_csi_score: string;
  avg_drp_compliance: string;
  avg_rebate_capture_rate: string;
  intervention_priority_count: number;
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
  cohorts,
  interventions,
}: {
  cohorts: CohortAggRow[];
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
      ...Array.from(new Set(interventions.map((r) => r.region))).sort().map((v) => ({ value: v, label: v })),
    ],
    [interventions]
  );
  const cohortOptions = useMemo(
    () => [
      { value: "all", label: "All cohorts" },
      ...cohorts.map((c) => ({ value: c.cohort_label, label: c.cohort_label })),
    ],
    [cohorts]
  );

  const filteredInterventions = useMemo(() => {
    return interventions.filter((r) => {
      if (region !== "all" && r.region !== region) return false;
      if (cohort !== "all" && r.cohort_label !== cohort) return false;
      return true;
    });
  }, [interventions, region, cohort]);

  // Filtered cohort aggregates: when filter is by cohort, just that one;
  // otherwise show all cohorts with intervention counts updated by region filter.
  const filteredCohorts = useMemo(() => {
    if (region === "all" && cohort === "all") return cohorts;

    // Recompute intervention_priority_count from filtered interventions.
    const interventionCountByLabel = new Map<string, number>();
    for (const i of filteredInterventions) {
      interventionCountByLabel.set(i.cohort_label, (interventionCountByLabel.get(i.cohort_label) ?? 0) + 1);
    }

    let xs = cohorts;
    if (cohort !== "all") xs = xs.filter((c) => c.cohort_label === cohort);
    return xs.map((c) => ({
      ...c,
      intervention_priority_count: interventionCountByLabel.get(c.cohort_label) ?? 0,
    }));
  }, [cohorts, filteredInterventions, region, cohort]);

  const totalShops = filteredCohorts.reduce((s, r) => s + Number(r.shop_count), 0);
  const totalInterventions = filteredInterventions.length;
  const peerCohorts = filteredCohorts.length;

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
            {filteredCohorts.length === 0 ? (
              <div className="py-8 text-center text-[12.5px] text-ink-faint">No cohorts match the current filters.</div>
            ) : (
              <BarList
                rows={filteredCohorts as unknown as Record<string, string | number | null>[]}
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
                  <th className="text-right">Shops</th>
                  <th className="text-right">Cycle</th>
                  <th className="text-right">CSI</th>
                  <th className="text-right">DRP</th>
                </tr>
              </thead>
              <tbody>
                {filteredCohorts.map((row) => (
                  <tr key={row.cohort_label}>
                    <td className="font-semibold text-ink">{row.cohort_label}</td>
                    <td className="text-right font-mono tabular-nums">{row.shop_count}</td>
                    <td className="text-right font-mono tabular-nums">{row.avg_cycle_time_days}d</td>
                    <td className="text-right font-mono tabular-nums">{pct(row.avg_csi_score, 1)}</td>
                    <td className="text-right font-mono tabular-nums">{pct(row.avg_drp_compliance, 1)}</td>
                  </tr>
                ))}
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
                <th className="text-right">Cycle outlier %</th>
                <th className="text-right">CSI risk %</th>
                <th className="text-right">DRP risk %</th>
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
                    <td className="text-right font-mono tabular-nums">{row.cycle_time_percentile}</td>
                    <td className="text-right font-mono tabular-nums">{row.csi_percentile}</td>
                    <td className="text-right font-mono tabular-nums">{row.drp_compliance_percentile}</td>
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
