import { BarList } from "@/components/BarList";
import { MetricCard } from "@/components/MetricCard";
import { PageShell } from "@/components/PageShell";
import { getCohortPreview, getTopCohortInterventions } from "@/lib/queries";
import { number, pct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CohortPreviewPage() {
  const [cohorts, interventions] = await Promise.all([
    getCohortPreview(),
    getTopCohortInterventions(),
  ]);
  const totalShops = cohorts.reduce((sum, row) => sum + Number(row.shop_count), 0);
  const priority = cohorts.reduce((sum, row) => sum + Number(row.intervention_priority_count), 0);

  return (
    <PageShell
      eyebrow="CCG · Performance Mgmt"
      title="Affiliate performance cohort preview"
      subtitle="Companion view for the performance management team — same shop dimension, peer-relative cohorts. Useful when the conversation moves from rebate leakage to performance management."
      framingNote="Peer-relative comparison protects the affiliate from network-average benchmarking that obscures genuine outliers."
    >
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <MetricCard
          label="Shops classified"
          value={number(totalShops)}
          helper="across CCG + Top Shop"
        />
        <MetricCard
          label="Peer cohorts"
          value={number(cohorts.length)}
          helper="behavioral, not just regional"
        />
        <MetricCard
          label="Intervention candidates"
          value={number(priority)}
          helper="cycle / CSI / DRP outliers"
        />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <div className="border-b border-rule px-5 py-3">
            <h2 className="section-title">Cohorts by intervention count</h2>
            <p className="section-sub">Where performance-team outreach effort actually pays back.</p>
          </div>
          <div className="px-5 py-4">
            <BarList
              rows={cohorts}
              labelKey="cohort_label"
              valueKey="intervention_priority_count"
              unit="count"
              color="#0E8C5A"
            />
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
                {cohorts.map((row) => (
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
          <h2 className="section-title">Top intervention candidates</h2>
          <p className="section-sub">
            How the dashboard becomes an outreach workflow rather than a chart gallery.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="matrix">
            <thead>
              <tr>
                <th>Shop</th>
                <th>Cohort</th>
                <th className="text-right">Cycle pct</th>
                <th className="text-right">CSI pct</th>
                <th className="text-right">DRP pct</th>
                <th>Recommended intervention</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map((row) => (
                <tr key={row.shop_code}>
                  <td className="min-w-[230px]">
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
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
