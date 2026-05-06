import { format } from "date-fns";

type SlicerCell = { label: string; value: string };

export function SlicerBar({
  cells,
  asOf = new Date(),
}: {
  cells?: SlicerCell[];
  asOf?: Date;
}) {
  const defaults: SlicerCell[] = [
    { label: "Time", value: "Last 90 days" },
    { label: "Region", value: "All" },
    { label: "Vendor program", value: "All" },
    { label: "Priority", value: "All" },
    { label: "Maturity", value: "Mature ≥ 60 days" },
    { label: "Refreshed", value: format(asOf, "MMM d · h:mm a") },
  ];
  const rows = cells ?? defaults;
  return (
    <div className="slicer">
      {rows.map((cell) => (
        <div key={cell.label} className="slicer-cell">
          <span className="slicer-cell-label">{cell.label}</span>
          <span className="slicer-cell-value">{cell.value}</span>
        </div>
      ))}
    </div>
  );
}
