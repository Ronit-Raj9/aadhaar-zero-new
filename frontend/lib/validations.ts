// Zod validation schemas for all API inputs
import { z } from 'zod';

// ---- Auth ----
// NOTE: registerSchema and loginSchema are for wallet-based auth flows.
// Currently unused but exported for future wallet registration/login routes.

export const registerSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  email: z.string().email().optional(),
  name: z.string().min(1).max(200),
});

export const loginSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  signature: z.string().min(1), // Wallet signature for login
  message: z.string().min(1), // The message that was signed
  nonce: z.string().min(1),
});

// Simple email/password login (for demo mode)
export const emailLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ---- Credentials ----

export const issueCredentialSchema = z.object({
  documentData: z.object({
    type: z.enum(['AADHAAR', 'PAN', 'DL', 'VOTER_ID', 'PASSPORT', 'CUSTOM']),
    number: z.string().min(1),
    name: z.string().min(1),
    dob: z.string().optional(),
    address: z.string().optional(),
  }),
  livenessData: z
    .object({
      score: z.number().min(0).max(1),
      videoFrames: z.array(z.string()).optional(),
    })
    .optional(),
  documentImage: z.string().optional(), // base64
});

export const revokeCredentialSchema = z.object({
  credentialId: z.string().uuid(),
  reason: z.string().min(1).max(500).optional(),
});

// ---- Proofs ----

export const generateProofSchema = z.object({
  credentialId: z.string().uuid(),
  selectedAttributes: z.array(z.string()).min(1),
  verifierAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  purpose: z.string().min(1),
});

export const verifyProofSchema = z.object({
  proof: z.object({
    proofData: z.string().min(1),
    revealedAttributes: z.record(z.unknown()),
    nullifier: z.string().min(1),
    consentHash: z.string().min(1),
  }),
  verifierAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/),
  purpose: z.string().min(1),
});

// ---- AI ----

export const livenessDetectSchema = z.object({
  frames: z.array(z.string()).min(1).max(30),
  metadata: z
    .object({
      deviceModel: z.string().optional(),
      cameraResolution: z.string().optional(),
    })
    .optional(),
});

export const documentVerifySchema = z.object({
  documentImage: z.string().min(1),
  documentType: z.enum(['AADHAAR', 'PAN', 'DL', 'VOTER_ID', 'PASSPORT']),
  expectedData: z
    .object({
      name: z.string().optional(),
      number: z.string().optional(),
    })
    .optional(),
});

export const riskScoreSchema = z.object({
  userId: z.string().uuid(),
  context: z.object({
    deviceFingerprint: z.string().optional(),
    location: z
      .object({
        lat: z.number(),
        lon: z.number(),
      })
      .optional(),
    ipAddress: z.string().optional(),
    verifierType: z.string().optional(),
    transactionAmount: z.number().optional(),
  }),
  historicalData: z
    .object({
      verificationCount: z.number().optional(),
      lastVerification: z.string().optional(),
    })
    .optional(),
});

// ---- Blockchain ----

export const markNullifierSchema = z.object({
  nullifier: z.string().min(1),
  verifierAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/),
  purposeHash: z.string().min(1),
});

export const recordConsentSchema = z.object({
  consentHash: z.string().min(1),
  attributesRoot: z.string().min(1),
});

// ---- Verifier ----

export const verifierRequestSchema = z.object({
  credentialType: z.enum(['AADHAAR', 'PAN', 'DL', 'VOTER_ID', 'PASSPORT', 'CUSTOM']),
  requiredAttributes: z.array(z.string()).min(1),
  purpose: z.string().min(1),
  verifierName: z.string().min(1),
  verifierAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EmailLoginInput = z.infer<typeof emailLoginSchema>;
export type IssueCredentialInput = z.infer<typeof issueCredentialSchema>;
export type GenerateProofInput = z.infer<typeof generateProofSchema>;
export type VerifyProofInput = z.infer<typeof verifyProofSchema>;
export type LivenessDetectInput = z.infer<typeof livenessDetectSchema>;
export type DocumentVerifyInput = z.infer<typeof documentVerifySchema>;
export type RiskScoreInput = z.infer<typeof riskScoreSchema>;
export type MarkNullifierInput = z.infer<typeof markNullifierSchema>;
export type VerifierRequestInput = z.infer<typeof verifierRequestSchema>;
