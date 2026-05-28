'use client';

import { useReadContract } from 'wagmi';
import { IssuerRegistryABI } from '@/lib/contracts/abis';
import { getContractAddresses } from '@/lib/contracts/addresses';
import type { Hex } from 'viem';

const addresses = getContractAddresses();

/**
 * Check if an address is an authorized issuer
 */
export function useIssuerStatus(issuerAddress: Hex | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: addresses.issuerRegistry,
    abi: IssuerRegistryABI,
    functionName: 'isAuthorizedIssuer',
    args: issuerAddress ? [issuerAddress] : undefined,
    query: { enabled: !!issuerAddress },
  });

  return {
    isAuthorized: data as boolean | undefined,
    isLoading,
    refetch,
  };
}

/**
 * Get issuer metadata
 */
export function useIssuerInfo(issuerAddress: Hex | undefined) {
  const { data, isLoading } = useReadContract({
    address: addresses.issuerRegistry,
    abi: IssuerRegistryABI,
    functionName: 'getIssuerInfo',
    args: issuerAddress ? [issuerAddress] : undefined,
    query: { enabled: !!issuerAddress },
  });

  return {
    info: data as
      | { name: string; addedAt: bigint; isActive: boolean; credentialsIssued: bigint }
      | undefined,
    isLoading,
  };
}

/**
 * Get total issuer count
 */
export function useIssuerCount() {
  const { data, isLoading } = useReadContract({
    address: addresses.issuerRegistry,
    abi: IssuerRegistryABI,
    functionName: 'getIssuerCount',
  });

  return {
    count: data ? Number(data) : 0,
    isLoading,
  };
}
