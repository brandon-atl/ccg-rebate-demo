"use client";

import { useEffect, useRef, useState } from "react";

export type SlicerOption = { value: string; label: string };

export function Slicer({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SlicerOption[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const current = options.find((o) => o.value === value)?.label ?? value;
  const isDefault = value === options[0]?.value;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative flex flex-1 flex-col gap-1 border-r border-rule px-4 py-2 last:border-r-0 min-w-[140px]">
      <span className="text-[10px] font-semibold uppercase tracking-meta text-ink-faint">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`group flex items-center justify-between gap-2 truncate text-left text-[13px] font-medium transition-colors ${
          isDefault ? "text-ink" : "text-accent-azure"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{current}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" className="flex-none opacity-60 transition-transform group-hover:opacity-100" style={{ transform: open ? "rotate(180deg)" : "none" }}>
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div role="listbox" className="absolute left-2 right-2 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-md border border-rule bg-surface py-1 shadow-panel">
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[12.5px] hover:bg-canvas ${
                  active ? "font-semibold text-accent-azure" : "text-ink"
                }`}
              >
                <span className="truncate">{o.label}</span>
                {active ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" className="flex-none">
                    <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
