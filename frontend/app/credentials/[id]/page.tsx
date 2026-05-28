'use client';

import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { credentialsAPI } from '@/lib/api-client';
import { Credential } from '@/lib/types';
import { ArrowLeft, Share2, Trash2, Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function CredentialDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleDelete = async () => {
    if (!credential || !confirm('Are you sure you want to revoke this credential?')) return;

    try {
      await credentialsAPI.revokeCredential(credential.id);
      toast.success('Credential revoked successfully');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to revoke credential');
      console.error(error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
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

  const getGradient = (type: string) => {
    const gradients: Record<string, string> = {
      aadhaar: 'from-blue-600 to-blue-400',
      pan: 'from-purple-600 to-purple-400',
      license: 'from-amber-600 to-amber-400',
      passport: 'from-green-600 to-green-400',
    };
    return gradients[type] || 'from-blue-600 to-blue-400';
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-8">
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
          </motion.div>

          {/* Credential Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className={`relative overflow-hidden border-border p-8 bg-gradient-to-br ${getGradient(credential.type)} text-white shadow-lg`}>
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-sm opacity-90">Credential Type</p>
                    <h1 className="text-4xl font-bold capitalize">{credential.type}</h1>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-sm opacity-90">Status</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6" />
                      <span className="font-semibold capitalize">{credential.status}</span>
                    </div>
                  </div>
                </div>

                {credential.metadata.firstName && (
                  <div className="border-t border-white/20 pt-4">
                    <p className="text-sm opacity-90 mb-1">Credential Holder</p>
                    <p className="text-2xl font-semibold">
                      {credential.metadata.firstName} {credential.metadata.lastName}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-8 border-border space-y-6">
              <h2 className="text-2xl font-bold">Credential Details</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Issued Date</p>
                  <p className="font-semibold">
                    {new Date(credential.issueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {credential.expiryDate && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="font-semibold">
                      {new Date(credential.expiryDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {credential.metadata.dateOfBirth && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-semibold">{credential.metadata.dateOfBirth}</p>
                  </div>
                )}

                {credential.metadata.gender && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-semibold capitalize">{credential.metadata.gender}</p>
                  </div>
                )}
              </div>

              {credential.metadata.address && (
                <div className="space-y-2 border-t border-border pt-6">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-semibold">{credential.metadata.address}</p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Blockchain Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-8 border-border space-y-6">
              <h2 className="text-2xl font-bold">Blockchain & Security</h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Proof Hash</p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-muted rounded-lg p-3 font-mono text-xs break-all">
                      {credential.proofHash}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(credential.proofHash, 'Proof hash')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {credential.blockchainTxHash && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Blockchain Transaction Hash</p>
                    <div className="flex gap-2">
                      <code className="flex-1 bg-muted rounded-lg p-3 font-mono text-xs break-all">
                        {credential.blockchainTxHash}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          copyToClipboard(credential.blockchainTxHash || '', 'Transaction hash')
                        }
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a
                          href={`https://sepolia.basescan.org/tx/${credential.blockchainTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                  Blockchain Verification
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your credential is registered on the blockchain for immutable verification.
                  Share the transaction hash with verifiers to prove authenticity.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex gap-4"
          >
            <Button
              onClick={() => router.push(`/credentials/${credential.id}/share`)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share Credential
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              className="flex-1 h-12 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              <Trash2 className="w-5 h-5" />
              Revoke Credential
            </Button>
          </motion.div>
        </div>
      </main>
    </>
  );
}
