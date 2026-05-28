'use client';

import { useReadContract } from 'wagmi';
import { VerifierRegistryABI } from '@/lib/contracts/abis';
import { getContractAddresses } from '@/lib/contracts/addresses';
import type { Hex } from 'viem';

const addresses = getContractAddresses();

/**
 * Check if an address is an authorized verifier
 */
export function useVerifierStatus(verifierAddress: Hex | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: addresses.verifierRegistry,
    abi: VerifierRegistryABI,
    functionName: 'isAuthorizedVerifier',
    args: verifierAddress ? [verifierAddress] : undefined,
    query: { enabled: !!verifierAddress },
  });

  return {
    isAuthorized: data as boolean | undefined,
    isLoading,
    refetch,
  };
}

/**
 * Get verifier metadata
 */
export function useVerifierInfo(verifierAddress: Hex | undefined) {
  const { data, isLoading } = useReadContract({
    address: addresses.verifierRegistry,
    abi: VerifierRegistryABI,
    functionName: 'getVerifierInfo',
    args: verifierAddress ? [verifierAddress] : undefined,
    query: { enabled: !!verifierAddress },
  });

  return {
    info: data as
      | {
          name: string;
          category: number;
          reputationScore: number;
          verificationCount: bigint;
          isActive: boolean;
          registeredAt: bigint;
        }
      | undefined,
    isLoading,
  };
}

/**
 * Get total verifier count
 */
export function useVerifierCount() {
  const { data, isLoading } = useReadContract({
    address: addresses.verifierRegistry,
    abi: VerifierRegistryABI,
    functionName: 'getVerifierCount',
  });

  return {
    count: data ? Number(data) : 0,
    isLoading,
  };
}
