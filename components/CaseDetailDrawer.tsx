"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusMenu } from "@/components/StatusMenu";
import type { FollowupStatus, GroupKey } from "@/app/actions/followup-action";
import type { CaseDetail } from "@/app/actions/case-detail-action";
import { getCaseDetail } from "@/app/actions/case-detail-action";
import { money, pct } from "@/lib/format";

const reasonExplanation: Record<string, string> = {
  eligible_unclaimed:
    "Transactions in this group cleared the program window and the 60-day maturity gate, but no claim record exists. Most often a missed submission or a vendor-enrollment timing gap.",
  rejected_claim:
    "A claim was filed but the program owner rejected it. Worth investigating whether the rejection reason is recoverable (re-submit) or genuinely unclaimable.",
  pending_claim:
    "A claim was submitted but not yet finalized. These usually resolve themselves; flagged for awareness only.",
  marked_unclaimable:
    "BI feedback labeled this case as unclaimable. The dollars stay visible in the resolved tab; no further action.",
  marked_false_positive:
    "BI feedback labeled this case as a rule misfire. Used as training signal to tighten rule precision.",
  resolved_claimed:
    "BI feedback labeled this case as claimed and recovered. The dollars roll into recovered YTD.",
};

const rootCauseExplanation: Record<string, string> = {
  "Vendor/entity mapping":
    "The vendor on the source transaction does not match the parent entity registered to the rebate program. Often happens with subsidiary brands (e.g. PPG → Nexa, BASF → Glasurit). Fix with vendor crosswalk.",
  "Claim workflow gap":
    "Transaction is eligible and matured, but no successful claim record exists. Either nothing was submitted or the submission was rejected and never re-filed.",
  "Timing/window issue":
    "Transaction date sits at the edge of the program window (≤ 21 days from start or end). Often resolved by confirming the program effective dates with the vendor.",
  "SKU/category mapping":
    "SKU or product category does not align with what the program covers. Sometimes a re-classification, sometimes legitimately ineligible.",
  "Enrollment mismatch":
    "Affiliate is purchasing from a qualifying vendor but the affiliate-to-program enrollment is missing or misaligned.",
};

export function CaseDetailDrawer({
  groupKey,
  open,
  onClose,
}: {
  groupKey: GroupKey | null;
  open: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !groupKey) return;
    let cancelled = false;
    setLoading(true);
    setDetail(null);
    void (async () => {
      const result = await getCaseDetail(groupKey);
      if (!cancelled) {
        setDetail(result);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, groupKey]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-ink/30"
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            initial={{ x: 480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[520px] flex-col overflow-y-auto border-l border-rule bg-surface shadow-panel"
            role="dialog"
            aria-label="Case detail"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-rule bg-surface px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] font-semibold uppercase tracking-meta text-ink-faint">
                  Case detail · audit trail
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded p-1 text-ink-faint hover:bg-canvas hover:text-ink"
              >
                <svg width="14" height="14" viewBox="0 0 16 16">
                  <path d="M3 3l10 10M13 3l-10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="flex flex-1 items-center justify-center text-[12.5px] text-ink-faint">
                Loading…
              </div>
            ) : !detail ? (
              <div className="flex flex-1 items-center justify-center px-6 text-center text-[12.5px] text-ink-faint">
                No detail found for this case.
              </div>
            ) : (
              <div className="flex-1 px-5 py-5">
                <div className="flex items-start gap-3">
                  <PriorityBadge level={detail.priority_level} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-semibold leading-tight text-ink">{detail.shop_name}</div>
                    <div className="text-[12px] text-ink-faint">
                      {detail.shop_code} · {detail.region} · {detail.state} · {detail.affiliate_tier}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Stat label="Estimated leakage" value={money(detail.estimated_leakage_amount)} mono />
                  <Stat label="Transactions" value={String(detail.transaction_count)} mono />
                  <Stat label="Aged" value={`${detail.max_maturity_days}d max · ${detail.min_maturity_days}d min`} />
                  <Stat label="Rebate rate" value={pct(Number(detail.rebate_rate) * 100, 1)} />
                </div>

                <Section title="Vendor program">
                  <Row label="Vendor (parent)" value={detail.parent_vendor_name} />
                  <Row label="Vendor category" value={detail.vendor_category} />
                  <Row label="Program" value={detail.program_name} />
                  <Row label="Program code" value={detail.program_code} mono />
                  <Row label="Program window" value={`${detail.program_start_date} → ${detail.program_end_date}`} mono />
                  {detail.vendor_crosswalk_used ? (
                    <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-900">
                      Parent → subsidiary crosswalk applied. The transaction vendor differs from the program-registered parent vendor.
                    </div>
                  ) : null}
                </Section>

                <Section title="Why this was flagged">
                  <Row label="Leakage reason" value={detail.leakage_reason.replace(/_/g, " ")} />
                  <Row label="Root cause" value={detail.root_cause} />
                  <p className="mt-2 text-[12px] leading-[1.5] text-ink-muted">
                    {rootCauseExplanation[detail.root_cause] ?? "No specific explanation available for this root cause."}
                  </p>
                  <p className="mt-2 text-[11.5px] leading-[1.5] text-ink-faint">
                    {reasonExplanation[detail.leakage_reason] ?? null}
                  </p>
                </Section>

                <Section title="Source transactions">
                  <Row label="Earliest txn" value={detail.earliest_txn_date} mono />
                  <Row label="Latest txn" value={detail.latest_txn_date} mono />
                  <div className="mt-2 text-[10.5px] font-semibold uppercase tracking-meta text-ink-faint">
                    Sample NetSuite txn IDs
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {detail.sample_netsuite_ids.map((id) => (
                      <li key={id} className="font-mono text-[11.5px] text-ink-muted">
                        {id}
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section title="Recommended next action">
                  <p className="text-[13px] leading-[1.5] text-ink">{detail.recommended_action}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-[11.5px] text-ink-muted">Classify:</span>
                    <StatusMenu
                      current={detail.followup_status as FollowupStatus}
                      groupKey={{
                        shop_code: detail.shop_code,
                        parent_vendor_name: detail.parent_vendor_name,
                        program_name: detail.program_name,
                        leakage_reason: detail.leakage_reason,
                      }}
                    />
                  </div>
                </Section>
              </div>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 border-t border-rule pt-4">
      <div className="text-[10.5px] font-semibold uppercase tracking-meta text-ink-faint">{title}</div>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
      <span className="text-ink-muted">{label}</span>
      <span className={`text-right text-ink ${mono ? "font-mono text-[12px]" : ""}`}>{value}</span>
    </div>
  );
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-rule bg-canvas px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-meta text-ink-faint">{label}</div>
      <div className={`mt-0.5 text-[14px] font-semibold text-ink ${mono ? "font-mono tabular-nums" : ""}`}>{value}</div>
    </div>
  );
}
