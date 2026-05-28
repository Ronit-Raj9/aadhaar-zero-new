// GET /api/blockchain/issuer/verify?address=0x...
// Check if an issuer is authorized on-chain
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, withErrorHandling, rateLimit } from '@/lib/api-middleware';
import { verifyIssuer } from '@/lib/services';

const limiter = rateLimit(100, 60_000);

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { allowed } = limiter(request);
  if (!allowed) return apiError('Too many requests', 429);

  const address = request.nextUrl.searchParams.get('address');
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return apiError('Valid Ethereum address required', 400);
  }

  const isAuthorized = await verifyIssuer(address);

  return apiSuccess({
    address,
    isAuthorized,
    mockMode: process.env.MOCK_BLOCKCHAIN === 'true',
  });
});
