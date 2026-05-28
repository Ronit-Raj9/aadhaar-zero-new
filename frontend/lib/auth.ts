// JWT authentication utilities
// Uses Web Crypto API (no external deps, works in Edge Runtime)

import { type NextRequest } from 'next/server';

// Lazy evaluation to avoid throwing during Next.js build-time page collection
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production');
  }
  return secret || 'aadhaar-zero-dev-secret-change-in-production-32chars';
}
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

export interface JWTPayload {
  sub: string; // userId
  wallet: string;
  role: string;
  iat: number;
  exp: number;
}

// ---- Encoding helpers ----

function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return new Uint8Array([...binary].map((c) => c.charCodeAt(0)));
}

function textEncode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function textDecode(data: Uint8Array): string {
  return new TextDecoder().decode(data);
}

// ---- HMAC signing ----

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    textEncode(getJwtSecret()).buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function sign(data: string): Promise<string> {
  const key = await getKey();
  const encoded = textEncode(data);
  const signature = await crypto.subtle.sign('HMAC', key, encoded.buffer as ArrayBuffer);
  return base64UrlEncode(new Uint8Array(signature));
}

async function verify(data: string, signature: string): Promise<boolean> {
  const key = await getKey();
  const sigBytes = base64UrlDecode(signature);
  const dataBytes = textEncode(data);
  return crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes.buffer as ArrayBuffer,
    dataBytes.buffer as ArrayBuffer
  );
}

// ---- Token helpers ----

function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60; // default 7 days
  const value = parseInt(match[1]);
  switch (match[2]) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return 7 * 24 * 60 * 60;
  }
}

// ---- Public API ----

export async function createToken(payload: {
  userId: string;
  walletAddress: string;
  role: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expirySeconds = parseExpiry(JWT_EXPIRY);

  const header = { alg: 'HS256', typ: 'JWT' };
  const body: JWTPayload = {
    sub: payload.userId,
    wallet: payload.walletAddress,
    role: payload.role,
    iat: now,
    exp: now + expirySeconds,
  };

  const encodedHeader = base64UrlEncode(textEncode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(textEncode(JSON.stringify(body)));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = await sign(data);

  return `${data}.${signature}`;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, payload, signature] = parts;
    const data = `${header}.${payload}`;

    const isValid = await verify(data, signature);
    if (!isValid) return null;

    const decoded: JWTPayload = JSON.parse(textDecode(base64UrlDecode(payload)));

    // Check expiry
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;

    return decoded;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(
  request: NextRequest
): Promise<JWTPayload | null> {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return verifyToken(authHeader.slice(7));
  }

  // Check cookie
  const tokenCookie = request.cookies.get('aadhaar_token');
  if (tokenCookie?.value) {
    return verifyToken(tokenCookie.value);
  }

  return null;
}
