import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiError,
  withErrorHandling,
  withAuth,
  rateLimit,
} from '@/lib/api-middleware';
import { calculateRiskScore } from '@/lib/services';

const limiter = rateLimit(10, 60_000);

export const POST = withErrorHandling(
  withAuth(async (request, _user) => {
  const { allowed } = limiter(request);
  if (!allowed) return apiError('Too many requests – AI rate limit exceeded', 429);

  const body = await request.json();
  const { userId, action, context, historicalData } = body;

  if (!action) return apiError('Action type required', 400);

  const result = await calculateRiskScore(
    userId || 'anonymous',
    { action, ...context },
    historicalData
  );

  return apiSuccess({
    risk_score: result.risk_score,
    overallScore: result.risk_score, // backward-compatible alias
    risk_level: result.risk_level,
    riskLevel: result.risk_level, // backward-compatible alias
    friction_required: result.friction_required,
    factors: result.factors,
    recommendation: result.recommendation,
    escalation_required: result.escalation_required,
    mockMode: process.env.MOCK_AI === 'true',
    timestamp: new Date().toISOString(),
  });
}));
