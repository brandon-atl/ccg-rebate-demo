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
      <CohortDashboard shops={shops} interventions={interventions} />
    </PageShell>
  );
}
