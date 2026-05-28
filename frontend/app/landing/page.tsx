'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { ArrowRight, Lock, Eye, Zap, Check, Shield, Users, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  const features = [
    {
      icon: Lock,
      title: 'Zero-Knowledge Proofs',
      description: 'Share only the information verifiers need, nothing more. Your data stays private.',
    },
    {
      icon: Zap,
      title: 'Instant Verification',
      description: 'Verify credentials in seconds using quantum-resistant cryptography.',
    },
    {
      icon: Shield,
      title: 'Blockchain Audit Trail',
      description: 'Immutable proof of all transactions stored on the blockchain.',
    },
    {
      icon: Eye,
      title: 'Multi-Modal Liveness',
      description: 'Advanced AI detects spoofing attempts and ensures real-world identity.',
    },
    {
      icon: Users,
      title: 'One Identity, Infinite Uses',
      description: 'Reuse your digital credential across multiple platforms securely.',
    },
    {
      icon: Smartphone,
      title: 'Mobile-First Experience',
      description: 'Manage your credentials on the go with our intuitive mobile app.',
    },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              className="text-center space-y-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 dark:border-blue-800 dark:bg-blue-950">
                  <Zap className="w-4 h-4 text-blue-600 mr-2 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    The Future of Digital Identity
                  </span>
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-balance leading-tight">
                  Privacy-Preserving{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                    Digital Identity
                  </span>
                </h1>

                <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
                  Aadhaar-Zero revolutionizes KYC with zero-knowledge proofs. Share only what's
                  needed, keep everything else private. Instant, secure, and unstoppable.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-12 px-8 gap-2"
                  onClick={() => (isAuthenticated ? router.push('/dashboard') : router.push('/register'))}
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-lg h-12 px-8"
                  onClick={() => router.push('/verify')}
                >
                  I'm a Verifier
                </Button>
              </motion.div>


            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-32 border-t border-border bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold">Why Choose Aadhaar-Zero?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Built for privacy, security, and instant verification
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-6 h-full hover:shadow-lg transition-shadow bg-card border-border">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold">How It Works</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                A simple 4-step process to issue and verify digital credentials
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: 1,
                  title: 'Create Account',
                  description: 'Sign up with your email',
                  icon: '📝',
                },
                {
                  step: 2,
                  title: 'Enroll Document',
                  description: 'Upload your document',
                  icon: '📄',
                },
                {
                  step: 3,
                  title: 'Liveness Check',
                  description: 'Verify your identity',
                  icon: '✓',
                },
                {
                  step: 4,
                  title: 'Credential Issued',
                  description: 'Ready to share',
                  icon: '🔐',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center mx-auto text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {item.icon}
                    </div>
                    {index < 3 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-2xl text-border">
                        →
                      </div>
                    )}
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-32 border-t border-border bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold">Ready to Own Your Identity?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of users who've reclaimed control of their digital identity
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-12 px-8 gap-2"
                onClick={() => (isAuthenticated ? router.push('/dashboard') : router.push('/register'))}
              >
                Start Enrolling Now
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-lg h-12 px-8"
                onClick={() => router.push('/verify')}
              >
                Learn More
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-12">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span className="font-bold">Aadhaar-Zero</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Privacy-preserving digital identity for the world.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold">Product</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>
                    <Link href="#features" className="hover:text-foreground transition-colors">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/benchmark" className="hover:text-foreground transition-colors">
                      Benchmarks
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold">Company</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>
                    <Link href="#how-it-works" className="hover:text-foreground transition-colors">
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <Link href="/compliance" className="hover:text-foreground transition-colors">
                      Compliance
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold">Legal</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>
                    <Link href="/compliance" className="hover:text-foreground transition-colors">
                      Privacy (DPDP)
                    </Link>
                  </li>
                  <li>
                    <Link href="/verify" className="hover:text-foreground transition-colors">
                      Verify
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border pt-8 flex justify-between items-center text-sm text-muted-foreground">
              <p>&copy; 2026 Aadhaar-Zero. All rights reserved.</p>
              <div className="flex gap-4">
                <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  GitHub
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
