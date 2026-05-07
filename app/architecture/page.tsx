import { DataModelDiagram } from "@/components/DataModelDiagram";
import { PageShell } from "@/components/PageShell";
import { getArchitectureStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

const layers = [
  {
    code: "01",
    name: "Source",
    body: "NetSuite (transactions, vendors, programs, claims). Later: CCC ONE for affiliate KPIs, Square One for financial benchmarking.",
    accent: "#94A3B8",
  },
  {
    code: "02",
    name: "Bronze · Raw landing",
    body: "ADLS Gen2 raw zone in production. Date-partitioned, schema-on-read. Reprocess without re-pulling NetSuite.",
    accent: "#0078D4",
  },
  {
    code: "03",
    name: "Silver · Conformed model",
    body: "dim_shop, dim_vendor (parent crosswalk), dim_product, dim_program. ADF orchestrates the conformance step.",
    accent: "#1F73B7",
  },
  {
    code: "04",
    name: "Gold · Eligibility & leakage",
    body: "vw_rebate_gold applies eligibility, claim status, returns/voids, the 60-day maturity rule, and the priority + root-cause derivations.",
    accent: "#0E8C5A",
  },
  {
    code: "05",
    name: "Consume · Power BI surface",
    body: "Executive summary, BI action list, data quality, cohort preview. Operator feedback labels feed back into the rules.",
    accent: "#C2410C",
  },
];

const mappings: Array<[string, string]> = [
  ["Python seed scripts", "ADF pipelines (linked services, datasets, triggers)"],
  ["Railway PostgreSQL", "ADLS Gen2 + Azure SQL / Synapse / Databricks"],
  ["sql/02_gold_views.sql", "Versioned silver/gold transformations w/ quality gates"],
  ["Next.js dashboard", "Power BI semantic model + paginated reports"],
  ["fact_bi_followup", "BI analyst feedback labels → rule refinement loop"],
];

export default async function ArchitecturePage() {
  const stats = await getArchitectureStats();
  return (
    <PageShell
      eyebrow="CCG · Technical Walkthrough"
      title="Lakehouse-Shaped Artifact"
      subtitle="One source pattern, one gold rule set, one action list, one feedback loop. The point is to show how it grows into ADF / ADLS / Power BI without becoming platform theater."
      showSlicer={false}
    >
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {layers.map((layer) => (
          <div key={layer.code} className="tile relative px-4 pb-4 pt-3.5">
            <div
              className="absolute inset-x-0 top-0 h-[3px] rounded-t-md"
              style={{ background: layer.accent }}
            />
            <div className="text-[11px] font-semibold uppercase tracking-meta text-ink-faint">
              Layer {layer.code}
            </div>
            <div className="mt-1 text-[15px] font-semibold text-ink">{layer.name}</div>
            <p className="mt-2 text-[12.5px] leading-5 text-ink-muted">{layer.body}</p>
          </div>
        ))}
      </section>

      <section className="panel mt-5">
        <div className="border-b border-rule px-5 py-3">
          <h2 className="section-title">Data model · entity relationships</h2>
          <p className="section-sub">
            Bronze → silver → gold, with the BI feedback loop closing back into the gold view.
          </p>
        </div>
        <div className="px-5 py-4">
          <DataModelDiagram />
        </div>
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="panel lg:col-span-2">
          <div className="border-b border-rule px-5 py-3">
            <h2 className="section-title">Objects created in this build</h2>
            <p className="section-sub">Every row of the dashboard traces back to one of these.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="matrix">
              <thead>
                <tr>
                  <th>Object</th>
                  <th>Layer</th>
                  <th className="text-right">Rows</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((row) => (
                  <tr key={`${row.layer}-${row.table_name}`}>
                    <td className="font-mono text-[12.5px] text-ink">{row.table_name}</td>
                    <td className="text-ink-muted">{row.layer}</td>
                    <td className="text-right font-mono tabular-nums">{row.row_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="border-b border-rule px-5 py-3">
            <h2 className="section-title">Production mapping</h2>
            <p className="section-sub">
              What each demo artifact becomes in the CCG Azure stack.
            </p>
          </div>
          <ul className="divide-y divide-rule">
            {mappings.map(([demo, prod]) => (
              <li key={demo} className="px-5 py-3.5">
                <div className="text-[10.5px] font-semibold uppercase tracking-meta text-ink-faint">
                  Demo
                </div>
                <div className="text-[13px] text-ink">{demo}</div>
                <div className="mt-2 text-[10.5px] font-semibold uppercase tracking-meta text-accent-azure">
                  Production
                </div>
                <div className="text-[13px] text-ink">{prod}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PageShell>
  );
}
