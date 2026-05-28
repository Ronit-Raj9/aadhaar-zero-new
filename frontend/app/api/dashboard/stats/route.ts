import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, withErrorHandling, withAuth } from '@/lib/api-middleware';

export const GET = withErrorHandling(
  withAuth(async (_request, user) => {
    // Aggregate real stats from database
    const [
      totalCredentials,
      activeVerifications,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.credential.count({ where: { userId: user.sub, revokedAt: null } }),
      prisma.verification.count({
        where: {
          credential: { userId: user.sub },
          verificationStatus: 'PENDING',
        },
      }),
      prisma.auditLog.findMany({
        where: { userId: user.sub },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          id: true,
          eventType: true,
          metadata: true,
          timestamp: true,
        },
      }),
    ]);

    // Calculate privacy score (higher = better privacy practices)
    const totalVerifications = await prisma.verification.count({
      where: { credential: { userId: user.sub } },
    });
    const selectiveDisclosures = await prisma.verification.count({
      where: {
        credential: { userId: user.sub },
        verificationStatus: 'SUCCESS',
      },
    });
    const privacyScore = totalVerifications > 0
      ? Math.min(95, 60 + Math.round((selectiveDisclosures / totalVerifications) * 35))
      : 85;

    const recentActivity = recentAuditLogs.map((log) => ({
      id: log.id,
      type: log.eventType.toLowerCase(),
      description: describeEvent(log.eventType, log.metadata as Record<string, unknown>),
      timestamp: log.timestamp.toISOString(),
      status: 'completed',
    }));

    return apiSuccess({
      totalCredentials,
      activeVerifications,
      privacyScore,
      recentActivity,
    });
  })
);

function describeEvent(type: string, metadata: Record<string, unknown> | null): string {
  switch (type) {
    case 'CREDENTIAL_ISSUED':
      return `${(metadata?.credentialType as string) || 'Credential'} credential issued`;
    case 'VERIFICATION':
      return `Verification by ${(metadata?.verifierAddress as string)?.slice(0, 8) || 'verifier'}...`;
    case 'REVOCATION':
      return 'Credential revoked';
    case 'CONSENT_RECORDED':
      return 'Consent recorded on-chain';
    case 'USER_REGISTERED':
      return 'Account created';
    case 'LOGIN':
      return 'Signed in';
    case 'LOGOUT':
      return 'Signed out';
    default:
      return type;
  }
}
