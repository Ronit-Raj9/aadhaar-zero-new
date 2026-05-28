// POST /api/verifier/request – Verifier creates a verification request (persisted to DB)
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
  apiSuccess,
  apiError,
  withErrorHandling,
  withAuth,
  validateBody,
} from '@/lib/api-middleware';
import { verifierRequestSchema } from '@/lib/validations';
import { verifyVerifier } from '@/lib/services';

export const POST = withErrorHandling(
  withAuth(async (request, user) => {
    const body = await request.json();
    const validation = validateBody(verifierRequestSchema, body);
    if ('error' in validation) return validation.error;

    const { credentialType, requiredAttributes, purpose, verifierName, verifierAddress } =
      validation.data;

    // Check verifier authorization on-chain
    const isAuthorized = await verifyVerifier(verifierAddress);

    const nonce = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Persist the verification request
    const vr = await prisma.verificationRequest.create({
      data: {
        verifierAddress,
        verifierName,
        credentialType,
        requestedAttributes: requiredAttributes,
        nonce,
        purpose,
        status: 'PENDING',
        expiresAt,
      },
    });

    return apiSuccess(
      {
        requestId: vr.id,
        verifierName,
        verifierAddress,
        isAuthorized,
        credentialType,
        requiredAttributes,
        purpose,
        nonce,
        createdAt: vr.createdAt.toISOString(),
        expiresAt: vr.expiresAt.toISOString(),
        status: 'PENDING',
      },
      201
    );
  })
);
