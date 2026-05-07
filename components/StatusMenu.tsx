"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  type FollowupStatus,
  type GroupKey,
  updateGroupFollowup,
} from "@/app/actions/followup-action";
import { useToast } from "@/components/Toaster";

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

const dotClass: Record<FollowupStatus, string> = {
  new: "bg-slate-400",
  in_progress: "bg-amber-500",
  claimed: "bg-emerald-500",
  unclaimable: "bg-rose-500",
  false_positive: "bg-rose-500",
};

const toastTone: Record<FollowupStatus, "neutral" | "good" | "warn" | "bad"> = {
  new: "neutral",
  in_progress: "warn",
  claimed: "good",
  unclaimable: "bad",
  false_positive: "bad",
};

const toastDescription: Record<FollowupStatus, (shop?: string) => string> = {
  new: (shop) => `${shop ?? "Case"} reopened. Back in the active queue.`,
  in_progress: (shop) => `${shop ?? "Case"} flagged in progress. Outreach started.`,
  claimed: (shop) => `${shop ?? "Case"} marked claimed. Dollars moved to recovered.`,
  unclaimable: (shop) => `${shop ?? "Case"} marked unclaimable. Logged for rule training.`,
  false_positive: (shop) => `${shop ?? "Case"} marked false positive. Logged for rule training.`,
};

const options: Array<{ value: FollowupStatus; label: string; helper: string }> = [
  { value: "new", label: "Mark new", helper: "Reopen the case" },
  { value: "in_progress", label: "Mark in progress", helper: "Outreach started" },
  { value: "claimed", label: "Mark claimed", helper: "Rebate captured" },
  { value: "unclaimable", label: "Mark unclaimable", helper: "Vendor declined" },
  { value: "false_positive", label: "Mark false positive", helper: "Rule mis-fire" },
];

export function StatusMenu({
  current,
  groupKey,
  shopName,
  onChange,
  size = "default",
}: {
  current: FollowupStatus;
  groupKey: GroupKey;
  shopName?: string;
  onChange?: (next: FollowupStatus) => void;
  size?: "default" | "sm";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const apply = (value: FollowupStatus) => {
    startTransition(() => {
      void updateGroupFollowup(groupKey, value);
    });
  };

  const click = (next: FollowupStatus) => {
    setOpen(false);
    if (next === current) return;
    const previous = current;
    onChange?.(next);
    apply(next);
    toast.push({
      title: `Marked ${labels[next]}`,
      description: toastDescription[next](shopName),
      tone: toastTone[next],
      onUndo: () => {
        onChange?.(previous);
        apply(previous);
      },
    });
  };

  const sizeClass = size === "sm" ? "text-[10.5px] py-[1px]" : "";

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`status-pill border ${toneClass[current]} cursor-pointer transition-all duration-200 disabled:opacity-60 ${sizeClass}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${dotClass[current]}`} />
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
          className="absolute right-0 top-full z-20 mt-1 w-56 origin-top-right rounded-md border border-rule bg-surface py-1 shadow-panel"
          onClick={(e) => e.stopPropagation()}
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
                className={`flex w-full flex-col items-start gap-0 px-3 py-2 text-left transition-colors hover:bg-canvas disabled:opacity-60 ${active ? "bg-canvas" : ""}`}
              >
                <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass[o.value]}`} />
                  {o.label}
                </span>
                <span className="ml-3 text-[11px] text-ink-faint">{o.helper}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
