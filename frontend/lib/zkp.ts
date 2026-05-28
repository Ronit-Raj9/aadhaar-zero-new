/**
 * @module zkp - Zero-Knowledge Proof Client Library
 * @description Client-side Groth16 proof generation using snarkjs WASM
 * 
 * This module handles:
 *  1. Loading circuit WASM + proving key (zkey) from /public/circuits/
 *  2. Computing Poseidon nullifier hashes
 *  3. Generating Groth16 proofs in-browser
 *  4. Formatting proofs for on-chain Solidity verification
 * 
 * Circuit: AgeVerifier.circom
 * Proving system: Groth16 (BN254 curve)
 * Public signals: [currentYear, currentMonth, currentDay, ageThreshold, nullifierHash, verifierAddress, isValid]
 */

// @ts-expect-error - snarkjs doesn't have TS types
import * as snarkjs from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';

// ─── Constants ─────────────────────────────────
const CIRCUIT_WASM_PATH = '/circuits/AgeVerifier.wasm';
const CIRCUIT_ZKEY_PATH = '/circuits/AgeVerifier_final.zkey';

// BN254 scalar field (snark field order)
const SNARK_FIELD_SIZE = BigInt(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617'
);

// ─── Types ─────────────────────────────────────
export interface ZKPInput {
  /** Date of birth - private (hidden from verifier) */
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  /** Random secret for nullifier derivation - private */
  userSecret: bigint;
  /** Minimum age required (e.g., 18) */
  ageThreshold: number;
  /** Address of the verifier entity (binds proof to specific verifier) */
  verifierAddress: string;
}

export interface Groth16Proof {
  /** Proof point A (G1) */
  pA: [string, string];
  /** Proof point B (G2) */
  pB: [[string, string], [string, string]];
  /** Proof point C (G1) */
  pC: [string, string];
  /** Public signals array */
  publicSignals: string[];
}

export interface FormattedProof {
  /** For Solidity: uint256[2] */
  a: [bigint, bigint];
  /** For Solidity: uint256[2][2] */
  b: [[bigint, bigint], [bigint, bigint]];
  /** For Solidity: uint256[2] */
  c: [bigint, bigint];
  /** For Solidity: uint256[7] */
  pubSignals: bigint[];
}

export interface ZKPResult {
  proof: FormattedProof;
  rawProof: Groth16Proof;
  nullifierHash: bigint;
  /** Hex string of nullifier for display */
  nullifierHex: string;
  /** Proof generation time in ms */
  generationTimeMs: number;
}

// ─── Poseidon Hash Singleton ───────────────────
let poseidonInstance: Awaited<ReturnType<typeof buildPoseidon>> | null = null;

async function getPoseidon() {
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }
  return poseidonInstance;
}

/**
 * Compute Poseidon hash for nullifier derivation
 * nullifier = Poseidon(userSecret, verifierAddress)
 */
export async function computeNullifierHash(
  userSecret: bigint,
  verifierAddress: string
): Promise<bigint> {
  const poseidon = await getPoseidon();
  // Convert address to BigInt (remove 0x prefix)
  const addressBigInt = BigInt(verifierAddress);
  const hash = poseidon([userSecret, addressBigInt]);
  const hashStr = poseidon.F.toString(hash);
  return BigInt(hashStr);
}

/**
 * Generate a cryptographically secure random secret for nullifier computation
 */
export function generateUserSecret(): bigint {
  const bytes = new Uint8Array(31); // 31 bytes = 248 bits < 254 bits (BN254)
  crypto.getRandomValues(bytes);
  let secret = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    secret = (secret << BigInt(8)) | BigInt(bytes[i]);
  }
  // Ensure within field
  return secret % SNARK_FIELD_SIZE;
}

/**
 * Generate a Groth16 zero-knowledge proof of age
 * 
 * @param input - Private + public inputs for the circuit
 * @returns Formatted proof ready for on-chain verification
 * 
 * @example
 * ```ts
 * const secret = generateUserSecret();
 * const result = await generateAgeProof({
 *   birthYear: 2000, birthMonth: 6, birthDay: 15,
 *   userSecret: secret,
 *   ageThreshold: 18,
 *   verifierAddress: '0x1234...'
 * });
 * // Submit result.proof to ZKPVerificationOrchestrator.verifyAgeProof()
 * ```
 */
export async function generateAgeProof(input: ZKPInput): Promise<ZKPResult> {
  const startTime = performance.now();

  // 1. Compute nullifier hash
  const nullifierHash = await computeNullifierHash(
    input.userSecret,
    input.verifierAddress
  );

  // 2. Get current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
  const currentDay = now.getDate();

  // 3. Prepare circuit inputs
  const circuitInput = {
    // Private inputs
    birthYear: input.birthYear.toString(),
    birthMonth: input.birthMonth.toString(),
    birthDay: input.birthDay.toString(),
    userSecret: input.userSecret.toString(),
    // Public inputs
    currentYear: currentYear.toString(),
    currentMonth: currentMonth.toString(),
    currentDay: currentDay.toString(),
    ageThreshold: input.ageThreshold.toString(),
    nullifierHash: nullifierHash.toString(),
    verifierAddress: BigInt(input.verifierAddress).toString(),
  };

  // 4. Generate Groth16 proof (in-browser WASM)
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInput,
    CIRCUIT_WASM_PATH,
    CIRCUIT_ZKEY_PATH
  );

  const endTime = performance.now();

  // 5. Format for Solidity
  const formattedProof = formatProofForSolidity(proof, publicSignals);

  // 6. Compute nullifier hex for display
  const nullifierHex = '0x' + nullifierHash.toString(16).padStart(64, '0');

  return {
    proof: formattedProof,
    rawProof: {
      pA: proof.pi_a.slice(0, 2),
      pB: [proof.pi_b[0].slice(0, 2), proof.pi_b[1].slice(0, 2)],
      pC: proof.pi_c.slice(0, 2),
      publicSignals,
    },
    nullifierHash,
    nullifierHex,
    generationTimeMs: Math.round(endTime - startTime),
  };
}

/**
 * Format a snarkjs proof for on-chain Solidity verifier
 * 
 * The Solidity verifier expects:
 *   verifyProof(uint[2] _pA, uint[2][2] _pB, uint[2] _pC, uint[7] _pubSignals)
 * 
 * snarkjs proof format:
 *   pi_a: [x, y, z] (G1 affine point, z=1)
 *   pi_b: [[x1, x2], [y1, y2], [z1, z2]] (G2 affine point)
 *   pi_c: [x, y, z] (G1 affine point, z=1)
 */
function formatProofForSolidity(
  proof: { pi_a: string[]; pi_b: string[][]; pi_c: string[] },
  publicSignals: string[]
): FormattedProof {
  return {
    a: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
    // Note: Solidity expects B in reversed order for the pairing check
    b: [
      [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
      [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
    ],
    c: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])],
    pubSignals: publicSignals.map((s: string) => BigInt(s)),
  };
}

/**
 * Verify a proof locally (off-chain) using the verification key
 * Useful for quick client-side validation before submitting on-chain
 */
export async function verifyProofLocally(
  proof: Groth16Proof
): Promise<boolean> {
  const vkeyResponse = await fetch('/circuits/verification_key.json');
  const vkey = await vkeyResponse.json();

  return snarkjs.groth16.verify(
    vkey,
    proof.publicSignals,
    {
      pi_a: [...proof.pA, '1'],
      pi_b: [...proof.pB.map((p: [string, string]) => [...p]), ['1', '0']],
      pi_c: [...proof.pC, '1'],
      protocol: 'groth16',
      curve: 'bn128',
    }
  );
}

/**
 * Export proof as shareable calldata string
 * Can be used to generate Solidity calldata for manual submission
 */
export async function exportSolidityCalldata(
  proof: Groth16Proof
): Promise<string> {
  return snarkjs.groth16.exportSolidityCallData(
    {
      pi_a: [...proof.pA, '1'],
      pi_b: [...proof.pB.map((p: [string, string]) => [...p]), ['1', '0']],
      pi_c: [...proof.pC, '1'],
      protocol: 'groth16',
      curve: 'bn128',
    },
    proof.publicSignals
  );
}

// ─── Address Verification ──────────────────────

const ADDRESS_CIRCUIT_WASM_PATH = '/circuits/AddressVerifier.wasm';
const ADDRESS_CIRCUIT_ZKEY_PATH = '/circuits/AddressVerifier_final.zkey';

export interface AddressZKPInput {
  /** Poseidon hash of the full address string - private */
  addressHash: bigint;
  /** 6-digit pincode - private */
  pincode: number;
  /** Numeric state code (1-36) - private */
  stateCode: number;
  /** Random secret for nullifier - private */
  userSecret: bigint;
  /** Expected pincode to verify against */
  expectedPincode: number;
  /** Expected state code (0 = skip state check) */
  expectedStateCode: number;
  /** Verifier address */
  verifierAddress: string;
}

/**
 * Compute address commitment: Poseidon(addressHash, pincode, stateCode)
 */
export async function computeAddressCommitment(
  addressHash: bigint,
  pincode: number,
  stateCode: number
): Promise<bigint> {
  const poseidon = await getPoseidon();
  const hash = poseidon([addressHash, BigInt(pincode), BigInt(stateCode)]);
  return BigInt(poseidon.F.toString(hash));
}

/**
 * Compute address nullifier: Poseidon(userSecret, verifierAddress, addressHash)
 */
export async function computeAddressNullifier(
  userSecret: bigint,
  verifierAddress: string,
  addressHash: bigint
): Promise<bigint> {
  const poseidon = await getPoseidon();
  const addressBigInt = BigInt(verifierAddress);
  const hash = poseidon([userSecret, addressBigInt, addressHash]);
  return BigInt(poseidon.F.toString(hash));
}

/**
 * Generate a Groth16 proof for address verification
 * Proves address belongs to a specific pincode/state without revealing the full address
 */
export async function generateAddressProof(
  input: AddressZKPInput
): Promise<ZKPResult | null> {
  try {
    const startTime = performance.now();

    // Compute public signals
    const addressCommitment = await computeAddressCommitment(
      input.addressHash,
      input.pincode,
      input.stateCode
    );

    const nullifierHash = await computeAddressNullifier(
      input.userSecret,
      input.verifierAddress,
      input.addressHash
    );

    const verifierAddressBigInt = BigInt(input.verifierAddress);

    // Circuit input
    const circuitInput = {
      // Private
      addressHash: input.addressHash.toString(),
      pincode: input.pincode.toString(),
      stateCode: input.stateCode.toString(),
      userSecret: input.userSecret.toString(),
      // Public
      expectedPincode: input.expectedPincode.toString(),
      expectedStateCode: input.expectedStateCode.toString(),
      addressCommitment: addressCommitment.toString(),
      nullifierHash: nullifierHash.toString(),
      verifierAddress: verifierAddressBigInt.toString(),
    };

    // Generate Groth16 proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      circuitInput,
      ADDRESS_CIRCUIT_WASM_PATH,
      ADDRESS_CIRCUIT_ZKEY_PATH
    );

    const endTime = performance.now();

    const rawProof: Groth16Proof = {
      pA: [proof.pi_a[0], proof.pi_a[1]],
      pB: [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]],
      ],
      pC: [proof.pi_c[0], proof.pi_c[1]],
      publicSignals,
    };

    const formattedProof: FormattedProof = {
      a: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])],
      b: [
        [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
        [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
      ],
      c: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])],
      pubSignals: publicSignals.map((s: string) => BigInt(s)),
    };

    const nullifierHex = '0x' + nullifierHash.toString(16).padStart(64, '0');

    return {
      proof: formattedProof,
      rawProof,
      nullifierHash,
      nullifierHex,
      generationTimeMs: Math.round(endTime - startTime),
    };
  } catch (error) {
    console.error('Address proof generation failed:', error);
    return null;
  }
}
