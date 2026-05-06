from __future__ import annotations

import random
from datetime import date, timedelta
from typing import Iterable

from faker import Faker
from psycopg2.extras import execute_values

from db_utils import connect

RANDOM_SEED = 4242
fake = Faker()
Faker.seed(RANDOM_SEED)
random.seed(RANDOM_SEED)

REGIONS = ["Northeast", "Southeast", "Midwest", "Southwest", "West", "Canada"]
STATES = ["GA", "FL", "TX", "CA", "PA", "OH", "NC", "AZ", "CO", "MI", "IL", "ON", "BC", "AB"]
TIERS = ["CCG Certified", "Top Shop"]
VOLUME_TIERS = ["Low", "Mid", "High"]
DRP_MIXES = ["single_DRP", "multi_DRP", "carrier_heavy", "light_DRP"]
CERT_LEVELS = ["General", "OEM Certified", "Luxury OEM", "EV/ADAS Ready"]
PRODUCT_CATEGORIES = ["Paint", "Parts", "Refinish Supplies", "Equipment", "Tools"]

VENDOR_PARENTS = [
    ("PPG", "Paint & Refinish", ["Paint", "Refinish Supplies"]),
    ("BASF", "Paint & Refinish", ["Paint", "Refinish Supplies"]),
    ("Sherwin-Williams", "Paint & Refinish", ["Paint", "Refinish Supplies"]),
    ("Axalta", "Paint & Refinish", ["Paint", "Refinish Supplies"]),
    ("3M", "Refinish Supplies", ["Refinish Supplies", "Tools"]),
    ("Norton", "Refinish Supplies", ["Refinish Supplies"]),
    ("Mirka", "Refinish Supplies", ["Refinish Supplies"]),
    ("LKQ", "Parts", ["Parts"]),
    ("Keystone", "Parts", ["Parts"]),
    ("Hunter", "Equipment", ["Equipment", "Tools"]),
    ("Snap-on", "Tools", ["Tools", "Equipment"]),
    ("Pro Spot", "Equipment", ["Equipment"]),
]

COHORTS = [
    "Independent Volume",
    "Mid-Volume Multi-DRP",
    "High-Volume Certified",
    "OEM Specialists",
    "Low-Volume General",
    "Top Shop Tier",
]


def bulk_insert(cur, sql: str, rows: Iterable[tuple], page_size: int = 1000) -> None:
    execute_values(cur, sql, list(rows), page_size=page_size)


def seed_shops(cur, n: int = 1100) -> None:
    rows = []
    for i in range(1, n + 1):
        tier = random.choices(TIERS, weights=[0.72, 0.28])[0]
        volume = random.choices(VOLUME_TIERS, weights=[0.28, 0.45, 0.27])[0]
        certification = random.choices(CERT_LEVELS, weights=[0.42, 0.35, 0.14, 0.09])[0]
        rows.append((
            f"SHOP-{i:04d}",
            f"{fake.last_name()} Collision Center",
            random.choice(REGIONS),
            random.choice(STATES),
            tier,
            volume,
            random.choice(DRP_MIXES),
            certification,
        ))
    bulk_insert(cur, """
        INSERT INTO dim_shop
        (shop_code, shop_name, region, state, affiliate_tier, volume_tier, drp_mix, certification_level)
        VALUES %s
    """, rows)


def seed_vendors(cur) -> None:
    suffixes = ["", "East", "West", "Industrial", "Distribution", "Automotive"]
    rows = []
    vendor_num = 1
    for parent, category, _program_categories in VENDOR_PARENTS:
        parent_code = parent.upper().replace("-", "_").replace(" ", "_")
        for suffix in suffixes:
            vendor_name = parent if suffix == "" else f"{parent} {suffix}"
            rows.append((
                f"VEND-{vendor_num:03d}",
                vendor_name,
                parent_code,
                parent,
                category,
                True,
            ))
            vendor_num += 1
    bulk_insert(cur, """
        INSERT INTO dim_vendor
        (vendor_code, vendor_name, parent_vendor_code, parent_vendor_name, vendor_category, preferred_partner)
        VALUES %s
    """, rows)


def seed_products(cur, n: int = 420) -> None:
    rows = []
    for i in range(1, n + 1):
        category = random.choices(PRODUCT_CATEGORIES, weights=[0.28, 0.35, 0.20, 0.08, 0.09])[0]
        eligible_default = random.random() > 0.07
        rows.append((
            f"SKU-{i:05d}",
            f"{category} Item {i:05d}",
            category,
            eligible_default,
        ))
    bulk_insert(cur, """
        INSERT INTO dim_product (sku, product_name, product_category, eligible_default)
        VALUES %s
    """, rows)


def seed_programs(cur) -> None:
    rows = []
    today = date.today()
    for parent, _vendor_category, program_categories in VENDOR_PARENTS:
        parent_code = parent.upper().replace("-", "_").replace(" ", "_")
        for category in program_categories:
            start_date = today - timedelta(days=random.randint(120, 240))
            end_date = today + timedelta(days=random.randint(30, 120))
            rows.append((
                f"PROG-{parent_code}-{category}".replace(" ", "_").upper(),
                f"{parent} {category} Rebate Program",
                parent_code,
                category,
                round(random.uniform(0.015, 0.085), 4),
                start_date,
                end_date,
                True,
            ))
    bulk_insert(cur, """
        INSERT INTO dim_program
        (program_code, program_name, parent_vendor_code, eligible_category, rebate_rate, start_date, end_date, active_flag)
        VALUES %s
    """, rows)


def fetch_ids(cur):
    cur.execute("SELECT shop_id, volume_tier, drp_mix, certification_level, affiliate_tier FROM dim_shop")
    shops = cur.fetchall()
    cur.execute("SELECT vendor_id FROM dim_vendor")
    vendors = [row[0] for row in cur.fetchall()]
    cur.execute("SELECT product_id, product_category FROM dim_product")
    products = cur.fetchall()
    return shops, vendors, products


def seed_transactions(cur, n: int = 50000) -> None:
    shops, vendors, products = fetch_ids(cur)
    today = date.today()
    rows = []
    for i in range(1, n + 1):
        shop_id = random.choice(shops)[0]
        vendor_id = random.choice(vendors)
        product_id, product_category = random.choice(products)
        txn_type = random.choices(["purchase", "return", "void"], weights=[0.925, 0.055, 0.02])[0]
        category_multiplier = {
            "Paint": 1.8,
            "Parts": 2.4,
            "Refinish Supplies": 0.9,
            "Equipment": 4.5,
            "Tools": 1.5,
        }[product_category]
        amount = round(random.uniform(45, 2200) * category_multiplier, 2)
        if txn_type in {"return", "void"}:
            amount = -abs(amount)
        txn_date = today - timedelta(days=random.randint(1, 210))
        rows.append((
            f"NS-{i:08d}",
            shop_id,
            vendor_id,
            product_id,
            txn_date,
            txn_type,
            amount,
            random.randint(1, 12),
            "posted",
        ))
    bulk_insert(cur, """
        INSERT INTO fact_transaction
        (netsuite_txn_id, shop_id, vendor_id, product_id, transaction_date, transaction_type,
         gross_amount, quantity, posted_status)
        VALUES %s
    """, rows, page_size=2500)


def seed_claims(cur) -> None:
    cur.execute("""
        SELECT
            t.transaction_id,
            p.program_id,
            ROUND((t.gross_amount * p.rebate_rate)::numeric, 2) AS expected_rebate,
            (CURRENT_DATE - t.transaction_date)::INT AS maturity_days
        FROM fact_transaction t
        JOIN dim_vendor v ON t.vendor_id = v.vendor_id
        JOIN dim_product prod ON t.product_id = prod.product_id
        JOIN dim_program p
          ON p.parent_vendor_code = v.parent_vendor_code
         AND p.eligible_category = prod.product_category
         AND t.transaction_date BETWEEN p.start_date AND p.end_date
        WHERE t.transaction_type = 'purchase'
          AND t.gross_amount > 0
          AND prod.eligible_default = TRUE
    """)
    rows = []
    today = date.today()
    for transaction_id, program_id, expected_rebate, maturity_days in cur.fetchall():
        # Immature transactions are more likely to be pending or absent.
        claim_probability = 0.72 if maturity_days >= 60 else 0.38
        if random.random() < claim_probability:
            status = random.choices(["claimed", "pending", "rejected"], weights=[0.82, 0.10, 0.08])[0]
            claimed_amount = expected_rebate if status == "claimed" else None
            claim_date = today - timedelta(days=random.randint(0, 75)) if status != "pending" else None
            rows.append((transaction_id, program_id, status, claimed_amount, claim_date))
    bulk_insert(cur, """
        INSERT INTO fact_rebate_claim
        (transaction_id, program_id, claim_status, claimed_amount, claim_date)
        VALUES %s
        ON CONFLICT (transaction_id, program_id) DO NOTHING
    """, rows, page_size=2500)


def classify_cohort(volume_tier: str, drp_mix: str, cert: str, tier: str) -> str:
    if tier == "Top Shop":
        return "Top Shop Tier"
    if volume_tier == "Low" and drp_mix == "light_DRP":
        return "Low-Volume General"
    if cert in {"Luxury OEM", "EV/ADAS Ready"}:
        return "OEM Specialists"
    if volume_tier == "High" and cert != "General":
        return "High-Volume Certified"
    if drp_mix in {"multi_DRP", "carrier_heavy"}:
        return "Mid-Volume Multi-DRP"
    return "Independent Volume"


def seed_shop_kpis(cur) -> None:
    cur.execute("SELECT shop_id, volume_tier, drp_mix, certification_level, affiliate_tier FROM dim_shop")
    shops = cur.fetchall()
    today = date.today()
    period_end = today - timedelta(days=today.day)  # last day of prior month-ish
    period_start = period_end - timedelta(days=89)
    rows = []
    for shop_id, volume_tier, drp_mix, cert, tier in shops:
        cohort = classify_cohort(volume_tier, drp_mix, cert, tier)
        volume_base = {"Low": 22, "Mid": 58, "High": 130}[volume_tier]
        ro_count = max(5, int(random.gauss(volume_base, volume_base * 0.22)))
        severity_base = {
            "General": 2450,
            "OEM Certified": 3350,
            "Luxury OEM": 5200,
            "EV/ADAS Ready": 6100,
        }[cert]
        severity = max(800, random.gauss(severity_base, severity_base * 0.18))
        cycle_time = max(3.0, random.gauss(7.8 + (severity / 5000), 1.4))
        touch_time = max(8.0, random.gauss(24 + (severity / 300), 5.5))
        csi = min(99.5, max(70.0, random.gauss(91.0, 5.0)))
        drp_compliance = min(99.0, max(65.0, random.gauss(88.0, 6.5)))
        lor = max(2.0, cycle_time + random.gauss(1.5, 1.0))
        rebate_capture = min(99.0, max(50.0, random.gauss(86.0, 8.0)))

        # Add some meaningful underperformance pockets for the intervention preview.
        if random.random() < 0.10:
            cycle_time += random.uniform(2.0, 4.5)
            csi -= random.uniform(5.0, 10.0)
            drp_compliance -= random.uniform(4.0, 12.0)
            rebate_capture -= random.uniform(8.0, 18.0)

        rows.append((
            shop_id,
            period_start,
            period_end,
            ro_count,
            round(cycle_time, 2),
            round(touch_time, 2),
            round(severity, 2),
            round(csi, 2),
            round(drp_compliance, 2),
            round(lor, 2),
            round(rebate_capture, 2),
            cohort,
        ))
    bulk_insert(cur, """
        INSERT INTO fact_shop_kpi
        (shop_id, period_start, period_end, repair_order_count, avg_cycle_time_days,
         avg_touch_time_hours, avg_severity_amount, csi_score, drp_compliance,
         length_of_rental, rebate_capture_rate, cohort_label)
        VALUES %s
    """, rows, page_size=2500)


def seed_all() -> None:
    print("Seeding synthetic CCG data...")
    with connect() as conn:
        with conn.cursor() as cur:
            seed_shops(cur)
            seed_vendors(cur)
            seed_products(cur)
            seed_programs(cur)
            seed_transactions(cur)
            seed_claims(cur)
            seed_shop_kpis(cur)
        conn.commit()
    print("Seed complete: shops, vendors, products, programs, transactions, claims, and KPI preview data loaded.")


if __name__ == "__main__":
    seed_all()
