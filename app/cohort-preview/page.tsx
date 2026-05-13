import { CohortDashboard } from "@/components/CohortDashboard";
import { PageShell } from "@/components/PageShell";
import { getCohortShops, getTopCohortInterventions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CohortPreviewPage() {
  const [shops, interventions] = await Promise.all([
    getCohortShops(),
    getTopCohortInterventions(),
  ]);

  return (
    <PageShell
      eyebrow="CCG · Affiliate Enablement"
      title="Affiliate Opportunity Cohorts"
      subtitle="Companion view for the performance management team — same shop dimension, peer-relative cohorts. Useful when the conversation moves from rebate leakage to affiliate enablement."
      showSlicer={false}
    >
      <div className="mb-4 rounded-md border border-amber-300/70 bg-amber-50 px-4 py-3 text-[12.5px] leading-5 text-amber-900 md:mb-5">
        <span className="font-semibold">Illustrative — Phase 2 segmentation.</span>{" "}
        Today&rsquo;s deliverable concentrates work via priority tiering on the 42 P1 cases; clustering becomes valuable post-feedback-label collection.
      </div>
      <CohortDashboard shops={shops} interventions={interventions} />
    </PageShell>
  );
}
