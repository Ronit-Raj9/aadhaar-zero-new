# 🎯 Aadhaar-Zero - Quick Reference

## 🚀 Start Development Server
```bash
./start-dev.sh
```
Opens: http://localhost:3000

## 🔐 Demo Login
- **Email:** demo@aadhaar-zero.com
- **Password:** demo123

## 📦 Contract Addresses (Base Sepolia)

```
IssuerRegistry:     0x82D1E6236e668B67D9924Aab4Def1b41AEBC89Cb
NullifierRegistry:  0x5b0662632D025916525b3b6cDDc08fc32A727bd5
ConsentRegistry:    0x1f44E59656dBeF37aEE621b7872260cb2d16F02F
RevocationRegistry: 0xDa0d45db71481a540b444a33C424B48Be78657EF
VerifierRegistry:   0x566d75ECFdEdDE310D04036ce884cb816e3685Bc
AuditTrail:         0x0afEffec732abC3aa5d3291c6254f1D107e7C80B
```

## 🧪 Run Tests
```bash
./test-e2e.sh
```

## 🐳 Docker Commands

### PostgreSQL
```bash
# Start
docker start aadhaar-postgres

# Stop
docker stop aadhaar-postgres

# View logs
docker logs aadhaar-postgres

# Connect
PGPASSWORD=postgres psql -h localhost -U postgres -d aadhaar_zero
```

## 🤖 AI Service

### Start
```bash
cd python_backend
source .venv/bin/activate
./cli dev
```

### Health Check
```bash
curl http://localhost:8000/health
```

## 🔧 Frontend Commands

```bash
cd frontend

# Development
COREPACK_INTEGRITY_KEYS=0 pnpm run dev

# Build
COREPACK_INTEGRITY_KEYS=0 pnpm run build

# Lint
pnpm run lint

# Prisma
npx prisma studio          # Open database GUI
npx prisma db push         # Push schema changes
npx tsx prisma/seed.ts     # Reseed database
```

## 📊 Service URLs

- **Frontend:** http://localhost:3000
- **AI Service:** http://localhost:8000
- **PostgreSQL:** localhost:5432
- **BaseScan:** https://sepolia.basescan.org/

## 🌐 Important Pages

- `/landing` - Landing page with features
- `/login` - Demo login
- `/dashboard` - User dashboard
- `/enroll/step1` - Start enrollment
- `/verify` - Verifier portal

## 🔑 Wallet Info

- **Deployer:** 0x0328FB51e6C4fCfC57824590D0Ee2Ac62d9BB2BB
- **Network:** Base Sepolia (Chain ID: 84532)
- **RPC:** https://sepolia.base.org

## 📝 Environment Flags

```bash
# In frontend/.env.local
MOCK_BLOCKCHAIN="false"    # Use real blockchain
MOCK_AI="false"           # Use real AI service
NEXT_PUBLIC_DEMO_MODE="false"  # Disable demo mode
```

## 🆘 Troubleshooting

### Frontend build fails
```bash
cd frontend
rm -rf .next node_modules/.cache
COREPACK_INTEGRITY_KEYS=0 pnpm install
COREPACK_INTEGRITY_KEYS=0 pnpm run build
```

### PostgreSQL connection error
```bash
docker restart aadhaar-postgres
sleep 3
PGPASSWORD=postgres psql -h localhost -U postgres -c "SELECT 1;"
```

### AI service not responding
```bash
cd python_backend
pkill -f uvicorn
source .venv/bin/activate
./cli dev
```

## 📁 Key Files

- `DEPLOYMENT-COMPLETE.md` - Full deployment documentation
- `test-e2e.sh` - End-to-end test suite
- `start-dev.sh` - Quick start script
- `frontend/.env.local` - Frontend environment variables
- `blockchain/.env` - Blockchain deployment config
- `python_backend/main.py` - AI service

## 🎊 Status

✅ All systems operational  
✅ 6/6 contracts deployed  
✅ Database seeded  
✅ All tests passing  
🚀 **DEMO READY**
