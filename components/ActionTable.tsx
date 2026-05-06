"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { PriorityBadge } from "@/components/PriorityBadge";
import { SlicerBar, type SlicerSpec } from "@/components/SlicerBar";
import { StatusMenu } from "@/components/StatusMenu";
import type { FollowupStatus } from "@/app/actions/followup-action";
import type { ActionQueueRow } from "@/lib/queries";
import { money, number as fmtNumber } from "@/lib/format";

type SortKey =
  | "priority_level"
  | "shop_name"
  | "parent_vendor_name"
  | "root_cause"
  | "followup_status"
  | "max_maturity_days"
  | "estimated_leakage_amount";

type SortDir = "asc" | "desc";

const PRIORITY_RANK: Record<string, number> = { P1: 1, P2: 2, P3: 3 };

const tabs: Array<{
  key: "open" | "in_progress" | "resolved" | "all";
  label: string;
  helper: string;
}> = [
  { key: "open", label: "Open", helper: "Needs work" },
  { key: "in_progress", label: "In progress", helper: "Outreach started" },
  { key: "resolved", label: "Resolved", helper: "Worked & closed" },
  { key: "all", label: "All", helper: "Full history" },
];

function compare(a: ActionQueueRow, b: ActionQueueRow, key: SortKey, dir: SortDir): number {
  const sign = dir === "asc" ? 1 : -1;
  if (key === "estimated_leakage_amount" || key === "max_maturity_days") {
    return (Number(a[key] ?? 0) - Number(b[key] ?? 0)) * sign;
  }
  if (key === "priority_level") {
    return ((PRIORITY_RANK[a.priority_level] ?? 99) - (PRIORITY_RANK[b.priority_level] ?? 99)) * sign;
  }
  return String(a[key] ?? "").localeCompare(String(b[key] ?? "")) * sign;
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-1 select-none ${align === "right" ? "justify-end" : ""} text-left text-[10.5px] font-semibold uppercase tracking-meta text-ink-subtle transition-colors hover:text-accent-azure ${active ? "text-accent-azure" : ""}`}
    >
      <span>{label}</span>
      <svg width="9" height="9" viewBox="0 0 12 12" className={`transition-opacity ${active ? "opacity-100" : "opacity-30"}`}>
        {active && dir === "asc" ? (
          <path d="M3 7l3-3 3 3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

export function ActionTable({ rows }: { rows: ActionQueueRow[] }) {
  // Filter state
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("open");
  const [region, setRegion] = useState("all");
  const [vendor, setVendor] = useState("all");
  const [priority, setPriority] = useState("all");
  const [rootCause, setRootCause] = useState("all");
  const [search, setSearch] = useState("");

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>("estimated_leakage_amount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const regions = useMemo(
    () => [
      { value: "all", label: "All regions" },
      ...Array.from(new Set(rows.map((r) => r.region)))
        .sort()
        .map((v) => ({ value: v, label: v })),
    ],
    [rows]
  );
  const vendors = useMemo(
    () => [
      { value: "all", label: "All vendors" },
      ...Array.from(new Set(rows.map((r) => r.parent_vendor_name)))
        .sort()
        .map((v) => ({ value: v, label: v })),
    ],
    [rows]
  );
  const priorities = useMemo(
    () => [
      { value: "all", label: "All priorities" },
      { value: "P1", label: "P1 only" },
      { value: "P2", label: "P2 only" },
      { value: "P3", label: "P3 only" },
    ],
    []
  );
  const rootCauses = useMemo(
    () => [
      { value: "all", label: "All root causes" },
      ...Array.from(new Set(rows.map((r) => r.root_cause)))
        .sort()
        .map((v) => ({ value: v, label: v })),
    ],
    [rows]
  );

  const counts = useMemo(() => {
    const acc = { open: 0, in_progress: 0, resolved: 0, all: rows.length };
    for (const r of rows) acc[r.queue_state] += 1;
    return acc;
  }, [rows]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let xs = rows;
    if (tab !== "all") xs = xs.filter((r) => r.queue_state === tab);
    if (region !== "all") xs = xs.filter((r) => r.region === region);
    if (vendor !== "all") xs = xs.filter((r) => r.parent_vendor_name === vendor);
    if (priority !== "all") xs = xs.filter((r) => r.priority_level === priority);
    if (rootCause !== "all") xs = xs.filter((r) => r.root_cause === rootCause);
    if (term) {
      xs = xs.filter((r) =>
        [r.shop_name, r.shop_code, r.parent_vendor_name, r.program_name, r.root_cause]
          .some((v) => v?.toLowerCase().includes(term))
      );
    }
    return [...xs].sort((a, b) => compare(a, b, sortKey, sortDir));
  }, [rows, tab, region, vendor, priority, rootCause, search, sortKey, sortDir]);

  const slicers: SlicerSpec[] = [
    { key: "region", label: "Region", value: region, options: regions, onChange: setRegion },
    { key: "vendor", label: "Vendor", value: vendor, options: vendors, onChange: setVendor },
    { key: "priority", label: "Priority", value: priority, options: priorities, onChange: setPriority },
    { key: "root", label: "Root cause", value: rootCause, options: rootCauses, onChange: setRootCause },
  ];

  const onReset = () => {
    setRegion("all");
    setVendor("all");
    setPriority("all");
    setRootCause("all");
    setSearch("");
  };

  const setSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "estimated_leakage_amount" || key === "max_maturity_days" ? "desc" : "asc");
    }
  };

  const filtersActive =
    region !== "all" || vendor !== "all" || priority !== "all" || rootCause !== "all" || search !== "";

  const totalLeakage = filtered.reduce((s, r) => s + Number(r.estimated_leakage_amount ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Slicer bar driving the filters */}
      <SlicerBar slicers={slicers} onReset={onReset} />

      {/* Tabs */}
      <div className="panel">
        <div className="flex flex-wrap items-stretch gap-0 border-b border-rule">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`relative flex flex-col items-start gap-0.5 border-r border-rule px-4 py-3 text-left transition-colors last:border-r-0 ${
                  active ? "bg-canvas" : "hover:bg-canvas/60"
                }`}
              >
                {active ? (
                  <span className="absolute inset-x-3 top-0 h-[2px] bg-accent-azure" aria-hidden />
                ) : null}
                <span className={`text-[12.5px] font-semibold ${active ? "text-accent-azure" : "text-ink"}`}>
                  {t.label} <span className="ml-1 font-mono text-[11px] text-ink-faint">{fmtNumber(counts[t.key])}</span>
                </span>
                <span className="text-[10.5px] text-ink-faint">{t.helper}</span>
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-2 px-4 py-3">
            <input
              type="search"
              placeholder="Search shop, vendor, program…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-md border border-rule bg-canvas px-3 py-1.5 text-[12.5px] text-ink placeholder:text-ink-faint focus:border-accent-azure focus:outline-none"
            />
          </div>
        </div>

        {/* Active-filter chips */}
        {filtersActive ? (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-rule bg-[#FAF7F1] px-4 py-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-meta text-ink-faint">Filters</span>
            {region !== "all" ? <Chip label={`Region · ${region}`} onClear={() => setRegion("all")} /> : null}
            {vendor !== "all" ? <Chip label={`Vendor · ${vendor}`} onClear={() => setVendor("all")} /> : null}
            {priority !== "all" ? <Chip label={`Priority · ${priority}`} onClear={() => setPriority("all")} /> : null}
            {rootCause !== "all" ? <Chip label={`Root · ${rootCause}`} onClear={() => setRootCause("all")} /> : null}
            {search ? <Chip label={`Search · ${search}`} onClear={() => setSearch("")} /> : null}
          </div>
        ) : null}

        {/* Results summary line */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-4 py-2 text-[12px] text-ink-muted">
          <span>
            <span className="font-semibold text-ink">{fmtNumber(filtered.length)}</span> {filtered.length === 1 ? "case" : "cases"} matching · <span className="font-mono tabular-nums">{money(totalLeakage)}</span> total leakage
          </span>
          <span className="text-[11.5px] text-ink-faint">Click any column header to sort. Click a status pill to classify.</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="matrix w-full table-auto">
            <thead>
              <tr>
                <th className="w-[58px]">
                  <SortHeader label="Pri" active={sortKey === "priority_level"} dir={sortDir} onClick={() => setSort("priority_level")} />
                </th>
                <th>
                  <SortHeader label="Shop" active={sortKey === "shop_name"} dir={sortDir} onClick={() => setSort("shop_name")} />
                </th>
                <th>
                  <SortHeader label="Vendor / Program" active={sortKey === "parent_vendor_name"} dir={sortDir} onClick={() => setSort("parent_vendor_name")} />
                </th>
                <th>
                  <SortHeader label="Root cause" active={sortKey === "root_cause"} dir={sortDir} onClick={() => setSort("root_cause")} />
                </th>
                <th>
                  <SortHeader label="Status" active={sortKey === "followup_status"} dir={sortDir} onClick={() => setSort("followup_status")} />
                </th>
                <th className="text-right">
                  <SortHeader label="Aged" active={sortKey === "max_maturity_days"} dir={sortDir} onClick={() => setSort("max_maturity_days")} align="right" />
                </th>
                <th className="text-right">
                  <SortHeader label="Leakage" active={sortKey === "estimated_leakage_amount"} dir={sortDir} onClick={() => setSort("estimated_leakage_amount")} align="right" />
                </th>
                <th>Recommended action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.slice(0, 200).map((row) => {
                  const groupKey = {
                    shop_code: row.shop_code,
                    parent_vendor_name: row.parent_vendor_name,
                    program_name: row.program_name,
                    leakage_reason: row.leakage_reason,
                  };
                  return (
                    <motion.tr
                      key={`${row.shop_code}-${row.parent_vendor_name}-${row.program_name}-${row.leakage_reason}`}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      <td>
                        <PriorityBadge level={row.priority_level} />
                      </td>
                      <td>
                        <div className="font-semibold text-ink">{row.shop_name}</div>
                        <div className="text-[11.5px] text-ink-faint">
                          {row.shop_code} · {row.region} · {row.state}
                        </div>
                      </td>
                      <td>
                        <div>{row.parent_vendor_name}</div>
                        <div className="text-[11.5px] text-ink-faint">{row.program_name}</div>
                      </td>
                      <td className="text-ink-muted">{row.root_cause}</td>
                      <td>
                        <StatusMenu
                          current={row.followup_status as FollowupStatus}
                          groupKey={groupKey}
                        />
                      </td>
                      <td className="whitespace-nowrap text-right font-mono tabular-nums text-ink-muted">
                        {row.max_maturity_days}d
                      </td>
                      <td className="whitespace-nowrap text-right font-mono tabular-nums font-semibold">
                        {money(row.estimated_leakage_amount)}
                      </td>
                      <td className="text-ink-muted">{row.recommended_action}</td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <div className="text-[13px] font-semibold text-ink">No cases match the current filters.</div>
              <button
                type="button"
                onClick={onReset}
                className="text-[12px] font-medium text-accent-azure hover:underline"
              >
                Reset filters
              </button>
            </div>
          ) : null}
          {filtered.length > 200 ? (
            <div className="border-t border-rule bg-canvas px-4 py-2 text-[11.5px] text-ink-faint">
              Showing 200 of {fmtNumber(filtered.length)} cases. Refine filters to narrow.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-rule bg-surface px-2 py-0.5 text-[11px] text-ink">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear ${label}`}
        className="-mr-1 ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-ink-faint hover:bg-canvas hover:text-ink"
      >
        <svg width="9" height="9" viewBox="0 0 12 12">
          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </span>
  );
}
