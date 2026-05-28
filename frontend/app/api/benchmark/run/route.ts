// POST /api/benchmark/run – Execute system benchmarks
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, withErrorHandling, withAuth } from '@/lib/api-middleware';
import { keccak256, encodePacked, type Hex } from 'viem';
import { bbsSign, bbsCreateProof, bbsVerifyProof, serializeBBSSignature, deserializeBBSSignature } from '@/lib/bbs';
import { buildMerkleTree, getMerkleRoot, getMerkleProof, verifyMerkleProof, hashLogEntry } from '@/lib/merkle';

export const runtime = 'nodejs';

interface BenchmarkResult {
  operation: string;
  durationMs: number;
  gasUsed?: number;
  metadata?: Record<string, unknown>;
}

async function benchmark(name: string, fn: () => Promise<Record<string, unknown> | void>): Promise<BenchmarkResult> {
  const start = performance.now();
  const meta = await fn();
  const durationMs = Math.round((performance.now() - start) * 100) / 100;
  return { operation: name, durationMs, metadata: meta as Record<string, unknown> || {} };
}

export const POST = withErrorHandling(
  withAuth(async (request, user) => {
    const results: BenchmarkResult[] = [];

    // 1. Keccak256 hashing benchmark
    results.push(
      await benchmark('keccak256_hash', async () => {
        const iterations = 1000;
        for (let i = 0; i < iterations; i++) {
          keccak256(encodePacked(['string', 'uint256'], [`test-${i}`, BigInt(i)]));
        }
        return { iterations };
      })
    );

    // 2. BBS+ sign benchmark
    const testAttributes = {
      name: 'Test User',
      ageOver18: true,
      type: 'aadhaar',
      number_masked: 'XXXX1234',
      dob: '1990-01-01',
      address: '123 Test St',
    };

    let bbsSig: ReturnType<typeof bbsSign> | null = null;
    results.push(
      await benchmark('bbs_sign', async () => {
        const iterations = 100;
        for (let i = 0; i < iterations; i++) {
          bbsSig = bbsSign({
            credentialHash: keccak256(encodePacked(['string'], [`cred-${i}`])),
            issuerAddress: '0x0000000000000000000000000000000000000001',
            attributes: testAttributes,
            issuedAt: Math.floor(Date.now() / 1000),
          });
        }
        return { iterations, messageCount: Object.keys(testAttributes).length };
      })
    );

    // 3. BBS+ selective disclosure proof generation
    results.push(
      await benchmark('bbs_create_proof', async () => {
        if (!bbsSig) return;
        const iterations = 100;
        for (let i = 0; i < iterations; i++) {
          bbsCreateProof(
            bbsSig,
            testAttributes,
            ['name', 'ageOver18'],
            '0x' + '0'.repeat(64),
            '0x0000000000000000000000000000000000000001'
          );
        }
        return { iterations, disclosedCount: 2, totalAttributes: Object.keys(testAttributes).length };
      })
    );

    // 4. BBS+ proof verification
    results.push(
      await benchmark('bbs_verify_proof', async () => {
        if (!bbsSig) return;
        const proof = bbsCreateProof(
          bbsSig,
          testAttributes,
          ['name', 'ageOver18'],
          '0x' + '0'.repeat(64),
          '0x0000000000000000000000000000000000000001'
        );
        const iterations = 100;
        let valid = false;
        for (let i = 0; i < iterations; i++) {
          valid = bbsVerifyProof(proof, bbsSig.signature);
        }
        return { iterations, valid };
      })
    );

    // 5. Merkle tree construction
    results.push(
      await benchmark('merkle_tree_build', async () => {
        const leafCount = 1000;
        const leaves: Hex[] = [];
        for (let i = 0; i < leafCount; i++) {
          leaves.push(keccak256(encodePacked(['string'], [`leaf-${i}`])));
        }
        const tree = buildMerkleTree(leaves);
        const root = getMerkleRoot(tree);
        return { leafCount, treeDepth: tree.length, root };
      })
    );

    // 6. Merkle proof generation + verification
    results.push(
      await benchmark('merkle_proof_verify', async () => {
        const leaves: Hex[] = [];
        for (let i = 0; i < 100; i++) {
          leaves.push(keccak256(encodePacked(['string'], [`leaf-${i}`])));
        }
        const tree = buildMerkleTree(leaves);
        const root = getMerkleRoot(tree);
        const iterations = 100;
        let allValid = true;
        for (let i = 0; i < iterations; i++) {
          const proof = getMerkleProof(tree, i % leaves.length);
          const valid = verifyMerkleProof(leaves[i % leaves.length], proof, root);
          if (!valid) allValid = false;
        }
        return { iterations, allValid };
      })
    );

    // 7. BBS+ serialization round-trip
    results.push(
      await benchmark('bbs_serialization', async () => {
        if (!bbsSig) return;
        const iterations = 1000;
        for (let i = 0; i < iterations; i++) {
          const s = serializeBBSSignature(bbsSig);
          deserializeBBSSignature(s);
        }
        return { iterations };
      })
    );

    // 8. Database latency (single read)
    results.push(
      await benchmark('db_read_latency', async () => {
        const count = await prisma.user.count();
        return { userCount: count };
      })
    );

    // Persist benchmark results
    try {
      await prisma.benchmarkResult.createMany({
        data: results.map((r) => ({
          operation: r.operation,
          durationMs: Math.round(r.durationMs),
          gasUsed: r.gasUsed != null ? BigInt(r.gasUsed) : null,
          metadata: r.metadata || {},
        })),
      });
    } catch {
      // Non-blocking
    }

    return apiSuccess({
      results,
      summary: {
        totalOperations: results.length,
        totalDurationMs: Math.round(results.reduce((s, r) => s + r.durationMs, 0) * 100) / 100,
        timestamp: new Date().toISOString(),
      },
    });
  })
);
