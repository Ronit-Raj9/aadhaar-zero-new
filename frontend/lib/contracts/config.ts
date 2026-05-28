import { http } from 'wagmi';
import { baseSepolia, base } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  injectedWallet,
  coinbaseWallet,
  rabbyWallet,
  braveWallet,
  zerionWallet,
} from '@rainbow-me/rainbowkit/wallets';

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo_project_id';
if (walletConnectProjectId === 'demo_project_id' && typeof window !== 'undefined') {
  console.warn('[WalletConnect] Using demo project ID. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID for production.');
}

export const wagmiConfig = getDefaultConfig({
  appName: 'Aadhaar-Zero',
  projectId: walletConnectProjectId,
  chains: [baseSepolia, base],
  // Use injectedWallet (window.ethereum) instead of metaMaskWallet (@metamask/sdk).
  // The MetaMask browser extension injects window.ethereum, so injectedWallet connects
  // to MetaMask directly without needing the MetaMask SDK package.
  wallets: [
    {
      groupName: 'Browser Wallets',
      wallets: [injectedWallet, rabbyWallet, braveWallet, zerionWallet],
    },
    {
      groupName: 'Other',
      wallets: [coinbaseWallet],
    },
  ],
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC || 'https://mainnet.base.org'),
  },
  ssr: true,
});
