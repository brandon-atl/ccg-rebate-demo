import { MetricCard } from "@/components/MetricCard";
import { PageShell } from "@/components/PageShell";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusMenu } from "@/components/StatusMenu";
import type { FollowupStatus } from "@/app/actions/followup-action";
import { getDashboardSummary, getShopActionList } from "@/lib/queries";
import { money, moneyCompact, number, pct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ActionListPage() {
  const [summary, actions] = await Promise.all([
    getDashboardSummary(),
    getShopActionList(150),
  ]);

  const p1Count = actions.filter((r) => r.priority_level === "P1").length;
  const p2Count = actions.filter((r) => r.priority_level === "P2").length;

  return (
    <PageShell
      eyebrow="CCG · Rebate Recovery"
      title="BI team action list"
      subtitle="Operator queue. Click a status pill to classify a flagged item — that label flows into fact_bi_followup and the gold view recomputes on next render."
      framingNote="Closed-loop trust: BI feedback (claimed / unclaimable / false-positive) tightens the rules over time."
    >
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Open queue"
          value={number(actions.length)}
          helper={`P1: ${p1Count} · P2: ${p2Count}`}
        />
        <MetricCard
          label="Estimated leakage"
          value={moneyCompact(summary.estimated_leakage_amount)}
          helper="across active priorities"
        />
        <MetricCard
          label="Capture rate"
          value={pct(summary.capture_rate, 1)}
          helper={`${summary.shops_with_leakage} shops flagged`}
        />
        <MetricCard
          label="False-positive rate"
          value={pct(summary.false_positive_rate, 1)}
          helper="from BI feedback labels"
        />
      </section>

      <section className="panel mt-5">
        <div className="border-b border-rule px-5 py-3">
          <h2 className="section-title">Active queue</h2>
          <p className="section-sub">
            Sorted by priority, then leakage value. Status pills are interactive — try clicking one.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="matrix w-full table-auto">
            <thead>
              <tr>
                <th className="w-[58px]">Pri</th>
                <th>Shop</th>
                <th>Vendor / Program</th>
                <th>Root cause</th>
                <th>Status</th>
                <th className="text-right">Aged</th>
                <th className="text-right">Leakage</th>
                <th>Recommended action</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((row) => {
                const groupKey = {
                  shop_code: row.shop_code,
                  parent_vendor_name: row.parent_vendor_name,
                  program_name: row.program_name,
                  leakage_reason: row.leakage_reason,
                };
                return (
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
                    <td>
                      <StatusMenu
                        current={row.followup_status as FollowupStatus}
                        groupKey={groupKey}
                      />
                    </td>
                    <td className="whitespace-nowrap text-right font-mono tabular-nums text-ink-muted">
                      {row.max_maturity_days}d
                    </td>
                    <td className="whitespace-nowrap text-right font-mono tabular-nums font-semibold">
                      {money(row.estimated_leakage_amount)}
                    </td>
                    <td className="text-ink-muted">{row.recommended_action}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
