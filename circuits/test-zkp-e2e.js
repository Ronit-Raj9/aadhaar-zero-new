const snarkjs = require('snarkjs');
const { buildPoseidon } = require('circomlibjs');
const { createPublicClient, http } = require('viem');
const { baseSepolia } = require('viem/chains');
const path = require('path');
const fs = require('fs');

const CIRCUITS_DIR = path.join(__dirname, 'build');
const WASM_PATH = path.join(CIRCUITS_DIR, 'AgeVerifier_js', 'AgeVerifier.wasm');
const ZKEY_PATH = path.join(CIRCUITS_DIR, 'AgeVerifier_final.zkey');
const VKEY_PATH = path.join(CIRCUITS_DIR, 'verification_key.json');
const GROTH16_VERIFIER = '0xf277ee461d58740e9cf39a89254013cb97d427f6';
const ZKP_ORCHESTRATOR = '0x8efac999990dd4235d48f277d0bfddb35c5105a7';
const USER_SECRET = BigInt('123456789012345678901234567890');

const G = '\x1b[32m', R = '\x1b[31m', B = '\x1b[34m', BOLD = '\x1b[1m', RST = '\x1b[0m';
let passed = 0, failed = 0;
function pass(n) { passed++; console.log(`  ${G}✓${RST} ${n}`); }
function fail(n, e) { failed++; console.log(`  ${R}✗${RST} ${n}: ${e}`); }

const VERIFIER_ABI = [{
  type: 'function', name: 'verifyProof',
  inputs: [
    { name: '_pA', type: 'uint256[2]' },
    { name: '_pB', type: 'uint256[2][2]' },
    { name: '_pC', type: 'uint256[2]' },
    { name: '_pubSignals', type: 'uint256[7]' },
  ],
  outputs: [{ name: '', type: 'bool' }],
  stateMutability: 'view',
}];

async function main() {
  console.log(`${BOLD}╔═══════════════════════════════════════════╗${RST}`);
  console.log(`${BOLD}║  Aadhaar-Zero ZKP End-to-End Test Suite   ║${RST}`);
  console.log(`${BOLD}╚═══════════════════════════════════════════╝${RST}`);

  // Test 1: Poseidon
  console.log(`\n${B}${BOLD}▸ Test 1: Poseidon Nullifier Hash${RST}`);
  let nullifierHash;
  try {
    const poseidon = await buildPoseidon();
    const hash = poseidon([USER_SECRET, BigInt(ZKP_ORCHESTRATOR)]);
    nullifierHash = poseidon.F.toString(hash);
    pass('Nullifier: ' + nullifierHash.slice(0, 30) + '...');
  } catch (e) { fail('Poseidon', e.message); }

  // Test 2: Proof gen
  console.log(`\n${B}${BOLD}▸ Test 2: Groth16 Proof Generation${RST}`);
  let proof, publicSignals, calldata;
  try {
    const now = new Date();
    const input = {
      birthYear: '2000', birthMonth: '6', birthDay: '15',
      userSecret: USER_SECRET.toString(),
      currentYear: now.getFullYear().toString(),
      currentMonth: (now.getMonth() + 1).toString(),
      currentDay: now.getDate().toString(),
      ageThreshold: '18',
      nullifierHash: nullifierHash,
      verifierAddress: BigInt(ZKP_ORCHESTRATOR).toString(),
    };
    const t0 = Date.now();
    ({ proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM_PATH, ZKEY_PATH));
    pass('Proof generated in ' + (Date.now() - t0) + 'ms');
    pass('isValid signal = ' + publicSignals[publicSignals.length - 1]);
  } catch (e) { fail('Proof generation', e.message); process.exit(1); }

  // Test 3: Off-chain verify
  console.log(`\n${B}${BOLD}▸ Test 3: Off-Chain Verification${RST}`);
  try {
    const vkey = JSON.parse(fs.readFileSync(VKEY_PATH, 'utf8'));
    const valid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
    valid ? pass('Off-chain: VALID') : fail('Off-chain', 'INVALID');
  } catch (e) { fail('Off-chain', e.message); }

  // Test 4: Calldata
  console.log(`\n${B}${BOLD}▸ Test 4: Solidity Calldata Export${RST}`);
  try {
    calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    pass('Calldata exported (' + calldata.length + ' chars)');
  } catch (e) { fail('Calldata', e.message); }

  // Test 5: On-chain verify
  console.log(`\n${B}${BOLD}▸ Test 5: On-Chain Verification (Base Sepolia)${RST}`);
  try {
    const [a, b, c, signals] = JSON.parse('[' + calldata + ']');
    const client = createPublicClient({ chain: baseSepolia, transport: http('https://sepolia.base.org') });
    const result = await client.readContract({
      address: GROTH16_VERIFIER, abi: VERIFIER_ABI, functionName: 'verifyProof',
      args: [a.map(BigInt), b.map(r => r.map(BigInt)), c.map(BigInt), signals.map(BigInt)],
    });
    result ? pass('ON-CHAIN: ✅ VALID') : fail('On-chain', 'returned false');
  } catch (e) { fail('On-chain', e.message); }

  // Test 6: Tamper rejection (corrupt proof point A)
  console.log(`\n${B}${BOLD}▸ Test 6: Tampered Proof Rejection${RST}`);
  try {
    const [a, b, c, signals] = JSON.parse('[' + calldata + ']');
    // Corrupt proof point A to break the pairing check
    const tamperedA = [...a];
    tamperedA[0] = '0x' + 'ff'.repeat(32);
    const client = createPublicClient({ chain: baseSepolia, transport: http('https://sepolia.base.org') });
    let rejected = false;
    try {
      const result = await client.readContract({
        address: GROTH16_VERIFIER, abi: VERIFIER_ABI, functionName: 'verifyProof',
        args: [tamperedA.map(BigInt), b.map(r => r.map(BigInt)), c.map(BigInt), signals.map(BigInt)],
      });
      rejected = (result === false);
    } catch (_) { rejected = true; }
    rejected ? pass('Tampered proof REJECTED') : fail('Tamper', 'Accepted!');
  } catch (e) { fail('Tamper test error', e.message); }

  // Summary
  console.log(`\n${BOLD}═══════════════════════════════════════════${RST}`);
  console.log(`${BOLD}Results: ${G}${passed} passed${RST}, ${failed > 0 ? R : G}${failed} failed${RST}`);
  console.log(`${BOLD}═══════════════════════════════════════════${RST}\n`);
  if (failed > 0) process.exit(1);
}
main().catch(e => { console.error('Fatal:', e); process.exit(1); });
