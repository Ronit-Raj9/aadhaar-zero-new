import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiError,
  withErrorHandling,
  withAuth,
  validateBody,
  rateLimit,
} from '@/lib/api-middleware';
import { documentVerifySchema } from '@/lib/validations';
import { verifyDocument } from '@/lib/services';

const limiter = rateLimit(10, 60_000);

export const POST = withErrorHandling(
  withAuth(async (request, _user) => {
  const { allowed } = limiter(request);
  if (!allowed) return apiError('Too many requests – AI rate limit exceeded', 429);

  const contentType = request.headers.get('content-type') || '';
  let documentImage: string = '';
  let documentType: string = 'AADHAAR';
  let expectedData: Record<string, string> | undefined;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('document') as File | null;
    documentType = (formData.get('documentType') as string) || 'AADHAAR';
    if (file) {
      const buffer = await file.arrayBuffer();
      documentImage = Buffer.from(buffer).toString('base64');
    }
  } else {
    const body = await request.json();
    // Support both validated and legacy format
    if (body.documentImage) {
      const validation = validateBody(documentVerifySchema, body);
      if ('error' in validation) return validation.error;
      documentImage = validation.data.documentImage;
      documentType = validation.data.documentType;
      expectedData = validation.data.expectedData as Record<string, string> | undefined;
    } else {
      documentImage = body.document || body.image || '';
      documentType = (body.documentType || 'AADHAAR').toUpperCase();
    }
  }

  if (!documentImage) {
    return apiError('Document image required', 400);
  }

  const result = await verifyDocument(documentImage, documentType, expectedData);

  return apiSuccess({
    document_valid: result.document_valid,
    isAuthentic: result.document_valid, // backward-compatible alias
    document_type: result.document_type,
    confidence: result.confidence,
    extracted_data: result.extracted_data,
    extractedFields: result.extracted_data, // backward-compatible alias
    forensics: result.forensics,
    warnings: result.warnings,
    mockMode: process.env.MOCK_AI === 'true',
    timestamp: new Date().toISOString(),
  });
}));
