import { Credential, VerificationRequest, DashboardStats, User } from './types';

export const mockUser: User = {
  id: 'user-001',
  email: 'demo@aadhaar-zero.com',
  name: 'Khushi Singh',
  aadhaarMasked: 'XXXX XXXX 9876',
  createdAt: new Date('2026-01-15').toISOString(),
};

export const mockCredentials: Credential[] = [
  {
    id: 'cred-001',
    userId: 'user-001',
    type: 'aadhaar',
    issueDate: '2024-03-20',
    status: 'active',
    proofHash: '0x7f8a9c2d1e4b6f3a9c2d1e4b6f3a9c2d',
    blockchainTxHash: '0x1234567890abcdef1234567890abcdef12345678',
    metadata: {
      firstName: 'Khushi',
      lastName: 'Singh',
      dateOfBirth: '1999-05-15',
      gender: 'Female',
      address: 'Mumbai, Maharashtra, India',
    },
  },
  {
    id: 'cred-002',
    userId: 'user-001',
    type: 'pan',
    issueDate: '2022-11-10',
    status: 'active',
    proofHash: '0x8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
    blockchainTxHash: '0x2345678901bcdef02345678901bcdef023456789',
    metadata: {
      panNumber: 'AABCD1234X',
      firstName: 'Khushi',
      lastName: 'Singh',
    },
  },
  {
    id: 'cred-003',
    userId: 'user-001',
    type: 'license',
    issueDate: '2021-06-05',
    expiryDate: '2026-06-04',
    status: 'active',
    proofHash: '0x9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
    blockchainTxHash: '0x3456789012cdef03456789012cdef034567890',
    metadata: {
      licenseNumber: 'DL-0001-2021',
      firstName: 'Khushi',
      lastName: 'Singh',
      dateOfBirth: '1999-05-15',
    },
  },
];

export const mockVerifications: VerificationRequest[] = [
  {
    id: 'verif-001',
    credentialId: 'cred-001',
    requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    status: 'approved',
    verifierName: 'HDFC Bank',
    verifierDetails: 'KYC Verification for Account Opening',
    proofSubmittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'verif-002',
    credentialId: 'cred-002',
    requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    verifierName: 'Aadhar Compliant Service',
    verifierDetails: 'PAN Verification Request',
  },
  {
    id: 'verif-003',
    credentialId: 'cred-003',
    requestedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    verifierName: 'Insurance Company XYZ',
    verifierDetails: 'License Verification for Policy',
  },
];

export const mockDashboardStats: DashboardStats = {
  totalCredentials: mockCredentials.length,
  activeVerifications: mockVerifications.filter((v) => v.status === 'pending').length,
  privacyScore: 85,
  recentActivity: [
    {
      id: 'act-001',
      type: 'credential_issued',
      description: 'Aadhaar credential successfully issued',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
    },
    {
      id: 'act-002',
      type: 'verification_request',
      description: 'Received KYC verification request from HDFC Bank',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'approved',
    },
    {
      id: 'act-003',
      type: 'proof_shared',
      description: 'Shared zero-knowledge proof with HDFC Bank',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
    },
    {
      id: 'act-004',
      type: 'credential_viewed',
      description: 'Viewed Aadhaar credential details',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
    },
    {
      id: 'act-005',
      type: 'verification_request',
      description: 'Received PAN verification request',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    },
  ],
};
