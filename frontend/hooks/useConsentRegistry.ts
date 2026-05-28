'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConsentRegistryABI } from '@/lib/contracts/abis';
import { getContractAddresses } from '@/lib/contracts/addresses';
import type { Hex } from 'viem';

const addresses = getContractAddresses();

/**
 * Record consent on-chain (user signs this transaction)
 */
export function useRecordConsent() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const recordConsent = (
    consentHash: Hex,
    attributesMerkleRoot: Hex,
    verifier: Hex,
    purposeCode: Hex
  ) => {
    writeContract({
      address: addresses.consentRegistry,
      abi: ConsentRegistryABI,
      functionName: 'recordConsent',
      args: [consentHash, attributesMerkleRoot, verifier, purposeCode],
    });
  };

  return {
    recordConsent,
    isPending,
    isConfirming,
    isSuccess,
    txHash: hash,
    error,
  };
}

/**
 * Revoke a previously given consent
 */
export function useRevokeConsent() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const revokeConsent = (consentHash: Hex) => {
    writeContract({
      address: addresses.consentRegistry,
      abi: ConsentRegistryABI,
      functionName: 'revokeConsent',
      args: [consentHash],
    });
  };

  return {
    revokeConsent,
    isPending,
    isConfirming,
    isSuccess,
    txHash: hash,
    error,
  };
}

/**
 * Check if a consent is active
 */
export function useConsentStatus(consentHash: Hex | undefined) {
  const { data, isLoading } = useReadContract({
    address: addresses.consentRegistry,
    abi: ConsentRegistryABI,
    functionName: 'isConsentActive',
    args: consentHash ? [consentHash] : undefined,
    query: { enabled: !!consentHash },
  });

  return {
    isActive: data as boolean | undefined,
    isLoading,
  };
}

/**
 * Get user's consent count
 */
export function useUserConsentCount(userAddress: Hex | undefined) {
  const { data, isLoading } = useReadContract({
    address: addresses.consentRegistry,
    abi: ConsentRegistryABI,
    functionName: 'getUserConsentCount',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress },
  });

  return {
    count: data ? Number(data) : 0,
    isLoading,
  };
}
