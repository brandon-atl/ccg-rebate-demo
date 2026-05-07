import { query } from "./db";

export type DashboardSummary = {
  leakage_transaction_count: number;
  estimated_leakage_amount: string;
  total_eligible_spend: string;
  total_claimed_amount: string;
  recovered_ytd_amount: string;
  capture_rate: string;
  capture_rate_qoq_delta: string;
  shops_with_leakage: number;
  p1_shop_count: number;
  vendors_with_leakage: number;
  false_positive_rate: string;
  action_completion_rate: string;
};

export async function getDashboardSummary() {
  const rows = await query<DashboardSummary>("SELECT * FROM vw_dashboard_summary");
  return rows[0];
}

export async function getVendorLeakage(limit = 8) {
  return query<{
    parent_vendor_name: string;
    vendor_category: string;
    leakage_transactions: number;
    estimated_leakage_amount: string;
    dominant_root_cause: string | null;
  }>(`SELECT * FROM vw_vendor_leakage LIMIT $1`, [limit]);
}

export async function getLeakageReasonBreakdown() {
  return query<{
    leakage_reason: string;
    transaction_count: number;
    estimated_leakage_amount: string;
  }>(`
    SELECT *
    FROM vw_leakage_reason_breakdown
    ORDER BY estimated_leakage_amount DESC NULLS LAST
  `);
}

export async function getRootCauseBreakdown() {
  return query<{
    root_cause: string;
    transaction_count: number;
    estimated_leakage_amount: string;
    share_of_leakage: string;
  }>(`SELECT * FROM vw_root_cause_breakdown`);
}

export async function getLeakageTrend() {
  return query<{
    month_start: string;
    month_label: string;
    open_leakage: string;
    recovered_amount: string;
  }>(`SELECT * FROM vw_leakage_trend_monthly ORDER BY month_start`);
}

export type ShopActionRow = {
  shop_code: string;
  shop_name: string;
  region: string;
  state: string;
  affiliate_tier: string;
  parent_vendor_name: string;
  program_name: string;
  leakage_reason: string;
  root_cause: string;
  priority_level: string;
  followup_status: string;
  transaction_count: number;
  estimated_leakage_amount: string;
  max_maturity_days: number;
  recommended_action: string;
};

export type ActionQueueRow = ShopActionRow & {
  queue_state: "open" | "in_progress" | "resolved";
};

export async function getShopActionList(limit = 75) {
  return query<ShopActionRow>(
    `SELECT *
       FROM vw_shop_action_list
       ORDER BY
         CASE priority_level WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END,
         estimated_leakage_amount::numeric DESC
       LIMIT $1`,
    [limit]
  );
}

export async function getActionQueueFull(limit = 600) {
  return query<ActionQueueRow>(
    `SELECT *
       FROM vw_action_queue_full
       ORDER BY
         CASE queue_state WHEN 'open' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END,
         CASE priority_level WHEN 'P1' THEN 1 WHEN 'P2' THEN 2 ELSE 3 END,
         estimated_leakage_amount::numeric DESC
       LIMIT $1`,
    [limit]
  );
}

export async function getDataQualitySummary() {
  const rows = await query<{
    total_transactions: number;
    eligible_rows: number;
    return_void_count: number;
    immature_transaction_count: number;
    mature_leakage_count: number;
    duplicate_netsuite_id_count: number;
    zero_amount_count: number;
    orphan_claim_count: number;
    vendor_crosswalk_count: number;
  }>("SELECT * FROM vw_data_quality_summary");
  return rows[0];
}

export async function getQualityChecks() {
  return query<{
    check_name: string;
    check_value: string;
    status: string;
    notes: string;
  }>("SELECT * FROM vw_quality_check_results ORDER BY check_name");
}

export async function getArchitectureStats() {
  return query<{
    table_name: string;
    row_count: string;
    layer: string;
  }>("SELECT * FROM vw_architecture_stats ORDER BY layer, table_name");
}

export async function getLorRebateCorrelation() {
  return query<{
    shop_code: string;
    shop_name: string;
    region: string;
    cohort_label: string;
    length_of_rental: string;
    rebate_eligible_spend: string;
    expected_rebate: string;
  }>(`SELECT * FROM vw_lor_rebate_correlation`);
}

export async function getCohortPreview() {
  return query<{
    cohort_label: string;
    shop_count: number;
    avg_cycle_time_days: string;
    avg_csi_score: string;
    avg_drp_compliance: string;
    avg_rebate_capture_rate: string;
    intervention_priority_count: number;
  }>("SELECT * FROM vw_cohort_preview ORDER BY intervention_priority_count DESC, shop_count DESC");
}

export async function getTopCohortInterventions() {
  return query<{
    shop_code: string;
    shop_name: string;
    region: string;
    cohort_label: string;
    cycle_time_percentile: number;
    csi_percentile: number;
    drp_compliance_percentile: number;
    severity_score: string;
    recommended_intervention: string;
  }>(`
    SELECT *
    FROM vw_cohort_intervention_list
    ORDER BY severity_score::numeric DESC
    LIMIT 30
  `);
}
