# Deployment guide: Railway Postgres + Vercel

## Railway

1. Create a new Railway project.
2. Add a PostgreSQL service.
3. Copy the external `DATABASE_URL`.
4. Run:

```bash
bash scripts/wire_railway.sh "YOUR_DATABASE_URL"
```

The database will be reset and seeded. This is expected. Do not run against a database that contains anything valuable.

## Vercel

Push to GitHub:

```bash
git init
git add .
git commit -m "Build CCG rebate recovery command center"
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/ccg-rebate-recovery-command-center.git
git push -u origin main
```

Then either import through Vercel UI or run:

```bash
npm run deploy:vercel
```

## Required environment variable

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require
```

## Notes

- The Next.js app uses server components and connects directly to Postgres via `pg`.
- In production, SSL is enabled automatically unless the connection string is localhost.
- Railway DB is used only as the backend store for the demo. Production CCG would likely move raw landing into ADLS and orchestrate via ADF.
