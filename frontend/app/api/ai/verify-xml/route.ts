// POST /api/ai/verify-xml – Proxy to Python DigiLocker XML verification
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, withErrorHandling, withAuth } from '@/lib/api-middleware';

const AI_BACKEND = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const MOCK_AI = process.env.MOCK_AI === 'true' || !process.env.AI_SERVICE_URL;

export const POST = withErrorHandling(
  withAuth(async (request, user) => {
    const body = await request.json();

    // Mock fallback when Python backend is unavailable
    if (MOCK_AI) {
      return apiSuccess({
        valid: true,
        document_type: body.documentType || 'aadhaar',
        signature_present: true,
        signature_valid: true,
        extracted_fields: {
          name: 'Verified User',
          document_number: 'XXXX-XXXX-1234',
          dob: '1990-01-15',
        },
        document_hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        verification_timestamp: new Date().toISOString(),
      });
    }

    try {
      const response = await fetch(`${AI_BACKEND}/document/verify-xml`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok) {
        return apiError(result.detail || 'XML verification failed', response.status);
      }

      return apiSuccess(result.data || result);
    } catch (err) {
      console.error('XML verify AI call failed:', err);
      return apiError('AI service unavailable', 503);
    }
  })
);
