/**
 * @module useZKPVerification - wagmi hook for on-chain ZKP age verification
 * 
 * Manages the full flow:
 *  1. Generate Groth16 proof client-side (snarkjs WASM)
 *  2. Submit proof to ZKPVerificationOrchestrator on Base Sepolia
 *  3. Track transaction status
 *  4. Return verification result
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { ZKPOrchestratorABI } from '@/lib/contracts/abis';
import { getContractAddresses } from '@/lib/contracts/addresses';
import {
  generateAgeProof,
  generateUserSecret,
  type ZKPInput,
  type ZKPResult,
} from '@/lib/zkp';

// ─── Types ─────────────────────────────────────
export type ZKPStatus =
  | 'idle'
  | 'generating-proof'
  | 'proof-ready'
  | 'submitting-tx'
  | 'confirming'
  | 'verified'
  | 'error';

export interface ZKPVerificationState {
  status: ZKPStatus;
  proof: ZKPResult | null;
  txHash: `0x${string}` | null;
  error: string | null;
  generationTimeMs: number | null;
}

export interface UseZKPVerificationReturn {
  /** Current state of the verification process */
  state: ZKPVerificationState;
  /** Generate a ZK proof of age (client-side) */
  generateProof: (birthYear: number, birthMonth: number, birthDay: number, ageThreshold?: number) => Promise<ZKPResult | null>;
  /** Submit the generated proof on-chain */
  submitProofOnChain: () => Promise<void>;
  /** Full flow: generate proof + submit on-chain */
  verifyAge: (birthYear: number, birthMonth: number, birthDay: number, ageThreshold?: number) => Promise<void>;
  /** Reset state */
  reset: () => void;
  /** Whether a proof is currently being generated */
  isGenerating: boolean;
  /** Whether a transaction is pending */
  isPending: boolean;
  /** Whether verification is complete */
  isVerified: boolean;
}

export function useZKPVerification(): UseZKPVerificationReturn {
  const addresses = getContractAddresses();

  const [state, setState] = useState<ZKPVerificationState>({
    status: 'idle',
    proof: null,
    txHash: null,
    error: null,
    generationTimeMs: null,
  });

  // wagmi write hook
  const { writeContractAsync, isPending: isTxPending } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: state.txHash ?? undefined,
    });

  // Update state when transaction is confirmed (via useEffect to avoid render-time updates)
  useEffect(() => {
    if (isConfirmed && state.status === 'confirming') {
      setState((prev) => ({ ...prev, status: 'verified' }));
    }
  }, [isConfirmed, state.status]);

  // ─── Generate Proof (Client-Side) ──────────
  const generateProof = useCallback(
    async (
      birthYear: number,
      birthMonth: number,
      birthDay: number,
      ageThreshold = 18
    ): Promise<ZKPResult | null> => {
      try {
        setState((prev) => ({
          ...prev,
          status: 'generating-proof',
          error: null,
        }));

        // Generate a random secret for this proof session
        const userSecret = generateUserSecret();

        // Use the ZKP orchestrator address as the verifier
        const verifierAddress = addresses.zkpOrchestrator;

        const input: ZKPInput = {
          birthYear,
          birthMonth,
          birthDay,
          userSecret,
          ageThreshold,
          verifierAddress,
        };

        const result = await generateAgeProof(input);

        setState((prev) => ({
          ...prev,
          status: 'proof-ready',
          proof: result,
          generationTimeMs: result.generationTimeMs,
        }));

        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Proof generation failed';
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: message,
        }));
        return null;
      }
    },
    [addresses.zkpOrchestrator]
  );

  // ─── Submit Proof On-Chain ─────────────────
  const submitProofOnChain = useCallback(async () => {
    if (!state.proof) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: 'No proof generated. Generate a proof first.',
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, status: 'submitting-tx', error: null }));

      const { a, b, c, pubSignals } = state.proof.proof;

      const txHash = await writeContractAsync({
        address: addresses.zkpOrchestrator,
        abi: ZKPOrchestratorABI,
        functionName: 'verifyAgeProof',
        args: [a, b, c, pubSignals],
      });

      setState((prev) => ({
        ...prev,
        status: 'confirming',
        txHash,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Transaction failed';
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: message,
      }));
    }
  }, [state.proof, writeContractAsync, addresses.zkpOrchestrator]);

  // ─── Full Flow: Generate + Submit ──────────
  const verifyAge = useCallback(
    async (
      birthYear: number,
      birthMonth: number,
      birthDay: number,
      ageThreshold = 18
    ) => {
      const result = await generateProof(
        birthYear,
        birthMonth,
        birthDay,
        ageThreshold
      );
      if (result) {
        // Auto-submit after generation
        // Small delay to let React re-render
        await new Promise((r) => setTimeout(r, 100));
        await submitProofOnChain();
      }
    },
    [generateProof, submitProofOnChain]
  );

  // ─── Reset ─────────────────────────────────
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      proof: null,
      txHash: null,
      error: null,
      generationTimeMs: null,
    });
  }, []);

  return {
    state,
    generateProof,
    submitProofOnChain,
    verifyAge,
    reset,
    isGenerating: state.status === 'generating-proof',
    isPending: isTxPending || isConfirming,
    isVerified: state.status === 'verified',
  };
}

/**
 * Hook to read on-chain ZKP verification stats
 */
export function useZKPStats() {
  const addresses = getContractAddresses();

  const { data: totalVerifications } = useReadContract({
    address: addresses.zkpOrchestrator,
    abi: ZKPOrchestratorABI,
    functionName: 'totalVerifications',
  });

  return {
    totalVerifications: totalVerifications ? Number(totalVerifications) : 0,
  };
}
