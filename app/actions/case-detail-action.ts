"use server";

import { query } from "@/lib/db";

export type CaseDetail = {
  shop_code: string;
  shop_name: string;
  region: string;
  state: string;
  affiliate_tier: string;
  parent_vendor_name: string;
  vendor_category: string;
  raw_transaction_vendors: string[];
  program_name: string;
  program_code: string;
  program_registered_vendor: string;
  rebate_rate: string;
  program_start_date: string;
  program_end_date: string;
  leakage_reason: string;
  root_cause: string;
  priority_level: string;
  followup_status: string;
  crosswalk_applied: boolean;
  transaction_count: number;
  estimated_leakage_amount: string;
  earliest_txn_date: string;
  latest_txn_date: string;
  max_maturity_days: number;
  min_maturity_days: number;
  sample_netsuite_ids: string[];
  recommended_action: string;
  supporting_signals: string[];
};

const recommendedActionByRootCause: Record<string, string> = {
  "Vendor/entity mapping": "Reconcile vendor crosswalk and validate claim eligibility.",
  "Claim workflow gap": "Validate claim status with vendor/program owner; resubmit if recoverable.",
  "Timing/window issue": "Confirm program effective dates and grace periods; resubmit if eligible.",
  "SKU/category mapping": "Validate SKU/category eligibility against the program rule set.",
  "Enrollment mismatch": "Confirm shop enrollment status and effective date for the program.",
};

export async function getCaseDetail(args: {
  shop_code: string;
  parent_vendor_name: string;
  program_name: string;
  leakage_reason: string;
}): Promise<CaseDetail | null> {
  const rows = await query<CaseDetail & { _supporting: string[] }>(
    `
    WITH g AS (
      SELECT *
      FROM vw_rebate_gold
      WHERE shop_code = $1
        AND parent_vendor_name = $2
        AND program_name = $3
        AND leakage_reason = $4
    )
    SELECT
      MIN(shop_code)              AS shop_code,
      MIN(shop_name)              AS shop_name,
      MIN(region)                 AS region,
      MIN(state)                  AS state,
      MIN(affiliate_tier)         AS affiliate_tier,
      MIN(parent_vendor_name)     AS parent_vendor_name,
      MIN(vendor_category)        AS vendor_category,
      ARRAY(
        SELECT DISTINCT vendor_name FROM g ORDER BY vendor_name
      )                           AS raw_transaction_vendors,
      MIN(program_name)           AS program_name,
      MIN(program_code)           AS program_code,
      MIN(parent_vendor_name)     AS program_registered_vendor,
      MAX(rebate_rate)::TEXT      AS rebate_rate,
      MIN(program_start_date)::TEXT AS program_start_date,
      MAX(program_end_date)::TEXT   AS program_end_date,
      MIN(leakage_reason)         AS leakage_reason,
      MIN(root_cause)             AS root_cause,
      CASE
        WHEN BOOL_OR(priority_level = 'P1') THEN 'P1'
        WHEN BOOL_OR(priority_level = 'P2') THEN 'P2'
        ELSE 'P3'
      END                         AS priority_level,
      COALESCE(MIN(followup_status), 'new') AS followup_status,
      BOOL_OR(crosswalk_applied)  AS crosswalk_applied,
      COUNT(*)::INT               AS transaction_count,
      ROUND(COALESCE(SUM(expected_rebate_amount), 0::numeric), 2) AS estimated_leakage_amount,
      MIN(transaction_date)::TEXT AS earliest_txn_date,
      MAX(transaction_date)::TEXT AS latest_txn_date,
      MAX(maturity_days)::INT     AS max_maturity_days,
      MIN(maturity_days)::INT     AS min_maturity_days,
      ARRAY(
        SELECT netsuite_txn_id FROM g ORDER BY transaction_date DESC LIMIT 5
      )                           AS sample_netsuite_ids,
      ''::TEXT                    AS recommended_action,
      ARRAY[]::TEXT[]             AS supporting_signals,
      ARRAY[]::TEXT[]             AS _supporting
    FROM g
    `,
    [args.shop_code, args.parent_vendor_name, args.program_name, args.leakage_reason]
  );
  const row = rows[0];
  if (!row) return null;

  // Compose recommended action from canonical root cause.
  row.recommended_action =
    recommendedActionByRootCause[row.root_cause] ??
    "Validate the case detail and confirm next action with the program owner.";

  // Supporting signals are metadata that contribute context but aren't the
  // primary root cause. Crosswalk applied is the key one — it's a
  // normalization step, not the cause of leakage unless root_cause says so.
  const signals: string[] = [];
  if (row.crosswalk_applied && row.root_cause !== "Vendor/entity mapping") {
    signals.push("Vendor parent/subsidiary crosswalk applied (normalization step, not the root cause).");
  }
  if (row.min_maturity_days >= 60 && row.max_maturity_days >= 150) {
    signals.push(`Aged ${row.max_maturity_days} days — past the 150-day P1 threshold.`);
  } else if (row.max_maturity_days >= 60) {
    signals.push(`Mature ≥ 60 days (eligible for flagging).`);
  }
  if (row.transaction_count > 1) {
    signals.push(`${row.transaction_count} transactions roll up to this case.`);
  }
  row.supporting_signals = signals;
  return row;
}
