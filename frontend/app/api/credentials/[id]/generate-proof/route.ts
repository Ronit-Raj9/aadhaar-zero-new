// POST /api/credentials/:id/generate-proof – Generate a BBS+ selective disclosure proof
import { NextRequest } from 'next/server';
import { keccak256, encodePacked, type Hex } from 'viem';
import prisma from '@/lib/prisma';
import {
  apiSuccess,
  apiError,
  withErrorHandling,
  withAuth,
} from '@/lib/api-middleware';
import { deserializeBBSSignature, bbsCreateProof } from '@/lib/bbs';

export const runtime = 'nodejs';

export const POST = withErrorHandling(
  withAuth(async (request, user, { params }: { params: Promise<{ id: string }> }) => {
    const { id: credentialId } = await params; // /api/credentials/[id]/generate-proof

    const body = await request.json().catch(() => ({}));
    const attributes: string[] = body.attributes || body.selectedAttributes || ['name', 'ageOver18'];

    // 1. Look up the credential
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
    });

    if (!credential) {
      return apiError('Credential not found', 404);
    }

    if (credential.userId !== user.sub) {
      return apiError('Not authorized to generate proof for this credential', 403);
    }

    if (credential.revokedAt) {
      return apiError('Cannot generate proof for a revoked credential', 400);
    }

    if (credential.expiresAt && credential.expiresAt < new Date()) {
      return apiError('Cannot generate proof for an expired credential', 400);
    }

    // 2. Build selective disclosure subset
    const allAttributes = (credential.attributes as Record<string, unknown>) || {};
    const revealedAttributes: Record<string, unknown> = {};
    for (const attr of attributes) {
      if (attr in allAttributes) {
        revealedAttributes[attr] = allAttributes[attr];
      }
    }

    // 3. Generate BBS+ selective disclosure proof
    const timestamp = Math.floor(Date.now() / 1000);
    let proofToken: string;
    let proofHash: Hex;

    if (credential.bbsSignature) {
      // Use real BBS+ selective disclosure
      const bbsSig = deserializeBBSSignature(credential.bbsSignature);
      const bbsProof = bbsCreateProof(
        bbsSig,
        allAttributes,
        attributes,
        credential.credentialHash,
        credential.issuerAddress
      );

      proofHash = keccak256(
        encodePacked(
          ['bytes32', 'string', 'uint256'],
          [credential.credentialHash as Hex, bbsProof.nonce, BigInt(timestamp)]
        )
      );

      proofToken = Buffer.from(JSON.stringify({
        version: 'bbs-v1',
        proof: bbsProof,
        proofHash,
        timestamp,
      })).toString('base64');
    } else {
      // Legacy fallback for credentials issued before BBS+ upgrade
      proofHash = keccak256(
        encodePacked(
          ['bytes32', 'address', 'uint256', 'string'],
          [
            credential.credentialHash as Hex,
            credential.issuerAddress as Hex,
            BigInt(timestamp),
            JSON.stringify(attributes),
          ]
        )
      );

      proofToken = [
        proofHash,
        credential.credentialHash,
        credential.signature,
        timestamp.toString(16),
        Buffer.from(JSON.stringify(revealedAttributes)).toString('base64'),
      ].join('.');
    }

    // 4. Audit log
    try {
      await prisma.auditLog.create({
        data: {
          eventType: 'PROOF_GENERATED',
          userId: user.sub,
          credentialId: credential.id,
          metadata: {
            revealedAttributes: attributes,
            proofHash,
            bbsEnabled: !!credential.bbsSignature,
          },
        },
      });
    } catch {
      // Non-blocking
    }

    return apiSuccess({
      proofToken,
      proofHash,
      revealedAttributes,
      credentialType: credential.credentialType,
      issuedAt: credential.issuedAt.toISOString(),
      expiresAt: credential.expiresAt?.toISOString() || null,
      bbsEnabled: !!credential.bbsSignature,
    });
  })
);
