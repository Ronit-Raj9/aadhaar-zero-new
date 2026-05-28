// GET /api/blockchain/nullifier/check?nullifier=0x...
// Check if a nullifier has already been used
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, withErrorHandling, rateLimit } from '@/lib/api-middleware';
import { checkNullifier } from '@/lib/services';

const limiter = rateLimit(100, 60_000);

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { allowed } = limiter(request);
  if (!allowed) return apiError('Too many requests', 429);

  const nullifier = request.nextUrl.searchParams.get('nullifier');
  if (!nullifier) return apiError('nullifier query param required', 400);

  const isUsed = await checkNullifier(nullifier);

  return apiSuccess({
    nullifier,
    isUsed,
    metadata: null,
    mockMode: process.env.MOCK_BLOCKCHAIN === 'true',
  });
});
