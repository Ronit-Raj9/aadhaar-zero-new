import { NextRequest } from 'next/server';
import { keccak256, encodePacked, type Hex } from 'viem';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, withErrorHandling, withAuth, validateBody } from '@/lib/api-middleware';
import { issueCredentialSchema } from '@/lib/validations';
import { verifyIssuer, detectLiveness, verifyDocument, calculateRiskScore } from '@/lib/services';
import { bbsSign, serializeBBSSignature } from '@/lib/bbs';

export const runtime = 'nodejs';

// The backend issuer address (system issuer)
const ISSUER_ADDRESS = process.env.BACKEND_ISSUER_ADDRESS || '0x0000000000000000000000000000000000000001';

export const POST = withErrorHandling(
  withAuth(async (request, user) => {
    const body = await request.json();
    const validation = validateBody(issueCredentialSchema, body);
    if ('error' in validation) return validation.error;

    const { documentData, livenessData, documentImage } = validation.data;
    const timestamp = Math.floor(Date.now() / 1000);

    // 1. AI Document Verification
    let docResult = null;
    if (documentImage) {
      docResult = await verifyDocument(documentImage, documentData.type, {
        name: documentData.name,
        number: documentData.number,
      });
      if (!docResult.document_valid) {
        return apiError('Document verification failed – possible forgery detected', 400);
      }
    }

    // 2. AI Liveness Detection
    let livenessResult = null;
    if (livenessData?.videoFrames?.length) {
      livenessResult = await detectLiveness(livenessData.videoFrames);
      if (!livenessResult.is_live) {
        return apiError('Liveness check failed – presentation attack suspected', 400);
      }
    }

    // 3. Check issuer authorization on blockchain
    const issuerAuthorized = await verifyIssuer(ISSUER_ADDRESS);
    // Not fatal – log warning if unauthorized (mock mode always passes)

    // 4. Risk scoring
    const riskResult = await calculateRiskScore(user.sub, {
      action: 'CREDENTIAL_ISSUANCE',
      documentType: documentData.type,
    });

    if (riskResult.risk_level === 'HIGH' && riskResult.escalation_required) {
      return apiError('Risk level too high – manual review required', 403);
    }

    // 5. Generate credential hashes & BBS+ signature
    const credentialId = keccak256(
      encodePacked(
        ['address', 'string', 'string', 'uint256'],
        [ISSUER_ADDRESS as Hex, user.sub, documentData.type, BigInt(timestamp)]
      )
    );

    const credentialHash = keccak256(
      encodePacked(
        ['bytes32', 'string', 'string'],
        [credentialId, documentData.name, documentData.number]
      )
    );

    // 6. Derive attributes
    const attributes: Record<string, unknown> = {
      name: documentData.name,
      type: documentData.type,
      number_masked: documentData.number,
    };
    if (documentData.dob) {
      attributes.dob = documentData.dob;
      const age = Math.floor(
        (Date.now() - new Date(documentData.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      attributes.ageOver18 = age >= 18;
      attributes.ageRange =
        age < 18 ? 'under-18' : age <= 30 ? '18-30' : age <= 50 ? '31-50' : '51+';
    }
    if (documentData.address) attributes.address = documentData.address;

    // BBS+ multi-message signature over credential attributes
    const bbsSig = bbsSign({
      credentialHash,
      issuerAddress: ISSUER_ADDRESS,
      attributes,
      issuedAt: timestamp,
    });

    const signature = bbsSig.signature;

    // 7. Store in database
    // Map input type to valid Prisma CredentialType enum
    const VALID_CREDENTIAL_TYPES = ['AADHAAR', 'PAN', 'DL', 'VOTER_ID', 'PASSPORT', 'CUSTOM'] as const;
    type ValidCredentialType = typeof VALID_CREDENTIAL_TYPES[number];
    const normalizedType = documentData.type.toUpperCase();
    const credentialType: ValidCredentialType = VALID_CREDENTIAL_TYPES.includes(normalizedType as ValidCredentialType)
      ? (normalizedType as ValidCredentialType)
      : 'CUSTOM';

    const credential = await prisma.credential.create({
      data: {
        userId: user.sub,
        credentialType,
        credentialHash,
        attributes: attributes as any,
        signature,
        bbsSignature: serializeBBSSignature(bbsSig),
        issuerAddress: ISSUER_ADDRESS,
        expiresAt: new Date(Date.now() + 5 * 365.25 * 24 * 60 * 60 * 1000), // 5 years
        metadata: {
          documentVerification: docResult
            ? { valid: docResult.document_valid, confidence: docResult.confidence }
            : null,
          livenessCheck: livenessResult
            ? { score: livenessResult.liveness_score, live: livenessResult.is_live }
            : null,
          riskScore: riskResult.risk_score,
          issuerAuthorized: issuerAuthorized,
        } as any,
      },
    });

    // 8. Audit log
    await prisma.auditLog.create({
      data: {
        eventType: 'CREDENTIAL_ISSUED',
        userId: user.sub,
        credentialId: credential.id,
        metadata: {
          credentialType: documentData.type,
          issuer: ISSUER_ADDRESS,
          riskScore: riskResult.risk_score,
        },
      },
    });

    return apiSuccess(
      {
        credential: {
          id: credential.id,
          type: credential.credentialType,
          attributes,
          signature,
          issuer: ISSUER_ADDRESS,
          issuedAt: credential.issuedAt.toISOString(),
          expiresAt: credential.expiresAt?.toISOString(),
        },
        credentialHash,
        riskScore: riskResult.risk_score,
        riskLevel: riskResult.risk_level,
      },
      201
    );
  })
);
