import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, withErrorHandling, withAuth } from '@/lib/api-middleware';

export const GET = withErrorHandling(
  withAuth(async (_request, user) => {
    const credentials = await prisma.credential.findMany({
      where: { userId: user.sub },
      orderBy: { issuedAt: 'desc' },
      select: {
        id: true,
        credentialType: true,
        credentialHash: true,
        attributes: true,
        issuerAddress: true,
        issuedAt: true,
        expiresAt: true,
        revokedAt: true,
        blockchainTxHash: true,
      },
    });

    // Map to frontend-compatible format
    const mapped = credentials.map((c: typeof credentials[number]) => ({
      id: c.id,
      userId: user.sub,
      type: c.credentialType.toLowerCase(),
      issueDate: c.issuedAt.toISOString().split('T')[0],
      expiryDate: c.expiresAt?.toISOString().split('T')[0],
      status: c.revokedAt ? 'revoked' : c.expiresAt && c.expiresAt < new Date() ? 'expired' : 'active',
      proofHash: c.credentialHash,
      blockchainTxHash: c.blockchainTxHash || null,
      metadata: c.attributes as Record<string, unknown>,
    }));

    return apiSuccess(mapped);
  })
);
