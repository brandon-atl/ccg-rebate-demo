"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function InfoTip({
  title,
  body,
  formula,
  thresholds,
}: {
  title: string;
  body: string;
  formula?: string;
  thresholds?: Array<{ label: string; tone: "good" | "warn" | "bad" }>;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => setMounted(true), []);

  const dotByTone: Record<"good" | "warn" | "bad", string> = {
    good: "bg-emerald-500",
    warn: "bg-amber-500",
    bad: "bg-rose-500",
  };

  // Position tooltip relative to the trigger, using fixed positioning so it
  // can escape any ancestor with overflow:hidden (including the .tile card).
  useIsoLayoutEffect(() => {
    if (!open || !triggerRef.current || !tipRef.current) return;
    const t = triggerRef.current.getBoundingClientRect();
    const tip = tipRef.current.getBoundingClientRect();
    const W = 256; // tooltip width
    const margin = 8;
    let left = t.right - W; // right-align under the icon
    if (left < margin) left = margin;
    if (left + W > window.innerWidth - margin) left = window.innerWidth - W - margin;
    let top = t.bottom + 6;
    if (top + tip.height > window.innerHeight - margin) {
      top = t.top - tip.height - 6;
    }
    setPos({ left, top });
  }, [open]);

  return (
    <span className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Info: ${title}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-rule bg-canvas text-[9px] font-semibold text-ink-faint hover:border-accent-azure hover:text-accent-azure"
      >
        i
      </button>
      {mounted && open
        ? createPortal(
            <div
              ref={tipRef}
              role="tooltip"
              className="pointer-events-none fixed z-[60] w-64 rounded-md border border-rule bg-surface p-3 shadow-panel"
              style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, opacity: pos ? 1 : 0 }}
            >
              <div className="text-[12px] font-semibold text-ink">{title}</div>
              <div className="mt-1 text-[11.5px] leading-[1.45] text-ink-muted">{body}</div>
              {formula ? (
                <div className="mt-2 rounded bg-canvas px-2 py-1 font-mono text-[10.5px] text-ink-muted">{formula}</div>
              ) : null}
              {thresholds && thresholds.length ? (
                <div className="mt-2 space-y-1">
                  {thresholds.map((t) => (
                    <div key={t.label} className="flex items-center gap-1.5 text-[10.5px] text-ink-muted">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotByTone[t.tone]}`} />
                      {t.label}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </span>
  );
}
