import { LorCorrelationChart } from "@/components/LorCorrelationChart";
import { MetricCard } from "@/components/MetricCard";
import { PageShell } from "@/components/PageShell";
import { RootCauseBars } from "@/components/RootCauseBars";
import { StakeholderViews } from "@/components/StakeholderViews";
import { TopVendorsChart } from "@/components/TopVendorsChart";
import { TrendChart } from "@/components/TrendChart";
import {
  getDashboardSummary,
  getLeakageTrend,
  getLorRebateCorrelation,
  getRootCauseBreakdown,
  getVendorLeakage,
} from "@/lib/queries";
import { delta, money, moneyCompact, number, pct } from "@/lib/format";
import { captureRateTone, deltaTone, falsePositiveTone, p1Tone } from "@/lib/tones";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [summary, rootCauses, trend, vendors, lor] = await Promise.all([
    getDashboardSummary(),
    getRootCauseBreakdown(),
    getLeakageTrend(),
    getVendorLeakage(8),
    getLorRebateCorrelation(),
  ]);

  const openLeakage = Number(summary.estimated_leakage_amount ?? 0);
  const captureRate = Number(summary.capture_rate ?? 0);
  const fpRate = Number(summary.false_positive_rate ?? 0);
  // Annualized recovery projection = open leakage × capture rate × (1 - FP rate) × 4 quarters,
  // floored to a sensible minimum so the demo never reads "$0".
  const projectedAnnual = Math.max(
    0,
    openLeakage * (captureRate / 100) * (1 - fpRate / 100) * 4
  );

  return (
    <PageShell
      eyebrow="CCG · Rebate Recovery"
      title="Rebate Leakage Executive Dashboard"
      subtitle="Consumption artifact: what enterprise systems, performance management, and senior leadership would see in Power BI on top of the NetSuite → bronze → silver → gold pipeline."
      audienceTags={
        <>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/85">exec view</span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/85">mature ≥ 60d</span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/85">gold model</span>
        </>
      }
    >
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Open matured leakage"
          value={moneyCompact(summary.estimated_leakage_amount)}
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
          value={moneyCompact(summary.recovered_ytd_amount)}
          helper="closed from flag"
          tone="recovered"
          info={{
            body: "Year-to-date claimed dollars on transactions that flowed through the leakage flag → BI-team feedback loop.",
            formula: "SUM(claimed_amount WHERE claim_date >= year_start)",
          }}
          index={1}
        />
        <MetricCard
          label="Capture rate"
          value={pct(summary.capture_rate, 1)}
          helper={`${delta(summary.capture_rate_qoq_delta, 1)} QoQ`}
          tone={captureRateTone(summary.capture_rate)}
          helperTone={deltaTone(summary.capture_rate_qoq_delta)}
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
          value={number(summary.p1_shop_count)}
          helper="affiliate shops with ≥ $500 leakage or 150d+ aged case"
          tone={p1Tone(summary.p1_shop_count)}
          info={{
            body: "Distinct affiliate shops with at least one P1-priority case (≥ $500 leakage or 150+ days aged).",
            formula: "COUNT DISTINCT shop_id WHERE priority = 'P1'",
          }}
          index={3}
        />
        <MetricCard
          label="False-positive rate"
          value={pct(summary.false_positive_rate, 1)}
          helper="of labeled flags"
          tone={falsePositiveTone(summary.false_positive_rate)}
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
          value={moneyCompact(projectedAnnual)}
          helper={`based on ${pct(summary.capture_rate, 0)} capture · ${pct(summary.false_positive_rate, 0)} FP`}
          tone="recovered"
          info={{
            body: "Forward-looking annualized recovery assuming current run-rate, capture rate, and false-positive rate hold.",
            formula: "open_leakage × capture × (1 − FP) × 4",
          }}
          index={5}
        />
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-3">
        <div className="panel xl:col-span-2">
          <div className="border-b border-rule px-5 py-3">
            <h2 className="section-title">Top vendors by leakage</h2>
            <p className="section-sub">
              Vendor concentration view. Bar color reflects the dominant root cause for each vendor — useful when investigating crosswalk and program-rule quality.
            </p>
          </div>
          <div className="px-5 py-4">
            <TopVendorsChart rows={vendors} />
          </div>
        </div>

        <div className="panel">
          <div className="border-b border-rule px-5 py-3">
            <h2 className="section-title">Root cause breakdown</h2>
            <p className="section-sub">Where the leakage comes from — not just status.</p>
          </div>
          <div className="px-5 py-4">
            <RootCauseBars rows={rootCauses} />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-3">
        <div className="panel xl:col-span-2">
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
        </div>

        <div className="panel">
          <div className="border-b border-rule px-5 py-3">
            <h2 className="section-title">LOR ↔ rebate-eligible spend</h2>
            <p className="section-sub">
              Length of rental as leading indicator for material spend &mdash; the cross-source signal CCG should be generating internally.
            </p>
          </div>
          <div className="px-5 py-4">
            <LorCorrelationChart data={lor} />
          </div>
        </div>
      </section>

      <StakeholderViews />
    </PageShell>
  );
}
