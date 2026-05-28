import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createToken } from '@/lib/auth';
import {
  apiSuccess,
  apiError,
  withErrorHandling,
  rateLimit,
} from '@/lib/api-middleware';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

const limiter = rateLimit(20, 60_000);

// Simple email+password registration schema for MVP
const mvpRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required').max(200),
  walletAddress: z.string().optional(),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { allowed } = limiter(request);
  if (!allowed) return apiError('Too many requests', 429);

  const body = await request.json();
  const parsed = mvpRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation error', 400, parsed.error.flatten().fieldErrors);
  }

  const { email, password, name, walletAddress } = parsed.data;

  // Check email uniqueness
  const emailExists = await prisma.user.findUnique({ where: { email } });
  if (emailExists) return apiError('Email already registered', 409);

  // Generate a placeholder wallet address if not provided
  const finalWallet = walletAddress || `0x${Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2, '0')).join('')}`;

  // Check wallet uniqueness
  const walletExists = await prisma.user.findUnique({ where: { walletAddress: finalWallet } });
  if (walletExists) return apiError('Wallet address already registered', 409);

  // Hash password with bcrypt (cost factor 12)
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user with passwordHash stored directly
  const user = await prisma.user.create({
    data: {
      walletAddress: finalWallet,
      email,
      name,
      passwordHash,
      role: 'USER',
      lastLoginAt: new Date(),
    },
  });

  // Audit log (no password in metadata)
  await prisma.auditLog.create({
    data: {
      eventType: 'USER_REGISTERED',
      userId: user.id,
      metadata: {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      },
    },
  });

  // Generate JWT
  const token = await createToken({
    userId: user.id,
    walletAddress: user.walletAddress,
    role: user.role,
  });

  // Create session
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return apiSuccess(
    {
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    },
    201
  );
});
