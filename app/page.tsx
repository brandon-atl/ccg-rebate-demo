import { HomeDashboard } from "@/components/HomeDashboard";
import { PageShell } from "@/components/PageShell";
import { StakeholderViews } from "@/components/StakeholderViews";
import { getHomeRows, getLorRebateCorrelation } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [rows, lor] = await Promise.all([
    getHomeRows(),
    getLorRebateCorrelation(),
  ]);

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
      showSlicer={false}
    >
      <HomeDashboard rows={rows} lor={lor} />
      <StakeholderViews />
    </PageShell>
  );
}
