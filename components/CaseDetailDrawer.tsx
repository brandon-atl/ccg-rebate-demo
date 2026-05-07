"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PriorityBadge } from "@/components/PriorityBadge";
import { StatusMenu } from "@/components/StatusMenu";
import type { FollowupStatus, GroupKey } from "@/app/actions/followup-action";
import type { CaseDetail } from "@/app/actions/case-detail-action";
import { getCaseDetail } from "@/app/actions/case-detail-action";
import { money, pct } from "@/lib/format";

const rootCauseExplanation: Record<string, string> = {
  "Claim workflow gap":
    "Transaction appears eligible and mature, but no successful claim record was found. Review claim submission status and vendor response.",
  "Vendor/entity mapping":
    "Source vendor differs from the program-registered parent vendor and the crosswalk has not produced a confident match. Validate the parent/subsidiary mapping before claim recovery.",
  "SKU/category mapping":
    "Vendor and program align, but the SKU/product category does not clearly map to the rebate-eligible category. Validate item/category eligibility before claim submission.",
  "Timing/window issue":
    "Transaction date is near or outside the program effective window. Confirm program dates, grace periods, and claim eligibility rules.",
  "Enrollment mismatch":
    "Shop/program enrollment appears missing, late, or misaligned. Confirm enrollment effective date and whether the transaction is claimable.",
};

const skuWithCrosswalkNote =
  "Vendor normalized via parent/subsidiary crosswalk. The transaction is evaluated against the parent vendor's program; the leakage flag is driven by SKU/category eligibility, not vendor-entity mismatch.";

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
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[540px] flex-col overflow-y-auto border-l border-rule bg-surface shadow-panel"
            role="dialog"
            aria-label="Case detail"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-rule bg-surface px-5 py-3">
              <span className="text-[10.5px] font-semibold uppercase tracking-meta text-ink-faint">
                Case detail · audit trail
              </span>
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
              <DrawerContent detail={detail} />
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function DrawerContent({ detail }: { detail: CaseDetail }) {
  const explanation = rootCauseExplanation[detail.root_cause] ?? "Review the case data and confirm next steps with the program owner.";
  const isSkuWithCrosswalk =
    detail.root_cause === "SKU/category mapping" && detail.crosswalk_applied;

  return (
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
        <Row label="Raw transaction vendor(s)" value={detail.raw_transaction_vendors.join(", ") || "—"} />
        <Row label="Normalized parent vendor" value={detail.parent_vendor_name} />
        <Row label="Program-registered vendor" value={detail.program_registered_vendor} />
        <Row label="Vendor category" value={detail.vendor_category} />
        <Row label="Program" value={detail.program_name} />
        <Row label="Program code" value={detail.program_code} mono />
        <Row label="Program window" value={`${detail.program_start_date} → ${detail.program_end_date}`} mono />
        <Row label="Crosswalk applied" value={detail.crosswalk_applied ? "Yes" : "No"} />
      </Section>

      <Section title="Root cause">
        <Row label="Primary root cause" value={detail.root_cause} mono />
        <p className="mt-2 text-[12.5px] leading-[1.5] text-ink-muted">{explanation}</p>
        {isSkuWithCrosswalk ? (
          <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] leading-[1.5] text-amber-900">
            {skuWithCrosswalkNote}
          </div>
        ) : null}
      </Section>

      {detail.supporting_signals.length > 0 ? (
        <Section title="Supporting signals">
          <ul className="space-y-1.5 text-[12.5px] text-ink-muted">
            {detail.supporting_signals.map((s) => (
              <li key={s} className="flex items-start gap-1.5">
                <span className="mt-1.5 inline-block h-1 w-1 flex-none rounded-full bg-ink-faint" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Source transactions">
        <Row label="Earliest txn" value={detail.earliest_txn_date} mono />
        <Row label="Latest txn" value={detail.latest_txn_date} mono />
        <div className="mt-2 text-[10.5px] font-semibold uppercase tracking-meta text-ink-faint">
          Sample NetSuite txn IDs
        </div>
        <ul className="mt-1 space-y-0.5">
          {detail.sample_netsuite_ids.map((id) => (
            <li key={id} className="font-mono text-[11.5px] text-ink-muted">{id}</li>
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
            shopName={detail.shop_name}
          />
        </div>
      </Section>
    </div>
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
