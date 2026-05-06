-- CCG Rebate Recovery Command Center
-- Synthetic demo schema: Postgres-backed bronze/silver/gold-style model.
-- Safe to re-run. Drops and recreates all demo objects.

DROP VIEW IF EXISTS vw_cohort_intervention_list CASCADE;
DROP VIEW IF EXISTS vw_cohort_preview CASCADE;
DROP VIEW IF EXISTS vw_architecture_stats CASCADE;
DROP VIEW IF EXISTS vw_quality_check_results CASCADE;
DROP VIEW IF EXISTS vw_data_quality_summary CASCADE;
DROP VIEW IF EXISTS vw_leakage_reason_breakdown CASCADE;
DROP VIEW IF EXISTS vw_vendor_leakage CASCADE;
DROP VIEW IF EXISTS vw_shop_action_list CASCADE;
DROP VIEW IF EXISTS vw_dashboard_summary CASCADE;
DROP VIEW IF EXISTS vw_rebate_gold CASCADE;

DROP TABLE IF EXISTS fact_shop_kpi CASCADE;
DROP TABLE IF EXISTS fact_bi_followup CASCADE;
DROP TABLE IF EXISTS fact_rebate_claim CASCADE;
DROP TABLE IF EXISTS fact_transaction CASCADE;
DROP TABLE IF EXISTS dim_program CASCADE;
DROP TABLE IF EXISTS dim_product CASCADE;
DROP TABLE IF EXISTS dim_vendor CASCADE;
DROP TABLE IF EXISTS dim_shop CASCADE;

CREATE TABLE dim_shop (
    shop_id              SERIAL PRIMARY KEY,
    shop_code            TEXT UNIQUE NOT NULL,
    shop_name            TEXT NOT NULL,
    region               TEXT NOT NULL,
    state                TEXT NOT NULL,
    affiliate_tier       TEXT NOT NULL,
    volume_tier          TEXT NOT NULL,
    drp_mix              TEXT NOT NULL,
    certification_level  TEXT NOT NULL,
    active_flag          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dim_vendor (
    vendor_id            SERIAL PRIMARY KEY,
    vendor_code          TEXT UNIQUE NOT NULL,
    vendor_name          TEXT NOT NULL,
    parent_vendor_code   TEXT NOT NULL,
    parent_vendor_name   TEXT NOT NULL,
    vendor_category      TEXT NOT NULL,
    preferred_partner    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dim_product (
    product_id           SERIAL PRIMARY KEY,
    sku                  TEXT UNIQUE NOT NULL,
    product_name         TEXT NOT NULL,
    product_category     TEXT NOT NULL,
    eligible_default     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE dim_program (
    program_id           SERIAL PRIMARY KEY,
    program_code         TEXT UNIQUE NOT NULL,
    program_name         TEXT NOT NULL,
    parent_vendor_code   TEXT NOT NULL,
    eligible_category    TEXT NOT NULL,
    rebate_rate          NUMERIC(8,4) NOT NULL CHECK (rebate_rate >= 0),
    start_date           DATE NOT NULL,
    end_date             DATE NOT NULL,
    active_flag          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

CREATE TABLE fact_transaction (
    transaction_id       BIGSERIAL PRIMARY KEY,
    netsuite_txn_id      TEXT UNIQUE NOT NULL,
    shop_id              INT NOT NULL REFERENCES dim_shop(shop_id),
    vendor_id            INT NOT NULL REFERENCES dim_vendor(vendor_id),
    product_id           INT NOT NULL REFERENCES dim_product(product_id),
    transaction_date     DATE NOT NULL,
    transaction_type     TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'return', 'void')),
    gross_amount         NUMERIC(12,2) NOT NULL,
    quantity             INT NOT NULL DEFAULT 1,
    posted_status        TEXT NOT NULL DEFAULT 'posted',
    source_system        TEXT NOT NULL DEFAULT 'mock_netsuite',
    loaded_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fact_rebate_claim (
    claim_id             BIGSERIAL PRIMARY KEY,
    transaction_id       BIGINT NOT NULL REFERENCES fact_transaction(transaction_id),
    program_id           INT NOT NULL REFERENCES dim_program(program_id),
    claim_status         TEXT NOT NULL CHECK (claim_status IN ('claimed', 'pending', 'rejected')),
    claimed_amount       NUMERIC(12,2),
    claim_date           DATE,
    loaded_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (transaction_id, program_id)
);

CREATE TABLE fact_bi_followup (
    followup_id          BIGSERIAL PRIMARY KEY,
    transaction_id       BIGINT NOT NULL REFERENCES fact_transaction(transaction_id),
    program_id           INT NOT NULL REFERENCES dim_program(program_id),
    followup_status      TEXT NOT NULL CHECK (
        followup_status IN ('new', 'in_progress', 'claimed', 'unclaimable', 'false_positive')
    ),
    owner                TEXT,
    notes                TEXT,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (transaction_id, program_id)
);

-- Small companion table to let the dashboard show a Georgiana-facing cohort preview without building a separate app.
CREATE TABLE fact_shop_kpi (
    shop_kpi_id          BIGSERIAL PRIMARY KEY,
    shop_id              INT NOT NULL REFERENCES dim_shop(shop_id),
    period_start         DATE NOT NULL,
    period_end           DATE NOT NULL,
    repair_order_count   INT NOT NULL,
    avg_cycle_time_days  NUMERIC(8,2) NOT NULL,
    avg_touch_time_hours NUMERIC(8,2) NOT NULL,
    avg_severity_amount  NUMERIC(12,2) NOT NULL,
    csi_score            NUMERIC(5,2) NOT NULL,
    drp_compliance       NUMERIC(5,2) NOT NULL,
    length_of_rental     NUMERIC(8,2) NOT NULL,
    rebate_capture_rate  NUMERIC(5,2) NOT NULL,
    cohort_label         TEXT NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (period_end >= period_start)
);

CREATE INDEX idx_txn_shop_date ON fact_transaction(shop_id, transaction_date);
CREATE INDEX idx_txn_vendor_date ON fact_transaction(vendor_id, transaction_date);
CREATE INDEX idx_txn_product_date ON fact_transaction(product_id, transaction_date);
CREATE INDEX idx_claim_txn_program ON fact_rebate_claim(transaction_id, program_id);
CREATE INDEX idx_followup_txn_program ON fact_bi_followup(transaction_id, program_id);
CREATE INDEX idx_program_vendor_category ON dim_program(parent_vendor_code, eligible_category);
CREATE INDEX idx_kpi_shop_period ON fact_shop_kpi(shop_id, period_start, period_end);
