#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "== CCG Rebate Recovery bootstrap =="

echo "Checking Node..."
node --version >/dev/null
npm --version >/dev/null

echo "Checking Python..."
python3 --version >/dev/null

if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example. Paste your Railway DATABASE_URL into it before seeding."
fi

echo "Installing Node dependencies..."
npm install

echo "Creating Python virtual environment..."
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r etl/requirements.txt

echo "Bootstrap complete. Next: edit .env.local, then run: npm run db:setup && npm run dev"
