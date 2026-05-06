#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${1:-ccg_rebate_demo}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v createdb >/dev/null 2>&1; then
  echo "createdb not found. Install PostgreSQL locally or use Railway and scripts/wire_railway.sh."
  exit 1
fi

createdb "$DB_NAME" 2>/dev/null || true
cat > .env.local <<EOF_ENV
DATABASE_URL="postgresql://localhost:5432/${DB_NAME}"
LOG_SQL=0
EOF_ENV

python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r etl/requirements.txt
npm install
python etl/reset_and_seed.py
npm run build

echo "Local database ready. Run npm run dev."
