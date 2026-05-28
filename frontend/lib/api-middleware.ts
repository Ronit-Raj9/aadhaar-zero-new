// API middleware: authentication, rate limiting, error handling, validation
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, type JWTPayload } from '@/lib/auth';
import { z } from 'zod';

// ---- Standard API Response ----

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, ...(details ? { details } : {}) },
    { status }
  );
}

// ---- Authentication Middleware ----

export type AuthenticatedHandler = (
  request: NextRequest,
  user: JWTPayload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: any
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (request: NextRequest, context?: any) => {
    try {
      const user = await getUserFromRequest(request);
      if (!user) {
        return apiError('Unauthorized – invalid or missing token', 401);
      }
      return handler(request, user, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return apiError('Internal server error', 500);
    }
  };
}

// Require specific roles
export function withRole(roles: string[], handler: AuthenticatedHandler) {
  return withAuth(async (request, user, context) => {
    if (!roles.includes(user.role)) {
      return apiError('Forbidden – insufficient permissions', 403);
    }
    return handler(request, user, context);
  });
}

// ---- Rate Limiting (in-memory with lazy cleanup, compatible with serverless) ----
// NOTE: In serverless environments (Vercel), this Map resets on cold starts.
// For production, replace with Redis-based rate limiting (e.g., @upstash/ratelimit).

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000');
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
const RATE_LIMIT_STORE_MAX_SIZE = 10000; // Prevent unbounded memory growth

export function rateLimit(
  maxRequests: number = RATE_LIMIT_MAX,
  windowMs: number = RATE_LIMIT_WINDOW
) {
  return (request: NextRequest): { allowed: boolean; remaining: number } => {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const now = Date.now();

    // Lazy cleanup: evict expired entries if store grows too large
    if (rateLimitStore.size > RATE_LIMIT_STORE_MAX_SIZE) {
      for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetAt) rateLimitStore.delete(key);
      }
    }

    const entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    entry.count++;
    if (entry.count > maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: maxRequests - entry.count };
  };
}

// ---- Validation Helper ----

export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      error: apiError('Validation error', 400, result.error.flatten().fieldErrors),
    };
  }
  return { data: result.data };
}

// ---- Error Wrapper ----

export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error(`[API Error] ${request.method} ${request.nextUrl.pathname}:`, error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      return apiError(message, 500);
    }
  };
}

// Rate limit cleanup is handled lazily inside the rateLimit() function above.
// For production serverless deployments, use Redis-based rate limiting.
