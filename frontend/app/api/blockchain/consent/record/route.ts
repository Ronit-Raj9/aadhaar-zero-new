// POST /api/blockchain/consent/record – Record consent on-chain
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, withErrorHandling, withAuth, validateBody } from '@/lib/api-middleware';
import { recordConsentSchema } from '@/lib/validations';
import { mockBlockchain } from '@/lib/services';
import * as blockchain from '@/lib/blockchain';
import type { Hex } from 'viem';

const MOCK_BLOCKCHAIN = process.env.MOCK_BLOCKCHAIN === 'true';

export const POST = withErrorHandling(
  withAuth(async (request, user) => {
    const body = await request.json();
    const validation = validateBody(recordConsentSchema, body);
    if ('error' in validation) return validation.error;

    const { consentHash, attributesRoot } = validation.data;

    let txHash: string | null = null;
    let blockNumber: number | null = null;

    if (MOCK_BLOCKCHAIN) {
      const result = await mockBlockchain.recordConsent(consentHash, attributesRoot);
      txHash = result.txHash;
      blockNumber = result.blockNumber;
    } else {
      // Real blockchain – use ConsentRegistry
      const hash = await blockchain.recordConsent(
        consentHash as Hex,
        attributesRoot as Hex,
        user.wallet as Hex,
        ('0x' + '0'.repeat(64)) as Hex // default purpose hash
      );
      txHash = hash;
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        eventType: 'CONSENT_RECORDED',
        userId: user.sub,
        metadata: { consentHash, attributesRoot, txHash },
      },
    });

    return apiSuccess({
      success: true,
      consentHash,
      txHash,
      blockNumber,
      timestamp: new Date().toISOString(),
      mockMode: MOCK_BLOCKCHAIN,
    });
  })
);
