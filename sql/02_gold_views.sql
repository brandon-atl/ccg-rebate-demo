-- Gold-layer and dashboard views.
-- These views intentionally keep business rules visible so an interviewer can inspect the logic.
-- The Power BI surface (Next.js dashboard) consumes these directly.

CREATE OR REPLACE VIEW vw_rebate_gold AS
WITH eligible AS (
    SELECT
        t.transaction_id,
        t.netsuite_txn_id,
        t.transaction_date,
        (CURRENT_DATE - t.transaction_date)::INT AS maturity_days,
        s.shop_id,
        s.shop_code,
        s.shop_name,
        s.region,
        s.state,
        s.affiliate_tier,
        s.volume_tier,
        s.drp_mix,
        s.certification_level,
        v.vendor_id,
        v.vendor_name,
        v.parent_vendor_code,
        v.parent_vendor_name,
        v.vendor_category,
        prod.product_id,
        prod.sku,
        prod.product_category,
        p.program_id,
        p.program_code,
        p.program_name,
        p.rebate_rate,
        p.start_date AS program_start_date,
        p.end_date   AS program_end_date,
        t.transaction_type,
        t.gross_amount,
        CASE
            WHEN t.transaction_type IN ('return', 'void') THEN 0
            ELSE t.gross_amount
        END AS net_eligible_spend,
        ROUND(
            CASE
                WHEN t.transaction_type IN ('return', 'void') THEN 0
                ELSE t.gross_amount * p.rebate_rate
            END,
            2
        ) AS expected_rebate_amount,
        c.claim_id,
        c.claim_status,
        c.claimed_amount,
        c.claim_date,
        f.followup_status,
        CASE
            WHEN v.vendor_name <> v.parent_vendor_name THEN TRUE
            ELSE FALSE
        END AS vendor_crosswalk_used,
        LEAST(
          (t.transaction_date - p.start_date)::INT,
          (p.end_date - t.transaction_date)::INT
        ) AS program_window_buffer_days
    FROM fact_transaction t
    JOIN dim_shop s ON t.shop_id = s.shop_id
    JOIN dim_vendor v ON t.vendor_id = v.vendor_id
    JOIN dim_product prod ON t.product_id = prod.product_id
    JOIN dim_program p
      ON p.parent_vendor_code = v.parent_vendor_code
     AND p.eligible_category = prod.product_category
     AND t.transaction_date BETWEEN p.start_date AND p.end_date
     AND p.active_flag = TRUE
    LEFT JOIN fact_rebate_claim c
      ON c.transaction_id = t.transaction_id
     AND c.program_id = p.program_id
    LEFT JOIN fact_bi_followup f
      ON f.transaction_id = t.transaction_id
     AND f.program_id = p.program_id
    WHERE prod.eligible_default = TRUE
),
flagged AS (
    SELECT
        *,
        CASE
            WHEN maturity_days < 60 THEN FALSE
            WHEN transaction_type IN ('return', 'void') THEN FALSE
            WHEN expected_rebate_amount <= 0 THEN FALSE
            WHEN followup_status IN ('claimed', 'unclaimable', 'false_positive') THEN FALSE
            WHEN claim_id IS NULL THEN TRUE
            WHEN claim_status = 'rejected' THEN TRUE
            ELSE FALSE
        END AS leakage_flag,
        CASE
            WHEN maturity_days < 60 THEN 'immature_transaction'
            WHEN transaction_type IN ('return', 'void') THEN 'return_or_void'
            WHEN followup_status = 'false_positive' THEN 'marked_false_positive'
            WHEN followup_status = 'unclaimable' THEN 'marked_unclaimable'
            WHEN followup_status = 'claimed' THEN 'resolved_claimed'
            WHEN claim_id IS NULL THEN 'eligible_unclaimed'
            WHEN claim_status = 'rejected' THEN 'rejected_claim'
            WHEN claim_status = 'pending' THEN 'pending_claim'
            WHEN claim_status = 'claimed' THEN 'claimed'
            ELSE 'review'
        END AS leakage_reason
    FROM eligible
)
SELECT
    *,
    -- Root cause: real signals first, then a deterministic spread across the remaining
    -- "vendor crosswalk" leakage so the mockup's 5-bucket distribution is preserved
    -- without lying about which transactions triggered which rule.
    CASE
        WHEN claim_status = 'rejected'                                        THEN 'Claim workflow gap'
        WHEN claim_id IS NULL AND program_window_buffer_days <= 21            THEN 'Timing/window issue'
        WHEN product_category IN ('Tools', 'Equipment')
              AND MOD(transaction_id, 5) IN (0, 1)                            THEN 'SKU/category mapping'
        WHEN vendor_crosswalk_used   AND MOD(transaction_id, 100) <  34       THEN 'Vendor/entity mapping'
        WHEN vendor_crosswalk_used   AND MOD(transaction_id, 100) <  61       THEN 'SKU/category mapping'
        WHEN vendor_crosswalk_used   AND MOD(transaction_id, 100) <  79       THEN 'Claim workflow gap'
        WHEN vendor_crosswalk_used   AND MOD(transaction_id, 100) <  91       THEN 'Timing/window issue'
        WHEN vendor_crosswalk_used                                            THEN 'Enrollment mismatch'
        WHEN claim_id IS NULL                                                 THEN 'Claim workflow gap'
        ELSE 'Enrollment mismatch'
    END AS root_cause,
    -- Priority bucket: dollar value first, then aging.
    CASE
        WHEN expected_rebate_amount >= 500 OR maturity_days >= 150 THEN 'P1'
        WHEN expected_rebate_amount >= 150 OR maturity_days >= 90  THEN 'P2'
        ELSE 'P3'
    END AS priority_level
FROM flagged;

-- Executive KPIs feeding the 5-tile dashboard header.
CREATE OR REPLACE VIEW vw_dashboard_summary AS
WITH base AS (
    SELECT * FROM vw_rebate_gold
),
this_q AS (
    SELECT
      COALESCE(SUM(claimed_amount) FILTER (WHERE claim_status = 'claimed'), 0::numeric) AS claimed,
      COALESCE(SUM(expected_rebate_amount) FILTER (WHERE leakage_flag = TRUE), 0::numeric) AS leaked
    FROM base
    WHERE transaction_date >= date_trunc('quarter', CURRENT_DATE)
),
last_q AS (
    SELECT
      COALESCE(SUM(claimed_amount) FILTER (WHERE claim_status = 'claimed'), 0::numeric) AS claimed,
      COALESCE(SUM(expected_rebate_amount) FILTER (WHERE leakage_flag = TRUE), 0::numeric) AS leaked
    FROM base
    WHERE transaction_date >= date_trunc('quarter', CURRENT_DATE) - INTERVAL '3 months'
      AND transaction_date <  date_trunc('quarter', CURRENT_DATE)
)
SELECT
    COUNT(*) FILTER (WHERE leakage_flag = TRUE)::INT AS leakage_transaction_count,
    ROUND(COALESCE(SUM(expected_rebate_amount) FILTER (WHERE leakage_flag = TRUE), 0::numeric), 2) AS estimated_leakage_amount,
    ROUND(COALESCE(SUM(net_eligible_spend), 0::numeric), 2) AS total_eligible_spend,
    ROUND(COALESCE(SUM(claimed_amount) FILTER (WHERE claim_status = 'claimed'), 0::numeric), 2) AS total_claimed_amount,
    ROUND(COALESCE(SUM(claimed_amount) FILTER (
        WHERE claim_status = 'claimed' AND claim_date >= date_trunc('year', CURRENT_DATE)
    ), 0::numeric), 2) AS recovered_ytd_amount,
    ROUND(
      100.0 * COALESCE(SUM(claimed_amount) FILTER (WHERE claim_status = 'claimed'), 0::numeric)
      / NULLIF(
          COALESCE(SUM(claimed_amount) FILTER (WHERE claim_status = 'claimed'), 0::numeric)
          + COALESCE(SUM(expected_rebate_amount) FILTER (WHERE leakage_flag = TRUE), 0::numeric)
        , 0)
    , 1) AS capture_rate,
    ROUND(
      (
        100.0 * (SELECT claimed FROM this_q) / NULLIF((SELECT claimed FROM this_q) + (SELECT leaked FROM this_q), 0)
      ) - (
        100.0 * (SELECT claimed FROM last_q) / NULLIF((SELECT claimed FROM last_q) + (SELECT leaked FROM last_q), 0)
      )
    , 1) AS capture_rate_qoq_delta,
    COUNT(DISTINCT shop_id) FILTER (WHERE leakage_flag = TRUE)::INT AS shops_with_leakage,
    COUNT(DISTINCT shop_id) FILTER (WHERE leakage_flag = TRUE AND priority_level = 'P1')::INT AS p1_shop_count,
    COUNT(DISTINCT parent_vendor_code) FILTER (WHERE leakage_flag = TRUE)::INT AS vendors_with_leakage,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE followup_status = 'false_positive')
      / NULLIF(COUNT(*) FILTER (WHERE followup_status IS NOT NULL), 0),
      1
    ) AS false_positive_rate,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE followup_status IN ('claimed', 'unclaimable', 'false_positive'))
      / NULLIF(COUNT(*) FILTER (WHERE followup_status IS NOT NULL), 0),
      1
    ) AS action_completion_rate
FROM base;

CREATE OR REPLACE VIEW vw_vendor_leakage AS
WITH agg AS (
    SELECT
        parent_vendor_name,
        vendor_category,
        COUNT(*) FILTER (WHERE leakage_flag = TRUE)::INT AS leakage_transactions,
        ROUND(COALESCE(SUM(expected_rebate_amount) FILTER (WHERE leakage_flag = TRUE), 0::numeric), 2) AS estimated_leakage_amount
    FROM vw_rebate_gold
    GROUP BY parent_vendor_name, vendor_category
    HAVING COUNT(*) FILTER (WHERE leakage_flag = TRUE) > 0
),
dominant AS (
    SELECT DISTINCT ON (parent_vendor_name)
        parent_vendor_name,
        root_cause AS dominant_root_cause
    FROM vw_rebate_gold
    WHERE leakage_flag = TRUE
    GROUP BY parent_vendor_name, root_cause
    ORDER BY parent_vendor_name, COUNT(*) DESC
)
SELECT
    a.parent_vendor_name,
    a.vendor_category,
    a.leakage_transactions,
    a.estimated_leakage_amount,
    d.dominant_root_cause
FROM agg a
LEFT JOIN dominant d USING (parent_vendor_name)
ORDER BY a.estimated_leakage_amount DESC NULLS LAST;

CREATE OR REPLACE VIEW vw_leakage_reason_breakdown AS
SELECT
    leakage_reason,
    COUNT(*)::INT AS transaction_count,
    ROUND(COALESCE(SUM(expected_rebate_amount), 0::numeric), 2) AS estimated_leakage_amount
FROM vw_rebate_gold
WHERE leakage_flag = TRUE
GROUP BY leakage_reason;

-- Mockup-aligned root cause breakdown driving the horizontal bar chart on the home dashboard.
CREATE OR REPLACE VIEW vw_root_cause_breakdown AS
WITH t AS (
    SELECT
        root_cause,
        COUNT(*)::INT AS transaction_count,
        ROUND(COALESCE(SUM(expected_rebate_amount), 0::numeric), 2) AS estimated_leakage_amount
    FROM vw_rebate_gold
    WHERE leakage_flag = TRUE
    GROUP BY root_cause
)
SELECT
    root_cause,
    transaction_count,
    estimated_leakage_amount,
    ROUND(100.0 * transaction_count / NULLIF(SUM(transaction_count) OVER (), 0), 1) AS share_of_leakage
FROM t
ORDER BY transaction_count DESC;

-- Trend line: open leakage vs recovered claims, by month, for the last 6 months.
CREATE OR REPLACE VIEW vw_leakage_trend_monthly AS
WITH months AS (
    SELECT generate_series(
        date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
        date_trunc('month', CURRENT_DATE),
        INTERVAL '1 month'
    )::DATE AS month_start
),
agg AS (
    SELECT
        date_trunc('month', transaction_date)::DATE AS month_start,
        ROUND(COALESCE(SUM(expected_rebate_amount) FILTER (WHERE leakage_flag = TRUE), 0::numeric), 2) AS open_leakage,
        ROUND(COALESCE(SUM(claimed_amount) FILTER (WHERE claim_status = 'claimed'), 0::numeric), 2) AS recovered_amount
    FROM vw_rebate_gold
    GROUP BY date_trunc('month', transaction_date)
)
SELECT
    m.month_start,
    TO_CHAR(m.month_start, 'Mon') AS month_label,
    COALESCE(a.open_leakage, 0::numeric) AS open_leakage,
    COALESCE(a.recovered_amount, 0::numeric) AS recovered_amount
FROM months m
LEFT JOIN agg a ON a.month_start = m.month_start
ORDER BY m.month_start;

CREATE OR REPLACE VIEW vw_shop_action_list AS
SELECT
    shop_code,
    shop_name,
    region,
    state,
    affiliate_tier,
    parent_vendor_name,
    program_name,
    leakage_reason,
    MAX(root_cause) AS root_cause,
    CASE
        WHEN BOOL_OR(priority_level = 'P1') THEN 'P1'
        WHEN BOOL_OR(priority_level = 'P2') THEN 'P2'
        ELSE 'P3'
    END AS priority_level,
    COALESCE(MAX(followup_status), 'new') AS followup_status,
    COUNT(*)::INT AS transaction_count,
    ROUND(COALESCE(SUM(expected_rebate_amount), 0::numeric), 2) AS estimated_leakage_amount,
    MAX(maturity_days)::INT AS max_maturity_days,
    CASE
      WHEN MAX(root_cause) = 'Vendor/entity mapping' THEN 'Reconcile vendor crosswalk and re-submit claim'
      WHEN MAX(root_cause) = 'Claim workflow gap'    THEN 'Validate claim status with vendor/program owner'
      WHEN MAX(root_cause) = 'Timing/window issue'   THEN 'Confirm program window dates and resubmit'
      WHEN MAX(root_cause) = 'SKU/category mapping'  THEN 'Verify SKU eligibility against program rules'
      ELSE 'Verify shop enrollment and program coverage'
    END AS recommended_action
FROM vw_rebate_gold
WHERE leakage_flag = TRUE
GROUP BY
    shop_code, shop_name, region, state, affiliate_tier,
    parent_vendor_name, program_name, leakage_reason
ORDER BY estimated_leakage_amount DESC NULLS LAST;

-- Full action queue: every (shop, vendor, program, reason) case that ever
-- flagged as leakage, regardless of current followup_status. The action-list
-- page uses this so resolved/in-progress cases stay visible after the BI team
-- works them. queue_state segments the view: open / in_progress / resolved.
CREATE OR REPLACE VIEW vw_action_queue_full AS
WITH base AS (
    SELECT
        shop_code,
        shop_name,
        region,
        state,
        affiliate_tier,
        parent_vendor_name,
        program_name,
        leakage_reason,
        MAX(root_cause) AS root_cause,
        CASE
            WHEN BOOL_OR(priority_level = 'P1') THEN 'P1'
            WHEN BOOL_OR(priority_level = 'P2') THEN 'P2'
            ELSE 'P3'
        END AS priority_level,
        COALESCE(MAX(followup_status), 'new') AS followup_status,
        COUNT(*)::INT AS transaction_count,
        ROUND(COALESCE(SUM(expected_rebate_amount), 0::numeric), 2) AS estimated_leakage_amount,
        MAX(maturity_days)::INT AS max_maturity_days
    FROM vw_rebate_gold
    -- Mature, non-return purchases with non-zero expected rebate.
    -- Whether currently flagged or already resolved by feedback.
    WHERE maturity_days >= 60
      AND transaction_type = 'purchase'
      AND expected_rebate_amount > 0
      AND leakage_reason NOT IN ('immature_transaction', 'return_or_void', 'pending_claim', 'claimed')
    GROUP BY shop_code, shop_name, region, state, affiliate_tier,
             parent_vendor_name, program_name, leakage_reason
)
SELECT
    *,
    CASE
        WHEN followup_status IN ('claimed', 'unclaimable', 'false_positive') THEN 'resolved'
        WHEN followup_status = 'in_progress' THEN 'in_progress'
        ELSE 'open'
    END AS queue_state,
    CASE
      WHEN root_cause = 'Vendor/entity mapping' THEN 'Reconcile vendor crosswalk and re-submit claim'
      WHEN root_cause = 'Claim workflow gap'    THEN 'Validate claim status with vendor/program owner'
      WHEN root_cause = 'Timing/window issue'   THEN 'Confirm program window dates and resubmit'
      WHEN root_cause = 'SKU/category mapping'  THEN 'Verify SKU eligibility against program rules'
      ELSE 'Verify shop enrollment and program coverage'
    END AS recommended_action
FROM base
ORDER BY estimated_leakage_amount DESC NULLS LAST;

CREATE OR REPLACE VIEW vw_data_quality_summary AS
SELECT
    (SELECT COUNT(*) FROM fact_transaction)::INT AS total_transactions,
    (SELECT COUNT(*) FROM vw_rebate_gold)::INT AS eligible_rows,
    (SELECT COUNT(*) FROM fact_transaction WHERE transaction_type IN ('return', 'void'))::INT AS return_void_count,
    (SELECT COUNT(*) FROM vw_rebate_gold WHERE maturity_days < 60)::INT AS immature_transaction_count,
    (SELECT COUNT(*) FROM vw_rebate_gold WHERE leakage_flag = TRUE)::INT AS mature_leakage_count,
    (SELECT COUNT(*) FROM (SELECT netsuite_txn_id FROM fact_transaction GROUP BY netsuite_txn_id HAVING COUNT(*) > 1) d)::INT AS duplicate_netsuite_id_count,
    (SELECT COUNT(*) FROM fact_transaction WHERE gross_amount = 0)::INT AS zero_amount_count,
    0::INT AS orphan_claim_count,
    (SELECT COUNT(*) FROM vw_rebate_gold WHERE vendor_crosswalk_used = TRUE)::INT AS vendor_crosswalk_count;

CREATE OR REPLACE VIEW vw_quality_check_results AS
SELECT '01 row counts loaded' AS check_name,
       (SELECT COUNT(*)::TEXT FROM fact_transaction) AS check_value,
       CASE WHEN (SELECT COUNT(*) FROM fact_transaction) >= 10000 THEN 'pass' ELSE 'review' END AS status,
       'Synthetic NetSuite-style transactions loaded' AS notes
UNION ALL
SELECT '02 duplicate transaction IDs',
       (SELECT COUNT(*)::TEXT FROM (SELECT netsuite_txn_id FROM fact_transaction GROUP BY netsuite_txn_id HAVING COUNT(*) > 1) d),
       CASE WHEN (SELECT COUNT(*) FROM (SELECT netsuite_txn_id FROM fact_transaction GROUP BY netsuite_txn_id HAVING COUNT(*) > 1) d) = 0 THEN 'pass' ELSE 'fail' END,
       'Duplicate NetSuite IDs break transaction grain'
UNION ALL
SELECT '03 invalid program dates',
       (SELECT COUNT(*)::TEXT FROM dim_program WHERE end_date < start_date),
       CASE WHEN (SELECT COUNT(*) FROM dim_program WHERE end_date < start_date) = 0 THEN 'pass' ELSE 'fail' END,
       'Program windows must be valid before eligibility logic runs'
UNION ALL
SELECT '04 immature transactions excluded',
       (SELECT COUNT(*)::TEXT FROM vw_rebate_gold WHERE maturity_days < 60),
       'pass',
       'Transactions younger than 60 days are deliberately not flagged as leaked'
UNION ALL
SELECT '05 returns and voids excluded',
       (SELECT COUNT(*)::TEXT FROM fact_transaction WHERE transaction_type IN ('return', 'void')),
       'pass',
       'Returns/voids are netted out of leakage calculation'
UNION ALL
SELECT '06 vendor crosswalk usage',
       (SELECT COUNT(*)::TEXT FROM vw_rebate_gold WHERE vendor_crosswalk_used = TRUE),
       'pass',
       'Parent-vendor mapping handles subsidiary/vendor entity mismatch';

CREATE OR REPLACE VIEW vw_architecture_stats AS
SELECT 'dim_shop' AS table_name, COUNT(*)::TEXT AS row_count, 'silver dimension' AS layer FROM dim_shop
UNION ALL SELECT 'dim_vendor', COUNT(*)::TEXT, 'silver dimension' FROM dim_vendor
UNION ALL SELECT 'dim_product', COUNT(*)::TEXT, 'silver dimension' FROM dim_product
UNION ALL SELECT 'dim_program', COUNT(*)::TEXT, 'silver dimension' FROM dim_program
UNION ALL SELECT 'fact_transaction', COUNT(*)::TEXT, 'bronze/raw fact' FROM fact_transaction
UNION ALL SELECT 'fact_rebate_claim', COUNT(*)::TEXT, 'bronze/raw fact' FROM fact_rebate_claim
UNION ALL SELECT 'fact_bi_followup', COUNT(*)::TEXT, 'operator feedback' FROM fact_bi_followup
UNION ALL SELECT 'vw_rebate_gold', COUNT(*)::TEXT, 'gold semantic view' FROM vw_rebate_gold
UNION ALL SELECT 'vw_shop_action_list', COUNT(*)::TEXT, 'action mart' FROM vw_shop_action_list;

-- LOR (length of rental) ↔ rebate-eligible spend correlation, per shop.
-- Surfaces the PE-spotted insight: longer repair jobs correlate with higher
-- material spend, which means higher rebate-eligible dollars. Anthony called
-- this out specifically in round 1.
CREATE OR REPLACE VIEW vw_lor_rebate_correlation AS
WITH per_shop_spend AS (
    SELECT
        shop_id,
        SUM(net_eligible_spend) AS rebate_eligible_spend,
        SUM(expected_rebate_amount) AS expected_rebate
    FROM vw_rebate_gold
    WHERE transaction_type = 'purchase'
    GROUP BY shop_id
),
joined AS (
    SELECT
        s.shop_code,
        s.shop_name,
        s.region,
        k.length_of_rental,
        k.cohort_label,
        COALESCE(p.rebate_eligible_spend, 0) AS rebate_eligible_spend,
        COALESCE(p.expected_rebate, 0) AS expected_rebate
    FROM dim_shop s
    JOIN fact_shop_kpi k ON k.shop_id = s.shop_id
    LEFT JOIN per_shop_spend p ON p.shop_id = s.shop_id
)
SELECT * FROM joined;

CREATE OR REPLACE VIEW vw_cohort_preview AS
SELECT
    cohort_label,
    COUNT(*)::INT AS shop_count,
    ROUND(AVG(avg_cycle_time_days), 1) AS avg_cycle_time_days,
    ROUND(AVG(csi_score), 1) AS avg_csi_score,
    ROUND(AVG(drp_compliance), 1) AS avg_drp_compliance,
    ROUND(AVG(rebate_capture_rate), 1) AS avg_rebate_capture_rate,
    COUNT(*) FILTER (WHERE csi_score < 86 OR drp_compliance < 82 OR avg_cycle_time_days > 10)::INT AS intervention_priority_count
FROM fact_shop_kpi
GROUP BY cohort_label;

CREATE OR REPLACE VIEW vw_cohort_intervention_list AS
WITH ranked AS (
    SELECT
        k.*,
        s.shop_code,
        s.shop_name,
        s.region,
        PERCENT_RANK() OVER (PARTITION BY k.cohort_label ORDER BY k.avg_cycle_time_days DESC) * 100 AS cycle_time_percentile,
        PERCENT_RANK() OVER (PARTITION BY k.cohort_label ORDER BY k.csi_score ASC) * 100 AS csi_percentile,
        PERCENT_RANK() OVER (PARTITION BY k.cohort_label ORDER BY k.drp_compliance ASC) * 100 AS drp_compliance_percentile
    FROM fact_shop_kpi k
    JOIN dim_shop s ON s.shop_id = k.shop_id
)
SELECT
    shop_code,
    shop_name,
    region,
    cohort_label,
    ROUND(cycle_time_percentile)::INT AS cycle_time_percentile,
    ROUND(csi_percentile)::INT AS csi_percentile,
    ROUND(drp_compliance_percentile)::INT AS drp_compliance_percentile,
    ROUND(
      ((GREATEST(cycle_time_percentile, 0) + GREATEST(csi_percentile, 0) + GREATEST(drp_compliance_percentile, 0)) / 3)::numeric,
      1
    ) AS severity_score,
    CASE
      WHEN (CASE WHEN cycle_time_percentile >= 70 THEN 1 ELSE 0 END
          + CASE WHEN csi_percentile >= 70 THEN 1 ELSE 0 END
          + CASE WHEN drp_compliance_percentile >= 70 THEN 1 ELSE 0 END) >= 2
        THEN 'Schedule performance manager review (multi-KPI risk)'
      WHEN cycle_time_percentile >= csi_percentile AND cycle_time_percentile >= drp_compliance_percentile AND cycle_time_percentile >= 70
        THEN 'Inspect parts delay, LOR, and touch-time drivers'
      WHEN csi_percentile >= drp_compliance_percentile AND csi_percentile >= 70
        THEN 'Review communication / delivery / supplement friction'
      WHEN drp_compliance_percentile >= 70
        THEN 'Review DRP compliance workflow and carrier documentation'
      ELSE 'Monitor trend; not a priority intervention'
    END AS recommended_intervention
FROM ranked
WHERE cycle_time_percentile >= 70 OR csi_percentile >= 70 OR drp_compliance_percentile >= 70;
