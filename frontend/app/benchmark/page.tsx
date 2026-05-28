'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { Activity, Play, Clock, Zap, Database, Shield, TreePine, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface BenchmarkResult {
  operation: string;
  durationMs: number;
  gasUsed?: number;
  metadata?: Record<string, unknown>;
}

const OPERATION_ICONS: Record<string, typeof Activity> = {
  keccak256_hash: Zap,
  bbs_sign: KeyRound,
  bbs_create_proof: Shield,
  bbs_verify_proof: Shield,
  merkle_tree_build: TreePine,
  merkle_proof_verify: TreePine,
  bbs_serialization: Database,
  db_read_latency: Database,
};

const OPERATION_LABELS: Record<string, string> = {
  keccak256_hash: 'Keccak256 Hashing (1000×)',
  bbs_sign: 'BBS+ Signing (100×)',
  bbs_create_proof: 'BBS+ Proof Generation (100×)',
  bbs_verify_proof: 'BBS+ Proof Verification (100×)',
  merkle_tree_build: 'Merkle Tree Build (1000 leaves)',
  merkle_proof_verify: 'Merkle Proof Verify (100×)',
  bbs_serialization: 'BBS+ Serialization (1000×)',
  db_read_latency: 'Database Read Latency',
};

function getSpeedBadge(ms: number): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (ms < 10) return { label: '⚡ Blazing', variant: 'default' };
  if (ms < 100) return { label: '✓ Fast', variant: 'secondary' };
  if (ms < 500) return { label: '~ OK', variant: 'outline' };
  return { label: '⚠ Slow', variant: 'destructive' };
}

export default function BenchmarkPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [totalMs, setTotalMs] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const runBenchmarks = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      const token = localStorage.getItem('aadhaar_token');
      const response = await fetch('/api/benchmark/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setResults(data.data.results);
        setTotalMs(data.data.summary.totalDurationMs);
        toast.success(`Benchmarks completed in ${data.data.summary.totalDurationMs}ms`);
      } else {
        toast.error(data.error || 'Benchmark failed');
      }
    } catch (err) {
      toast.error('Failed to run benchmarks');
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              System Benchmarks
            </h1>
            <p className="text-muted-foreground">
              Measure cryptographic operations, BBS+ signatures, Merkle tree construction, and database latency
            </p>
          </div>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Run Full Suite</h2>
                <p className="text-sm text-muted-foreground">
                  Executes all benchmark operations server-side and stores results
                </p>
              </div>
              <Button
                onClick={runBenchmarks}
                disabled={isRunning}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isRunning ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Benchmarks
                  </>
                )}
              </Button>
            </div>

            {totalMs > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">
                  Total execution time: <span className="text-blue-700 dark:text-blue-400">{totalMs}ms</span>
                  {' '}across {results.length} operations
                </span>
              </div>
            )}
          </Card>

          {results.length > 0 && (
            <div className="grid gap-4">
              {results.map((result, i) => {
                const Icon = OPERATION_ICONS[result.operation] || Activity;
                const label = OPERATION_LABELS[result.operation] || result.operation;
                const speed = getSpeedBadge(result.durationMs);
                const barWidth = Math.min((result.durationMs / Math.max(...results.map((r) => r.durationMs))) * 100, 100);

                return (
                  <motion.div
                    key={result.operation}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{label}</p>
                            {result.metadata && Object.keys(result.metadata).length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {Object.entries(result.metadata)
                                  .filter(([k]) => k !== 'root')
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(' · ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={speed.variant}>{speed.label}</Badge>
                          <span className="text-lg font-bold tabular-nums">{result.durationMs}ms</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }}
                          transition={{ duration: 0.4, delay: i * 0.05 }}
                        />
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
