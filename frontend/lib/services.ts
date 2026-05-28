// Mock services for demo mode
// Toggle via MOCK_BLOCKCHAIN and MOCK_AI environment variables

import { type Hex } from 'viem';

const MOCK_BLOCKCHAIN = process.env.MOCK_BLOCKCHAIN === 'true';
const MOCK_AI = process.env.MOCK_AI === 'true';

// ---- Mock Blockchain ----

const usedNullifiers = new Set<string>();

export const mockBlockchain = {
  isEnabled: () => MOCK_BLOCKCHAIN,

  async isNullifierUsed(nullifier: string): Promise<boolean> {
    await delay(200);
    return usedNullifiers.has(nullifier);
  },

  async markNullifierUsed(
    nullifier: string,
    _verifier: string,
    _purposeHash: string
  ): Promise<{ txHash: string; blockNumber: number; gasUsed: string }> {
    await delay(800);
    usedNullifiers.add(nullifier);
    return {
      txHash: `0xMOCK${randomHex(60)}`,
      blockNumber: 12345678 + Math.floor(Math.random() * 1000),
      gasUsed: '45000',
    };
  },

  async isAuthorizedIssuer(_address: string): Promise<boolean> {
    await delay(150);
    return true; // Always authorized in mock mode
  },

  async isAuthorizedVerifier(_address: string): Promise<boolean> {
    await delay(150);
    return true; // Always authorized in mock mode
  },

  async isCredentialRevoked(_credentialId: string): Promise<boolean> {
    await delay(150);
    return false; // Never revoked in mock mode
  },

  async recordConsent(
    _consentHash: string,
    _attributesRoot: string
  ): Promise<{ txHash: string; blockNumber: number }> {
    await delay(600);
    return {
      txHash: `0xMOCK${randomHex(60)}`,
      blockNumber: 12345678 + Math.floor(Math.random() * 1000),
    };
  },

  async anchorMerkleRoot(
    _merkleRoot: string,
    _batchSize: number
  ): Promise<{ txHash: string; blockNumber: number }> {
    await delay(800);
    return {
      txHash: `0xMOCK${randomHex(60)}`,
      blockNumber: 12345678 + Math.floor(Math.random() * 1000),
    };
  },
};

// ---- Mock AI Services ----

export const mockAI = {
  isEnabled: () => MOCK_AI,

  async detectLiveness(
    _frames: string[],
    _metadata?: Record<string, unknown>
  ): Promise<{
    liveness_score: number;
    is_live: boolean;
    confidence: string;
    signals: Record<string, unknown>;
    threats_detected: string[];
    recommendation: string;
  }> {
    await delay(1500);
    const score = 0.88 + Math.random() * 0.1; // 0.88 – 0.98
    return {
      liveness_score: parseFloat(score.toFixed(2)),
      is_live: true,
      confidence: 'HIGH',
      signals: {
        spatial_texture: parseFloat((0.86 + Math.random() * 0.1).toFixed(2)),
        temporal_motion: parseFloat((0.90 + Math.random() * 0.08).toFixed(2)),
        rppg_pulse: parseFloat((0.88 + Math.random() * 0.1).toFixed(2)),
        pulse_detected: true,
        heart_rate_bpm: 60 + Math.floor(Math.random() * 30),
        virtual_camera_detected: false,
      },
      threats_detected: [],
      recommendation: 'APPROVE',
    };
  },

  async verifyDocument(
    _image: string,
    documentType: string,
    expectedData?: Record<string, string>
  ): Promise<{
    document_valid: boolean;
    document_type: string;
    confidence: number;
    extracted_data: Record<string, string>;
    forensics: Record<string, unknown>;
    warnings: string[];
  }> {
    await delay(2000);
    const confidence = 0.85 + Math.random() * 0.12;
    return {
      document_valid: true,
      document_type: documentType,
      confidence: parseFloat(confidence.toFixed(2)),
      extracted_data: {
        name: expectedData?.name || 'RONIT RAJ',
        dob: expectedData?.dob || '01/01/2000',
        aadhaar_masked: expectedData?.number || 'XXXX XXXX 1234',
        address: expectedData?.address || 'Gwalior, Madhya Pradesh',
      },
      forensics: {
        forgery_score: parseFloat((Math.random() * 0.15).toFixed(2)),
        is_genuine: true,
        qr_valid: true,
        qr_data_matches_ocr: true,
        security_features_detected: ['hologram', 'guilloche_pattern'],
      },
      warnings: [],
    };
  },

  async calculateRiskScore(
    _userId: string,
    context: Record<string, unknown>,
    _historicalData?: Record<string, unknown>
  ): Promise<{
    risk_score: number;
    risk_level: string;
    friction_required: string;
    factors: Record<string, unknown>;
    recommendation: string;
    escalation_required: boolean;
  }> {
    await delay(800);
    const riskScore = Math.floor(Math.random() * 35) + 5; // 5 – 40
    const riskLevel = riskScore < 25 ? 'LOW' : riskScore < 60 ? 'MEDIUM' : 'HIGH';
    return {
      risk_score: riskScore,
      risk_level: riskLevel,
      friction_required: riskLevel === 'LOW' ? 'PASSIVE_LIVENESS' : 'ACTIVE_LIVENESS',
      factors: {
        device_trust: 80 + Math.floor(Math.random() * 20),
        location_anomaly: false,
        new_verifier: !!context.newVerifier,
        unusual_time: false,
        behavioral_match: parseFloat((0.8 + Math.random() * 0.18).toFixed(2)),
        verifier_reputation: 90 + Math.floor(Math.random() * 10),
      },
      recommendation: riskLevel === 'HIGH' ? 'REVIEW' : 'APPROVE',
      escalation_required: riskLevel === 'HIGH',
    };
  },
};

// ---- Helpers ----

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomHex(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// ---- Unified Service Layer ----
// These functions choose between mock and real based on env vars

import * as blockchain from './blockchain';

export async function checkNullifier(nullifier: string): Promise<boolean> {
  if (MOCK_BLOCKCHAIN) return mockBlockchain.isNullifierUsed(nullifier);
  return blockchain.isNullifierUsed(nullifier as Hex);
}

export async function markNullifier(
  nullifier: string,
  verifier: string,
  purposeHash: string
): Promise<{ txHash: string | null; blockNumber?: number; gasUsed?: string }> {
  if (MOCK_BLOCKCHAIN) {
    return mockBlockchain.markNullifierUsed(nullifier, verifier, purposeHash);
  }
  const txHash = await blockchain.markNullifierUsed(
    nullifier as Hex,
    verifier as Hex,
    purposeHash as Hex
  );
  return { txHash };
}

export async function verifyIssuer(address: string): Promise<boolean> {
  if (MOCK_BLOCKCHAIN) return mockBlockchain.isAuthorizedIssuer(address);
  return blockchain.isAuthorizedIssuer(address as Hex);
}

export async function verifyVerifier(address: string): Promise<boolean> {
  if (MOCK_BLOCKCHAIN) return mockBlockchain.isAuthorizedVerifier(address);
  return blockchain.isAuthorizedVerifier(address as Hex);
}

export async function checkRevocation(credentialId: string): Promise<boolean> {
  if (MOCK_BLOCKCHAIN) return mockBlockchain.isCredentialRevoked(credentialId);
  return blockchain.isCredentialRevoked(credentialId as Hex);
}

export async function detectLiveness(
  frames: string[],
  metadata?: Record<string, unknown>
) {
  if (MOCK_AI) return mockAI.detectLiveness(frames, metadata);

  const aiUrl = process.env.AI_SERVICE_URL;
  const aiKey = process.env.AI_SERVICE_API_KEY;
  if (!aiUrl) throw new Error('AI_SERVICE_URL environment variable is not configured');
  if (!aiKey) throw new Error('AI_SERVICE_API_KEY environment variable is not configured');

  // Real AI service call
  const response = await fetch(`${aiUrl}/liveness/detect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiKey}`,
    },
    body: JSON.stringify({ frames, metadata }),
  });
  if (!response.ok) throw new Error(`AI liveness service error: ${response.status}`);
  return response.json();
}

export async function verifyDocument(
  image: string,
  documentType: string,
  expectedData?: Record<string, string>
) {
  if (MOCK_AI) return mockAI.verifyDocument(image, documentType, expectedData);

  const aiUrl = process.env.AI_SERVICE_URL;
  const aiKey = process.env.AI_SERVICE_API_KEY;
  if (!aiUrl) throw new Error('AI_SERVICE_URL environment variable is not configured');
  if (!aiKey) throw new Error('AI_SERVICE_API_KEY environment variable is not configured');

  const response = await fetch(`${aiUrl}/document/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiKey}`,
    },
    body: JSON.stringify({ documentImage: image, documentType, expectedData }),
  });
  if (!response.ok) throw new Error(`AI document service error: ${response.status}`);
  return response.json();
}

export async function calculateRiskScore(
  userId: string,
  context: Record<string, unknown>,
  historicalData?: Record<string, unknown>
) {
  if (MOCK_AI) return mockAI.calculateRiskScore(userId, context, historicalData);

  const aiUrl = process.env.AI_SERVICE_URL;
  const aiKey = process.env.AI_SERVICE_API_KEY;
  if (!aiUrl) throw new Error('AI_SERVICE_URL environment variable is not configured');
  if (!aiKey) throw new Error('AI_SERVICE_API_KEY environment variable is not configured');

  const response = await fetch(`${aiUrl}/risk/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiKey}`,
    },
    body: JSON.stringify({ userId, context, historicalData }),
  });
  if (!response.ok) throw new Error(`AI risk service error: ${response.status}`);
  return response.json();
}
