from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable

import psycopg2
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_environment() -> str:
    """Load .env.local or .env and return DATABASE_URL."""
    load_dotenv(PROJECT_ROOT / ".env.local")
    load_dotenv(PROJECT_ROOT / ".env")
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL is required. Copy .env.example to .env.local and paste your Railway Postgres URL."
        )
    return database_url


def connect():
    database_url = load_environment()
    return psycopg2.connect(database_url)


def run_sql_file(path: str | Path) -> None:
    sql_path = Path(path)
    if not sql_path.is_absolute():
        sql_path = PROJECT_ROOT / sql_path
    if not sql_path.exists():
        raise FileNotFoundError(sql_path)

    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql_path.read_text())
        conn.commit()


def print_query_results(path: str | Path) -> None:
    sql_path = Path(path)
    if not sql_path.is_absolute():
        sql_path = PROJECT_ROOT / sql_path
    statements = [stmt.strip() for stmt in sql_path.read_text().split(";") if stmt.strip()]
    with connect() as conn:
        with conn.cursor() as cur:
            for idx, statement in enumerate(statements, start=1):
                print(f"\n--- Query {idx} ---")
                cur.execute(statement)
                if cur.description:
                    columns = [desc[0] for desc in cur.description]
                    print(" | ".join(columns))
                    print("-" * min(120, sum(len(c) + 3 for c in columns)))
                    for row in cur.fetchall():
                        print(" | ".join(str(value) for value in row))
                else:
                    print(f"Rows affected: {cur.rowcount}")
