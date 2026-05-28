// GET /api/verifier/history – Get verification history for a verifier
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, withErrorHandling, withAuth } from '@/lib/api-middleware';

export const GET = withErrorHandling(
  withAuth(async (request, user) => {
    const { searchParams } = request.nextUrl;
    const verifierAddress = searchParams.get('verifierAddress') || user.wallet || null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!verifierAddress) {
      return apiError('Verifier address required', 400);
    }

    const verifications = await prisma.verification.findMany({
      where: { verifierAddress },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        verifierName: true,
        purpose: true,
        revealedAttributes: true,
        riskScore: true,
        riskLevel: true,
        verificationStatus: true,
        blockchainTxHash: true,
        timestamp: true,
      },
    });

    const total = await prisma.verification.count({
      where: { verifierAddress },
    });

    return apiSuccess({
      verifications,
      pagination: { total, limit, offset },
    });
  })
);
