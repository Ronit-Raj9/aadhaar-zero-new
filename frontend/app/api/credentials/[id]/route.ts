// GET /api/credentials/[id] – Get single credential detail
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, withErrorHandling, withAuth } from '@/lib/api-middleware';

export const GET = withErrorHandling(
  withAuth(async (request, user, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    if (!id) return apiError('Credential ID required', 400);

    const credential = await prisma.credential.findUnique({
      where: { id },
      include: {
        verifications: {
          orderBy: { timestamp: 'desc' },
          take: 10,
          select: {
            id: true,
            verifierName: true,
            purpose: true,
            verificationStatus: true,
            riskScore: true,
            riskLevel: true,
            timestamp: true,
          },
        },
      },
    });

    if (!credential) return apiError('Credential not found', 404);
    if (credential.userId !== user.sub && user.role !== 'ADMIN') {
      return apiError('Forbidden', 403);
    }

    // Map to frontend-compatible Credential shape
    const attrs = credential.attributes as Record<string, unknown>;
    return apiSuccess({
      id: credential.id,
      userId: credential.userId,
      type: credential.credentialType.toLowerCase(),
      issueDate: credential.issuedAt.toISOString().split('T')[0],
      expiryDate: credential.expiresAt?.toISOString().split('T')[0],
      status: credential.revokedAt
        ? 'revoked'
        : credential.expiresAt && credential.expiresAt < new Date()
        ? 'expired'
        : 'active',
      proofHash: credential.credentialHash,
      blockchainTxHash: credential.blockchainTxHash || null,
      metadata: {
        ...(attrs || {}),
        // Ensure firstName/lastName/dateOfBirth exist for detail & share pages
        firstName: attrs?.name as string || attrs?.firstName as string || undefined,
        lastName: attrs?.lastName as string || undefined,
        dateOfBirth: attrs?.dob as string || attrs?.dateOfBirth as string || undefined,
        address: attrs?.address as string || undefined,
        gender: attrs?.gender as string || undefined,
      },
      // Extra fields for detail page
      signature: credential.signature,
      issuer: credential.issuerAddress,
      revokedAt: credential.revokedAt?.toISOString(),
      revocationReason: credential.revocationReason,
      verifications: credential.verifications,
      rawMetadata: credential.metadata,
    });
  })
);
