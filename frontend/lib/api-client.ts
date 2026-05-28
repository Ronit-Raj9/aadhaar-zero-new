import { mockUser, mockCredentials, mockVerifications, mockDashboardStats } from './mocks';
import {
  Credential, VerificationRequest, DashboardStats, User, EnrollmentData, ApiResponse,
  VerificationResult, LivenessResult, DocumentForensicsResult, RiskScoringResult, AuditBatch,
} from './types';

// Configuration for demo mode
// IMPORTANT: Defaults to true when NEXT_PUBLIC_DEMO_MODE is not set.
// Set NEXT_PUBLIC_DEMO_MODE=false in .env to use real API routes.
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

// Simulated delay for demo purposes
const DEMO_DELAY = (ms: number = 800) =>
  new Promise((resolve) => setTimeout(resolve, Math.random() * ms + 300));

// Helper: get auth headers with JWT token
function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('aadhaar_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Auth API
export const authAPI = {
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(1200);
      if (email === 'demo@aadhaar-zero.com' && password === 'demo123') {
        return {
          success: true,
          data: {
            user: mockUser,
            token: 'mock-jwt-token-' + Date.now(),
          },
        };
      }
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }
    // Real API call
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },

  async register(email: string, password: string, name: string): Promise<ApiResponse<{ user: User; token: string }>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(1500);
      return {
        success: true,
        data: {
          user: {
            id: 'user-' + Date.now(),
            email,
            name,
            createdAt: new Date().toISOString(),
          },
          token: 'mock-jwt-token-' + Date.now(),
        },
      };
    }
    // Real API call
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    return response.json();
  },

  async logout(): Promise<ApiResponse<null>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(500);
      return { success: true };
    }
    // Real API call
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};

// Enrollment API
export const enrollmentAPI = {
  async uploadDocument(file: File): Promise<ApiResponse<{ documentId: string }>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(1500);
      return {
        success: true,
        data: {
          documentId: 'doc-' + Date.now(),
        },
      };
    }
    // Real API call – use the AI document verification endpoint
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', 'AADHAAR');
    const token = typeof window !== 'undefined' ? localStorage.getItem('aadhaar_token') : null;
    const response = await fetch(`${API_BASE_URL}/ai/document`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    const result = await response.json();
    // Map AI result to expected shape
    if (result.success) {
      return { success: true, data: { documentId: 'doc-' + Date.now() } };
    }
    return result;
  },

  async extractDocumentData(
    documentId: string
  ): Promise<
    ApiResponse<{
      documentNumber: string;
      issueDate: string;
      expiryDate?: string;
      [key: string]: any;
    }>
  > {
    if (DEMO_MODE) {
      await DEMO_DELAY(2000);
      return {
        success: true,
        data: {
          documentNumber: 'AADHAAR123456789012',
          issueDate: '2024-03-20',
          expiryDate: '2034-03-19',
          firstName: 'Khushi',
          lastName: 'Singh',
          dateOfBirth: '1999-05-15',
        },
      };
    }
    // Document data extraction is done client-side during upload via AI endpoint
    // This is called after upload; return cached/default data
    return {
      success: true,
      data: {
        documentNumber: 'Pending extraction',
        issueDate: new Date().toISOString().split('T')[0],
      },
    };
  },

  async verifyLiveness(frames: string[]): Promise<ApiResponse<{ livenessScore: number }>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(2500);
      return {
        success: true,
        data: {
          livenessScore: 0.95,
        },
      };
    }
    // Real API call – send base64 JPEG frames to AI liveness endpoint
    const token2 = typeof window !== 'undefined' ? localStorage.getItem('aadhaar_token') : null;
    const response = await fetch(`${API_BASE_URL}/ai/liveness`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token2 ? { 'Authorization': `Bearer ${token2}` } : {}),
      },
      body: JSON.stringify({ frames }),
    });
    const result = await response.json();
    // Map AI liveness result to expected shape
    if (result.success && result.data) {
      return {
        success: true,
        data: { livenessScore: result.data.liveness_score ?? result.data.confidence ?? 0.95 },
      };
    }
    return result;
  },

  async issueCredential(enrollmentData: EnrollmentData): Promise<ApiResponse<Credential>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(1800);
      const newCredential: Credential = {
        id: 'cred-' + Date.now(),
        userId: 'user-001',
        type: enrollmentData.document.type || 'aadhaar',
        issueDate: new Date().toISOString().split('T')[0],
        status: 'active',
        proofHash: '0x' + Math.random().toString(16).slice(2),
        blockchainTxHash: '0x' + Math.random().toString(16).slice(2),
        metadata: {
          firstName: enrollmentData.personalInfo.firstName,
          lastName: enrollmentData.personalInfo.lastName,
          dateOfBirth: enrollmentData.personalInfo.dateOfBirth,
          email: enrollmentData.personalInfo.email,
          phone: enrollmentData.personalInfo.phone,
        },
      };
      return {
        success: true,
        data: newCredential,
      };
    }
    // Real API call – map EnrollmentData to the issueCredentialSchema shape
    // The API at /api/credentials/issue expects { documentData, livenessData?, documentImage? }
    const apiBody = {
      documentData: {
        type: (enrollmentData.document.type || 'AADHAAR').toUpperCase(),
        number: enrollmentData.document.extractedData?.documentNumber || 'N/A',
        name: `${enrollmentData.personalInfo.firstName} ${enrollmentData.personalInfo.lastName}`.trim(),
        dob: enrollmentData.personalInfo.dateOfBirth || undefined,
        address: undefined as string | undefined,
      },
      livenessData: enrollmentData.liveness.status === 'completed'
        ? { score: 0.95 }
        : undefined,
      documentImage: undefined as string | undefined,
    };

    // If the document file exists, read it as base64
    if (enrollmentData.document.file) {
      try {
        const buffer = await enrollmentData.document.file.arrayBuffer();
        apiBody.documentImage = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
      } catch {
        // File read failed, proceed without image
      }
    }

    const response = await fetch(`${API_BASE_URL}/credentials/issue`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(apiBody),
    });
    const result = await response.json();

    // Map the API response to the frontend Credential shape
    if (result.success && result.data?.credential) {
      const cred = result.data.credential;
      return {
        success: true,
        data: {
          id: cred.id,
          userId: 'self',
          type: (cred.type || enrollmentData.document.type || 'aadhaar').toLowerCase() as Credential['type'],
          issueDate: cred.issuedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          expiryDate: cred.expiresAt?.split('T')[0],
          status: 'active',
          proofHash: result.data.credentialHash || cred.signature || '',
          blockchainTxHash: undefined,
          metadata: {
            firstName: enrollmentData.personalInfo.firstName,
            lastName: enrollmentData.personalInfo.lastName,
            dateOfBirth: enrollmentData.personalInfo.dateOfBirth,
          },
        },
      };
    }

    return result;
  },
};

// Credentials API
export const credentialsAPI = {
  async listCredentials(_userId: string): Promise<ApiResponse<Credential[]>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(600);
      return {
        success: true,
        data: mockCredentials,
      };
    }
    // Real API call – route uses JWT to identify user, no userId query needed
    const response = await fetch(`${API_BASE_URL}/credentials/list`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async getCredential(credentialId: string): Promise<ApiResponse<Credential>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(400);
      const credential = mockCredentials.find((c) => c.id === credentialId);
      if (!credential) {
        return {
          success: false,
          error: 'Credential not found',
        };
      }
      return {
        success: true,
        data: credential,
      };
    }
    // Real API call
    const response = await fetch(`${API_BASE_URL}/credentials/${credentialId}`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async generateProof(
    credentialId: string,
    attributes?: string[]
  ): Promise<ApiResponse<{ proofToken: string; proofHash: string }>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(1500);
      return {
        success: true,
        data: {
          proofToken:
            'PROOF_' +
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15),
          proofHash: '0x' + Math.random().toString(16).slice(2),
        },
      };
    }
    // Real API call
    const response = await fetch(`${API_BASE_URL}/credentials/${credentialId}/generate-proof`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ attributes }),
    });
    return response.json();
  },

  async revokeCredential(credentialId: string, reason?: string): Promise<ApiResponse<null>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(1000);
      return {
        success: true,
      };
    }
    // Real API call – POST to /api/credentials/revoke with credentialId in body
    const response = await fetch(`${API_BASE_URL}/credentials/revoke`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ credentialId, reason: reason || 'User requested revocation' }),
    });
    return response.json();
  },
};

// Verification API
export const verificationAPI = {
  async initiateVerification(
    credentialId: string,
    verifierName: string
  ): Promise<ApiResponse<VerificationRequest>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(800);
      const newVerification: VerificationRequest = {
        id: 'verif-' + Date.now(),
        credentialId,
        requestedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        verifierName,
      };
      return {
        success: true,
        data: newVerification,
      };
    }
    // Real API call – maps to POST /api/verifier/request
    const response = await fetch(`${API_BASE_URL}/verifier/request`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        credentialType: 'AADHAAR',
        requiredAttributes: ['name', 'dateOfBirth'],
        purpose: 'identity-verification',
        verifierName,
        verifierAddress: '0x0000000000000000000000000000000000000000',
      }),
    });
    const result = await response.json();
    if (!result.success) return result;
    // Map verifier/request response → VerificationRequest shape
    return {
      success: true,
      data: {
        id: result.data.requestId,
        credentialId,
        requestedAt: result.data.createdAt,
        expiresAt: result.data.expiresAt,
        status: result.data.status?.toLowerCase() || 'pending',
        verifierName: result.data.verifierName,
      },
    };
  },

  async getVerificationStatus(verificationId: string): Promise<ApiResponse<VerificationRequest>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(400);
      const verification = mockVerifications.find((v) => v.id === verificationId);
      if (!verification) {
        return {
          success: false,
          error: 'Verification request not found',
        };
      }
      return {
        success: true,
        data: verification,
      };
    }
    // Real API call – look up a single verification from the history endpoint
    const response = await fetch(`${API_BASE_URL}/verifier/history?limit=100`, {
      headers: getAuthHeaders(),
    });
    const result = await response.json();
    if (!result.success) return result;
    const match = (result.data?.verifications || []).find(
      (v: any) => v.id === verificationId
    );
    if (!match) return { success: false, error: 'Verification request not found' };
    return {
      success: true,
      data: {
        id: match.id,
        credentialId: '',
        requestedAt: match.timestamp,
        expiresAt: '',
        status: match.verificationStatus?.toLowerCase() || 'completed',
        verifierName: match.verifierName,
      } as VerificationRequest,
    };
  },

  async listVerifications(_userId: string): Promise<ApiResponse<VerificationRequest[]>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(600);
      return {
        success: true,
        data: mockVerifications,
      };
    }
    // Real API call – route uses JWT user, no userId query needed
    const response = await fetch(`${API_BASE_URL}/verifier/history`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },

  async submitProof(verificationId: string, proofToken: string): Promise<ApiResponse<null>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(1200);
      return {
        success: true,
      };
    }
    // Real API call – maps to POST /api/verify/proof
    const response = await fetch(`${API_BASE_URL}/verify/proof`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        proof: {
          proofData: proofToken,
          nullifier: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
          revealedAttributes: {},
          consentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
        verifierAddress: '0x0000000000000000000000000000000000000000',
        purpose: 'identity-verification',
      }),
    });
    return response.json();
  },
};

// Dashboard API
export const dashboardAPI = {
  async getStats(_userId: string): Promise<ApiResponse<DashboardStats>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(600);
      return {
        success: true,
        data: mockDashboardStats,
      };
    }
    // Real API call \u2013 route uses JWT to identify user, no userId query needed
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  },
};

// ======================================================
// Blockchain-Aware Verification API
// ======================================================
export const blockchainVerifyAPI = {
  async verifyProof(params: {
    proofToken: string;
    verifierName: string;
    verifierAddress?: string;
    credentialId?: string;
    nullifier?: string;
    purpose?: string;
  }): Promise<ApiResponse<VerificationResult>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(1500);
      return {
        success: true,
        data: {
          verified: true,
          credentialType: 'aadhaar',
          issuerName: 'National Authority (UIDAI)',
          verificationTime: new Date().toISOString(),
          status: 'approved',
          message: 'Credential verified via zero-knowledge proof',
          riskScore: 12,
          riskLevel: 'LOW',
          nullifierTxHash: '0x' + Math.random().toString(16).slice(2),
          blockchainChecks: {
            nullifierCheck: 'PASSED',
            revocationCheck: 'PASSED',
            verifierCheck: 'AUTHORIZED',
          },
          attributes: { ageOver18: true, identityVerified: true },
        },
      };
    }
    // Map params → verifyProofSchema shape
    const response = await fetch(`${API_BASE_URL}/verify/proof`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        proof: {
          proofData: params.proofToken,
          nullifier: params.nullifier || `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
          revealedAttributes: {},
          consentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
        verifierAddress: params.verifierAddress || '0x0000000000000000000000000000000000000000',
        purpose: params.purpose || 'identity-verification',
        verifierName: params.verifierName,
      }),
    });
    return response.json();
  },
};

// ======================================================
// AI Services API
// ======================================================
export const aiAPI = {
  async detectLiveness(image: File | string, challengeId?: string): Promise<ApiResponse<LivenessResult>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(1200);
      return {
        success: true,
        data: {
          isLive: true,
          confidence: 0.96,
          checks: {
            blinkDetection: true,
            headMovement: true,
            depthAnalysis: true,
            textureAnalysis: true,
            infraredCheck: true,
          },
          antiSpoofScore: 0.95,
          processingTimeMs: 320,
        },
      };
    }
    if (typeof image === 'string') {
      const response = await fetch(`${API_BASE_URL}/ai/liveness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, challengeId }),
      });
      return response.json();
    }
    const formData = new FormData();
    formData.append('image', image);
    if (challengeId) formData.append('challengeId', challengeId);
    const response = await fetch(`${API_BASE_URL}/ai/liveness`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  async verifyDocument(document: File | string, documentType?: string): Promise<ApiResponse<DocumentForensicsResult>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(1500);
      return {
        success: true,
        data: {
          isAuthentic: true,
          documentType: documentType || 'aadhaar',
          confidence: 0.97,
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
          processingTimeMs: 450,
        },
      };
    }
    if (typeof document === 'string') {
      const response = await fetch(`${API_BASE_URL}/ai/document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document, documentType }),
      });
      return response.json();
    }
    const formData = new FormData();
    formData.append('document', document);
    if (documentType) formData.append('documentType', documentType);
    const response = await fetch(`${API_BASE_URL}/ai/document`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  async scoreRisk(params: {
    userId?: string;
    action: string;
    context?: Record<string, any>;
  }): Promise<ApiResponse<RiskScoringResult>> {
    if (DEMO_MODE) {
      await DEMO_DELAY(800);
      return {
        success: true,
        data: {
          overallScore: 15,
          riskLevel: 'LOW',
          factors: [
            { name: 'Device Trust', score: 10, weight: 0.2, details: 'Trusted device' },
            { name: 'Behavioral', score: 12, weight: 0.25, details: 'Normal patterns' },
            { name: 'IP Geolocation', score: 8, weight: 0.15, details: 'Expected region' },
            { name: 'Velocity', score: 5, weight: 0.15, details: 'Normal frequency' },
          ],
          recommendation: 'APPROVE',
          anomaliesDetected: [],
          processingTimeMs: 180,
        },
      };
    }
    const response = await fetch(`${API_BASE_URL}/ai/risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  },
};

// ======================================================
// Audit Trail API
// ======================================================
export const auditAPI = {
  async anchorBatch(forceFlush?: boolean): Promise<ApiResponse<AuditBatch & { anchored: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/audit/anchor`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ forceFlush }),
    });
    return response.json();
  },

  async getStats(): Promise<ApiResponse<{ pendingCount: number; totalAnchored: number; batchSize: number }>> {
    const response = await fetch(`${API_BASE_URL}/audit/anchor`);
    return response.json();
  },
};

// ======================================================
// Blockchain Status API
// ======================================================
export const blockchainAPI = {
  async getStatus(): Promise<ApiResponse<{
    network: string;
    chainId: number;
    contracts: Record<string, string | null>;
    deployedCount: number;
    totalContracts: number;
  }>> {
    const response = await fetch(`${API_BASE_URL}/blockchain/status`);
    return response.json();
  },
};
