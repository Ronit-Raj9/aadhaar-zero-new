#!/bin/bash
# ============================================
# Aadhaar-Zero Development Startup Script
# ============================================
# This script starts all required services:
#   1. PostgreSQL (Docker)
#   2. AI Microservice (FastAPI)
#   3. Next.js Frontend
# ============================================

echo "🚀 Starting Aadhaar-Zero Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ─────────────────────────────────────────────
# 1. Start PostgreSQL
# ─────────────────────────────────────────────
echo -e "${BLUE}[1/3]${NC} Checking PostgreSQL..."

if docker ps | grep -q aadhaar-postgres; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}⚠️  Starting PostgreSQL..."
    if docker ps -a | grep -q aadhaar-postgres; then
        docker start aadhaar-postgres 2>/dev/null
    else
        docker run -d \
          --name aadhaar-postgres \
          -e POSTGRES_USER=postgres \
          -e POSTGRES_PASSWORD=postgres \
          -e POSTGRES_DB=aadhaar_zero \
          -p 5434:5432 \
          -v aadhaar-postgres-data:/var/lib/postgresql/data \
          postgres:16-alpine
    fi
    sleep 3

    # Verify PostgreSQL started
    if PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d aadhaar_zero -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL started and ready${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL starting... (may need a few more seconds)${NC}"
    fi
fi

# ─────────────────────────────────────────────
# 2. Start AI Service
# ─────────────────────────────────────────────
echo ""
echo -e "${BLUE}[2/3]${NC} Checking AI Service..."

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AI Service is running${NC}"
else
    echo -e "${YELLOW}⚠️  AI Service not running. Starting in background..."
    cd python_backend
    source .venv/bin/activate
    nohup uvicorn main:app --host 0.0.0.0 --port 8000 > ../ai-service.log 2>&1 &
    AI_PID=$!
    echo $AI_PID > ../ai-service.pid
    cd ..
    sleep 5

    # Verify AI service started
    if curl -s http://localhost:8000/health | grep -q "ok"; then
        echo -e "${GREEN}✅ AI Service started (PID: $AI_PID)${NC}"
    else
        echo -e "${YELLOW}⚠️  AI Service starting... (check ai-service.log for details)${NC}"
    fi
fi

# ─────────────────────────────────────────────
# 3. Start Frontend
# ─────────────────────────────────────────────
echo ""
echo -e "${BLUE}[3/3]${NC} Starting Next.js development server..."
echo ""
echo -e "${GREEN}🎉 All background services ready!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Quick Reference:"
echo ""
echo "   Frontend:  http://localhost:3000"
echo "   AI API:    http://localhost:8000"
echo "   DB:        localhost:5434"
echo ""
echo "🔐 Demo Login:"
echo "   Email:    demo@aadhaar-zero.com"
echo "   Password: demo123"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd frontend
COREPACK_INTEGRITY_KEYS=0 pnpm run dev
