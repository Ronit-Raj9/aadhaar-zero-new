import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// Blockchain Status API
// Returns current state of all deployed contracts
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const contracts = {
      issuerRegistry: process.env.NEXT_PUBLIC_ISSUER_REGISTRY || null,
      nullifierRegistry: process.env.NEXT_PUBLIC_NULLIFIER_REGISTRY || null,
      consentRegistry: process.env.NEXT_PUBLIC_CONSENT_REGISTRY || null,
      revocationRegistry: process.env.NEXT_PUBLIC_REVOCATION_REGISTRY || null,
      verifierRegistry: process.env.NEXT_PUBLIC_VERIFIER_REGISTRY || null,
      auditTrail: process.env.NEXT_PUBLIC_AUDIT_TRAIL || null,
      groth16Verifier: process.env.NEXT_PUBLIC_GROTH16_VERIFIER || null,
      zkpOrchestrator: process.env.NEXT_PUBLIC_ZKP_ORCHESTRATOR || null,
    };

    const deployed = Object.values(contracts).filter(
      (addr) => addr && addr !== '0x0000000000000000000000000000000000000000'
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        network: process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? 'base-mainnet' : 'base-sepolia',
        chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532'),
        contracts,
        deployedCount: deployed,
        totalContracts: 8,
        rpcUrl: process.env.NEXT_PUBLIC_CHAIN_ID === '8453'
          ? 'https://mainnet.base.org'
          : 'https://sepolia.base.org',
      },
    });
  } catch (error) {
    console.error('Blockchain status error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
