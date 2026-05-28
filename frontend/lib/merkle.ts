// Simple Merkle Tree implementation for audit log batching
// Used server-side to build Merkle trees and generate inclusion proofs

import { keccak256, encodePacked, type Hex } from 'viem';

export interface AuditLogEntry {
  operation: string;
  nullifier?: string;
  verifier?: string;
  timestamp: number;
  riskScore?: number;
  outcome: string;
  metadata?: Record<string, unknown>;
}

/**
 * Hash an individual audit log entry
 */
export function hashLogEntry(entry: AuditLogEntry): Hex {
  return keccak256(
    encodePacked(
      ['string', 'string', 'uint256', 'string'],
      [entry.operation, entry.verifier || '', BigInt(entry.timestamp), entry.outcome]
    )
  );
}

/**
 * Build a Merkle tree from an array of leaf hashes
 * Returns all layers of the tree (leaves at index 0, root at last index)
 */
export function buildMerkleTree(leaves: Hex[]): Hex[][] {
  if (leaves.length === 0) return [[]];

  // Ensure even number of leaves by duplicating last if odd
  const normalizedLeaves = [...leaves];
  if (normalizedLeaves.length % 2 !== 0) {
    normalizedLeaves.push(normalizedLeaves[normalizedLeaves.length - 1]);
  }

  const tree: Hex[][] = [normalizedLeaves];

  let currentLevel = normalizedLeaves;
  while (currentLevel.length > 1) {
    const nextLevel: Hex[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left;
      const combined =
        left <= right
          ? keccak256(encodePacked(['bytes32', 'bytes32'], [left, right]))
          : keccak256(encodePacked(['bytes32', 'bytes32'], [right, left]));
      nextLevel.push(combined);
    }
    tree.push(nextLevel);
    currentLevel = nextLevel;
  }

  return tree;
}

/**
 * Get the Merkle root from a tree
 */
export function getMerkleRoot(tree: Hex[][]): Hex {
  if (tree.length === 0 || tree[tree.length - 1].length === 0) {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }
  return tree[tree.length - 1][0];
}

/**
 * Generate a Merkle proof for a leaf at a given index
 */
export function getMerkleProof(tree: Hex[][], leafIndex: number): Hex[] {
  const proof: Hex[] = [];
  let index = leafIndex;

  for (let level = 0; level < tree.length - 1; level++) {
    const currentLevel = tree[level];
    const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;

    if (siblingIndex < currentLevel.length) {
      proof.push(currentLevel[siblingIndex]);
    }

    index = Math.floor(index / 2);
  }

  return proof;
}

/**
 * Verify a Merkle proof
 */
export function verifyMerkleProof(leaf: Hex, proof: Hex[], root: Hex): boolean {
  let computed = leaf;

  for (const sibling of proof) {
    if (computed <= sibling) {
      computed = keccak256(encodePacked(['bytes32', 'bytes32'], [computed, sibling]));
    } else {
      computed = keccak256(encodePacked(['bytes32', 'bytes32'], [sibling, computed]));
    }
  }

  return computed === root;
}

// In-memory log accumulator – also persists leaves to DB when prisma is available
let pendingLogs: AuditLogEntry[] = [];
const BATCH_SIZE = 100; // Anchor every 100 logs

/**
 * Add a log entry to the pending batch and persist the leaf hash to DB
 */
export function addAuditLog(entry: AuditLogEntry): void {
  pendingLogs.push(entry);

  // Persist leaf hash to DB asynchronously (non-blocking)
  const leafHash = hashLogEntry(entry);
  persistLeaf(leafHash).catch(() => {});
}

async function persistLeaf(leafHash: Hex): Promise<void> {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    await prisma.merkleLeaf.create({
      data: { leafHash },
    });
  } catch {
    // Silently fail – in-memory batch is the primary path
  }
}

/**
 * Get pending logs count
 */
export function getPendingLogsCount(): number {
  return pendingLogs.length;
}

/**
 * Build and return the current batch, clearing pending logs
 * Returns { merkleRoot, batchSize, leaves } for anchoring on-chain
 */
export function buildAndFlushBatch(): {
  merkleRoot: Hex;
  batchSize: number;
  leaves: Hex[];
  tree: Hex[][];
} | null {
  if (pendingLogs.length === 0) return null;

  const leaves = pendingLogs.map(hashLogEntry);
  const tree = buildMerkleTree(leaves);
  const merkleRoot = getMerkleRoot(tree);
  const batchSize = pendingLogs.length;

  pendingLogs = []; // Clear batch

  // Mark persisted leaves as anchored (non-blocking)
  markLeavesAnchored(leaves, merkleRoot).catch(() => {});

  return { merkleRoot, batchSize, leaves, tree };
}

async function markLeavesAnchored(leaves: Hex[], batchId: Hex): Promise<void> {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    await prisma.merkleLeaf.updateMany({
      where: { leafHash: { in: leaves }, batchId: null },
      data: { batchId, anchoredAt: new Date() },
    });
  } catch {
    // Non-blocking
  }
}

/**
 * Check if batch is ready to be anchored
 */
export function isBatchReady(): boolean {
  return pendingLogs.length >= BATCH_SIZE;
}

/**
 * Get batch statistics
 */
export function getBatchStats(): {
  pendingCount: number;
  batchSize: number;
  totalAnchored: number;
} {
  return {
    pendingCount: pendingLogs.length,
    batchSize: BATCH_SIZE,
    // In-memory tracking; for accurate production counts, query the DB
    totalAnchored: getTotalAnchoredCount(),
  };
}

// Track anchored batches in memory (reset on cold start)
let _totalAnchoredCount = 0;

/** Increment the in-memory anchored count after a successful flush */
export function incrementAnchoredCount(batchSize: number): void {
  _totalAnchoredCount += batchSize;
}

function getTotalAnchoredCount(): number {
  return _totalAnchoredCount;
}
