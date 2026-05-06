import { StakeholderTag } from "@/components/StakeholderTag";

type Stakeholder = "anthony" | "georgiana" | "leadership" | "biteam";

export function MetricCard({
  label,
  value,
  helper,
  helperTone = "neutral",
  owner,
}: {
  label: string;
  value: string;
  helper?: string;
  helperTone?: "neutral" | "up" | "down";
  owner?: Stakeholder;
}) {
  const helperColor =
    helperTone === "up" ? "text-emerald-700" :
    helperTone === "down" ? "text-rose-700" :
    "text-ink-muted";

  return (
    <div className="tile px-4 pb-4 pt-3.5">
      <div className="flex items-start justify-between gap-3">
        <span className="kpi-label">{label}</span>
        {owner ? <StakeholderTag who={owner} /> : null}
      </div>
      <div className="kpi-value mt-2.5">{value}</div>
      {helper ? (
        <div className={`kpi-helper mt-1 ${helperColor}`}>{helper}</div>
      ) : null}
    </div>
  );
}
