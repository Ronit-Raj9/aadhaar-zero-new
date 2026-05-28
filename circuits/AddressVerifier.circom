pragma circom 2.1.6;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

/// @title AddressVerifier - Groth16 Zero-Knowledge Address Verification Circuit
/// @notice Proves that the user's address belongs to a specific pincode/state
///         without revealing the full address string
/// @dev Uses Poseidon hash for commitment and nullifier derivation
///
/// Private inputs (hidden from verifier):
///   - addressHash: Poseidon hash of the full address string
///   - pincode: 6-digit pincode (e.g., 560001)
///   - stateCode: numeric state code (1-36 for Indian states/UTs)
///   - userSecret: random secret for nullifier derivation
///
/// Public inputs (visible to verifier):
///   - expectedPincode: pincode the verifier wants to check against
///   - expectedStateCode: state code to verify (0 = skip state check)
///   - addressCommitment: Poseidon(addressHash, pincode, stateCode) — binds proof to real address
///   - nullifierHash: prevents proof replay
///   - verifierAddress: binds proof to specific verifier
///
template AddressVerifier() {
    // === Private inputs (witness) ===
    signal input addressHash;
    signal input pincode;
    signal input stateCode;
    signal input userSecret;

    // === Public inputs ===
    signal input expectedPincode;
    signal input expectedStateCode;
    signal input addressCommitment;
    signal input nullifierHash;
    signal input verifierAddress;

    // === Output ===
    signal output isValid;

    // -------------------------------------------------------
    // 1. Range checks
    // -------------------------------------------------------
    // Pincode must be 6 digits: 100000 - 999999
    component pinLow = GreaterEqThan(20);
    pinLow.in[0] <== pincode;
    pinLow.in[1] <== 100000;
    pinLow.out === 1;

    component pinHigh = LessEqThan(20);
    pinHigh.in[0] <== pincode;
    pinHigh.in[1] <== 999999;
    pinHigh.out === 1;

    // State code 1-36 (Indian states and UTs)
    component stateLow = GreaterEqThan(8);
    stateLow.in[0] <== stateCode;
    stateLow.in[1] <== 1;
    stateLow.out === 1;

    component stateHigh = LessEqThan(8);
    stateHigh.in[0] <== stateCode;
    stateHigh.in[1] <== 36;
    stateHigh.out === 1;

    // -------------------------------------------------------
    // 2. Verify address commitment
    //    commitment = Poseidon(addressHash, pincode, stateCode)
    // -------------------------------------------------------
    component commitHash = Poseidon(3);
    commitHash.inputs[0] <== addressHash;
    commitHash.inputs[1] <== pincode;
    commitHash.inputs[2] <== stateCode;

    // The computed commitment must match the public addressCommitment
    commitHash.out === addressCommitment;

    // -------------------------------------------------------
    // 3. Pincode verification
    //    Prove pincode matches expected pincode
    // -------------------------------------------------------
    component pincodeMatch = IsEqual();
    pincodeMatch.in[0] <== pincode;
    pincodeMatch.in[1] <== expectedPincode;
    // pincodeMatch.out === 1 would be strict; we allow state-only checks

    // -------------------------------------------------------
    // 4. State code verification (optional)
    //    If expectedStateCode == 0, skip state check
    // -------------------------------------------------------
    component stateIsZero = IsZero();
    stateIsZero.in <== expectedStateCode;

    component stateMatch = IsEqual();
    stateMatch.in[0] <== stateCode;
    stateMatch.in[1] <== expectedStateCode;

    // stateValid = stateIsZero.out OR stateMatch.out
    // = 1 - (1 - stateIsZero.out) * (1 - stateMatch.out)
    signal stateInvalid1;
    stateInvalid1 <== 1 - stateIsZero.out;
    signal stateInvalid2;
    stateInvalid2 <== 1 - stateMatch.out;
    signal stateInvalidBoth;
    stateInvalidBoth <== stateInvalid1 * stateInvalid2;
    signal stateValid;
    stateValid <== 1 - stateInvalidBoth;

    // -------------------------------------------------------
    // 5. Nullifier verification
    //    nullifier = Poseidon(userSecret, verifierAddress, addressHash)
    // -------------------------------------------------------
    component nullHash = Poseidon(3);
    nullHash.inputs[0] <== userSecret;
    nullHash.inputs[1] <== verifierAddress;
    nullHash.inputs[2] <== addressHash;
    nullHash.out === nullifierHash;

    // -------------------------------------------------------
    // 6. Final validity: pincode matches AND state valid
    // -------------------------------------------------------
    isValid <== pincodeMatch.out * stateValid;
}

component main {public [expectedPincode, expectedStateCode, addressCommitment, nullifierHash, verifierAddress]} = AddressVerifier();
