'use client';

import { useReadContract } from 'wagmi';
import { AuditTrailABI } from '@/lib/contracts/abis';
import { getContractAddresses } from '@/lib/contracts/addresses';
import type { Hex } from 'viem';

const addresses = getContractAddresses();

/**
 * Get total audit batch count
 */
export function useAuditBatchCount() {
  const { data, isLoading } = useReadContract({
    address: addresses.auditTrail,
    abi: AuditTrailABI,
    functionName: 'getBatchCount',
  });

  return {
    count: data ? Number(data) : 0,
    isLoading,
  };
}

/**
 * Get a specific audit batch
 */
export function useAuditBatch(batchId: number | undefined) {
  const { data, isLoading } = useReadContract({
    address: addresses.auditTrail,
    abi: AuditTrailABI,
    functionName: 'getAuditBatch',
    args: batchId !== undefined ? [BigInt(batchId)] : undefined,
    query: { enabled: batchId !== undefined },
  });

  return {
    batch: data as
      | { merkleRoot: Hex; batchSize: bigint; timestamp: bigint; submitter: Hex }
      | undefined,
    isLoading,
  };
}

/**
 * Verify a log inclusion in a batch
 */
export function useVerifyLogInclusion(
  logHash: Hex | undefined,
  proof: Hex[] | undefined,
  batchId: number | undefined
) {
  const { data, isLoading } = useReadContract({
    address: addresses.auditTrail,
    abi: AuditTrailABI,
    functionName: 'verifyLogInclusion',
    args:
      logHash && proof && batchId !== undefined
        ? [logHash, proof, BigInt(batchId)]
        : undefined,
    query: { enabled: !!logHash && !!proof && batchId !== undefined },
  });

  return {
    isIncluded: data as boolean | undefined,
    isLoading,
  };
}
