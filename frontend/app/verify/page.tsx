'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { blockchainVerifyAPI } from '@/lib/api-client';
import { VerificationResult } from '@/lib/types';
import { TransactionLink } from '@/components/BlockchainStatus';
import { QrCode, Check, X, Clock, Shield, AlertTriangle, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function VerifyPage() {
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'verify'>('select');
  const [proofToken, setProofToken] = useState('');
  const [verifierName, setVerifierName] = useState('');
  const [verifierAddress, setVerifierAddress] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proofToken || !verifierName) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsVerifying(true);
    try {
      // Call blockchain-aware verification API
      const response = await blockchainVerifyAPI.verifyProof({
        proofToken,
        verifierName,
        verifierAddress: verifierAddress || undefined,
        purpose: 'CREDENTIAL_VERIFICATION',
      });

      if (response.success && response.data) {
        setVerificationResult(response.data);
        toast.success('Credential verified successfully!');
      } else {
        toast.error(response.error || 'Verification failed');
      }
    } catch (error) {
      toast.error('Verification failed');
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

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
            className="text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Verify Credentials</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Verify zero-knowledge proofs from credential holders securely and instantly
            </p>
          </motion.div>

          {/* Verification Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-8 border-border">
              {!verificationResult ? (
                <form onSubmit={handleVerify} className="space-y-6">
                  {/* Verifier Name */}
                  <div className="space-y-2">
                    <Label htmlFor="verifier" className="text-sm font-medium">
                      Your Organization Name
                    </Label>
                    <Input
                      id="verifier"
                      type="text"
                      placeholder="e.g., HDFC Bank, Insurance XYZ"
                      value={verifierName}
                      onChange={(e) => setVerifierName(e.target.value)}
                      disabled={isVerifying}
                      className="h-10"
                    />
                  </div>

                  {/* Verifier Wallet Address (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="verifierAddress" className="text-sm font-medium">
                      Verifier Wallet Address <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="verifierAddress"
                      type="text"
                      placeholder="0x..."
                      value={verifierAddress}
                      onChange={(e) => setVerifierAddress(e.target.value)}
                      disabled={isVerifying}
                      className="h-10 font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Provide a wallet address for on-chain verification checks
                    </p>
                  </div>

                  {/* Proof Token */}
                  <div className="space-y-2">
                    <Label htmlFor="proof" className="text-sm font-medium">
                      Proof Token
                    </Label>
                    <textarea
                      id="proof"
                      placeholder="Paste the proof token here or scan the QR code"
                      value={proofToken}
                      onChange={(e) => setProofToken(e.target.value)}
                      disabled={isVerifying}
                      className="w-full h-32 p-3 rounded-lg border border-border bg-background text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <p className="text-xs text-muted-foreground">
                      You can paste the proof token directly or use a QR code scanner
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      onClick={() => router.push('/landing')}
                      disabled={isVerifying}
                      variant="outline"
                      className="flex-1 h-10"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isVerifying || !proofToken || !verifierName}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Verify Proof
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Result */}
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto"
                    >
                      <Check className="w-8 h-8 text-green-600" />
                    </motion.div>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold text-green-600">Verified</p>
                      <p className="text-muted-foreground">
                        The credential proof is valid and authentic
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-6 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Credential Type</p>
                        <p className="font-semibold capitalize">
                          {verificationResult.credentialType}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="font-semibold text-green-600">
                          {verificationResult.status.charAt(0).toUpperCase() +
                            verificationResult.status.slice(1)}
                        </p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <p className="text-xs text-muted-foreground">Issuer</p>
                        <p className="font-semibold">{verificationResult.issuerName}</p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <p className="text-xs text-muted-foreground">Verification Time</p>
                        <p className="font-semibold text-xs font-mono">
                          {new Date(verificationResult.verificationTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Checks */}
                  {verificationResult.blockchainChecks && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                          On-Chain Verification
                        </p>
                      </div>
                      <div className="grid gap-2">
                        {Object.entries(verificationResult.blockchainChecks).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between text-xs">
                            <span className="text-blue-800 dark:text-blue-200 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <Badge
                              variant={value === 'PASSED' || value === 'AUTHORIZED' ? 'default' : 'secondary'}
                              className={`text-[10px] ${
                                value === 'PASSED' || value === 'AUTHORIZED'
                                  ? 'bg-green-500/10 text-green-600'
                                  : value === 'skipped'
                                  ? 'bg-gray-500/10 text-gray-500'
                                  : 'bg-yellow-500/10 text-yellow-600'
                              }`}
                            >
                              {value}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Score */}
                  {verificationResult.riskScore !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">AI Risk Score</span>
                      </div>
                      <Badge
                        className={`${
                          verificationResult.riskLevel === 'LOW'
                            ? 'bg-green-500/10 text-green-600'
                            : verificationResult.riskLevel === 'MEDIUM'
                            ? 'bg-yellow-500/10 text-yellow-600'
                            : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        {verificationResult.riskScore}/100 — {verificationResult.riskLevel}
                      </Badge>
                    </div>
                  )}

                  {/* Nullifier Tx Hash */}
                  {verificationResult.nullifierTxHash && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm">
                      <span className="text-muted-foreground">Nullifier Tx</span>
                      <TransactionLink txHash={verificationResult.nullifierTxHash} />
                    </div>
                  )}

                  {/* Privacy Notice */}
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-2">
                    <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                      Privacy Protected
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      No personal information was revealed during verification. The holder proved
                      their credential authenticity without exposing their data.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4 border-t border-border">
                    <Button
                      type="button"
                      onClick={() => {
                        setStep('select');
                        setProofToken('');
                        setVerifierName('');
                        setVerificationResult(null);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10"
                    >
                      Verify Another Proof
                    </Button>
                    <Button
                      type="button"
                      onClick={() => router.push('/')}
                      variant="outline"
                      className="flex-1 h-10"
                    >
                      Done
                    </Button>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: QrCode,
                title: 'Scan or Paste',
                description: 'Scan the QR code or paste the proof token',
              },
              {
                icon: Check,
                title: 'Instant Verification',
                description: 'Verify credentials in seconds with cryptography',
              },
              {
                icon: Clock,
                title: 'Privacy First',
                description: 'No personal data is revealed during verification',
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <Card key={i} className="p-6 border-border">
                  <Icon className="w-8 h-8 text-blue-600 mb-4" />
                  <p className="font-semibold mb-2">{card.title}</p>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </Card>
              );
            })}
          </motion.div>
        </div>
      </main>
    </>
  );
}
