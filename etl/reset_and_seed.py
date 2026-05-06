from __future__ import annotations

from db_utils import print_query_results, run_sql_file
from seed_followups import seed_followups
from seed_synthetic_data import seed_all


def main() -> None:
    print("\n[1/5] Recreating schema...")
    run_sql_file("sql/01_schema.sql")

    print("\n[2/5] Loading synthetic source data...")
    seed_all()

    print("\n[3/5] Creating gold/dashboard views...")
    run_sql_file("sql/02_gold_views.sql")

    print("\n[4/5] Adding operator feedback-loop records...")
    seed_followups()

    print("\n[5/5] Running quality checks...")
    print_query_results("sql/03_quality_checks.sql")

    print("\nDone. Run `npm run dev` and open http://localhost:3000")


if __name__ == "__main__":
    main()
