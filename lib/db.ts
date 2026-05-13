import { Pool } from "pg";

// Deferred init: don't throw on module import. The R3 seed branch renders
// every page from static fixtures in lib/queries.ts; db.ts is only reached
// if a server action actually fires (status pill click, etc.), which won't
// happen in the panel demo path.
let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and paste your Railway Postgres URL."
    );
  }
  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");
  pool = new Pool({
    connectionString,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
    max: 5,
  });
  return pool;
}

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (process.env.LOG_SQL === "1") console.log(sql, params);
  const result = await getPool().query(sql, params);
  return result.rows as T[];
}
