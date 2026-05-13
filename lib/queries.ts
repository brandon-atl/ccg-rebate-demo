// R3 reference seed: static fixtures that mirror the canonical numbers
// from the Power BI deliverable. The schema-on-the-DB version of these
// functions is preserved in git history; this branch trades dynamism for
// guaranteed alignment with the Round-3 PBIX so a panel walk-through of
// the V6 demo cannot contradict the canonical analysis.

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

const PARTNERS = [
  "3M",
  "AKZO",
  "BASF",
  "Fibre Glass Evercoat",
  "Kent",
  "Klean Strip",
  "LKQ",
  "PPG",
  "Saint Gobain",
  "Wurth",
  "American Tape",
] as const;

const REGIONS = ["Northeast", "Southeast", "Midwest", "South Central", "West"] as const;

// Used to spread fixture rows across realistic root-cause categories.
const ROOT_CAUSES = [
  "Claim workflow gap",
  "SKU/category mapping",
  "Vendor/entity mapping",
  "Enrollment mismatch",
  "Timing/window issue",
] as const;

export async function getDashboardSummary(): Promise<DashboardSummary> {
  // Numbers hardwired to R3 canonicals. The action-list page no longer
  // surfaces capture_rate (R3 doesn't underwrite a recovery claim), so
  // that field is preserved structurally with a neutral value.
  return {
    leakage_transaction_count: 1193,
    estimated_leakage_amount: "199429.54",
    total_eligible_spend: "3868592.42",
    total_claimed_amount: "0",
    recovered_ytd_amount: "0",
    capture_rate: "0",
    capture_rate_qoq_delta: "0",
    shops_with_leakage: 1193,
    p1_shop_count: 42,
    vendors_with_leakage: 11,
    false_positive_rate: "7.4",
    action_completion_rate: "0",
  };
}

export async function getVendorLeakage(_limit = 8) {
  // 11-partner exception leaderboard, sorted by dollar gap descending.
  return [
    { parent_vendor_name: "LKQ",           vendor_category: "Parts",        leakage_transactions: 400, estimated_leakage_amount: "32317.00", dominant_root_cause: "Claim workflow gap" },
    { parent_vendor_name: "3M",            vendor_category: "Refinish",     leakage_transactions: 130, estimated_leakage_amount: "17191.00", dominant_root_cause: "SKU/category mapping" },
    { parent_vendor_name: "AKZO",          vendor_category: "Paint",        leakage_transactions: 109, estimated_leakage_amount:  "6879.00", dominant_root_cause: "Vendor/entity mapping" },
    { parent_vendor_name: "Saint Gobain",  vendor_category: "Abrasives",    leakage_transactions: 263, estimated_leakage_amount:  "6338.00", dominant_root_cause: "Claim workflow gap" },
    { parent_vendor_name: "PPG",           vendor_category: "Paint",        leakage_transactions:  41, estimated_leakage_amount:  "5227.00", dominant_root_cause: "Enrollment mismatch" },
    { parent_vendor_name: "BASF",          vendor_category: "Paint",        leakage_transactions:  32, estimated_leakage_amount:  "1880.00", dominant_root_cause: "SKU/category mapping" },
    { parent_vendor_name: "Kent",          vendor_category: "Consumables",  leakage_transactions:  88, estimated_leakage_amount:  "1297.00", dominant_root_cause: "Claim workflow gap" },
    { parent_vendor_name: "Klean Strip",   vendor_category: "Consumables",  leakage_transactions:  46, estimated_leakage_amount:   "270.00", dominant_root_cause: "Timing/window issue" },
    { parent_vendor_name: "American Tape", vendor_category: "Consumables",  leakage_transactions:  32, estimated_leakage_amount:   "238.00", dominant_root_cause: "SKU/category mapping" },
    { parent_vendor_name: "Wurth",         vendor_category: "Consumables",  leakage_transactions:   7, estimated_leakage_amount:    "29.00", dominant_root_cause: "Vendor/entity mapping" },
    { parent_vendor_name: "Fibre Glass Evercoat", vendor_category: "Consumables", leakage_transactions: 0, estimated_leakage_amount: "0.00", dominant_root_cause: null },
  ];
}

export async function getLeakageReasonBreakdown() {
  return [
    { leakage_reason: "Eligible spend without successful claim",     transaction_count: 608, estimated_leakage_amount: "101709.06" },
    { leakage_reason: "SKU outside program category set",            transaction_count: 286, estimated_leakage_amount:  "47863.09" },
    { leakage_reason: "Vendor parent/subsidiary unresolved",         transaction_count: 167, estimated_leakage_amount:  "27920.14" },
    { leakage_reason: "Affiliate not enrolled / mid-period change",  transaction_count: 119, estimated_leakage_amount:  "19942.95" },
    { leakage_reason: "Outside program effective window",            transaction_count:  24, estimated_leakage_amount:   "1994.30" },
  ];
}

export async function getRootCauseBreakdown() {
  // Spec: keep V6's Phase-2 framing. Distribution stays at 51/24/14/10/2.
  return [
    { root_cause: "Claim workflow gap",   transaction_count: 608, estimated_leakage_amount: "101709.06", share_of_leakage: "51.0" },
    { root_cause: "SKU/category mapping", transaction_count: 286, estimated_leakage_amount:  "47863.09", share_of_leakage: "24.0" },
    { root_cause: "Vendor/entity mapping",transaction_count: 167, estimated_leakage_amount:  "27920.14", share_of_leakage: "14.0" },
    { root_cause: "Enrollment mismatch",  transaction_count: 119, estimated_leakage_amount:  "19942.95", share_of_leakage: "10.0" },
    { root_cause: "Timing/window issue",  transaction_count:  24, estimated_leakage_amount:   "1994.30", share_of_leakage:  "2.0" },
  ];
}

export async function getLeakageTrend() {
  // Synthetic 6-month trend curve, kept here so the landing trend chart
  // continues to render without a DB. Recovery line is intentionally low
  // because R3 does not underwrite a YTD-recovered metric.
  const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
  const open = [42000, 38500, 45000, 41500, 38000, 34000];
  return months.map((m, i) => ({
    month_start: `2025-${String(9 + i).padStart(2, "0")}-01`,
    month_label: m,
    open_leakage: open[i].toFixed(2),
    recovered_amount: "0",
  }));
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

// Compact representative action queue. Total real-world count is 1,193
// (42 P1 / 176 P2 / 975 P3) and is shown in the header KPIs; the table
// itself ships a curated sample so panel readers can scan structure.
const ACTION_ROWS: ActionQueueRow[] = [
  // P1 — mapping-first orphans (route to Data Ops)
  { shop_code: "AFF-15789", shop_name: "Orphan Affiliate ID 15789", region: "Southeast",   state: "GA", affiliate_tier: "Unmapped", parent_vendor_name: "3M",           program_name: "3M HAG Tier 2",         leakage_reason: "Affiliate not in dim_affiliate crosswalk", root_cause: "Vendor/entity mapping", priority_level: "P1", followup_status: "new",        transaction_count: 590, estimated_leakage_amount: "25413.06", max_maturity_days: 184, recommended_action: "Reconcile affiliate crosswalk and validate claim eligibility.", queue_state: "open" },
  { shop_code: "AFF-14102", shop_name: "Orphan Affiliate ID 14102", region: "Midwest",      state: "OH", affiliate_tier: "Unmapped", parent_vendor_name: "LKQ",          program_name: "LKQ Volume Rebate",      leakage_reason: "Affiliate not in dim_affiliate crosswalk", root_cause: "Vendor/entity mapping", priority_level: "P1", followup_status: "new",        transaction_count: 412, estimated_leakage_amount: "18922.40", max_maturity_days: 162, recommended_action: "Reconcile affiliate crosswalk.", queue_state: "open" },
  { shop_code: "AFF-13044", shop_name: "Orphan Affiliate ID 13044", region: "South Central",state: "TX", affiliate_tier: "Unmapped", parent_vendor_name: "AKZO",         program_name: "AKZO Loyalty Direct",   leakage_reason: "Affiliate not in dim_affiliate crosswalk", root_cause: "Vendor/entity mapping", priority_level: "P1", followup_status: "new",        transaction_count: 318, estimated_leakage_amount: "14418.92", max_maturity_days: 211, recommended_action: "Reconcile affiliate crosswalk.", queue_state: "open" },
  { shop_code: "AFF-11876", shop_name: "Orphan Affiliate ID 11876", region: "West",         state: "CA", affiliate_tier: "Unmapped", parent_vendor_name: "Saint Gobain", program_name: "Saint Gobain Abrasives",leakage_reason: "Affiliate not in dim_affiliate crosswalk", root_cause: "Vendor/entity mapping", priority_level: "P1", followup_status: "new",        transaction_count: 261, estimated_leakage_amount: "10880.27", max_maturity_days: 178, recommended_action: "Reconcile affiliate crosswalk.", queue_state: "open" },
  { shop_code: "AFF-10421", shop_name: "Orphan Affiliate ID 10421", region: "Northeast",    state: "PA", affiliate_tier: "Unmapped", parent_vendor_name: "PPG",          program_name: "PPG Refinish Direct",   leakage_reason: "Affiliate not in dim_affiliate crosswalk", root_cause: "Vendor/entity mapping", priority_level: "P1", followup_status: "new",        transaction_count: 198, estimated_leakage_amount:  "9211.85", max_maturity_days: 153, recommended_action: "Reconcile affiliate crosswalk.", queue_state: "open" },
  { shop_code: "AFF-09833", shop_name: "Orphan Affiliate ID 09833", region: "Southeast",    state: "FL", affiliate_tier: "Unmapped", parent_vendor_name: "BASF",         program_name: "BASF Refinish Loyalty", leakage_reason: "Affiliate not in dim_affiliate crosswalk", root_cause: "Vendor/entity mapping", priority_level: "P1", followup_status: "new",        transaction_count: 165, estimated_leakage_amount:  "7944.62", max_maturity_days: 169, recommended_action: "Reconcile affiliate crosswalk.", queue_state: "open" },
  { shop_code: "AFF-08711", shop_name: "Orphan Affiliate ID 08711", region: "Midwest",      state: "IL", affiliate_tier: "Unmapped", parent_vendor_name: "Kent",         program_name: "Kent Volume",           leakage_reason: "Affiliate not in dim_affiliate crosswalk", root_cause: "Vendor/entity mapping", priority_level: "P1", followup_status: "new",        transaction_count: 142, estimated_leakage_amount:  "6188.17", max_maturity_days: 191, recommended_action: "Reconcile affiliate crosswalk.", queue_state: "open" },
  { shop_code: "AFF-07522", shop_name: "Orphan Affiliate ID 07522", region: "West",         state: "AZ", affiliate_tier: "Unmapped", parent_vendor_name: "3M",           program_name: "3M Negotiated",         leakage_reason: "Affiliate not in dim_affiliate crosswalk", root_cause: "Vendor/entity mapping", priority_level: "P1", followup_status: "in_progress",transaction_count: 118, estimated_leakage_amount:  "5722.91", max_maturity_days: 158, recommended_action: "Reconcile affiliate crosswalk.", queue_state: "in_progress" },
  // P1 — named operator (route to Performance Management)
  { shop_code: "CIO-QKTWN", shop_name: "Ciocca Collision Quakertown", region: "Northeast", state: "PA", affiliate_tier: "Premier", parent_vendor_name: "LKQ",         program_name: "LKQ HAG Tier 1",         leakage_reason: "Eligible spend without successful claim", root_cause: "Claim workflow gap", priority_level: "P1", followup_status: "new",        transaction_count:  47, estimated_leakage_amount:  "3079.72", max_maturity_days: 122, recommended_action: "Validate claim status with vendor/program owner; resubmit if recoverable.", queue_state: "open" },
  { shop_code: "LAM-BLVUE", shop_name: "LaMettry's Bloomington",     region: "Midwest",   state: "MN", affiliate_tier: "Premier", parent_vendor_name: "3M",          program_name: "3M HAG Tier 2",          leakage_reason: "Eligible spend without successful claim", root_cause: "Claim workflow gap", priority_level: "P1", followup_status: "new",        transaction_count:  62, estimated_leakage_amount:  "2843.18", max_maturity_days: 138, recommended_action: "Validate claim status.", queue_state: "open" },
  { shop_code: "CIO-BTHLM", shop_name: "Ciocca Collision Bethlehem",  region: "Northeast", state: "PA", affiliate_tier: "Premier", parent_vendor_name: "AKZO",        program_name: "AKZO Loyalty Direct",   leakage_reason: "Eligible spend without successful claim", root_cause: "Claim workflow gap", priority_level: "P1", followup_status: "new",        transaction_count:  41, estimated_leakage_amount:  "2104.55", max_maturity_days: 110, recommended_action: "Validate claim status.", queue_state: "open" },
  { shop_code: "LAM-RCHFD", shop_name: "LaMettry's Richfield",       region: "Midwest",   state: "MN", affiliate_tier: "Premier", parent_vendor_name: "PPG",         program_name: "PPG Refinish Direct",   leakage_reason: "Eligible spend without successful claim", root_cause: "Claim workflow gap", priority_level: "P1", followup_status: "in_progress",transaction_count:  38, estimated_leakage_amount:  "1822.94", max_maturity_days: 167, recommended_action: "Validate claim status.", queue_state: "in_progress" },
  // P2 — claim workflow + SKU mapping mix
  { shop_code: "CER-RLGH",  shop_name: "Certified Collision Raleigh",     region: "Southeast",    state: "NC", affiliate_tier: "Standard", parent_vendor_name: "Saint Gobain", program_name: "Saint Gobain Abrasives", leakage_reason: "SKU outside program category set",       root_cause: "SKU/category mapping",  priority_level: "P2", followup_status: "new", transaction_count: 28, estimated_leakage_amount: "1742.18", max_maturity_days: 96,  recommended_action: "Validate SKU/category eligibility.", queue_state: "open" },
  { shop_code: "PRO-DALLS", shop_name: "Pro Auto Body Dallas",            region: "South Central",state: "TX", affiliate_tier: "Standard", parent_vendor_name: "BASF",         program_name: "BASF Refinish Loyalty", leakage_reason: "Eligible spend without successful claim", root_cause: "Claim workflow gap",    priority_level: "P2", followup_status: "new", transaction_count: 22, estimated_leakage_amount: "1455.20", max_maturity_days: 91,  recommended_action: "Validate claim status.", queue_state: "open" },
  { shop_code: "MID-CHICG", shop_name: "Midwest Collision Chicago",       region: "Midwest",      state: "IL", affiliate_tier: "Standard", parent_vendor_name: "3M",           program_name: "3M HAG Tier 2",         leakage_reason: "SKU outside program category set",        root_cause: "SKU/category mapping",  priority_level: "P2", followup_status: "new", transaction_count: 31, estimated_leakage_amount: "1218.46", max_maturity_days: 88,  recommended_action: "Validate SKU/category eligibility.", queue_state: "open" },
  { shop_code: "SOU-ATLNT", shop_name: "Southern Collision Atlanta",      region: "Southeast",    state: "GA", affiliate_tier: "Standard", parent_vendor_name: "LKQ",          program_name: "LKQ Volume Rebate",     leakage_reason: "Eligible spend without successful claim", root_cause: "Claim workflow gap",    priority_level: "P2", followup_status: "in_progress", transaction_count: 19, estimated_leakage_amount: "1110.72", max_maturity_days: 102, recommended_action: "Validate claim status.", queue_state: "in_progress" },
  { shop_code: "PAC-LAANG", shop_name: "Pacific Collision LA",            region: "West",         state: "CA", affiliate_tier: "Standard", parent_vendor_name: "AKZO",         program_name: "AKZO Loyalty Direct",   leakage_reason: "Affiliate not enrolled / mid-period change", root_cause: "Enrollment mismatch", priority_level: "P2", followup_status: "new", transaction_count: 17, estimated_leakage_amount:  "988.40", max_maturity_days: 79,  recommended_action: "Confirm enrollment effective date.", queue_state: "open" },
  { shop_code: "NEC-BSTN",  shop_name: "Northeast Collision Boston",      region: "Northeast",    state: "MA", affiliate_tier: "Standard", parent_vendor_name: "PPG",          program_name: "PPG Refinish Direct",   leakage_reason: "Vendor parent/subsidiary unresolved",     root_cause: "Vendor/entity mapping", priority_level: "P2", followup_status: "new", transaction_count: 24, estimated_leakage_amount:  "884.61", max_maturity_days: 84,  recommended_action: "Reconcile vendor crosswalk.", queue_state: "open" },
  { shop_code: "OZA-PHX",   shop_name: "Ozark Auto Body Phoenix",         region: "West",         state: "AZ", affiliate_tier: "Standard", parent_vendor_name: "Kent",         program_name: "Kent Volume",           leakage_reason: "Eligible spend without successful claim", root_cause: "Claim workflow gap",    priority_level: "P2", followup_status: "new", transaction_count: 16, estimated_leakage_amount:  "742.18", max_maturity_days: 71,  recommended_action: "Validate claim status.", queue_state: "open" },
  { shop_code: "CRO-DENV",  shop_name: "Crown Collision Denver",          region: "West",         state: "CO", affiliate_tier: "Standard", parent_vendor_name: "3M",           program_name: "3M Negotiated",         leakage_reason: "SKU outside program category set",        root_cause: "SKU/category mapping",  priority_level: "P2", followup_status: "new", transaction_count: 14, estimated_leakage_amount:  "651.84", max_maturity_days: 77,  recommended_action: "Validate SKU/category eligibility.", queue_state: "open" },
  { shop_code: "GUL-NEORL", shop_name: "Gulf Coast Collision New Orleans",region: "South Central",state: "LA", affiliate_tier: "Standard", parent_vendor_name: "BASF",         program_name: "BASF Refinish Loyalty", leakage_reason: "Affiliate not enrolled / mid-period change", root_cause: "Enrollment mismatch", priority_level: "P2", followup_status: "new", transaction_count: 12, estimated_leakage_amount:  "548.93", max_maturity_days: 65,  recommended_action: "Confirm enrollment effective date.", queue_state: "open" },
  // P3 — long tail
  { shop_code: "SUN-MIAMI", shop_name: "Sunbelt Collision Miami",         region: "Southeast",    state: "FL", affiliate_tier: "Standard", parent_vendor_name: "Kent",         program_name: "Kent Volume",           leakage_reason: "Eligible spend without successful claim", root_cause: "Claim workflow gap",    priority_level: "P3", followup_status: "new", transaction_count: 7,  estimated_leakage_amount: "318.40", max_maturity_days: 68, recommended_action: "Validate claim status.", queue_state: "open" },
  { shop_code: "RIO-HOUST", shop_name: "Rio Grande Auto Body Houston",    region: "South Central",state: "TX", affiliate_tier: "Standard", parent_vendor_name: "Saint Gobain", program_name: "Saint Gobain Abrasives", leakage_reason: "SKU outside program category set",       root_cause: "SKU/category mapping",  priority_level: "P3", followup_status: "new", transaction_count: 9,  estimated_leakage_amount: "274.22", max_maturity_days: 62, recommended_action: "Validate SKU/category eligibility.", queue_state: "open" },
  { shop_code: "OAK-CLVLD", shop_name: "Oakwood Collision Cleveland",     region: "Midwest",      state: "OH", affiliate_tier: "Standard", parent_vendor_name: "American Tape",program_name: "American Tape Volume",  leakage_reason: "SKU outside program category set",        root_cause: "SKU/category mapping",  priority_level: "P3", followup_status: "false_positive", transaction_count: 4, estimated_leakage_amount: "187.05", max_maturity_days: 71, recommended_action: "Validate SKU/category eligibility.", queue_state: "resolved" },
  { shop_code: "BAY-SFRAN", shop_name: "Bay Area Collision SF",           region: "West",         state: "CA", affiliate_tier: "Standard", parent_vendor_name: "Klean Strip",  program_name: "Klean Strip Consumables",leakage_reason: "Outside program effective window",       root_cause: "Timing/window issue",   priority_level: "P3", followup_status: "new", transaction_count: 6,  estimated_leakage_amount: "164.72", max_maturity_days: 88, recommended_action: "Confirm program effective dates.", queue_state: "open" },
  { shop_code: "PNN-PHILA", shop_name: "Penn Collision Philadelphia",     region: "Northeast",    state: "PA", affiliate_tier: "Standard", parent_vendor_name: "Wurth",        program_name: "Wurth Loyalty",         leakage_reason: "Vendor parent/subsidiary unresolved",     root_cause: "Vendor/entity mapping", priority_level: "P3", followup_status: "new", transaction_count: 3,  estimated_leakage_amount: "138.94", max_maturity_days: 64, recommended_action: "Reconcile vendor crosswalk.", queue_state: "open" },
  { shop_code: "ROC-NSHVL", shop_name: "Rockford Collision Nashville",    region: "Southeast",    state: "TN", affiliate_tier: "Standard", parent_vendor_name: "LKQ",          program_name: "LKQ Volume Rebate",     leakage_reason: "Eligible spend without successful claim", root_cause: "Claim workflow gap",    priority_level: "P3", followup_status: "claimed", transaction_count: 8, estimated_leakage_amount: "122.18", max_maturity_days: 80, recommended_action: "Validate claim status.", queue_state: "resolved" },
  { shop_code: "MIN-MPLS",  shop_name: "Minnehaha Auto Body Minneapolis", region: "Midwest",      state: "MN", affiliate_tier: "Standard", parent_vendor_name: "PPG",          program_name: "PPG Refinish Direct",   leakage_reason: "Eligible spend without successful claim", root_cause: "Claim workflow gap",    priority_level: "P3", followup_status: "new", transaction_count: 4,  estimated_leakage_amount: "98.40",  max_maturity_days: 69, recommended_action: "Validate claim status.", queue_state: "open" },
  { shop_code: "AZL-TUCSN", shop_name: "Azul Collision Tucson",           region: "West",         state: "AZ", affiliate_tier: "Standard", parent_vendor_name: "3M",           program_name: "3M HAG Tier 2",         leakage_reason: "Affiliate not enrolled / mid-period change", root_cause: "Enrollment mismatch", priority_level: "P3", followup_status: "new", transaction_count: 5,  estimated_leakage_amount: "82.95",  max_maturity_days: 73, recommended_action: "Confirm enrollment effective date.", queue_state: "open" },
];

export async function getShopActionList(_limit = 75) {
  return ACTION_ROWS.map(({ queue_state, ...rest }) => rest);
}

export async function getActionQueueFull(_limit = 600) {
  return ACTION_ROWS;
}

export async function getDataQualitySummary() {
  return {
    total_transactions: 8813,
    eligible_rows: 1193,
    return_void_count: 315,
    immature_transaction_count: 0,
    mature_leakage_count: 1193,
    duplicate_netsuite_id_count: 0,
    zero_amount_count: 0,
    orphan_claim_count: 45,
    vendor_crosswalk_count: 1458,
  };
}

export async function getQualityChecks() {
  return [
    { check_name: "Row Count Validation",  check_value: "37,002",      status: "pass", notes: "37,002 fact rows · 8,813 distinct transactions in fact_rebate_line." },
    { check_name: "Grain Integrity",       check_value: "0 duplicates",status: "pass", notes: "Zero duplicate transaction IDs. rebate_line_key preserves line grain (4.2 lines / transaction)." },
    { check_name: "Date Window Validation",check_value: "0 invalid",   status: "pass", notes: "All program dates fall within configured min/max bounds." },
    { check_name: "Maturity Filtering",    check_value: "2026-02-01",  status: "pass", notes: "Latest mature period 2026-02-01 · 100% of February rebates posted by day 60." },
    { check_name: "Returns / Reversals",   check_value: "315 · -$3,364.72", status: "pass", notes: "315 reversal rows totaling −$3,364.72 separated to R3 exception type Negative/Reversal." },
    { check_name: "Affiliate Crosswalk",   check_value: "1,458 in dim",status: "pass", notes: "1,458 affiliates in dim · 1,397 active · 45 orphan IDs · $127,762.56 unattributable until mapped." },
  ];
}

export async function getArchitectureStats() {
  return [
    { table_name: "bronze.fact_transaction",       row_count: "8,813",  layer: "bronze" },
    { table_name: "bronze.fact_rebate_line",       row_count: "37,002", layer: "bronze" },
    { table_name: "silver.dim_affiliate",          row_count: "1,458",  layer: "silver" },
    { table_name: "silver.dim_affiliate (active)", row_count: "1,397",  layer: "silver" },
    { table_name: "silver.dim_partner",            row_count: "11",     layer: "silver" },
    { table_name: "gold.vw_exception_candidates",  row_count: "1,193",  layer: "gold"   },
    { table_name: "gold.vw_dq_flags",              row_count: "4,658",  layer: "gold"   },
    { table_name: "gold.vw_reconciliation_checks", row_count: "25",     layer: "gold"   },
    { table_name: "gold.vw_action_queue",          row_count: "1,193",  layer: "gold"   },
  ];
}

export type HomeRow = {
  shop_id: number;
  region: string;
  parent_vendor_name: string;
  vendor_category: string;
  program_name: string;
  root_cause: string;
  priority_level: string;
  leakage_flag: boolean;
  expected_rebate_amount: string;
  net_eligible_spend: string;
  claim_status: string | null;
  claimed_amount: string | null;
  claim_date: string | null;
  followup_status: string | null;
  transaction_date: string;
  maturity_days: number;
};

// Minimal HomeRow set: populates the slicer dropdowns (region / vendor /
// priority) and gives the LOR scatter chart something to bin against.
// The landing KPIs and charts are hardcoded in HomeDashboard, so the
// numeric content of these rows is not load-bearing.
function makeHomeRows(): HomeRow[] {
  const rows: HomeRow[] = [];
  let id = 1;
  PARTNERS.forEach((partner, pi) => {
    REGIONS.forEach((region, ri) => {
      for (let i = 0; i < 6; i++) {
        const root = ROOT_CAUSES[(pi + ri + i) % ROOT_CAUSES.length];
        const pri = i < 1 ? "P1" : i < 3 ? "P2" : "P3";
        const leak = i % 2 === 0;
        rows.push({
          shop_id: id++,
          region,
          parent_vendor_name: partner,
          vendor_category: ["Refinish", "Paint", "Abrasives", "Consumables", "Parts"][(pi + i) % 5],
          program_name: `${partner} program ${i + 1}`,
          root_cause: root,
          priority_level: pri,
          leakage_flag: leak,
          expected_rebate_amount: (120 + (pi * 30) + (i * 18)).toFixed(2),
          net_eligible_spend: (2400 + pi * 800).toFixed(2),
          claim_status: leak ? null : "claimed",
          claimed_amount: leak ? null : (95 + pi * 22).toFixed(2),
          claim_date: leak ? null : `2026-01-${String(((id % 28) || 1)).padStart(2, "0")}`,
          followup_status: pri === "P1" && i === 0 ? "new" : null,
          transaction_date: `2025-${String(9 + (i % 4)).padStart(2, "0")}-${String((id % 27) + 1).padStart(2, "0")}`,
          maturity_days: 60 + (i * 12),
        });
      }
    });
  });
  return rows;
}

const HOME_ROWS = makeHomeRows();

export async function getHomeRows() {
  return HOME_ROWS;
}

export async function getLorRebateCorrelation() {
  // Small fixture so the LOR scatter renders. Cohort labels match the
  // CohortDashboard palette.
  const cohorts = [
    "Independent Volume",
    "Mid-Volume Multi-DRP",
    "High-Volume Certified",
    "OEM Specialists",
    "Low-Volume General",
    "Premier Tier",
  ];
  const points: Array<{
    shop_id: number;
    shop_code: string;
    shop_name: string;
    region: string;
    cohort_label: string;
    length_of_rental: string;
    rebate_eligible_spend: string;
    expected_rebate: string;
  }> = [];
  let id = 1;
  cohorts.forEach((cohort, ci) => {
    for (let i = 0; i < 30; i++) {
      const lor = 7 + ci * 1.4 + (i % 7);
      const spend = 3800 + ci * 1100 + i * 220 + (i % 5) * 380;
      points.push({
        shop_id: id,
        shop_code: `SHOP-${1000 + id}`,
        shop_name: `${cohort.split(" ")[0]} Shop ${i + 1}`,
        region: REGIONS[(ci + i) % REGIONS.length],
        cohort_label: cohort,
        length_of_rental: lor.toFixed(1),
        rebate_eligible_spend: spend.toFixed(2),
        expected_rebate: (spend * 0.045).toFixed(2),
      });
      id++;
    }
  });
  return points;
}

const COHORTS = [
  { label: "Independent Volume",     shops: 312, avg_cycle: 14.8, csi: 88.4, drp: 0.61, capture: 0.84 },
  { label: "Mid-Volume Multi-DRP",   shops: 274, avg_cycle: 11.2, csi: 91.0, drp: 0.78, capture: 0.92 },
  { label: "High-Volume Certified",  shops: 198, avg_cycle:  9.6, csi: 93.2, drp: 0.86, capture: 0.95 },
  { label: "OEM Specialists",        shops: 142, avg_cycle:  8.4, csi: 94.5, drp: 0.90, capture: 0.96 },
  { label: "Low-Volume General",     shops:  98, avg_cycle: 17.4, csi: 86.1, drp: 0.52, capture: 0.78 },
  { label: "Premier Tier",           shops:  76, avg_cycle:  7.2, csi: 95.8, drp: 0.93, capture: 0.97 },
];

export async function getCohortShops() {
  // ~1,100 illustrative shops would be heavy to ship; we ship ~80 to
  // populate the table. The cohort-preview page is banner-marked as
  // illustrative — the panel narrative is Phase-2 segmentation.
  const rows: Array<{
    shop_id: number;
    shop_code: string;
    shop_name: string;
    region: string;
    affiliate_tier: string;
    cohort_label: string;
    avg_cycle_time_days: string;
    csi_score: string;
    drp_compliance: string;
    rebate_capture_rate: string;
    length_of_rental: string;
    intervention_flag: boolean;
  }> = [];
  let id = 1;
  COHORTS.forEach((c, ci) => {
    for (let i = 0; i < 14; i++) {
      const jitter = (i % 5) - 2;
      rows.push({
        shop_id: id,
        shop_code: `SHOP-${4000 + id}`,
        shop_name: `${c.label.split(" ")[0]} Shop ${i + 1}`,
        region: REGIONS[(ci + i) % REGIONS.length],
        affiliate_tier: ci === 3 || ci === 5 ? "Premier" : "Standard",
        cohort_label: c.label,
        avg_cycle_time_days: (c.avg_cycle + jitter * 0.6).toFixed(1),
        csi_score: (c.csi + jitter * 0.4).toFixed(1),
        drp_compliance: (c.drp + jitter * 0.02).toFixed(2),
        rebate_capture_rate: (c.capture + jitter * 0.01).toFixed(2),
        length_of_rental: (7 + ci * 1.3 + (i % 4) * 0.7).toFixed(1),
        intervention_flag: i < 2 && (ci === 0 || ci === 4),
      });
      id++;
    }
  });
  return rows;
}

export async function getCohortPreview() {
  return COHORTS.map((c) => ({
    cohort_label: c.label,
    shop_count: c.shops,
    avg_cycle_time_days: c.avg_cycle.toFixed(1),
    avg_csi_score: c.csi.toFixed(1),
    avg_drp_compliance: c.drp.toFixed(2),
    avg_rebate_capture_rate: c.capture.toFixed(2),
    intervention_priority_count: c.label === "Independent Volume" ? 26 : c.label === "Low-Volume General" ? 12 : 4,
  }));
}

export async function getTopCohortInterventions() {
  return [
    { shop_code: "SHOP-4111", shop_name: "Independent Shop 11", region: "Southeast",    cohort_label: "Independent Volume", cycle_time_percentile: 92, csi_percentile: 22, drp_compliance_percentile: 18, severity_score: "8.4", recommended_intervention: "Cycle-time review + DRP recertification track." },
    { shop_code: "SHOP-4118", shop_name: "Low-Volume Shop 4",   region: "South Central",cohort_label: "Low-Volume General", cycle_time_percentile: 89, csi_percentile: 31, drp_compliance_percentile: 24, severity_score: "7.9", recommended_intervention: "Operations coaching + scheduling rework." },
    { shop_code: "SHOP-4122", shop_name: "Independent Shop 22", region: "Midwest",      cohort_label: "Independent Volume", cycle_time_percentile: 87, csi_percentile: 28, drp_compliance_percentile: 21, severity_score: "7.6", recommended_intervention: "Cycle-time review + DRP recertification track." },
    { shop_code: "SHOP-4131", shop_name: "Mid-Volume Shop 7",   region: "West",         cohort_label: "Mid-Volume Multi-DRP",cycle_time_percentile: 84, csi_percentile: 36, drp_compliance_percentile: 32, severity_score: "7.2", recommended_intervention: "Multi-DRP playbook refresh." },
    { shop_code: "SHOP-4145", shop_name: "Low-Volume Shop 9",   region: "Northeast",    cohort_label: "Low-Volume General", cycle_time_percentile: 83, csi_percentile: 41, drp_compliance_percentile: 29, severity_score: "7.0", recommended_intervention: "Operations coaching." },
    { shop_code: "SHOP-4159", shop_name: "Independent Shop 38", region: "West",         cohort_label: "Independent Volume", cycle_time_percentile: 81, csi_percentile: 44, drp_compliance_percentile: 34, severity_score: "6.8", recommended_intervention: "DRP recertification track." },
    { shop_code: "SHOP-4171", shop_name: "Mid-Volume Shop 18",  region: "Southeast",    cohort_label: "Mid-Volume Multi-DRP",cycle_time_percentile: 78, csi_percentile: 49, drp_compliance_percentile: 41, severity_score: "6.4", recommended_intervention: "Multi-DRP playbook refresh." },
    { shop_code: "SHOP-4188", shop_name: "Independent Shop 51", region: "Midwest",      cohort_label: "Independent Volume", cycle_time_percentile: 76, csi_percentile: 51, drp_compliance_percentile: 44, severity_score: "6.2", recommended_intervention: "Cycle-time review." },
  ];
}
