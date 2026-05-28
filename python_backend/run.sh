#!/usr/bin/env bash
# ─────────────────────────────────────────
# Aadhaar-Zero AI Service — start script
# ─────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

VENV_DIR=".venv"

# Create venv if missing
if [ ! -d "$VENV_DIR" ]; then
  echo "📦 Creating Python virtual environment …"
  python3 -m venv "$VENV_DIR"
fi

# Activate
# shellcheck disable=SC1091
source "$VENV_DIR/bin/activate"

# Install / upgrade deps
echo "📦 Installing dependencies …"
pip install --upgrade pip -q
pip install -r requirements.txt -q

# Optional env vars
export AI_SERVICE_API_KEY="${AI_SERVICE_API_KEY:-}"
export LOG_LEVEL="${LOG_LEVEL:-INFO}"

echo ""
echo "🚀 Starting Aadhaar-Zero AI Service on http://localhost:8000"
echo "   Docs:   http://localhost:8000/docs"
echo "   Health: http://localhost:8000/health"
echo ""

exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
