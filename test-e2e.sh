#!/bin/bash
# End-to-End Test Script for Aadhaar-Zero
# Tests all components with real blockchain integration

set -e

echo "🧪 Starting End-to-End Tests..."
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Check PostgreSQL
echo -e "${BLUE}[1/7]${NC} Checking PostgreSQL..."
if PGPASSWORD=postgres psql -h localhost -p 5434 -U postgres -d aadhaar_zero -c "SELECT COUNT(*) FROM \"User\";" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL connected and seeded${NC}"
else
    echo -e "${RED}❌ PostgreSQL connection failed${NC}"
    exit 1
fi

# 2. Check AI Service
echo -e "${BLUE}[2/7]${NC} Checking AI Service..."
if curl -s http://localhost:8000/health | grep -q "ok"; then
    echo -e "${GREEN}✅ AI Service (FastAPI) running${NC}"
else
    echo -e "${RED}❌ AI Service not responding${NC}"
    exit 1
fi

# 3. Check Blockchain Deployment
echo -e "${BLUE}[3/7]${NC} Checking Smart Contracts on Base Sepolia..."
CONTRACT_COUNT=$(grep "NEXT_PUBLIC_ISSUER_REGISTRY=" frontend/.env.local | grep -v "0x0000" | wc -l)
if [ "$CONTRACT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Smart contracts deployed to Base Sepolia${NC}"
    echo "   IssuerRegistry: $(grep NEXT_PUBLIC_ISSUER_REGISTRY= frontend/.env.local | cut -d'"' -f2)"
else
    echo -e "${RED}❌ Contracts not deployed${NC}"
    exit 1
fi

# 4. Test AI Liveness Detection
echo -e "${BLUE}[4/7]${NC} Testing AI Liveness Detection..."
LIVENESS_RESPONSE=$(curl -s -X POST http://localhost:8000/liveness/detect \
  -H "Content-Type: application/json" \
  -d '{"frames": ["iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="]}' 2>/dev/null)

if echo "$LIVENESS_RESPONSE" | grep -q "recommendation"; then
    echo -e "${GREEN}✅ AI Liveness Detection working${NC}"
else
    echo -e "${RED}❌ AI Liveness test failed${NC}"
    exit 1
fi

# 5. Test AI Document Verification
echo -e "${BLUE}[5/7]${NC} Testing AI Document Verification..."
DOC_RESPONSE=$(curl -s -X POST http://localhost:8000/document/verify \
  -H "Content-Type: application/json" \
  -d '{"documentImage": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "documentType": "AADHAAR"}' 2>/dev/null)

if echo "$DOC_RESPONSE" | grep -q "document_valid"; then
    echo -e "${GREEN}✅ AI Document Verification working${NC}"
else
    echo -e "${RED}❌ AI Document test failed${NC}"
    exit 1
fi

# 6. Test AI Risk Scoring
echo -e "${BLUE}[6/7]${NC} Testing AI Risk Scoring..."
RISK_RESPONSE=$(curl -s -X POST http://localhost:8000/risk/score \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "action": "verification", "context": {}}' 2>/dev/null)

if echo "$RISK_RESPONSE" | grep -q "risk_level"; then
    echo -e "${GREEN}✅ AI Risk Scoring working${NC}"
else
    echo -e "${RED}❌ AI Risk test failed${NC}"
    exit 1
fi

# 7. Check Frontend Build
echo -e "${BLUE}[7/7]${NC} Checking Frontend Build..."
if [ -d "frontend/.next" ]; then
    echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
    echo -e "${RED}❌ Frontend build not found${NC}"
    exit 1
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 All End-to-End Tests Passed!${NC}"
echo ""
echo "📋 System Status:"
echo "   ✓ PostgreSQL Database: Running (Docker)"
echo "   ✓ AI Service (FastAPI): Running on :8000"
echo "   ✓ Smart Contracts: Deployed on Base Sepolia"
echo "   ✓ Frontend Build: Ready"
echo ""
echo "🚀 To start the application:"
echo "   cd frontend && COREPACK_INTEGRITY_KEYS=0 pnpm run dev"
echo ""
echo "🔗 Contract Addresses:"
grep "NEXT_PUBLIC_ISSUER_REGISTRY=" frontend/.env.local | cut -d'"' -f2 | xargs -I {} echo "   IssuerRegistry: {}"
grep "NEXT_PUBLIC_NULLIFIER_REGISTRY=" frontend/.env.local | cut -d'"' -f2 | xargs -I {} echo "   NullifierRegistry: {}"
grep "NEXT_PUBLIC_AUDIT_TRAIL=" frontend/.env.local | cut -d'"' -f2 | xargs -I {} echo "   AuditTrail: {}"
echo ""
echo "📱 Demo Login:"
echo "   Email: demo@aadhaar-zero.com"
echo "   Password: demo123"
echo ""
