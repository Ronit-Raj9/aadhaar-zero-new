// POST /api/user/erase – DPDP Act Section 12(3) Right to Erasure
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, withErrorHandling, withAuth } from '@/lib/api-middleware';
import { revokeCredentialOnChain } from '@/lib/blockchain';
import { keccak256, encodePacked } from 'viem';

export const runtime = 'nodejs';

export const POST = withErrorHandling(
  withAuth(async (request, user) => {
    const body = await request.json().catch(() => ({}));
    const confirmErase = body.confirmErase === true;

    if (!confirmErase) {
      return apiError('Please confirm erasure by setting confirmErase: true', 400);
    }

    // 1. Revoke all active credentials (on-chain + DB)
    const activeCredentials = await prisma.credential.findMany({
      where: { userId: user.sub, revokedAt: null },
      select: { id: true, credentialHash: true },
    });

    // Attempt on-chain revocation for each credential (best-effort)
    for (const cred of activeCredentials) {
      try {
        await revokeCredentialOnChain(cred.id, 'DPDP_ERASURE');
      } catch (e) {
        console.warn(`On-chain revocation failed for ${cred.id}:`, e);
      }
    }

    const revokedCredentials = await prisma.credential.updateMany({
      where: { userId: user.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // 2. Delete all sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: user.sub },
    });

    // 3. Delete device fingerprints
    const deletedFingerprints = await prisma.deviceFingerprint.deleteMany({
      where: { userId: user.sub },
    });

    // 4. Delete risk profiles
    const deletedRiskProfiles = await prisma.riskProfile.deleteMany({
      where: { userId: user.sub },
    });

    // 5. Nullify user PII (keep wallet address for audit trail integrity)
    await prisma.user.update({
      where: { id: user.sub },
      data: {
        name: '[ERASED]',
        email: null,
        passwordHash: null,
        aadhaarHash: null,
        metadata: {},
      },
    });

    // 6. Audit log the erasure event (required by DPDP for accountability)
    await prisma.auditLog.create({
      data: {
        eventType: 'DATA_ERASURE',
        userId: user.sub,
        metadata: {
          revokedCredentials: revokedCredentials.count,
          deletedSessions: deletedSessions.count,
          deletedFingerprints: deletedFingerprints.count,
          deletedRiskProfiles: deletedRiskProfiles.count,
          erasedAt: new Date().toISOString(),
          dpdpSection: '12(3)',
        },
      },
    });

    return apiSuccess({
      erased: true,
      summary: {
        revokedCredentials: revokedCredentials.count,
        deletedSessions: deletedSessions.count,
        deletedFingerprints: deletedFingerprints.count,
        deletedRiskProfiles: deletedRiskProfiles.count,
        userPIINullified: true,
      },
      message: 'All personal data has been erased per DPDP Act Section 12(3). Audit trail preserved for accountability.',
    });
  })
);
