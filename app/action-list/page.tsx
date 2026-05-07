import { ActionTable } from "@/components/ActionTable";
import { MetricCard } from "@/components/MetricCard";
import { captureRateTone, falsePositiveTone } from "@/lib/tones";
import { PageShell } from "@/components/PageShell";
import { getActionQueueFull, getDashboardSummary } from "@/lib/queries";
import { moneyCompact, number, pct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ActionListPage() {
  const [summary, rows] = await Promise.all([
    getDashboardSummary(),
    getActionQueueFull(3000),
  ]);

  const open = rows.filter((r) => r.queue_state === "open").length;
  const inProgress = rows.filter((r) => r.queue_state === "in_progress").length;
  const resolved = rows.filter((r) => r.queue_state === "resolved").length;

  return (
    <PageShell
      eyebrow="CCG · Rebate Recovery"
      title="BI Team Action List"
      subtitle="Operator queue. Slicers filter; column headers sort. Click a status pill to classify a flagged case — feedback flows into fact_bi_followup and the gold view recomputes."
      showSlicer={false}
    >
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Open queue"
          value={number(open)}
          helper={`${number(inProgress)} in progress · ${number(resolved)} resolved`}
          tone="open"
          index={0}
        />
        <MetricCard
          label="Estimated leakage"
          value={moneyCompact(summary.estimated_leakage_amount)}
          helper="across active priorities"
          tone="open"
          index={1}
        />
        <MetricCard
          label="Capture rate"
          value={pct(summary.capture_rate, 1)}
          helper={`${summary.shops_with_leakage} affiliates flagged`}
          tone={captureRateTone(summary.capture_rate)}
          index={2}
        />
        <MetricCard
          label="False-positive rate"
          value={pct(summary.false_positive_rate, 1)}
          helper="from BI feedback labels"
          tone={falsePositiveTone(summary.false_positive_rate)}
          index={3}
        />
      </section>

      <div className="mt-5">
        <ActionTable rows={rows} />
      </div>
    </PageShell>
  );
}
