// POST /api/blockchain/nullifier/mark – Mark nullifier as used on-chain
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, withErrorHandling, withAuth, validateBody } from '@/lib/api-middleware';
import { markNullifierSchema } from '@/lib/validations';
import { markNullifier, checkNullifier } from '@/lib/services';

export const POST = withErrorHandling(
  withAuth(async (request, user) => {
    const body = await request.json();
    const validation = validateBody(markNullifierSchema, body);
    if ('error' in validation) return validation.error;

    const { nullifier, verifierAddress, purposeHash } = validation.data;

    // Pre-check
    const alreadyUsed = await checkNullifier(nullifier);
    if (alreadyUsed) return apiError('Nullifier already used', 409);

    // Mark on-chain
    const result = await markNullifier(nullifier, verifierAddress, purposeHash);

    // Cache in DB
    try {
      await prisma.nullifierCache.upsert({
        where: { nullifier },
        create: {
          nullifier,
          isUsed: true,
          verifierAddress,
          usedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        update: { isUsed: true, usedAt: new Date() },
      });
    } catch {}

    return apiSuccess({
      success: true,
      txHash: result.txHash,
      blockNumber: result.blockNumber ?? null,
      gasUsed: result.gasUsed ?? null,
      mockMode: process.env.MOCK_BLOCKCHAIN === 'true',
    });
  })
);
