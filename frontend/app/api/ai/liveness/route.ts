import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiError,
  withErrorHandling,
  withAuth,
  validateBody,
  rateLimit,
} from '@/lib/api-middleware';
import { livenessDetectSchema } from '@/lib/validations';
import { detectLiveness } from '@/lib/services';

const limiter = rateLimit(10, 60_000); // Strict: 10 req/min for AI endpoints

export const POST = withErrorHandling(
  withAuth(async (request, _user) => {
  const { allowed } = limiter(request);
  if (!allowed) return apiError('Too many requests – AI rate limit exceeded', 429);

  const contentType = request.headers.get('content-type') || '';
  let frames: string[] = [];
  let metadata: Record<string, string> = {};

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const challengeId = formData.get('challengeId') as string | null;

    if (file) {
      const buffer = await file.arrayBuffer();
      frames = [Buffer.from(buffer).toString('base64')];
    }
    if (challengeId) metadata.challengeId = challengeId;
  } else {
    const body = await request.json();
    // Support both legacy single-image and new multi-frame format
    if (body.frames) {
      const validation = validateBody(livenessDetectSchema, body);
      if ('error' in validation) return validation.error;
      frames = validation.data.frames;
      metadata = (validation.data.metadata as Record<string, string>) || {};
    } else if (body.image) {
      frames = [body.image];
      if (body.challengeId) metadata.challengeId = body.challengeId;
    }
  }

  if (frames.length === 0) {
    return apiError('Image data or frames required', 400);
  }

  const result = await detectLiveness(frames, metadata);

  return apiSuccess({
    liveness_score: result.liveness_score,
    is_live: result.is_live,
    isLive: result.is_live, // backward-compatible alias
    confidence: result.confidence,
    signals: result.signals,
    threats_detected: result.threats_detected,
    recommendation: result.recommendation,
    mockMode: process.env.MOCK_AI === 'true',
    timestamp: new Date().toISOString(),
  });
}));
