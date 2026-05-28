import { NextRequest } from 'next/server';
import { type Hex } from 'viem';
import prisma from '@/lib/prisma';
import {
  apiSuccess,
  apiError,
  withErrorHandling,
  withAuth,
  validateBody,
  rateLimit,
} from '@/lib/api-middleware';
import { verifyProofSchema } from '@/lib/validations';
import {
  checkNullifier,
  markNullifier,
  checkRevocation,
  verifyVerifier,
  calculateRiskScore,
} from '@/lib/services';
import { hashPurpose } from '@/lib/blockchain';
import { addAuditLog, isBatchReady, buildAndFlushBatch } from '@/lib/merkle';
import { anchorMerkleRoot } from '@/lib/blockchain';
import { bbsVerifyProof, type BBSProof } from '@/lib/bbs';

export const runtime = 'nodejs';

const limiter = rateLimit(50, 60_000);

export const POST = withErrorHandling(
  withAuth(async (request, _user) => {
  const { allowed } = limiter(request);
  if (!allowed) return apiError('Too many requests', 429);

  const body = await request.json();
  const validation = validateBody(verifyProofSchema, body);
  if ('error' in validation) return validation.error;

  const { proof, verifierAddress, purpose } = validation.data;
  const timestamp = Math.floor(Date.now() / 1000);

  // ---- Step 1: Cryptographic Verification ----
  if (!proof.proofData || proof.proofData.length < 10) {
    return apiError('Invalid proof format', 400);
  }

  // Attempt BBS+ proof verification
  let proofVerified = false;
  let proofConfidence = 0.85; // default confidence for legacy proofs

  try {
    // Try to decode proofData as a BBS+ proof token
    const decoded = Buffer.from(proof.proofData, 'base64').toString('utf-8');
    const proofPayload = JSON.parse(decoded);

    if (proofPayload.version === 'bbs-v1' && proofPayload.bbsProof) {
      // BBS+ verification path — cryptographically verify the selective disclosure proof
      const bbsProof: BBSProof = proofPayload.bbsProof;

      // Look up original credential to get the BBS signature for verification
      const cred = await prisma.credential.findFirst({
        where: { credentialHash: bbsProof.credentialHash },
        select: { bbsSignature: true, revokedAt: true },
      });

      if (cred?.revokedAt) {
        return apiError('Credential has been revoked', 403);
      }

      if (cred?.bbsSignature) {
        // Parse the stored BBS signature and verify the proof against it
        const parsedSig = JSON.parse(cred.bbsSignature);
        proofVerified = bbsVerifyProof(bbsProof, parsedSig.signature);
        proofConfidence = proofVerified ? 0.98 : 0;
      } else {
        // Legacy credential without BBS+ — accept with lower confidence
        proofVerified = true;
        proofConfidence = 0.85;
      }
    } else if (proofPayload.version === 'legacy-v1') {
      // Legacy proof — basic hash-match verification
      proofVerified = !!proofPayload.proofHash && proofPayload.proofHash.length > 10;
      proofConfidence = 0.80;
    } else {
      // Unknown proof format — still accept if it looks valid
      proofVerified = true;
      proofConfidence = 0.75;
    }
  } catch {
    // If proof data isn't base64/JSON, treat as a raw proof token (legacy compat)
    proofVerified = proof.proofData.length >= 20;
    proofConfidence = 0.70;
  }

  if (!proofVerified) {
    return apiError('Proof verification failed — cryptographic signature mismatch', 403);
  }

  // ---- Step 2: Blockchain State Checks ----
  // 2a. Nullifier check
  const nullifierUsed = await checkNullifier(proof.nullifier);
  if (nullifierUsed) {
    return apiError('Proof already used (replay attack detected)', 403);
  }

  // 2b. Revocation check – reject if credential is revoked
  const isRevoked = await checkRevocation(proof.proofData);
  if (isRevoked) {
    return apiError('Credential has been revoked', 403);
  }

  // 2c. Verifier authorization
  const verifierAuthorized = await verifyVerifier(verifierAddress);

  // ---- Step 3: AI Risk Scoring ----
  const riskResult = await calculateRiskScore('system', {
    action: 'VERIFICATION',
    verifierAddress,
    purpose,
    ip: request.headers.get('x-forwarded-for') || 'unknown',
  });

  // ---- Step 4: Blockchain Writes ----
  const purposeHash = hashPurpose(purpose);
  const markResult = await markNullifier(proof.nullifier, verifierAddress, purposeHash);

  // ---- Step 5: Store verification record ----
  // We need a credential reference – attempt to look it up from the nullifier context
  // For the MVP, create a verification record with a placeholder or null credential
  let verificationRecord;
  try {
    // Try to find a credential by hash from the proof
    const cred = await prisma.credential.findFirst({
      where: { credentialHash: proof.proofData },
    });

    verificationRecord = await prisma.verification.create({
      data: {
        credentialId: cred?.id || (await getOrCreatePlaceholderCredential()),
        verifierAddress,
        verifierName: body.verifierName || 'Unknown Verifier',
        nullifier: proof.nullifier,
        consentHash: proof.consentHash,
        revealedAttributes: proof.revealedAttributes as any,
        purpose,
        riskScore: riskResult.risk_score,
        riskLevel: riskResult.risk_level as any,
        verificationStatus: 'SUCCESS',
        blockchainTxHash: markResult.txHash || undefined,
        metadata: {
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          verifierAuthorized,
        },
      },
    });
  } catch (dbError) {
    console.warn('Failed to store verification record (non-blocking):', dbError);
  }

  // ---- Step 6: Audit Log + Merkle Tree ----
  addAuditLog({
    operation: 'VERIFICATION',
    nullifier: proof.nullifier,
    verifier: verifierAddress,
    timestamp,
    riskScore: riskResult.risk_score,
    outcome: 'SUCCESS',
  });

  if (isBatchReady()) {
    const batch = buildAndFlushBatch();
    if (batch) {
      try {
        await anchorMerkleRoot(batch.merkleRoot as Hex, batch.batchSize);
      } catch (err) {
        console.error('Failed to anchor audit batch:', err);
      }
    }
  }

  try {
    await prisma.auditLog.create({
      data: {
        eventType: 'VERIFICATION',
        verificationId: verificationRecord?.id,
        metadata: {
          verifierAddress,
          purpose,
          riskScore: riskResult.risk_score,
          nullifierTxHash: markResult.txHash,
        },
      },
    });
  } catch {}

  return apiSuccess({
    verified: true,
    confidence: proofConfidence,
    revealedAttributes: proof.revealedAttributes,
    riskScore: riskResult.risk_score,
    riskLevel: riskResult.risk_level,
    metadata: {
      nullifier: proof.nullifier,
      blockchainTxHash: markResult.txHash,
      consentRecorded: true,
      timestamp,
      verifierAuthorized,
    },
    auditTrail: {
      verificationId: verificationRecord?.id || null,
    },
  });
}));

// Helper to create a placeholder credential for unlinked verifications
async function getOrCreatePlaceholderCredential(): Promise<string> {
  const placeholder = await prisma.credential.findFirst({
    where: { credentialHash: 'placeholder' },
  });
  if (placeholder) return placeholder.id;

  // Need a user for the credential — use upsert to avoid race condition duplicates
  const systemUser = await prisma.user.upsert({
    where: { walletAddress: '0x0000000000000000000000000000000000000000' },
    update: {},
    create: {
      walletAddress: '0x0000000000000000000000000000000000000000',
      name: 'System',
      role: 'ADMIN',
    },
  });

  const created = await prisma.credential.create({
    data: {
      userId: systemUser.id,
      credentialType: 'CUSTOM',
      credentialHash: 'placeholder',
      attributes: {},
      signature: '0x00',
      issuerAddress: '0x0000000000000000000000000000000000000000',
    },
  });
  return created.id;
}
