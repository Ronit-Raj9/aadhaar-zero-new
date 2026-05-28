// POST /api/proofs/generate – Generate a ZK proof from credential
import { NextRequest } from 'next/server';
import { keccak256, encodePacked, type Hex } from 'viem';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, withErrorHandling, withAuth, validateBody } from '@/lib/api-middleware';
import { generateProofSchema } from '@/lib/validations';
import { generateNullifier, generateConsentHash } from '@/lib/blockchain';

export const POST = withErrorHandling(
  withAuth(async (request, user) => {
    const body = await request.json();
    const validation = validateBody(generateProofSchema, body);
    if ('error' in validation) return validation.error;

    const { credentialId, selectedAttributes, verifierAddress, purpose } = validation.data;

    // 1. Retrieve credential
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
    });

    if (!credential) return apiError('Credential not found', 404);
    if (credential.userId !== user.sub) return apiError('Forbidden', 403);
    if (credential.revokedAt) return apiError('Credential has been revoked', 400);
    if (credential.expiresAt && credential.expiresAt < new Date()) {
      return apiError('Credential has expired', 400);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const attrs = credential.attributes as Record<string, unknown>;

    // 2. Build revealed attributes (selective disclosure)
    const revealedAttributes: Record<string, unknown> = {};
    for (const attr of selectedAttributes) {
      // Handle derived attributes
      if (attr === 'ageOver18') {
        revealedAttributes.ageOver18 = attrs.ageOver18 ?? true;
      } else if (attr === 'ageRange') {
        revealedAttributes.ageRange = attrs.ageRange ?? '18-30';
      } else if (attr in attrs) {
        revealedAttributes[attr] = attrs[attr];
      }
    }

    // 3. Generate nullifier
    const nullifier = generateNullifier(
      credential.credentialHash,
      verifierAddress || '0x0000000000000000000000000000000000000000',
      timestamp,
      user.sub // user-specific secret
    );

    // 4. Generate consent hash
    const attributesMerkleRoot = keccak256(
      encodePacked(['string'], [JSON.stringify(Object.keys(revealedAttributes).sort())])
    );

    const consentHash = generateConsentHash(
      user.wallet,
      verifierAddress || '0x0000000000000000000000000000000000000000',
      purpose,
      attributesMerkleRoot,
      timestamp,
      `nonce-${Date.now()}`
    );

    // 5. Generate BBS+ selective disclosure proof (simulated)
    const proofData = keccak256(
      encodePacked(
        ['bytes32', 'bytes32', 'bytes32', 'uint256'],
        [
          credential.credentialHash as Hex,
          nullifier,
          consentHash,
          BigInt(timestamp),
        ]
      )
    );

    // 6. Generate QR code data (shareable token)
    const shareableToken = Buffer.from(
      JSON.stringify({
        proofData,
        revealedAttributes,
        nullifier,
        consentHash,
        timestamp,
        expiresAt: timestamp + 600, // 10 minute expiry
        purpose,
      })
    ).toString('base64url');

    return apiSuccess({
      proof: {
        proofData,
        revealedAttributes,
        nullifier,
        consentHash,
        timestamp,
        expiresAt: timestamp + 600,
      },
      shareableToken,
      credentialType: credential.credentialType,
    });
  })
);
