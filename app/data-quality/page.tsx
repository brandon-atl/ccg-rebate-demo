import { MetricCard } from "@/components/MetricCard";
import { PageShell } from "@/components/PageShell";
import { StaticContextStrip } from "@/components/SlicerBar";
import { getQualityChecks } from "@/lib/queries";

export const dynamic = "force-dynamic";

const toneClass: Record<string, string> = {
  pass: "status-pill status-pass",
  review: "status-pill status-review",
  fail: "status-pill status-fail",
};

export default async function DataQualityPage() {
  const checks = await getQualityChecks();
  return (
    <PageShell
      eyebrow="CCG · Trust Layer"
      title="Data Quality &amp; Maturity Safeguards"
      subtitle="Pipeline trust view: row counts, grain checks, returns/reversals separation, affiliate crosswalk usage, and the 60-day rebate maturity rule. Every flag downstream is gated by these checks."
      showSlicer={false}
    >
      <div className="mb-4 md:mb-5">
        <StaticContextStrip />
      </div>
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Raw input"
          value="37,002"
          helper="rebate lines over 8,813 transactions"
        />
        <MetricCard
          label="Exception candidates"
          value="1,193"
          helper="post-rule-evaluation"
        />
        <MetricCard
          label="Latest mature period"
          value="2026-02-01"
          helper="100% of Feb rebates posted by day 60"
        />
        <MetricCard
          label="Affiliate crosswalk"
          value="1,458"
          helper="in dim · 1,397 active · 45 orphan"
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
        <div className="border-t border-rule px-5 py-3">
          <p className="text-[12px] italic leading-5 text-ink-faint">
            The Power BI deliverable carries a 25-row computed-vs-expected reconciliation scoreboard. This page shows the 6 pipeline gates upstream of that scoreboard — categorical pass/fail contracts that must hold before R3&rsquo;s numeric reconciliations run.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
