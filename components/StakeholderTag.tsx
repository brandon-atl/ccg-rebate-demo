type Stakeholder = "anthony" | "georgiana" | "leadership" | "biteam";

const labels: Record<Stakeholder, string> = {
  anthony: "Anthony · Enterprise Systems",
  georgiana: "Georgiana · Performance Mgmt",
  leadership: "Senior Leadership",
  biteam: "BI Team · Daily Workflow",
};

const shortLabels: Record<Stakeholder, string> = {
  anthony: "Anthony",
  georgiana: "Georgiana",
  leadership: "Leadership",
  biteam: "BI Team",
};

export function StakeholderTag({
  who,
  variant = "short",
}: {
  who: Stakeholder;
  variant?: "short" | "full";
}) {
  return (
    <span className={`tag tag-${who}`}>
      {variant === "full" ? labels[who] : shortLabels[who]}
    </span>
  );
}
