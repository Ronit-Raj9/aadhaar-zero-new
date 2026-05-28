// Server-side blockchain utilities (used in API routes)
// Uses viem directly for server-side contract interactions

import { createPublicClient, createWalletClient, http, keccak256, encodePacked, type Hex } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { getContractAddresses } from './contracts/addresses';
import {
  NullifierRegistryABI,
  IssuerRegistryABI,
  ConsentRegistryABI,
  RevocationRegistryABI,
  VerifierRegistryABI,
  AuditTrailABI,
} from './contracts/abis';

// ---- Clients ----

const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(rpcUrl),
});

// Backend wallet client (for system writes like marking nullifiers, anchoring audit logs)
function getWalletClient() {
  const privateKey = process.env.BACKEND_PRIVATE_KEY;
  if (!privateKey) {
    console.warn('BACKEND_PRIVATE_KEY not set - blockchain writes will fail');
    return null;
  }
  const account = privateKeyToAccount(privateKey as Hex);
  return createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(rpcUrl),
  });
}

const addresses = getContractAddresses();

// ---- Nullifier Registry ----

export async function isNullifierUsed(nullifier: Hex): Promise<boolean> {
  try {
    const result = await publicClient.readContract({
      address: addresses.nullifierRegistry,
      abi: NullifierRegistryABI,
      functionName: 'isNullifierUsed',
      args: [nullifier],
    });
    return result as boolean;
  } catch (error) {
    console.error('Error checking nullifier:', error);
    return false;
  }
}

export async function markNullifierUsed(nullifier: Hex, verifier: Hex, purposeHash: Hex): Promise<Hex | null> {
  const wallet = getWalletClient();
  if (!wallet) return null;

  try {
    const hash = await wallet.writeContract({
      address: addresses.nullifierRegistry,
      abi: NullifierRegistryABI,
      functionName: 'markNullifierUsed',
      args: [nullifier, verifier, purposeHash],
    });
    return hash;
  } catch (error) {
    console.error('Error marking nullifier:', error);
    return null;
  }
}

// ---- Issuer Registry ----

export async function isAuthorizedIssuer(issuerAddress: Hex): Promise<boolean> {
  try {
    const result = await publicClient.readContract({
      address: addresses.issuerRegistry,
      abi: IssuerRegistryABI,
      functionName: 'isAuthorizedIssuer',
      args: [issuerAddress],
    });
    return result as boolean;
  } catch (error) {
    console.error('Error checking issuer:', error);
    return false;
  }
}

// ---- Revocation Registry ----

export async function isCredentialRevoked(credentialId: Hex): Promise<boolean> {
  try {
    const result = await publicClient.readContract({
      address: addresses.revocationRegistry,
      abi: RevocationRegistryABI,
      functionName: 'isRevoked',
      args: [credentialId],
    });
    return result as boolean;
  } catch (error) {
    console.error('Error checking revocation:', error);
    return false;
  }
}

export async function revokeCredentialOnChain(
  credentialId: string,
  reason: string
): Promise<Hex | null> {
  const wallet = getWalletClient();
  if (!wallet) return null;

  try {
    // Convert UUID to bytes32 via keccak256
    const credentialIdHash = keccak256(encodePacked(['string'], [credentialId]));
    const hash = await wallet.writeContract({
      address: addresses.revocationRegistry,
      abi: RevocationRegistryABI,
      functionName: 'revokeCredential',
      args: [credentialIdHash, reason],
    });
    return hash;
  } catch (error) {
    console.error('Error revoking credential on-chain:', error);
    return null;
  }
}

// ---- Verifier Registry ----

export async function isAuthorizedVerifier(verifierAddress: Hex): Promise<boolean> {
  try {
    const result = await publicClient.readContract({
      address: addresses.verifierRegistry,
      abi: VerifierRegistryABI,
      functionName: 'isAuthorizedVerifier',
      args: [verifierAddress],
    });
    return result as boolean;
  } catch (error) {
    console.error('Error checking verifier:', error);
    return false;
  }
}

// ---- Consent Registry ----

export async function recordConsent(
  consentHash: Hex,
  attributesMerkleRoot: Hex,
  verifier: Hex,
  purposeCode: Hex
): Promise<Hex | null> {
  const wallet = getWalletClient();
  if (!wallet) return null;

  try {
    const hash = await wallet.writeContract({
      address: addresses.consentRegistry,
      abi: ConsentRegistryABI,
      functionName: 'recordConsent',
      args: [consentHash, attributesMerkleRoot, verifier, purposeCode],
    });
    return hash;
  } catch (error) {
    console.error('Error recording consent:', error);
    return null;
  }
}

// ---- Audit Trail ----

export async function anchorMerkleRoot(merkleRoot: Hex, batchSize: number): Promise<Hex | null> {
  const wallet = getWalletClient();
  if (!wallet) return null;

  try {
    const hash = await wallet.writeContract({
      address: addresses.auditTrail,
      abi: AuditTrailABI,
      functionName: 'anchorMerkleRoot',
      args: [merkleRoot, BigInt(batchSize)],
    });
    return hash;
  } catch (error) {
    console.error('Error anchoring merkle root:', error);
    return null;
  }
}

// ---- Hash Utilities ----

export function generateNullifier(
  credentialHash: string,
  verifierAddress: string,
  timestamp: number,
  userSecret: string = 'default_secret'
): Hex {
  return keccak256(
    encodePacked(
      ['bytes32', 'address', 'uint256', 'string'],
      [credentialHash as Hex, verifierAddress as Hex, BigInt(timestamp), userSecret]
    )
  );
}

export function generateConsentHash(
  userWallet: string,
  verifierAddress: string,
  purposeCode: string,
  attributesMerkleRoot: string,
  timestamp: number,
  nonce: string
): Hex {
  return keccak256(
    encodePacked(
      ['address', 'address', 'bytes32', 'bytes32', 'uint256', 'string'],
      [
        userWallet as Hex,
        verifierAddress as Hex,
        keccak256(encodePacked(['string'], [purposeCode])),
        attributesMerkleRoot as Hex,
        BigInt(timestamp),
        nonce,
      ]
    )
  );
}

export function generateCredentialId(
  issuerAddress: string,
  userIdentifierHash: string,
  credentialType: string,
  timestamp: number
): Hex {
  return keccak256(
    encodePacked(
      ['address', 'bytes32', 'string', 'uint256'],
      [issuerAddress as Hex, userIdentifierHash as Hex, credentialType, BigInt(timestamp)]
    )
  );
}

export function hashPurpose(purpose: string): Hex {
  return keccak256(encodePacked(['string'], [purpose]));
}
