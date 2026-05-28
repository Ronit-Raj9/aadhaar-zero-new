/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Stub optional peer deps that @wagmi/connectors tries to import but are not installed.
  // Without these aliases Turbopack (and webpack) fail with "module not found" at runtime
  // because those connectors (MetaMask SDK, Porto, WalletConnect) are optional.
  turbopack: {
    resolveAlias: {
      '@metamask/sdk': { browser: './src/__stubs__/empty.js', default: './src/__stubs__/empty.js' },
      'porto': { browser: './src/__stubs__/empty.js', default: './src/__stubs__/empty.js' },
      'porto/internal': { browser: './src/__stubs__/empty.js', default: './src/__stubs__/empty.js' },
      '@walletconnect/ethereum-provider': { browser: './src/__stubs__/empty.js', default: './src/__stubs__/empty.js' },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        readline: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        constants: false,
        worker_threads: false,
      };
    }
    // Stub optional wagmi connector peer deps that are not installed
    config.resolve.alias = {
      ...config.resolve.alias,
      '@metamask/sdk': false,
      'porto': false,
      'porto/internal': false,
      '@walletconnect/ethereum-provider': false,
    };
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
}

export default nextConfig
