// POST /api/auth/logout – Invalidate session
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/api-middleware';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await getUserFromRequest(request);
  if (!user) return apiError('Not authenticated', 401);

  // Delete all sessions for this user
  await prisma.session.deleteMany({ where: { userId: user.sub } });

  // Audit log
  await prisma.auditLog.create({
    data: {
      eventType: 'LOGOUT',
      userId: user.sub,
    },
  });

  return apiSuccess({ message: 'Logged out successfully' });
});
