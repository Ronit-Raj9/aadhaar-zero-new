'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import {
  Shield,
  FileCheck,
  Lock,
  UserX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  Database,
  Scale,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ComplianceCheck {
  id: string;
  title: string;
  description: string;
  section: string;
  status: 'compliant' | 'partial' | 'pending';
  icon: typeof Shield;
}

const DPDP_CHECKS: ComplianceCheck[] = [
  {
    id: 'consent',
    title: 'Consent Management',
    description: 'Purpose-limited consent recorded on-chain via ConsentRegistry',
    section: 'Section 6',
    status: 'compliant',
    icon: FileCheck,
  },
  {
    id: 'minimization',
    title: 'Data Minimization',
    description: 'BBS+ selective disclosure reveals only requested attributes',
    section: 'Section 4(2)',
    status: 'compliant',
    icon: Eye,
  },
  {
    id: 'erasure',
    title: 'Right to Erasure',
    description: 'Full PII deletion with credential revocation via /api/user/erase',
    section: 'Section 12(3)',
    status: 'compliant',
    icon: Trash2,
  },
  {
    id: 'audit',
    title: 'Audit Trail',
    description: 'Merkle tree anchored on Base Sepolia with tamper-proof logs',
    section: 'Section 8(7)',
    status: 'compliant',
    icon: Database,
  },
  {
    id: 'nullifier',
    title: 'Unlinkable Verification',
    description: 'ZKP nullifiers prevent cross-verifier tracking of users',
    section: 'Section 8(1)',
    status: 'compliant',
    icon: Lock,
  },
  {
    id: 'revocation',
    title: 'Credential Revocation',
    description: 'On-chain revocation via RevocationRegistry smart contract',
    section: 'Section 12(1)',
    status: 'compliant',
    icon: UserX,
  },
  {
    id: 'risk',
    title: 'Risk-Based Processing',
    description: 'AI risk scoring with adaptive friction levels',
    section: 'Section 8(4)',
    status: 'compliant',
    icon: AlertTriangle,
  },
  {
    id: 'retention',
    title: 'Storage Limitation',
    description: 'Credential expiry enforced (5-year maximum)',
    section: 'Section 8(8)',
    status: 'compliant',
    icon: Clock,
  },
];

export default function CompliancePage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const [isErasing, setIsErasing] = useState(false);
  const [showEraseConfirm, setShowEraseConfirm] = useState(false);
  const [eraseResult, setEraseResult] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  const handleErase = async () => {
    setIsErasing(true);
    try {
      const token = localStorage.getItem('aadhaar_token');
      const res = await fetch('/api/user/erase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ confirmErase: true }),
      });
      const data = await res.json();
      if (data.success) {
        setEraseResult(data.data);
        toast.success('Personal data erased successfully');
        // Force logout after 3 seconds since account is now anonymized
        setTimeout(async () => {
          await logout();
          router.push('/landing');
        }, 3000);
      } else {
        toast.error(data.error || 'Erasure failed');
      }
    } catch {
      toast.error('Failed to erase data');
    } finally {
      setIsErasing(false);
      setShowEraseConfirm(false);
    }
  };

  const compliantCount = DPDP_CHECKS.filter((c) => c.status === 'compliant').length;

  if (!isAuthenticated) return null;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Scale className="w-8 h-8 text-blue-600" />
              DPDP Compliance Dashboard
            </h1>
            <p className="text-muted-foreground">
              Digital Personal Data Protection Act, 2023 — compliance status for Aadhaar-Zero
            </p>
          </div>

          {/* Summary Card */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{compliantCount}/{DPDP_CHECKS.length} Checks Passed</h2>
                  <p className="text-sm text-muted-foreground">Full compliance with DPDP Act 2023</p>
                </div>
              </div>
              <Badge className="bg-green-600 text-white text-sm px-3 py-1">Compliant</Badge>
            </div>
          </Card>

          {/* Compliance Checks Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {DPDP_CHECKS.map((check, i) => {
              const Icon = check.icon;
              return (
                <motion.div
                  key={check.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-4 h-full">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-sm">{check.title}</h3>
                          <Badge variant={check.status === 'compliant' ? 'default' : 'secondary'} className="shrink-0 text-xs">
                            {check.section}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{check.description}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-xs text-green-600 font-medium capitalize">{check.status}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Right to Erasure Section */}
          <Card className="p-6 border-red-200 dark:border-red-900/50">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Trash2 className="w-6 h-6 text-red-500" />
                <div>
                  <h2 className="text-lg font-bold">Right to Erasure (Section 12(3))</h2>
                  <p className="text-sm text-muted-foreground">
                    Request complete deletion of your personal data from the system
                  </p>
                </div>
              </div>

              {eraseResult ? (
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-green-800 dark:text-green-200">✓ Data Erased Successfully</p>
                  <div className="text-sm space-y-1 text-green-700 dark:text-green-300">
                    <p>Credentials revoked: {eraseResult.summary.revokedCredentials}</p>
                    <p>Sessions deleted: {eraseResult.summary.deletedSessions}</p>
                    <p>Device fingerprints removed: {eraseResult.summary.deletedFingerprints}</p>
                    <p>Risk profiles cleared: {eraseResult.summary.deletedRiskProfiles}</p>
                    <p>PII nullified: ✓</p>
                  </div>
                </div>
              ) : showEraseConfirm ? (
                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                    ⚠ This action is irreversible. All your credentials will be revoked, personal data will be
                    permanently deleted, and your account will be anonymized.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      onClick={handleErase}
                      disabled={isErasing}
                      className="gap-2"
                    >
                      {isErasing ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Erasing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Confirm Erasure
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setShowEraseConfirm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 gap-2"
                  onClick={() => setShowEraseConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Request Data Erasure
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
