'use client';

import { useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Server, Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface BlockchainStatusData {
  network: string;
  chainId: number;
  contracts: Record<string, string | null>;
  deployedCount: number;
  totalContracts: number;
}

export function BlockchainStatusBadge() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected) {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
        <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
        Offline
      </Badge>
    );
  }

  const networkName = chainId === 84532 ? 'Base Sepolia' : chainId === 8453 ? 'Base' : `Chain ${chainId}`;
  const isCorrectChain = chainId === 84532 || chainId === 8453;

  return (
    <Badge
      variant="outline"
      className={`gap-1 text-[10px] ${
        isCorrectChain
          ? 'border-green-500/30 text-green-400'
          : 'border-yellow-500/30 text-yellow-400'
      }`}
    >
      <div
        className={`h-1.5 w-1.5 rounded-full ${
          isCorrectChain ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
        }`}
      />
      {networkName}
    </Badge>
  );
}

export function BlockchainStatusCard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [status, setStatus] = useState<BlockchainStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/blockchain/status');
        const data = await res.json();
        if (data.success) {
          setStatus(data.data);
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  const contractEntries = status
    ? Object.entries(status.contracts)
    : [];

  return (
    <Card className="bg-background/50 border-blue-500/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium">Blockchain Status</span>
          {isConnected ? (
            <Badge className="ml-auto bg-green-500/10 text-green-400 text-[10px]">
              Connected
            </Badge>
          ) : (
            <Badge className="ml-auto bg-gray-500/10 text-gray-400 text-[10px]">
              Not Connected
            </Badge>
          )}
        </div>

        {isConnected && address && (
          <div className="text-[11px] text-muted-foreground font-mono truncate">
            {address}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Network:</span>
            <span>{status?.network || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Contracts:</span>
            <span>{status ? `${status.deployedCount}/${status.totalContracts}` : '—'}</span>
          </div>
        </div>

        {!loading && status && (
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Contract Registry
            </p>
            {contractEntries.map(([name, addr]) => {
              const isDeployed = addr && addr !== '0x0000000000000000000000000000000000000000';
              return (
                <div key={name} className="flex items-center gap-1.5 text-[11px]">
                  {isDeployed ? (
                    <CheckCircle className="h-3 w-3 text-green-400" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-400" />
                  )}
                  <span className="text-muted-foreground capitalize">
                    {name.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  {isDeployed ? (
                    <span className="font-mono truncate max-w-[120px]">{addr}</span>
                  ) : (
                    <span className="text-red-400">Not Deployed</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TransactionLink({ txHash, label }: { txHash: string; label?: string }) {
  const chainId = useChainId();
  const baseUrl =
    chainId === 8453
      ? 'https://basescan.org'
      : 'https://sepolia.basescan.org';

  return (
    <a
      href={`${baseUrl}/tx/${txHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline font-mono"
    >
      {label || `${txHash.slice(0, 6)}...${txHash.slice(-4)}`}
    </a>
  );
}
