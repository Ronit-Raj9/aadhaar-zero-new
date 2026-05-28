'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { dashboardAPI, credentialsAPI } from '@/lib/api-client';
import { DashboardStats, Credential } from '@/lib/types';
import { Plus, Share2, Eye, Trash2, Lock, Shield, TrendingUp, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import CredentialCard from '@/components/CredentialCard';
import ActivityTimeline from '@/components/ActivityTimeline';
import { BlockchainStatusCard } from '@/components/BlockchainStatus';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        const [statsResponse, credsResponse] = await Promise.all([
          dashboardAPI.getStats(user?.id || ''),
          credentialsAPI.listCredentials(user?.id || ''),
        ]);

        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        }

        if (credsResponse.success && credsResponse.data) {
          setCredentials(credsResponse.data);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, router, user?.id]);

  const handleDeleteCredential = async (credentialId: string) => {
    if (!confirm('Are you sure you want to revoke this credential?')) return;

    try {
      await credentialsAPI.revokeCredential(credentialId);
      setCredentials(credentials.filter((c) => c.id !== credentialId));
      toast.success('Credential revoked successfully');
    } catch (error) {
      toast.error('Failed to revoke credential');
      console.error(error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
                <p className="text-muted-foreground">Manage your digital credentials securely</p>
              </div>
              <Button
                onClick={() => router.push('/enroll/step1')}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Credential
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            className="space-y-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Stats Section */}
            {stats && (
              <motion.div
                className="grid md:grid-cols-3 gap-6"
                variants={itemVariants}
              >
                <Card className="p-6 border-border">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Active Credentials</p>
                      <p className="text-4xl font-bold">{stats.totalCredentials}</p>
                    </div>
                    <Lock className="w-12 h-12 text-blue-600/20" />
                  </div>
                </Card>

                <Card className="p-6 border-border">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Pending Verifications</p>
                      <p className="text-4xl font-bold">{stats.activeVerifications}</p>
                    </div>
                    <Clock className="w-12 h-12 text-amber-600/20" />
                  </div>
                </Card>

                <Card className="p-6 border-border">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Privacy Score</p>
                      <p className="text-4xl font-bold">{stats.privacyScore}%</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-600/20" />
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Blockchain Status */}
            <motion.div variants={itemVariants}>
              <BlockchainStatusCard />
            </motion.div>

            {/* Credentials Section */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Your Credentials</h2>
              </div>

              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6 border-border animate-pulse">
                      <div className="space-y-4">
                        <div className="h-6 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : credentials.length === 0 ? (
                <Card className="p-12 border-border text-center space-y-4">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-semibold">No credentials yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start by enrolling your first credential
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/enroll/step1')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Enroll Now
                  </Button>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {credentials.map((credential, index) => (
                    <motion.div
                      key={credential.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <CredentialCard
                        credential={credential}
                        onShare={() => router.push(`/credentials/${credential.id}/share`)}
                        onView={() => router.push(`/credentials/${credential.id}`)}
                        onDelete={() => handleDeleteCredential(credential.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Activity Timeline */}
            {stats && (
              <motion.div variants={itemVariants} className="space-y-6">
                <h2 className="text-2xl font-bold">Recent Activity</h2>
                <ActivityTimeline activities={stats.recentActivity} />
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </>
  );
}
