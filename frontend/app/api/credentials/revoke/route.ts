// POST /api/credentials/revoke – Revoke a credential (DB + on-chain)
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, withErrorHandling, withAuth, validateBody } from '@/lib/api-middleware';
import { revokeCredentialSchema } from '@/lib/validations';
import { revokeCredentialOnChain } from '@/lib/blockchain';

export const POST = withErrorHandling(
  withAuth(async (request, user) => {
    const body = await request.json();
    const { credentialId } = body;

    if (!credentialId) return apiError('credentialId is required', 400);

    const validation = validateBody(revokeCredentialSchema, body);
    if ('error' in validation) return validation.error;

    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
    });

    if (!credential) return apiError('Credential not found', 404);
    if (credential.userId !== user.sub && user.role !== 'ADMIN' && user.role !== 'ISSUER') {
      return apiError('Forbidden – only credential owner, issuer, or admin can revoke', 403);
    }
    if (credential.revokedAt) return apiError('Credential already revoked', 409);

    const reason = validation.data.reason || 'User requested revocation';

    // 1. Revoke on-chain first
    let txHash: string | null = null;
    try {
      txHash = await revokeCredentialOnChain(credentialId, reason);
    } catch (err) {
      console.error('On-chain revocation failed:', err);
      // Continue with DB revocation even if on-chain fails
    }

    // 2. Revoke in database
    const updated = await prisma.credential.update({
      where: { id: credentialId },
      data: {
        revokedAt: new Date(),
        revocationReason: reason,
        blockchainTxHash: txHash || undefined,
      },
    });

    // 3. Audit log
    await prisma.auditLog.create({
      data: {
        eventType: 'REVOCATION',
        userId: user.sub,
        credentialId,
        metadata: {
          reason,
          revokedBy: user.sub,
          blockchainTxHash: txHash,
          onChainSuccess: !!txHash,
        },
      },
    });

    return apiSuccess({
      id: updated.id,
      revokedAt: updated.revokedAt?.toISOString(),
      revocationReason: updated.revocationReason,
      blockchainTxHash: txHash,
    });
  })
);
