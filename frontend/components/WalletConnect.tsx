'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useChainId } from 'wagmi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, ChevronDown, ExternalLink, Copy, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function WalletConnect() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        if (!ready) {
          return (
            <Button variant="outline" size="sm" disabled className="gap-2">
              <Wallet className="h-4 w-4" />
              Loading...
            </Button>
          );
        }

        if (!connected) {
          return (
            <Button
              onClick={openConnectModal}
              variant="outline"
              size="sm"
              className="gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          );
        }

        if (chain.unsupported) {
          return (
            <Button
              onClick={openChainModal}
              variant="destructive"
              size="sm"
              className="gap-2"
            >
              Wrong Network
              <ChevronDown className="h-3 w-3" />
            </Button>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Button
              onClick={openChainModal}
              variant="ghost"
              size="sm"
              className="gap-1.5 px-2 text-xs"
            >
              {chain.hasIcon && chain.iconUrl && (
                <img
                  alt={chain.name ?? 'Chain'}
                  src={chain.iconUrl}
                  className="h-4 w-4 rounded-full"
                />
              )}
              <span className="hidden sm:inline">{chain.name}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-green-500/30 text-green-400"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-mono text-xs">
                    {account.displayName}
                  </span>
                  {account.displayBalance && (
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {account.displayBalance}
                    </Badge>
                  )}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(account.address)}
                  className="gap-2 text-xs"
                >
                  <Copy className="h-3 w-3" />
                  Copy Address
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      `https://sepolia.basescan.org/address/${account.address}`,
                      '_blank'
                    )
                  }
                  className="gap-2 text-xs"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on BaseScan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={openAccountModal}
                  className="gap-2 text-xs text-red-400"
                >
                  <LogOut className="h-3 w-3" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

export function WalletConnectMinimal() {
  return (
    <ConnectButton
      showBalance={false}
      chainStatus="icon"
      accountStatus="avatar"
    />
  );
}
