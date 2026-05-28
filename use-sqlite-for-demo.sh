#!/bin/bash
# Quick demo setup using SQLite (no PostgreSQL password needed)

echo "Switching to SQLite for demo..."

# Backup original schema
cp frontend/prisma/schema.prisma frontend/prisma/schema.prisma.postgres.bak

# Update to SQLite
sed -i 's/provider = "postgresql"/provider = "sqlite"/' frontend/prisma/schema.prisma
sed -i 's|url      = env("DATABASE_URL")|url      = "file:./dev.db"|' frontend/prisma/schema.prisma

# Update .env files
echo 'DATABASE_URL="file:./prisma/dev.db"' > frontend/.env
echo 'DATABASE_URL="file:./prisma/dev.db"' >> frontend/.env.local

cd frontend
COREPACK_INTEGRITY_KEYS=0 npx prisma generate
COREPACK_INTEGRITY_KEYS=0 npx prisma db push --skip-generate

echo ""
echo "✅ SQLite database setup complete!"
echo "⚠️  To revert to PostgreSQL later, restore: frontend/prisma/schema.prisma.postgres.bak"
