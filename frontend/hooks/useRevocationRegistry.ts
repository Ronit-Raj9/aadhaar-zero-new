'use client';

import { useReadContract } from 'wagmi';
import { RevocationRegistryABI } from '@/lib/contracts/abis';
import { getContractAddresses } from '@/lib/contracts/addresses';
import type { Hex } from 'viem';

const addresses = getContractAddresses();

/**
 * Check if a credential has been revoked
 */
export function useRevocationStatus(credentialId: Hex | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: addresses.revocationRegistry,
    abi: RevocationRegistryABI,
    functionName: 'isRevoked',
    args: credentialId ? [credentialId] : undefined,
    query: { enabled: !!credentialId },
  });

  return {
    isRevoked: data as boolean | undefined,
    isLoading,
    refetch,
  };
}

/**
 * Get full revocation record
 */
export function useRevocationRecord(credentialId: Hex | undefined) {
  const { data, isLoading } = useReadContract({
    address: addresses.revocationRegistry,
    abi: RevocationRegistryABI,
    functionName: 'getRevocationRecord',
    args: credentialId ? [credentialId] : undefined,
    query: { enabled: !!credentialId },
  });

  return {
    record: data as
      | { revoked: boolean; revokedBy: Hex; revokedAt: bigint; reason: string }
      | undefined,
    isLoading,
  };
}
