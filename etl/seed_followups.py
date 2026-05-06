from __future__ import annotations

import random
from psycopg2.extras import execute_values

from db_utils import connect

random.seed(5252)


def seed_followups() -> None:
    print("Seeding BI follow-up feedback loop records...")
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT transaction_id, program_id, expected_rebate_amount
                FROM vw_rebate_gold
                WHERE leakage_flag = TRUE
                ORDER BY expected_rebate_amount DESC
                LIMIT 2500
            """)
            candidates = cur.fetchall()
            rows = []
            owners = ["BI Analyst East", "BI Analyst West", "Performance Mgmt", "Vendor Programs", "Finance Ops"]
            for transaction_id, program_id, amount in candidates:
                if random.random() > 0.42:
                    continue
                status = random.choices(
                    ["new", "in_progress", "claimed", "unclaimable", "false_positive"],
                    weights=[0.18, 0.34, 0.22, 0.18, 0.08],
                )[0]
                notes = {
                    "new": "Newly flagged; needs validation against vendor statement.",
                    "in_progress": "BI team reviewing supporting transaction detail.",
                    "claimed": "Claim submitted or corrected after review.",
                    "unclaimable": "Business confirmed item is not claimable under current program terms.",
                    "false_positive": "Rule mismatch found; useful label for future tuning.",
                }[status]
                rows.append((transaction_id, program_id, status, random.choice(owners), notes))
            execute_values(cur, """
                INSERT INTO fact_bi_followup
                (transaction_id, program_id, followup_status, owner, notes)
                VALUES %s
                ON CONFLICT (transaction_id, program_id) DO UPDATE
                SET followup_status = EXCLUDED.followup_status,
                    owner = EXCLUDED.owner,
                    notes = EXCLUDED.notes,
                    updated_at = NOW()
            """, rows, page_size=1000)
        conn.commit()
    print(f"Feedback loop records loaded: {len(rows)}")


if __name__ == "__main__":
    seed_followups()
