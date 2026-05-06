# CCG Rebate Recovery Command Center

A synthetic, interview-ready data product for the Certified Collision Group Data Engineer Round 2 conversation.

This project builds a small version of the rebate leakage workflow discussed in prep:

```text
Synthetic NetSuite-style transactions
  -> Postgres source/silver tables
  -> SQL gold eligibility views
  -> Next.js dashboard
  -> BI action list + data-quality trust view + feedback loop
```

It uses **Python + PostgreSQL + Next.js/React + Vercel + Railway Postgres**.

## What this demonstrates

- Transaction grain awareness: every leakage flag traces to transaction/program grain.
- Eligibility logic: qualifying vendor, SKU/category, active program window, claim status, returns/voids, maturity threshold.
- Data-quality discipline: duplicate checks, row counts, invalid program windows, immature transaction exclusion, vendor crosswalk usage.
- Operator workflow: the output is a prioritized BI action list, not just a chart.
- Future-state mapping: the local/Railway demo maps cleanly to ADF / ADLS / Power BI.

## Fastest path

```bash
unzip ccg-rebate-recovery-command-center.zip
cd ccg-rebate-recovery-command-center
bash scripts/wire_railway.sh "postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require"
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Pages

- `/` — Executive leakage summary
- `/action-list` — BI work queue
- `/data-quality` — quality checks and trust layer
- `/cohort-preview` — optional Georgiana-facing affiliate performance cohort preview
- `/architecture` — architecture and production mapping

## Commands

```bash
# install dependencies and create .env.local template
bash scripts/bootstrap.sh

# wire a Railway database, seed it, and build the app
bash scripts/wire_railway.sh "YOUR_RAILWAY_DATABASE_URL"

# reset and reseed the current DATABASE_URL
npm run db:setup

# run quality checks in terminal
npm run db:quality

# run dev server
npm run dev

# production build
npm run build

# deploy via Vercel CLI
npm run deploy:vercel
```

## Production mapping to CCG

| Demo artifact | Production CCG equivalent |
|---|---|
| Python seed script | NetSuite REST / SuiteAnalytics Connect extraction |
| Railway Postgres | ADLS Gen2 bronze + Azure SQL/Synapse/Databricks |
| SQL views | Silver/gold transformations orchestrated by ADF |
| Next.js dashboard | Power BI semantic model and BI action workflow |
| fact_bi_followup | BI analyst feedback labels: claimed / unclaimable / false-positive |

## Interview demo script

Use this 20-second opener:

> I brought a small synthetic artifact because I wanted to make the Round 1 rebate leakage problem concrete. I did not use any CCG data. It models NetSuite-style transactions, vendor-program eligibility, claim status, the 60-day maturity rule, and a BI action list. The goal is not to show a pretty dashboard; it is to show how I think through grain, eligibility logic, quality gates, and the operator workflow after a flag is produced.

Then walk in this order:

1. `/architecture` — 60 seconds
2. `/data-quality` — 45 seconds
3. `/` — 45 seconds
4. `/action-list` — 60 seconds
5. ADF/Power BI production mapping — 45 seconds

## What this intentionally does not include

- No real CCG data.
- No real NetSuite connector.
- No authentication or shop-level row-level security.
- No production Power BI semantic model.
- No final Azure Data Factory pipeline.

Those are intentional. The artifact is a thin production slice to prove the thinking pattern, not a fake production system.
