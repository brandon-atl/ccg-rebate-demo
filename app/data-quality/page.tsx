import { MetricCard } from "@/components/MetricCard";
import { PageShell } from "@/components/PageShell";
import { getDataQualitySummary, getQualityChecks } from "@/lib/queries";
import { number } from "@/lib/format";

export const dynamic = "force-dynamic";

const toneClass: Record<string, string> = {
  pass: "status-pill status-pass",
  review: "status-pill status-review",
  fail: "status-pill status-fail",
};

export default async function DataQualityPage() {
  const [summary, checks] = await Promise.all([
    getDataQualitySummary(),
    getQualityChecks(),
  ]);
  return (
    <PageShell
      eyebrow="CCG · Trust Layer"
      title="Data Quality &amp; Maturity Safeguards"
      subtitle="Pipeline trust view: row counts, grain checks, returns/voids exclusion, vendor crosswalk usage, and the 60-day rebate maturity rule. Every flag downstream is gated by these checks."
    >
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Raw transactions"
          value={number(summary.total_transactions)}
          helper="bronze fact_transaction"
        />
        <MetricCard
          label="Eligible gold rows"
          value={number(summary.eligible_rows)}
          helper="post-join, post-eligibility"
        />
        <MetricCard
          label="Immature excluded"
          value={number(summary.immature_transaction_count)}
          helper="younger than 60 days"
        />
        <MetricCard
          label="Vendor crosswalk hits"
          value={number(summary.vendor_crosswalk_count)}
          helper="parent ≠ subsidiary mapped"
        />
      </section>

      <section className="panel mt-5">
        <div className="border-b border-rule px-5 py-3">
          <h2 className="section-title">Quality checks</h2>
          <p className="section-sub">
            Each check is a contract between the pipeline and the dashboard. Failures stop the load.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="matrix">
            <thead>
              <tr>
                <th>Check</th>
                <th className="text-right">Value</th>
                <th>Status</th>
                <th>Why it matters</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => (
                <tr key={check.check_name}>
                  <td className="min-w-[220px] font-semibold text-ink">{check.check_name}</td>
                  <td className="text-right font-mono tabular-nums">{check.check_value}</td>
                  <td>
                    <span className={toneClass[check.status] ?? toneClass.review}>
                      {check.status}
                    </span>
                  </td>
                  <td className="min-w-[360px] text-ink-muted">{check.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
