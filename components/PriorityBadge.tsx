export function PriorityBadge({ level }: { level: string }) {
  const cls =
    level === "P1" ? "priority priority-p1" :
    level === "P2" ? "priority priority-p2" :
    "priority priority-p3";
  return <span className={cls}>{level}</span>;
}
