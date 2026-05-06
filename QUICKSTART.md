# Quickstart

## 1. Create a Railway Postgres database

Create a Railway project and add PostgreSQL. Copy the external connection string. It usually looks like:

```text
postgresql://postgres:PASSWORD@HOST:PORT/railway
```

Add `?sslmode=require` if Railway does not include it:

```text
postgresql://postgres:PASSWORD@HOST:PORT/railway?sslmode=require
```

## 2. Wire, seed, and build

```bash
bash scripts/wire_railway.sh "postgresql://postgres:PASSWORD@HOST:PORT/railway?sslmode=require"
```

This will:

1. Write `.env.local`
2. Install Node dependencies
3. Create a Python virtual environment
4. Install Python dependencies
5. Drop/recreate schema in Railway Postgres
6. Seed synthetic CCG-style data
7. Create SQL gold views
8. Add BI feedback-loop rows
9. Run quality checks
10. Build the Next.js app

## 3. Run locally

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 4. Deploy to Vercel

Option A: Use the script.

```bash
npm run deploy:vercel
```

Option B: Manual Vercel UI.

1. Push this repo to GitHub.
2. Import repo in Vercel.
3. Add `DATABASE_URL` as a Vercel environment variable.
4. Deploy.

## 5. If the live demo breaks

Open the SQL and README. Say:

> I have the repo and screenshots because I did not want the conversation to depend on live hosting. The important part is the model and rule logic; I can walk the schema and gold view directly.
