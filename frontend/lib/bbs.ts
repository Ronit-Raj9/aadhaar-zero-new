/**
 * BBS+ Signature Implementation for Selective Disclosure
 * 
 * Uses HMAC-SHA256 based commitment scheme as a compatible BBS+ simulation.
 * In production, replace with @mattrglobal/bbs-signatures when WASM support
 * stabilises in Next.js edge/serverless runtime.
 */

import { createHmac, randomBytes } from 'crypto';
import { keccak256, encodePacked, type Hex } from 'viem';

// Issuer key pair (deterministic from env secret for reproducibility)
// Lazy evaluation to avoid throwing during Next.js build-time page collection
function getIssuerSecret(): string {
  const secret = process.env.BBS_ISSUER_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('BBS_ISSUER_SECRET environment variable must be set in production');
  }
  return secret || 'aadhaar-zero-bbs-issuer-key-v1';
}

export interface BBSSignaturePayload {
  credentialHash: string;
  issuerAddress: string;
  attributes: Record<string, unknown>;
  issuedAt: number;
}

export interface BBSSignature {
  /** The aggregate BBS+ signature over all messages (hex) */
  signature: string;
  /** Individual attribute commitments for selective disclosure */
  commitments: Record<string, string>;
  /** Blinding factor used during signing */
  blindingFactor: string;
  /** Number of signed messages */
  messageCount: number;
}

export interface BBSProof {
  /** Disclosed attribute names */
  disclosedAttributes: string[];
  /** Disclosed attribute values */
  disclosedValues: Record<string, unknown>;
  /** Proof of knowledge for hidden attributes */
  hiddenProofs: Record<string, string>;
  /** Proof nonce */
  nonce: string;
  /** Aggregate proof signature */
  proofSignature: string;
  /** Credential hash */
  credentialHash: string;
  /** Issuer address */
  issuerAddress: string;
}

/**
 * Compute HMAC-SHA256 commitment for a single message
 */
function commitMessage(message: string, blindingFactor: string): string {
  return createHmac('sha256', getIssuerSecret())
    .update(`${blindingFactor}:${message}`)
    .digest('hex');
}

/**
 * Sign a credential's attributes using BBS+ scheme.
 * Each attribute becomes a separate "message" in the BBS+ multi-message signature.
 */
export function bbsSign(payload: BBSSignaturePayload): BBSSignature {
  const blindingFactor = randomBytes(32).toString('hex');
  const entries = Object.entries(payload.attributes);

  // Compute individual commitments for each attribute
  const commitments: Record<string, string> = {};
  for (const [key, value] of entries) {
    const serialised = typeof value === 'object' ? JSON.stringify(value) : String(value);
    commitments[key] = commitMessage(`${key}=${serialised}`, blindingFactor);
  }

  // Aggregate signature = HMAC over sorted commitments + credential metadata
  const sortedCommitments = Object.keys(commitments)
    .sort()
    .map((k) => commitments[k])
    .join(':');

  const signature = createHmac('sha256', getIssuerSecret())
    .update(
      `${payload.credentialHash}:${payload.issuerAddress}:${payload.issuedAt}:${sortedCommitments}`
    )
    .digest('hex');

  return {
    signature: `0x${signature}`,
    commitments,
    blindingFactor,
    messageCount: entries.length,
  };
}

/**
 * Generate a selective disclosure proof.
 * Reveals only chosen attributes; hidden attributes are replaced with their commitments.
 */
export function bbsCreateProof(
  signature: BBSSignature,
  allAttributes: Record<string, unknown>,
  disclosedAttributeNames: string[],
  credentialHash: string,
  issuerAddress: string
): BBSProof {
  const nonce = randomBytes(16).toString('hex');

  const disclosedValues: Record<string, unknown> = {};
  const hiddenProofs: Record<string, string> = {};

  for (const [key, value] of Object.entries(allAttributes)) {
    if (disclosedAttributeNames.includes(key)) {
      disclosedValues[key] = value;
    } else {
      // For hidden attributes, provide the commitment as proof of knowledge
      hiddenProofs[key] = signature.commitments[key] || '';
    }
  }

  // Proof signature = HMAC over disclosed values + hidden commitments + nonce
  const disclosedSorted = Object.keys(disclosedValues)
    .sort()
    .map((k) => `${k}=${JSON.stringify(disclosedValues[k])}`)
    .join('|');
  const hiddenSorted = Object.keys(hiddenProofs)
    .sort()
    .map((k) => hiddenProofs[k])
    .join(':');

  const proofSignature = createHmac('sha256', getIssuerSecret())
    .update(`${signature.signature}:${disclosedSorted}:${hiddenSorted}:${nonce}`)
    .digest('hex');

  return {
    disclosedAttributes: disclosedAttributeNames,
    disclosedValues,
    hiddenProofs,
    nonce,
    proofSignature: `0x${proofSignature}`,
    credentialHash,
    issuerAddress,
  };
}

/**
 * Verify a selective disclosure proof.
 * The verifier checks that the proof signature is valid for the disclosed values.
 */
export function bbsVerifyProof(proof: BBSProof, originalSignature: string): boolean {
  // Re-derive the proof signature from disclosed data + hidden proofs
  const disclosedSorted = Object.keys(proof.disclosedValues)
    .sort()
    .map((k) => `${k}=${JSON.stringify(proof.disclosedValues[k])}`)
    .join('|');
  const hiddenSorted = Object.keys(proof.hiddenProofs)
    .sort()
    .map((k) => proof.hiddenProofs[k])
    .join(':');

  const expectedProofSignature = createHmac('sha256', getIssuerSecret())
    .update(`${originalSignature}:${disclosedSorted}:${hiddenSorted}:${proof.nonce}`)
    .digest('hex');

  return proof.proofSignature === `0x${expectedProofSignature}`;
}

/**
 * Serialize a BBS signature for storage in DB
 */
export function serializeBBSSignature(sig: BBSSignature): string {
  return JSON.stringify(sig);
}

/**
 * Deserialize a BBS signature from DB
 */
export function deserializeBBSSignature(raw: string): BBSSignature {
  return JSON.parse(raw);
}
