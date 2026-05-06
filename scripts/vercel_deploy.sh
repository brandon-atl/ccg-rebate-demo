#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f ".env.local" ]; then
  echo ".env.local is missing. Run scripts/wire_railway.sh first."
  exit 1
fi

source .env.local || true

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not found in environment. Add it to .env.local."
  exit 1
fi

echo "This script uses the Vercel CLI. You may be prompted to login/link a project."
echo "Setting DATABASE_URL in Vercel environment..."
printf "%s" "$DATABASE_URL" | npx vercel env add DATABASE_URL production || true
printf "%s" "$DATABASE_URL" | npx vercel env add DATABASE_URL preview || true

echo "Deploying to Vercel production..."
npx vercel --prod
