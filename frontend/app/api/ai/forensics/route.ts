// POST /api/ai/forensics – Document forensic analysis
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, withErrorHandling, withAuth, rateLimit } from '@/lib/api-middleware';

const AI_BACKEND = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const MOCK_AI = process.env.MOCK_AI === 'true' || !process.env.AI_SERVICE_URL;

const limiter = rateLimit(10, 60_000);

export const POST = withErrorHandling(
  withAuth(async (request, _user) => {
    const { allowed } = limiter(request);
    if (!allowed) return apiError('Too many requests', 429);

    const body = await request.json();

    // Mock fallback for when Python backend is unavailable
    if (MOCK_AI) {
      return apiSuccess({
        isAuthentic: true,
        documentType: body.documentType || 'aadhaar',
        confidence: 0.94,
        forensicChecks: {
          microPrintVerification: true,
          hologramDetection: true,
          fontConsistency: true,
          pixelAnalysis: true,
          metadataIntegrity: true,
          edgeDetection: true,
          colorProfileAnalysis: true,
        },
        extractedFields: {
          documentNumber: 'XXXX-XXXX-1234',
          name: 'Verified User',
        },
        tamperScore: 3,
        processingTimeMs: 320,
      });
    }

    try {
      const response = await fetch(`${AI_BACKEND}/document/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (!response.ok) {
        return apiError(result.detail || 'Forensic analysis failed', response.status);
      }

      return apiSuccess(result.data || result);
    } catch (err) {
      console.error('Forensics AI call failed:', err);
      return apiError('AI service unavailable', 503);
    }
  })
);
