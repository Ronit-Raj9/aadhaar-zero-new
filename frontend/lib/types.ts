// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  aadhaarMasked?: string;
  walletAddress?: string;
  createdAt: string;
}

// Credential Types
export interface Credential {
  id: string;
  userId: string;
  type: string; // 'aadhaar' | 'pan' | 'license' | 'passport' | 'dl' | 'voter_id' | 'custom'
  issueDate: string;
  expiryDate?: string;
  status: 'active' | 'revoked' | 'expired';
  proofHash: string;
  blockchainTxHash?: string;
  credentialIdHash?: string;
  nullifier?: string;
  onChainStatus?: {
    isRevoked: boolean;
    revokedAt?: string;
    lastVerifiedAt?: string;
  };
  metadata: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    [key: string]: any;
  };
}

// Blockchain Types
export interface BlockchainVerification {
  nullifierCheck: 'PASSED' | 'REPLAY_DETECTED' | 'RPC_ERROR_SKIPPED' | 'skipped';
  revocationCheck: 'PASSED' | 'REVOKED' | 'RPC_ERROR_SKIPPED' | 'skipped';
  verifierCheck: 'AUTHORIZED' | 'UNREGISTERED' | 'RPC_ERROR_SKIPPED' | 'skipped';
}

export interface VerificationResult {
  verified: boolean;
  credentialType: string;
  issuerName: string;
  verificationTime: string;
  status: string;
  message: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  nullifierTxHash?: string | null;
  blockchainChecks: BlockchainVerification;
  attributes: Record<string, boolean | string>;
  /** Selectively disclosed attributes from the proof */
  revealedAttributes?: Record<string, unknown>;
  /** Additional metadata from the verification process */
  metadata?: {
    nullifier?: string;
    blockchainTxHash?: string | null;
    consentRecorded?: boolean;
    timestamp?: number;
    verifierAuthorized?: boolean;
    [key: string]: unknown;
  };
}

export interface LivenessResult {
  isLive: boolean;
  confidence: number;
  checks: {
    blinkDetection: boolean;
    headMovement: boolean;
    depthAnalysis: boolean;
    textureAnalysis: boolean;
    infraredCheck: boolean;
  };
  antiSpoofScore: number;
  processingTimeMs: number;
}

export interface DocumentForensicsResult {
  isAuthentic: boolean;
  documentType: string;
  confidence: number;
  forensicChecks: Record<string, boolean>;
  extractedFields: Record<string, string>;
  tamperScore: number;
  processingTimeMs: number;
}

export interface RiskScoringResult {
  overallScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: Array<{ name: string; score: number; weight: number; details: string }>;
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  anomaliesDetected: string[];
  processingTimeMs: number;
}

export interface AuditBatch {
  merkleRoot: string;
  batchSize: number;
  txHash?: string;
  timestamp: string;
}

// Enrollment Types
export interface EnrollmentData {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    phone: string;
  };
  document: {
    type: string; // 'aadhaar' | 'pan' | 'license' | 'passport' | 'dl' | 'voter_id' | 'custom'
    file?: File;
    extractedData?: {
      documentNumber: string;
      issueDate?: string;
      expiryDate?: string;
      [key: string]: any;
    };
  };
  liveness: {
    videoFile?: File;
    status: 'not-started' | 'in-progress' | 'completed' | 'failed';
  };
  consent: {
    agreedToTerms: boolean;
    agreedToDataUsage: boolean;
  };
}

// Verification Types
export interface VerificationRequest {
  id: string;
  credentialId: string;
  requestedAt: string;
  expiresAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  verifierName: string;
  verifierDetails?: string;
  proofSubmittedAt?: string;
  completedAt?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth Types
export interface AuthContext {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Enrollment Context
export interface EnrollmentContext {
  data: EnrollmentData;
  currentStep: number;
  updateStep: (step: number) => void;
  updatePersonalInfo: (info: Partial<EnrollmentData['personalInfo']>) => void;
  updateDocument: (doc: Partial<EnrollmentData['document']>) => void;
  updateLiveness: (liveness: Partial<EnrollmentData['liveness']>) => void;
  updateConsent: (consent: Partial<EnrollmentData['consent']>) => void;
  resetEnrollment: () => void;
}

// Dashboard Stats
export interface DashboardStats {
  totalCredentials: number;
  activeVerifications: number;
  privacyScore: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
}
