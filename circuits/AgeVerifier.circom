pragma circom 2.1.6;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";

/// @title AgeVerifier - Groth16 Zero-Knowledge Age Verification Circuit
/// @notice Proves age >= threshold without revealing date of birth
/// @dev Uses Poseidon hash for nullifier computation (ZK-friendly)
///
/// Private inputs (hidden from verifier):
///   - birthYear, birthMonth, birthDay: actual date of birth
///   - userSecret: random secret for nullifier derivation
///
/// Public inputs (visible to verifier):
///   - currentYear, currentMonth, currentDay: current date for age calc
///   - ageThreshold: minimum required age (e.g., 18)
///   - nullifierHash: prevents proof replay
///   - verifierAddress: binds proof to specific verifier
///
template AgeVerifier() {
    // === Private inputs (witness) ===
    signal input birthYear;
    signal input birthMonth;
    signal input birthDay;
    signal input userSecret;

    // === Public inputs ===
    signal input currentYear;
    signal input currentMonth;
    signal input currentDay;
    signal input ageThreshold;
    signal input nullifierHash;
    signal input verifierAddress;

    // === Output ===
    signal output isValid;

    // -------------------------------------------------------
    // 1. Range checks: ensure dates are reasonable
    // -------------------------------------------------------
    // Birth year must be between 1900 and current year
    component birthYearLow = GreaterEqThan(16);
    birthYearLow.in[0] <== birthYear;
    birthYearLow.in[1] <== 1900;
    birthYearLow.out === 1;

    component birthYearHigh = LessEqThan(16);
    birthYearHigh.in[0] <== birthYear;
    birthYearHigh.in[1] <== currentYear;
    birthYearHigh.out === 1;

    // Birth month 1-12
    component monthLow = GreaterEqThan(8);
    monthLow.in[0] <== birthMonth;
    monthLow.in[1] <== 1;
    monthLow.out === 1;

    component monthHigh = LessEqThan(8);
    monthHigh.in[0] <== birthMonth;
    monthHigh.in[1] <== 12;
    monthHigh.out === 1;

    // Birth day 1-31
    component dayLow = GreaterEqThan(8);
    dayLow.in[0] <== birthDay;
    dayLow.in[1] <== 1;
    dayLow.out === 1;

    component dayHigh = LessEqThan(8);
    dayHigh.in[0] <== birthDay;
    dayHigh.in[1] <== 31;
    dayHigh.out === 1;

    // -------------------------------------------------------
    // 2. Age computation
    // -------------------------------------------------------
    // baseAge = currentYear - birthYear
    signal baseAge;
    baseAge <== currentYear - birthYear;

    // Check if birthday has passed this year
    // birthdayPassed = (currentMonth > birthMonth) || (currentMonth == birthMonth && currentDay >= birthDay)
    component monthGreater = GreaterThan(8);
    monthGreater.in[0] <== currentMonth;
    monthGreater.in[1] <== birthMonth;

    component monthEqual = IsEqual();
    monthEqual.in[0] <== currentMonth;
    monthEqual.in[1] <== birthMonth;

    component dayGte = GreaterEqThan(8);
    dayGte.in[0] <== currentDay;
    dayGte.in[1] <== birthDay;

    // sameMonthPastDay = monthEqual * dayGte
    signal sameMonthPastDay;
    sameMonthPastDay <== monthEqual.out * dayGte.out;

    // birthdayPassed = monthGreater.out + sameMonthPastDay (at most 1)
    // To ensure binary: use a trick
    signal birthdayNotPassed;
    signal sumCheck;
    sumCheck <== monthGreater.out + sameMonthPastDay;
    
    // birthdayNotPassed = 1 if sumCheck == 0, else 0
    component isZero = IsZero();
    isZero.in <== sumCheck;
    birthdayNotPassed <== isZero.out;

    // actualAge = baseAge - birthdayNotPassed
    signal actualAge;
    actualAge <== baseAge - birthdayNotPassed;

    // -------------------------------------------------------
    // 3. Age threshold check: actualAge >= ageThreshold
    // -------------------------------------------------------
    component ageCheck = GreaterEqThan(16);
    ageCheck.in[0] <== actualAge;
    ageCheck.in[1] <== ageThreshold;
    ageCheck.out === 1;

    // -------------------------------------------------------
    // 4. Nullifier computation using Poseidon hash
    //    nullifier = Poseidon(userSecret, verifierAddress)
    //    This binds each proof to a specific verifier and user
    // -------------------------------------------------------
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== userSecret;
    nullifierHasher.inputs[1] <== verifierAddress;

    // Verify the provided nullifierHash matches
    nullifierHash === nullifierHasher.out;

    // -------------------------------------------------------
    // 5. Output
    // -------------------------------------------------------
    isValid <== ageCheck.out;
}

component main {public [currentYear, currentMonth, currentDay, ageThreshold, nullifierHash, verifierAddress]} = AgeVerifier();
