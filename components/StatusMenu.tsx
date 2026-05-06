"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  type FollowupStatus,
  type GroupKey,
  updateGroupFollowup,
} from "@/app/actions/followup-action";

const labels: Record<FollowupStatus, string> = {
  new: "new",
  in_progress: "in progress",
  claimed: "claimed",
  unclaimable: "unclaimable",
  false_positive: "false positive",
};

const toneClass: Record<FollowupStatus, string> = {
  new: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-amber-50 text-amber-800 border-amber-200",
  claimed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  unclaimable: "bg-rose-50 text-rose-700 border-rose-200",
  false_positive: "bg-rose-50 text-rose-700 border-rose-200",
};

const options: Array<{ value: FollowupStatus; label: string; helper: string }> = [
  { value: "in_progress", label: "Mark in progress", helper: "Outreach started" },
  { value: "claimed", label: "Mark claimed", helper: "Rebate captured" },
  { value: "unclaimable", label: "Mark unclaimable", helper: "Vendor declined" },
  { value: "false_positive", label: "Mark false positive", helper: "Rule mis-fire" },
];

export function StatusMenu({
  current,
  groupKey,
}: {
  current: FollowupStatus;
  groupKey: GroupKey;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const click = (value: FollowupStatus) => {
    setOpen(false);
    startTransition(() => {
      void updateGroupFollowup(groupKey, value);
    });
  };

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        className={`status-pill border ${toneClass[current]} cursor-pointer transition disabled:opacity-60`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {pending ? "saving…" : labels[current]}
        <svg
          aria-hidden="true"
          width="9"
          height="9"
          viewBox="0 0 12 12"
          className="ml-0.5 opacity-70"
        >
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border border-rule bg-surface py-1 shadow-panel"
        >
          {options.map((o) => {
            const active = o.value === current;
            return (
              <button
                key={o.value}
                type="button"
                role="menuitem"
                onClick={() => click(o.value)}
                disabled={pending || active}
                className="flex w-full flex-col items-start gap-0 px-3 py-2 text-left hover:bg-canvas disabled:opacity-60"
              >
                <span className="text-[12.5px] font-medium text-ink">{o.label}</span>
                <span className="text-[11px] text-ink-faint">{o.helper}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
