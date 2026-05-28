// GET /api/auth/session – Get current session / user info
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/api-middleware';

export const GET = withErrorHandling(async (request: NextRequest) => {
  const payload = await getUserFromRequest(request);
  if (!payload) return apiError('Not authenticated', 401);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      walletAddress: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) return apiError('User not found or deactivated', 404);

  return apiSuccess({ user });
});
