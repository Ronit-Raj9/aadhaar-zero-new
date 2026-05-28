'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEnrollment } from '@/contexts/EnrollmentContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { ArrowLeft, CheckCircle2, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { enrollmentAPI } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { TransactionLink } from '@/components/BlockchainStatus';

export default function EnrollmentStep4() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data, updateConsent, resetEnrollment } = useEnrollment();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issuedCredential, setIssuedCredential] = useState<any>(null);
  const { address: walletAddress, isConnected } = useAccount();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleConsent = (field: 'agreedToTerms' | 'agreedToDataUsage', value: boolean) => {
    updateConsent({ [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!data.consent.agreedToTerms || !data.consent.agreedToDataUsage) {
      toast.error('Please accept all terms and conditions');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await enrollmentAPI.issueCredential(data);
      if (response.success && response.data) {
        setIssuedCredential(response.data);
        toast.success('Credential issued successfully!');
        // Reset enrollment state after a delay
        setTimeout(() => {
          resetEnrollment();
          router.push('/dashboard');
        }, 2000);
      } else {
        toast.error(response.error || 'Failed to issue credential');
      }
    } catch (error) {
      toast.error('Error issuing credential');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Success Screen
  if (issuedCredential) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          <div className="max-w-2xl mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-12 border-border text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="flex justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <h2 className="text-4xl font-bold">Congratulations!</h2>
                  <p className="text-xl text-muted-foreground">
                    Your credential has been successfully issued
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 space-y-3 text-left"
                >
                  <p className="font-semibold text-blue-900 dark:text-blue-100">Credential Details:</p>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <p>
                      <span className="font-medium">Type:</span>{' '}
                      <span className="capitalize">{issuedCredential.type}</span>
                    </p>
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Active
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Proof Hash:</span>{' '}
                      <code className="text-xs bg-blue-900/30 px-2 py-1 rounded">
                        {issuedCredential.proofHash.slice(0, 20)}...
                      </code>
                    </p>
                    <p>
                      <span className="font-medium">Blockchain TX:</span>{' '}
                      {issuedCredential.blockchainTxHash ? (
                        <TransactionLink txHash={issuedCredential.blockchainTxHash} />
                      ) : (
                        <code className="text-xs bg-blue-900/30 px-2 py-1 rounded">Pending...</code>
                      )}
                    </p>
                    {isConnected && walletAddress && (
                      <p>
                        <span className="font-medium">Wallet:</span>{' '}
                        <code className="text-xs bg-blue-900/30 px-2 py-1 rounded">
                          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </code>
                      </p>
                    )}
                    {issuedCredential.credentialIdHash && (
                      <p>
                        <span className="font-medium">Credential ID:</span>{' '}
                        <code className="text-xs bg-blue-900/30 px-2 py-1 rounded">
                          {issuedCredential.credentialIdHash.slice(0, 20)}...
                        </code>
                      </p>
                    )}
                  </div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground text-sm"
                >
                  Redirecting to your dashboard...
                </motion.p>
              </Card>
            </motion.div>
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
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                4
              </div>
              <h1 className="text-3xl font-bold">Terms & Consent</h1>
            </div>
            <p className="text-muted-foreground">
              Review and accept our terms before issuing your credential
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step 4 of 4</span>
              <span>100%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full w-full bg-blue-600 transition-all duration-300" />
            </div>
          </div>

          {/* Form */}
          <Card className="p-8 border-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">Ready to Issue Your Credential</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Your {data.document.type?.toUpperCase()} credential will be issued and stored securely in your wallet.
                    </p>
                  </div>
                </div>
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={data.consent.agreedToTerms}
                    onChange={(e) => handleConsent('agreedToTerms', e.target.checked)}
                    disabled={isSubmitting}
                    className="w-5 h-5 rounded border-border mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer flex-1">
                    <span className="font-medium">I agree to the Terms of Service</span>
                    <p className="text-muted-foreground text-xs mt-1">
                      I understand and agree to the terms governing the use of Aadhaar-Zero and the issuance of digital credentials.
                    </p>
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={data.consent.agreedToDataUsage}
                    onChange={(e) => handleConsent('agreedToDataUsage', e.target.checked)}
                    disabled={isSubmitting}
                    className="w-5 h-5 rounded border-border mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer flex-1">
                    <span className="font-medium">I agree to the Privacy Policy</span>
                    <p className="text-muted-foreground text-xs mt-1">
                      I consent to the collection and use of my personal data as outlined in the privacy policy. My data will only be shared with verifiers upon my explicit request.
                    </p>
                  </label>
                </div>
              </div>

              {/* Features List */}
              <div className="border-t border-border pt-6 space-y-4">
                <p className="font-semibold text-sm">What you'll get:</p>
                <ul className="space-y-2">
                  {[
                    'Secure digital credential stored in your wallet',
                    'Zero-knowledge proof capability for privacy',
                    'Blockchain audit trail of all transactions',
                    'On-chain consent recording (DPDP Act compliant)',
                    'Nullifier-based replay attack prevention',
                    'Ability to share proofs with verifiers',
                    'Full control over your data',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4 border-t border-border">
                <Button
                  type="button"
                  onClick={() => router.push('/enroll/step3')}
                  disabled={isSubmitting}
                  variant="outline"
                  className="flex-1 h-10 gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !data.consent.agreedToTerms ||
                    !data.consent.agreedToDataUsage
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Issuing Credential...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Issue Credential
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}
