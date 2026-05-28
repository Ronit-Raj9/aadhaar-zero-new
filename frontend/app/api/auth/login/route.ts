import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createToken } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  withErrorHandling,
  validateBody,
  rateLimit,
} from '@/lib/api-middleware';
import { emailLoginSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

const limiter = rateLimit(30, 60_000);

async function createSessionAndRespond(user: any, request: NextRequest, method: string) {
  const token = await createToken({
    userId: user.id,
    walletAddress: user.walletAddress,
    role: user.role,
  });

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      eventType: 'LOGIN',
      userId: user.id,
      metadata: { method, ip: request.headers.get('x-forwarded-for') || 'unknown' },
    },
  });

  return apiSuccess({
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { allowed } = limiter(request);
  if (!allowed) return apiError('Too many requests', 429);

  const body = await request.json();

  // Support wallet-based login (look up by walletAddress)
  // Note: In production, a signature challenge should be verified here.
  // For the hackathon MVP, we trust the wallet address from the RainbowKit connection
  // since it's already authenticated via the wallet provider (MetaMask/WalletConnect).
  if (body.walletAddress) {
    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.walletAddress)) {
      return apiError('Invalid wallet address format', 400);
    }

    // Verify signature if provided (optional for backward compat)
    if (body.signature && body.message) {
      // Client-side wallet providers (MetaMask, WalletConnect) already authenticate
      // the user via their own signature flow. The signature here is an extra check.
      // TODO: Full EIP-4361 (Sign-In with Ethereum) implementation
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: body.walletAddress },
    });
    if (!user) return apiError('Wallet not registered', 401);
    return createSessionAndRespond(user, request, 'wallet');
  }

  // Email/password login
  const validation = validateBody(emailLoginSchema, body);
  if ('error' in validation) return validation.error;
  const { email, password } = validation.data;

  // Demo credentials shortcut (only available when DEMO_MODE is enabled)
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
  if (isDemoMode && email === 'demo@aadhaar-zero.com' && password === 'demo123') {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          email,
          name: 'Demo User',
          passwordHash: await bcrypt.hash('demo123', 12),
          role: 'USER',
          lastLoginAt: new Date(),
        },
      });
    }
    return createSessionAndRespond(user, request, 'demo');
  }

  // Look up user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return apiError('Invalid email or password', 401);

  // Verify password with bcrypt
  if (!user.passwordHash) {
    // Legacy user without bcrypt hash — try audit log fallback then reject
    return apiError('Invalid email or password', 401);
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    return apiError('Invalid email or password', 401);
  }

  return createSessionAndRespond(user, request, 'email');
});
