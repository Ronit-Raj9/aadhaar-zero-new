import { NextRequest, NextResponse } from 'next/server';
import { anchorMerkleRoot } from '@/lib/blockchain';
import { buildAndFlushBatch, getBatchStats } from '@/lib/merkle';
import { getUserFromRequest } from '@/lib/auth';
import type { Hex } from 'viem';

export async function POST(request: NextRequest) {
  try {
    // Require authentication for audit anchoring
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { forceFlush } = body;

    const stats = getBatchStats();

    // Only anchor if batch is ready or force flush requested
    if (!forceFlush && stats.pendingCount < stats.batchSize) {
      return NextResponse.json({
        success: true,
        data: {
          anchored: false,
          reason: `Batch not ready (${stats.pendingCount}/${stats.batchSize})`,
          pendingLogs: stats.pendingCount,
          totalAnchored: stats.totalAnchored,
        },
      });
    }

    const batch = buildAndFlushBatch();
    if (!batch) {
      return NextResponse.json({
        success: true,
        data: {
          anchored: false,
          reason: 'No pending logs to anchor',
          pendingLogs: 0,
        },
      });
    }

    let txHash: string | null = null;
    try {
      txHash = await anchorMerkleRoot(batch.merkleRoot as Hex, batch.batchSize);
    } catch (err) {
      console.error('Merkle anchor failed:', err);
    }

    return NextResponse.json({
      success: true,
      data: {
        anchored: true,
        merkleRoot: batch.merkleRoot,
        batchSize: batch.batchSize,
        txHash,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Audit anchor error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const stats = getBatchStats();
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Audit stats error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
