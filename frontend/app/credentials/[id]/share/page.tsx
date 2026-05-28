'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { credentialsAPI } from '@/lib/api-client';
import { Credential } from '@/lib/types';
import { ArrowLeft, Copy, Download, Shield, CheckCircle, Loader2, AlertCircle, Zap, Clock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useZKPVerification, type ZKPStatus } from '@/hooks/useZKPVerification';

/** Map ZKP status to human-readable labels */
const STATUS_LABELS: Record<ZKPStatus, { label: string; color: string }> = {
  idle: { label: 'Ready', color: 'text-muted-foreground' },
  'generating-proof': { label: 'Generating Groth16 Proof...', color: 'text-blue-500' },
  'proof-ready': { label: 'Proof Generated ✓', color: 'text-green-500' },
  'submitting-tx': { label: 'Submitting to Base Sepolia...', color: 'text-yellow-500' },
  confirming: { label: 'Confirming on-chain...', color: 'text-yellow-500' },
  verified: { label: 'Verified on-chain ✓', color: 'text-green-600' },
  error: { label: 'Error', color: 'text-red-500' },
};

export default function ShareCredentialPage() {
  const router = useRouter();
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { address: walletAddress, isConnected } = useAccount();

  // Real ZKP hook
  const {
    state: zkpState,
    generateProof,
    submitProofOnChain,
    reset: resetZKP,
    isGenerating,
    isPending,
    isVerified,
  } = useZKPVerification();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const loadCredential = async () => {
      try {
        const response = await credentialsAPI.getCredential(id as string);
        if (response.success && response.data) {
          setCredential(response.data);
        }
      } catch (error) {
        console.error('Error loading credential:', error);
        toast.error('Failed to load credential');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) loadCredential();
  }, [isAuthenticated, router, id]);

  /** Handle ZKP proof generation */
  const handleGenerateProof = async () => {
    if (!credential) return;

    // Extract DOB from credential metadata
    const dob = credential.metadata.dateOfBirth;
    if (!dob) {
      toast.error('No date of birth found in credential metadata');
      return;
    }

    // Parse DOB (could be YYYY-MM-DD or similar format)
    const dobDate = new Date(dob);
    const birthYear = dobDate.getFullYear();
    const birthMonth = dobDate.getMonth() + 1;
    const birthDay = dobDate.getDate();

    if (isNaN(birthYear) || birthYear < 1900) {
      toast.error('Invalid date of birth in credential');
      return;
    }

    const result = await generateProof(birthYear, birthMonth, birthDay, 18);
    if (result) {
      toast.success(`ZK proof generated in ${result.generationTimeMs}ms`);
    }
  };

  /** Handle on-chain submission */
  const handleSubmitOnChain = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    await submitProofOnChain();
  };

  const copyProofData = () => {
    if (zkpState.proof) {
      const proofData = JSON.stringify({
        type: 'groth16-age-proof',
        nullifier: zkpState.proof.nullifierHex,
        publicSignals: zkpState.proof.rawProof.publicSignals,
        proof: {
          a: zkpState.proof.rawProof.pA,
          b: zkpState.proof.rawProof.pB,
          c: zkpState.proof.rawProof.pC,
        },
      }, null, 2);
      navigator.clipboard.writeText(proofData);
      toast.success('Proof data copied to clipboard');
    }
  };

  const downloadQR = () => {
    const element = document.getElementById('qrcode');
    if (element) {
      const link = document.createElement('a');
      link.href = (element.querySelector('canvas') as HTMLCanvasElement)?.toDataURL() || '';
      link.download = `credential-${credential?.id}-zkp-proof.png`;
      link.click();
      toast.success('QR code downloaded');
    }
  };

  if (!isAuthenticated || isLoading) {
    return null;
  }

  if (!credential) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center space-y-4">
              <p className="text-muted-foreground">Credential not found</p>
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Card>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-4xl font-bold">Share Credential</h1>
            <p className="text-muted-foreground">
              Generate a Groth16 zero-knowledge proof and verify it on-chain
            </p>
          </motion.div>

          {/* Credential Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 border-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Credential Type</p>
                  <p className="text-2xl font-bold capitalize">{credential.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold text-green-600">Active</p>
                </div>
              </div>

              {credential.metadata.firstName && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Credential Holder</p>
                  <p className="font-semibold">
                    {credential.metadata.firstName} {credential.metadata.lastName}
                  </p>
                </div>
              )}

              {/* Blockchain Security Info */}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-medium">On-Chain Security</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Wallet:</span>{' '}
                    {isConnected ? (
                      <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/30">
                        {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500/30">
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Network:</span>{' '}
                    <Badge variant="outline" className="text-[10px]">Base Sepolia</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ZKP Proof Generation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-8 border-border space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-2xl font-bold">Groth16 Zero-Knowledge Proof</h2>
                </div>
                <p className="text-muted-foreground text-sm">
                  Generate a cryptographic proof that you are 18+ without revealing your date of birth.
                  Uses the Groth16 proving system on the BN254 elliptic curve.
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  zkpState.status === 'error' ? 'bg-red-500' :
                  zkpState.status === 'verified' ? 'bg-green-500' :
                  zkpState.status === 'idle' ? 'bg-gray-400' :
                  'bg-yellow-500 animate-pulse'
                }`} />
                <span className={`text-sm font-medium ${STATUS_LABELS[zkpState.status].color}`}>
                  {STATUS_LABELS[zkpState.status].label}
                </span>
                {zkpState.generationTimeMs && zkpState.status !== 'idle' && (
                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {zkpState.generationTimeMs}ms
                  </span>
                )}
              </div>

              {/* Error Display */}
              <AnimatePresence>
                {zkpState.error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">{zkpState.error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step 1: Generate Proof */}
              {(zkpState.status === 'idle' || zkpState.status === 'error') && (
                <Button
                  onClick={handleGenerateProof}
                  disabled={isGenerating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 gap-2"
                >
                  <Shield className="w-5 h-5" />
                  Generate Groth16 Proof
                </Button>
              )}

              {/* Generating Animation */}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4 py-6"
                >
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium">Computing Groth16 proof...</p>
                    <p className="text-xs text-muted-foreground">
                      Running circuit with 353 constraints (BN254 curve, Poseidon hash)
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Proof Generated - Show Details + Submit */}
              {(zkpState.status === 'proof-ready' || zkpState.status === 'submitting-tx' || zkpState.status === 'confirming' || zkpState.status === 'verified') && zkpState.proof && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  {/* Proof Details */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold">Proof Details</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Proving System:</span>{' '}
                        <span className="font-mono">Groth16</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Curve:</span>{' '}
                        <span className="font-mono">BN254</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Constraints:</span>{' '}
                        <span className="font-mono">353</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hash:</span>{' '}
                        <span className="font-mono">Poseidon</span>
                      </div>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Nullifier:</span>{' '}
                      <span className="font-mono break-all">{zkpState.proof.nullifierHex.slice(0, 22)}...</span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="bg-muted/50 rounded-lg p-6 flex flex-col items-center gap-4">
                    <div
                      id="qrcode"
                      className="bg-white p-4 rounded-lg"
                      style={{ width: '250px', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <QRCode
                        value={JSON.stringify({
                          type: 'groth16-age-proof',
                          nullifier: zkpState.proof.nullifierHex,
                          signals: zkpState.proof.rawProof.publicSignals,
                          txHash: zkpState.txHash || undefined,
                        })}
                        size={220}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Scan to verify this Groth16 proof
                    </p>
                  </div>

                  {/* On-Chain Verification Button */}
                  {zkpState.status === 'proof-ready' && (
                    <Button
                      onClick={handleSubmitOnChain}
                      disabled={!isConnected || isPending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12 gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Verify On-Chain (Base Sepolia)
                    </Button>
                  )}

                  {/* Transaction Pending */}
                  {(zkpState.status === 'submitting-tx' || zkpState.status === 'confirming') && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                      <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                      <span className="text-sm text-yellow-700 dark:text-yellow-300">
                        {zkpState.status === 'submitting-tx' ? 'Waiting for wallet approval...' : 'Confirming transaction...'}
                      </span>
                    </div>
                  )}

                  {/* Transaction Hash */}
                  {zkpState.txHash && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <span className="text-xs text-muted-foreground">Tx:</span>
                      <a
                        href={`https://sepolia.basescan.org/tx/${zkpState.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-blue-500 hover:text-blue-600 flex items-center gap-1"
                      >
                        {zkpState.txHash.slice(0, 10)}...{zkpState.txHash.slice(-8)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Verified Badge */}
                  {isVerified && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800 dark:text-green-200">
                          Verified On-Chain
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Proof validated by Groth16Verifier smart contract on Base Sepolia
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button onClick={copyProofData} variant="outline" className="flex-1 gap-2">
                      <Copy className="w-4 h-4" />
                      Copy Proof
                    </Button>
                    <Button onClick={downloadQR} variant="outline" className="flex-1 gap-2">
                      <Download className="w-4 h-4" />
                      Download QR
                    </Button>
                    <Button onClick={resetZKP} variant="outline" className="gap-2">
                      New Proof
                    </Button>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>

          {/* Technical Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6 border-border bg-blue-50 dark:bg-blue-950/30 space-y-3">
              <p className="font-semibold text-blue-900 dark:text-blue-100">How Groth16 ZK Proofs Work</p>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex gap-2">
                  <span className="font-mono text-xs mt-0.5">1.</span>
                  <span>Your date of birth stays <strong>private</strong> — only the proof that you&apos;re 18+ is shared</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-xs mt-0.5">2.</span>
                  <span>The Groth16 proof is generated <strong>client-side</strong> using WASM (your data never leaves your browser)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-xs mt-0.5">3.</span>
                  <span>A <strong>Poseidon nullifier</strong> prevents proof replay — each proof can only be used once</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-mono text-xs mt-0.5">4.</span>
                  <span>The proof is verified <strong>on-chain</strong> by the Groth16Verifier contract using BN254 pairing checks</span>
                </li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </main>
    </>
  );
}
