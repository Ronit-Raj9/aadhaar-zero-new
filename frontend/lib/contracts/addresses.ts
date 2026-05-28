// Contract addresses - update after deployment
// Base Sepolia testnet addresses (deploy with: forge script script/Deploy.s.sol)

export const CONTRACT_ADDRESSES = {
  // Base Sepolia (Chain ID: 84532)
  84532: {
    issuerRegistry: (process.env.NEXT_PUBLIC_ISSUER_REGISTRY || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    nullifierRegistry: (process.env.NEXT_PUBLIC_NULLIFIER_REGISTRY || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    consentRegistry: (process.env.NEXT_PUBLIC_CONSENT_REGISTRY || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    revocationRegistry: (process.env.NEXT_PUBLIC_REVOCATION_REGISTRY || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    verifierRegistry: (process.env.NEXT_PUBLIC_VERIFIER_REGISTRY || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    auditTrail: (process.env.NEXT_PUBLIC_AUDIT_TRAIL || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    groth16Verifier: (process.env.NEXT_PUBLIC_GROTH16_VERIFIER || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    zkpOrchestrator: (process.env.NEXT_PUBLIC_ZKP_ORCHESTRATOR || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  },
  // Base Mainnet (Chain ID: 8453) - update after mainnet deployment
  8453: {
    issuerRegistry: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    nullifierRegistry: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    consentRegistry: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    revocationRegistry: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    verifierRegistry: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    auditTrail: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    groth16Verifier: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    zkpOrchestrator: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
} as const;

// Default to Base Sepolia for development
export const DEFAULT_CHAIN_ID = 84532;

export function getContractAddresses(chainId: number = DEFAULT_CHAIN_ID) {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES[84532];
}
