// Contract ABIs for wagmi/viem interaction
// Generated from Foundry compilation (simplified for frontend use)

export const IssuerRegistryABI = [
  {
    type: 'function',
    name: 'addIssuer',
    inputs: [
      { name: 'issuerAddress', type: 'address' },
      { name: 'issuerName', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'removeIssuer',
    inputs: [{ name: 'issuerAddress', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isAuthorizedIssuer',
    inputs: [{ name: 'issuerAddress', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getIssuerInfo',
    inputs: [{ name: 'issuerAddress', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'addedAt', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
          { name: 'credentialsIssued', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'incrementCredentialCount',
    inputs: [{ name: 'issuerAddress', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getIssuerCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'IssuerAdded',
    inputs: [
      { name: 'issuer', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'IssuerRevoked',
    inputs: [
      { name: 'issuer', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const NullifierRegistryABI = [
  {
    type: 'function',
    name: 'markNullifierUsed',
    inputs: [
      { name: 'nullifier', type: 'bytes32' },
      { name: 'verifier', type: 'address' },
      { name: 'purposeHash', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isNullifierUsed',
    inputs: [{ name: 'nullifier', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getNullifierMetadata',
    inputs: [{ name: 'nullifier', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'used', type: 'bool' },
          { name: 'verifier', type: 'address' },
          { name: 'purposeHash', type: 'bytes32' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTotalNullifiers',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'NullifierMarked',
    inputs: [
      { name: 'nullifier', type: 'bytes32', indexed: true },
      { name: 'verifier', type: 'address', indexed: true },
      { name: 'purposeHash', type: 'bytes32', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const ConsentRegistryABI = [
  {
    type: 'function',
    name: 'recordConsent',
    inputs: [
      { name: 'consentHash', type: 'bytes32' },
      { name: 'attributesMerkleRoot', type: 'bytes32' },
      { name: 'verifier', type: 'address' },
      { name: 'purposeCode', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'revokeConsent',
    inputs: [{ name: 'consentHash', type: 'bytes32' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'verifyConsent',
    inputs: [{ name: 'consentHash', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'consentHash', type: 'bytes32' },
          { name: 'attributesMerkleRoot', type: 'bytes32' },
          { name: 'user', type: 'address' },
          { name: 'verifier', type: 'address' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'revoked', type: 'bool' },
          { name: 'purposeCode', type: 'bytes32' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isConsentActive',
    inputs: [{ name: 'consentHash', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserConsents',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserConsentCount',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'ConsentRecorded',
    inputs: [
      { name: 'consentHash', type: 'bytes32', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'verifier', type: 'address', indexed: true },
      { name: 'purposeCode', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ConsentRevoked',
    inputs: [
      { name: 'consentHash', type: 'bytes32', indexed: true },
      { name: 'user', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const RevocationRegistryABI = [
  {
    type: 'function',
    name: 'revokeCredential',
    inputs: [
      { name: 'credentialId', type: 'bytes32' },
      { name: 'reason', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'bulkRevoke',
    inputs: [
      { name: 'credentialIds', type: 'bytes32[]' },
      { name: 'reason', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isRevoked',
    inputs: [{ name: 'credentialId', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRevocationRecord',
    inputs: [{ name: 'credentialId', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'revoked', type: 'bool' },
          { name: 'revokedBy', type: 'address' },
          { name: 'revokedAt', type: 'uint256' },
          { name: 'reason', type: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'CredentialRevoked',
    inputs: [
      { name: 'credentialId', type: 'bytes32', indexed: true },
      { name: 'issuer', type: 'address', indexed: true },
      { name: 'reason', type: 'string', indexed: false },
    ],
  },
] as const;

export const VerifierRegistryABI = [
  {
    type: 'function',
    name: 'registerVerifier',
    inputs: [
      { name: 'verifier', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'category', type: 'uint8' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'removeVerifier',
    inputs: [{ name: 'verifier', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'isAuthorizedVerifier',
    inputs: [{ name: 'verifier', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getVerifierInfo',
    inputs: [{ name: 'verifier', type: 'address' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'category', type: 'uint8' },
          { name: 'reputationScore', type: 'uint8' },
          { name: 'verificationCount', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
          { name: 'registeredAt', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'incrementVerificationCount',
    inputs: [{ name: 'verifier', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getVerifierCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'VerifierRegistered',
    inputs: [
      { name: 'verifier', type: 'address', indexed: true },
      { name: 'name', type: 'string', indexed: false },
      { name: 'category', type: 'uint8', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'ReputationUpdated',
    inputs: [
      { name: 'verifier', type: 'address', indexed: true },
      { name: 'newScore', type: 'uint8', indexed: false },
    ],
  },
] as const;

export const AuditTrailABI = [
  {
    type: 'function',
    name: 'anchorMerkleRoot',
    inputs: [
      { name: 'merkleRoot', type: 'bytes32' },
      { name: 'batchSize', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'verifyLogInclusion',
    inputs: [
      { name: 'logHash', type: 'bytes32' },
      { name: 'proof', type: 'bytes32[]' },
      { name: 'batchId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAuditBatch',
    inputs: [{ name: 'batchId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'merkleRoot', type: 'bytes32' },
          { name: 'batchSize', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'submitter', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getBatchCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'AuditBatchAnchored',
    inputs: [
      { name: 'batchId', type: 'uint256', indexed: true },
      { name: 'merkleRoot', type: 'bytes32', indexed: false },
      { name: 'batchSize', type: 'uint256', indexed: false },
      { name: 'submitter', type: 'address', indexed: false },
    ],
  },
] as const;

// === Groth16 Verifier ABI (auto-generated from snarkjs) ===
export const Groth16VerifierABI = [
  {
    type: 'function',
    name: 'verifyProof',
    inputs: [
      { name: '_pA', type: 'uint256[2]' },
      { name: '_pB', type: 'uint256[2][2]' },
      { name: '_pC', type: 'uint256[2]' },
      { name: '_pubSignals', type: 'uint256[7]' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

// === ZKP Verification Orchestrator ABI ===
export const ZKPOrchestratorABI = [
  {
    type: 'function',
    name: 'verifyAgeProof',
    inputs: [
      { name: '_pA', type: 'uint256[2]' },
      { name: '_pB', type: 'uint256[2][2]' },
      { name: '_pC', type: 'uint256[2]' },
      { name: '_pubSignals', type: 'uint256[7]' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'verifyProofOnly',
    inputs: [
      { name: '_pA', type: 'uint256[2]' },
      { name: '_pB', type: 'uint256[2][2]' },
      { name: '_pC', type: 'uint256[2]' },
      { name: '_pubSignals', type: 'uint256[7]' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getVerification',
    inputs: [{ name: 'nullifierHash', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'prover', type: 'address' },
          { name: 'verifier', type: 'address' },
          { name: 'ageThreshold', type: 'uint256' },
          { name: 'nullifierHash', type: 'bytes32' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'isValid', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalVerifications',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'verificationCount',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'ProofVerified',
    inputs: [
      { name: 'nullifierHash', type: 'bytes32', indexed: true },
      { name: 'prover', type: 'address', indexed: true },
      { name: 'verifier', type: 'address', indexed: true },
      { name: 'ageThreshold', type: 'uint256', indexed: false },
      { name: 'isValid', type: 'bool', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;
