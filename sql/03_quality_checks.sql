-- Manual quality inspection queries.
-- Run with: python etl/run_sql.py sql/03_quality_checks.sql

SELECT * FROM vw_dashboard_summary;
SELECT * FROM vw_quality_check_results ORDER BY check_name;
SELECT * FROM vw_data_quality_summary;
SELECT * FROM vw_shop_action_list LIMIT 15;
SELECT * FROM vw_vendor_leakage LIMIT 15;
SELECT * FROM vw_cohort_preview ORDER BY intervention_priority_count DESC;
