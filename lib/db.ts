import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and paste your Railway Postgres URL.");
}

const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

export const pool = new Pool({
  connectionString,
  ssl: isLocal ? undefined : { rejectUnauthorized: false },
  max: 5,
});

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (process.env.LOG_SQL === "1") console.log(sql, params);
  const result = await pool.query(sql, params);
  return result.rows as T[];
}
