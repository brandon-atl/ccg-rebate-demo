from __future__ import annotations

import sys
from db_utils import print_query_results, run_sql_file


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("Usage: python etl/run_sql.py sql/03_quality_checks.sql [--execute-only]")
    path = sys.argv[1]
    if "--execute-only" in sys.argv:
        run_sql_file(path)
    else:
        print_query_results(path)


if __name__ == "__main__":
    main()
