'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { NullifierRegistryABI } from '@/lib/contracts/abis';
import { getContractAddresses } from '@/lib/contracts/addresses';
import type { Hex } from 'viem';

const addresses = getContractAddresses();

/**
 * Check if a nullifier has been used (prevents replay attacks)
 */
export function useNullifierStatus(nullifier: Hex | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: addresses.nullifierRegistry,
    abi: NullifierRegistryABI,
    functionName: 'isNullifierUsed',
    args: nullifier ? [nullifier] : undefined,
    query: { enabled: !!nullifier },
  });

  return {
    isUsed: data as boolean | undefined,
    isLoading,
    refetch,
  };
}

/**
 * Mark a nullifier as used on-chain
 */
export function useMarkNullifier() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const markNullifier = (nullifier: Hex, verifier: Hex, purposeHash: Hex) => {
    writeContract({
      address: addresses.nullifierRegistry,
      abi: NullifierRegistryABI,
      functionName: 'markNullifierUsed',
      args: [nullifier, verifier, purposeHash],
    });
  };

  return {
    markNullifier,
    isPending,
    isConfirming,
    isSuccess,
    txHash: hash,
    error,
  };
}

/**
 * Get nullifier metadata
 */
export function useNullifierMetadata(nullifier: Hex | undefined) {
  const { data, isLoading } = useReadContract({
    address: addresses.nullifierRegistry,
    abi: NullifierRegistryABI,
    functionName: 'getNullifierMetadata',
    args: nullifier ? [nullifier] : undefined,
    query: { enabled: !!nullifier },
  });

  return {
    metadata: data as
      | { used: boolean; verifier: Hex; purposeHash: Hex; timestamp: bigint }
      | undefined,
    isLoading,
  };
}

/**
 * Get total nullifiers count
 */
export function useTotalNullifiers() {
  const { data, isLoading } = useReadContract({
    address: addresses.nullifierRegistry,
    abi: NullifierRegistryABI,
    functionName: 'getTotalNullifiers',
  });

  return {
    total: data ? Number(data) : 0,
    isLoading,
  };
}
