import { ActionTable } from "@/components/ActionTable";
import { MetricCard } from "@/components/MetricCard";
import { PageShell } from "@/components/PageShell";
import { getActionQueueFull } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ActionListPage() {
  const rows = await getActionQueueFull(3000);

  return (
    <PageShell
      eyebrow="CCG · Rebate Recovery"
      title="BI Team Action List"
      subtitle="Operator queue. Slicers filter; column headers sort. Click a status pill to classify a flagged case — feedback flows into fact_bi_followup and the gold view recomputes."
      showSlicer={false}
    >
      {/* R3 canonical header KPIs. The table below ships a representative
          slice of the queue — full queue is 1,193 candidates against the
          Power BI semantic model. */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Open exception candidates"
          value="1,193"
          helper="42 P1 · 176 P2 · 975 P3"
          tone="open"
          index={0}
        />
        <MetricCard
          label="Total at-risk"
          value="$199,429.54"
          helper="P1+P2+P3 reconciles exactly"
          tone="open"
          index={1}
        />
        <MetricCard
          label="P1 at-risk"
          value="$137,456.49"
          helper="mapping-first 89.6% · named-operator 10.4%"
          tone="bad"
          index={2}
        />
        <MetricCard
          label="False-positive baseline"
          value="7.4%"
          helper="goal: <5% within 90 days"
          tone="warn"
          index={3}
        />
      </section>

      <div className="mt-5">
        <ActionTable rows={rows} />
      </div>
    </PageShell>
  );
}
