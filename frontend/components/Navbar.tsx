'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Lock, LogOut, QrCode } from 'lucide-react';
import Link from 'next/link';
import { WalletConnect } from '@/components/WalletConnect';
import { BlockchainStatusBadge } from '@/components/BlockchainStatus';

export function Navbar() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/landing');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:inline">Aadhaar-Zero</span>
            <BlockchainStatusBadge />
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Wallet Connect – always visible */}
            <WalletConnect />

            {isAuthenticated ? (
              <>
                <Link href="/verify/scan">
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <QrCode className="w-4 h-4" />
                    <span className="hidden sm:inline">Scan &amp; Verify</span>
                  </Button>
                </Link>
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Welcome, {user?.name?.split(' ')[0]}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/login')}
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push('/register')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
