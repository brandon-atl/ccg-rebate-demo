import { LorCorrelationChart } from "@/components/LorCorrelationChart";
import { MetricCard } from "@/components/MetricCard";
import { captureRateTone, deltaTone, falsePositiveTone, p1Tone } from "@/lib/tones";
import { PageShell } from "@/components/PageShell";
import { PriorityBadge } from "@/components/PriorityBadge";
import { RootCauseBars } from "@/components/RootCauseBars";
import { StakeholderViews } from "@/components/StakeholderViews";
import { TrendChart } from "@/components/TrendChart";
import {
  getDashboardSummary,
  getLeakageTrend,
  getLorRebateCorrelation,
  getRootCauseBreakdown,
  getShopActionList,
} from "@/lib/queries";
import { delta, money, moneyCompact, number, pct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [summary, rootCauses, trend, actions, lor] = await Promise.all([
    getDashboardSummary(),
    getRootCauseBreakdown(),
    getLeakageTrend(),
    getShopActionList(8),
    getLorRebateCorrelation(),
  ]);

  return (
    <PageShell
      eyebrow="CCG · Rebate Recovery"
      title="Rebate Leakage — Executive Dashboard"
      subtitle="Consumption artifact: what enterprise systems, performance management, and senior leadership would see in Power BI on top of the NetSuite → bronze → silver → gold pipeline."
      audienceTags={
        <>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/85">
            exec view
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/85">
            mature ≥ 60d only
          </span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/85">
            powered by gold model
          </span>
        </>
      }
      framingNote="Framing: low rebate capture is a value-recovery and process-diagnosis signal — not affiliate punishment. The dashboard helps CCG recover money and improve trust."
    >
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard
          label="Open matured leakage"
          value={moneyCompact(summary.estimated_leakage_amount)}
          helper="eligible · unclaimed · ≥ 60d"
          tone="open"
          index={0}
        />
        <MetricCard
          label="Recovered YTD"
          value={moneyCompact(summary.recovered_ytd_amount)}
          helper="closed from flag"
          tone="recovered"
          index={1}
        />
        <MetricCard
          label="Capture rate"
          value={pct(summary.capture_rate, 1)}
          helper={`${delta(summary.capture_rate_qoq_delta, 1)} QoQ`}
          tone={captureRateTone(summary.capture_rate)}
          helperTone={deltaTone(summary.capture_rate_qoq_delta)}
          index={2}
        />
        <MetricCard
          label="P1 affiliates"
          value={number(summary.p1_shop_count)}
          helper="≥ $500 leakage or 150d aged"
          tone={p1Tone(summary.p1_shop_count)}
          index={3}
        />
        <MetricCard
          label="False-positive rate"
          value={pct(summary.false_positive_rate, 1)}
          helper="of labeled flags"
          tone={falsePositiveTone(summary.false_positive_rate)}
          index={4}
        />
      </section>

      <section className="mt-5 grid gap-4 xl:grid-cols-3">
        <div className="panel xl:col-span-2">
          <div className="flex items-start justify-between gap-3 border-b border-rule px-5 py-3">
            <div>
              <h2 className="section-title">Prioritized BI team action list</h2>
              <p className="section-sub">
                Top 8 cases by dollar value. The BI team works the queue; the platform team watches the rule precision.
              </p>
            </div>
            <a
              href="/action-list"
              className="rounded-md border border-rule bg-canvas px-3 py-1.5 text-[12px] font-medium text-ink hover:border-accent-azure hover:text-accent-azure"
            >
              Open full queue →
            </a>
          </div>
          <div>
            <table className="matrix w-full table-auto">
              <thead>
                <tr>
                  <th className="w-[60px]">Pri</th>
                  <th>Affiliate shop</th>
                  <th>Vendor program</th>
                  <th>Root cause</th>
                  <th className="text-right">Aged</th>
                  <th className="text-right">Leakage</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((row) => (
                  <tr key={`${row.shop_code}-${row.parent_vendor_name}-${row.program_name}-${row.leakage_reason}`}>
                    <td>
                      <PriorityBadge level={row.priority_level} />
                    </td>
                    <td>
                      <div className="font-semibold text-ink">{row.shop_name}</div>
                      <div className="text-[11.5px] text-ink-faint">
                        {row.shop_code} · {row.region} · {row.state}
                      </div>
                    </td>
                    <td>
                      <div>{row.parent_vendor_name}</div>
                      <div className="text-[11.5px] text-ink-faint">{row.program_name}</div>
                    </td>
                    <td className="text-ink-muted">{row.root_cause}</td>
                    <td className="whitespace-nowrap text-right font-mono tabular-nums text-ink-muted">
                      {row.max_maturity_days}d
                    </td>
                    <td className="whitespace-nowrap text-right font-mono tabular-nums font-semibold">
                      {money(row.estimated_leakage_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <p className="section-sub">
                Recovery is the lagging metric. Watch it over the rolling 6-month window.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11.5px] text-ink-muted">
              <span className="flex items-center">
                <span className="legend-dot" style={{ background: "#DC2626" }} /> open
              </span>
              <span className="flex items-center">
                <span className="legend-dot" style={{ background: "#16A34A" }} /> recovered
              </span>
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
