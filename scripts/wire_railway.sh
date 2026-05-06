#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DATABASE_URL_ARG="${1:-}"

if [ -z "$DATABASE_URL_ARG" ]; then
  echo "Paste your Railway PostgreSQL DATABASE_URL and press Enter:"
  read -r DATABASE_URL_ARG
fi

if [ -z "$DATABASE_URL_ARG" ]; then
  echo "DATABASE_URL cannot be empty."
  exit 1
fi

cat > .env.local <<EOF_ENV
DATABASE_URL="$DATABASE_URL_ARG"
LOG_SQL=0
EOF_ENV

echo "Wrote .env.local"

echo "Installing Node dependencies..."
npm install

echo "Setting up Python virtual environment..."
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r etl/requirements.txt

echo "Resetting and seeding Railway Postgres..."
python etl/reset_and_seed.py

echo "Building Next.js app..."
npm run build

echo "Done. Local test: npm run dev"
echo "Vercel deploy: add DATABASE_URL in Vercel project settings, then run scripts/vercel_deploy.sh"
