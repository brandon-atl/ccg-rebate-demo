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
  program_name: string;
  program_code: string;
  rebate_rate: string;
  program_start_date: string;
  program_end_date: string;
  leakage_reason: string;
  root_cause: string;
  priority_level: string;
  followup_status: string;
  vendor_crosswalk_used: boolean;
  transaction_count: number;
  estimated_leakage_amount: string;
  earliest_txn_date: string;
  latest_txn_date: string;
  max_maturity_days: number;
  min_maturity_days: number;
  sample_netsuite_ids: string[];
  recommended_action: string;
};

export async function getCaseDetail(args: {
  shop_code: string;
  parent_vendor_name: string;
  program_name: string;
  leakage_reason: string;
}): Promise<CaseDetail | null> {
  const rows = await query<CaseDetail>(
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
      MIN(shop_code)            AS shop_code,
      MIN(shop_name)            AS shop_name,
      MIN(region)               AS region,
      MIN(state)                AS state,
      MIN(affiliate_tier)       AS affiliate_tier,
      MIN(parent_vendor_name)   AS parent_vendor_name,
      MIN(vendor_category)      AS vendor_category,
      MIN(program_name)         AS program_name,
      MIN(program_code)         AS program_code,
      MAX(rebate_rate)::TEXT    AS rebate_rate,
      MIN(program_start_date)::TEXT AS program_start_date,
      MAX(program_end_date)::TEXT   AS program_end_date,
      MIN(leakage_reason)       AS leakage_reason,
      MIN(root_cause)           AS root_cause,
      CASE
        WHEN BOOL_OR(priority_level = 'P1') THEN 'P1'
        WHEN BOOL_OR(priority_level = 'P2') THEN 'P2'
        ELSE 'P3'
      END                       AS priority_level,
      COALESCE(MIN(followup_status), 'new') AS followup_status,
      BOOL_OR(vendor_crosswalk_used) AS vendor_crosswalk_used,
      COUNT(*)::INT             AS transaction_count,
      ROUND(COALESCE(SUM(expected_rebate_amount), 0::numeric), 2) AS estimated_leakage_amount,
      MIN(transaction_date)::TEXT AS earliest_txn_date,
      MAX(transaction_date)::TEXT AS latest_txn_date,
      MAX(maturity_days)::INT   AS max_maturity_days,
      MIN(maturity_days)::INT   AS min_maturity_days,
      ARRAY(
        SELECT netsuite_txn_id FROM g ORDER BY transaction_date DESC LIMIT 5
      )                         AS sample_netsuite_ids,
      CASE
        WHEN MIN(root_cause) = 'Vendor/entity mapping' THEN 'Reconcile vendor crosswalk and re-submit claim'
        WHEN MIN(root_cause) = 'Claim workflow gap'    THEN 'Validate claim status with vendor/program owner'
        WHEN MIN(root_cause) = 'Timing/window issue'   THEN 'Confirm program window dates and resubmit'
        WHEN MIN(root_cause) = 'SKU/category mapping'  THEN 'Verify SKU eligibility against program rules'
        ELSE 'Verify shop enrollment and program coverage'
      END                       AS recommended_action
    FROM g
    `,
    [args.shop_code, args.parent_vendor_name, args.program_name, args.leakage_reason]
  );
  return rows[0] ?? null;
}
