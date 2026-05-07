"use client";

import { motion } from "framer-motion";
import { InfoTip } from "@/components/InfoTip";
import type { Tone } from "@/lib/tones";

export type { Tone };

const accentByTone: Record<Tone, string> = {
  neutral: "#94A3B8",
  good: "#16A34A",
  warn: "#D97706",
  bad: "#DC2626",
  open: "#DC2626",
  recovered: "#16A34A",
};

const valueTintByTone: Record<Tone, string> = {
  neutral: "text-ink",
  good: "text-emerald-700",
  warn: "text-amber-700",
  bad: "text-rose-700",
  open: "text-ink",
  recovered: "text-emerald-700",
};

const helperTintByTone: Record<Tone, string> = {
  neutral: "text-ink-muted",
  good: "text-emerald-700",
  warn: "text-amber-700",
  bad: "text-rose-700",
  open: "text-ink-muted",
  recovered: "text-emerald-700",
};

export type Info = {
  body: string;
  formula?: string;
  thresholds?: Array<{ label: string; tone: "good" | "warn" | "bad" }>;
};

export function MetricCard({
  label,
  value,
  helper,
  tone = "neutral",
  helperTone,
  info,
  index = 0,
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: Tone;
  helperTone?: Tone;
  info?: Info;
  index?: number;
}) {
  const accent = accentByTone[tone];
  const valueColor = valueTintByTone[tone];
  const helperColor = helperTone
    ? helperTintByTone[helperTone]
    : helperTintByTone[tone === "good" || tone === "bad" || tone === "warn" ? "neutral" : tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="tile relative overflow-hidden px-4 pb-4 pt-3.5 transition-shadow hover:shadow-panel"
    >
      <span aria-hidden className="absolute left-0 top-0 h-full w-[3px]" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-2">
        <div className="kpi-label">{label}</div>
        {info ? (
          <InfoTip title={label} body={info.body} formula={info.formula} thresholds={info.thresholds} />
        ) : null}
      </div>
      <div className={`kpi-value mt-2.5 ${valueColor}`}>{value}</div>
      {helper ? <div className={`kpi-helper mt-1 ${helperColor}`}>{helper}</div> : null}
    </motion.div>
  );
}
