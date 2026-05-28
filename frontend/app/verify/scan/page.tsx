'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { blockchainVerifyAPI } from '@/lib/api-client';
import { VerificationResult } from '@/lib/types';
import { QrCode, Check, X, Shield, ArrowLeft, Camera, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScanVerifyPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = useCallback(
    async (result: { rawValue: string }[]) => {
      if (!result?.[0]?.rawValue || isVerifying || !scanning) return;

      const raw = result[0].rawValue;
      setScannedData(raw);
      setScanning(false);
      setIsVerifying(true);

      try {
        // Parse scanned QR data
        let proofToken: string;
        let verifierName = 'QR Scanner';
        let purpose = 'CREDENTIAL_VERIFICATION';

        // QR can contain either a raw proof token or a JSON payload
        try {
          const parsed = JSON.parse(raw);
          proofToken = parsed.proofToken || parsed.proof || raw;
          verifierName = parsed.verifierName || verifierName;
          purpose = parsed.purpose || purpose;
        } catch {
          proofToken = raw;
        }

        const response = await blockchainVerifyAPI.verifyProof({
          proofToken,
          verifierName,
          purpose,
        });

        if (response.success && response.data) {
          setVerificationResult(response.data);
          toast.success('Credential verified successfully!');
        } else {
          setError(response.error || 'Verification failed');
          toast.error(response.error || 'Verification failed');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to verify scanned credential');
        toast.error('Verification error');
      } finally {
        setIsVerifying(false);
      }
    },
    [isVerifying, scanning]
  );

  const resetScanner = () => {
    setScanning(true);
    setVerificationResult(null);
    setScannedData(null);
    setError(null);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/verify')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <QrCode className="w-6 h-6" /> Scan &amp; Verify
              </h1>
              <p className="text-sm text-muted-foreground">
                Scan a credential QR code to verify authenticity
              </p>
            </div>
          </div>

          <Card className="p-6 overflow-hidden">
            {scanning ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden aspect-square bg-black">
                  <Scanner
                    onScan={handleScan}
                    onError={(err) => {
                      console.error('Scanner error:', err);
                      setError('Camera access failed');
                    }}
                    formats={['qr_code']}
                    components={{ finder: true }}
                    styles={{
                      container: { width: '100%', height: '100%' },
                      video: { objectFit: 'cover' as const },
                    }}
                  />
                  {isVerifying && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center text-white space-y-2">
                        <span className="inline-block w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <p className="text-sm">Verifying credential...</p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Point your camera at a credential QR code
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {verificationResult ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                        <Check className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="text-center">
                      <h2 className="text-xl font-bold text-green-700 dark:text-green-400">
                        Verified ✓
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Credential is authentic and valid
                      </p>
                    </div>

                    {verificationResult.revealedAttributes && (
                      <div className="space-y-2 bg-muted/50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold">Disclosed Attributes</h3>
                        {Object.entries(verificationResult.revealedAttributes).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-sm">
                            <span className="text-muted-foreground capitalize">{k}</span>
                            <span className="font-medium">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Shield className="w-3 h-3" />
                        Risk: {verificationResult.riskLevel || 'LOW'}
                      </Badge>
                      {verificationResult.metadata?.blockchainTxHash && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          On-chain ✓
                        </Badge>
                      )}
                    </div>

                    <Button onClick={resetScanner} className="w-full gap-2">
                      <Camera className="w-4 h-4" /> Scan Another
                    </Button>
                  </motion.div>
                ) : error ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4 text-center"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                      <X className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-red-700 dark:text-red-400">
                        Verification Failed
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">{error}</p>
                    </div>
                    <Button onClick={resetScanner} variant="outline" className="w-full gap-2">
                      <Camera className="w-4 h-4" /> Try Again
                    </Button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            )}
          </Card>
        </div>
      </main>
    </>
  );
}
