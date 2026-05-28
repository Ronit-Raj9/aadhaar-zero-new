// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title IGroth16Verifier - Interface for the auto-generated Groth16 verifier
interface IGroth16Verifier {
    function verifyProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[7] calldata _pubSignals
    ) external view returns (bool);
}

/// @title ZKPVerificationOrchestrator - Coordinates on-chain ZKP verification
/// @notice Single entry point for age verification using Groth16 proofs
/// @dev Integrates Groth16 verifier with NullifierRegistry for replay protection
contract ZKPVerificationOrchestrator is Ownable, Pausable {
    // === External contracts ===
    IGroth16Verifier public groth16Verifier;
    address public nullifierRegistry;

    // === Verification records ===
    struct VerificationRecord {
        address prover;
        address verifier;
        uint256 ageThreshold;
        bytes32 nullifierHash;
        uint256 timestamp;
        bool isValid;
    }

    mapping(bytes32 => VerificationRecord) public verifications;
    mapping(address => uint256) public verificationCount;
    uint256 public totalVerifications;

    // === Events ===
    event ProofVerified(
        bytes32 indexed nullifierHash,
        address indexed prover,
        address indexed verifier,
        uint256 ageThreshold,
        bool isValid,
        uint256 timestamp
    );

    event VerifierUpdated(address oldVerifier, address newVerifier);
    event NullifierRegistryUpdated(address oldRegistry, address newRegistry);

    // === Errors ===
    error InvalidProof();
    error NullifierAlreadyUsed();
    error InvalidVerifierAddress();
    error InvalidAgeThreshold();
    error InvalidNullifierHash();

    constructor(address _groth16Verifier, address _nullifierRegistry) Ownable(msg.sender) {
        groth16Verifier = IGroth16Verifier(_groth16Verifier);
        nullifierRegistry = _nullifierRegistry;
    }

    /// @notice Verify a Groth16 age proof on-chain
    /// @param _pA Proof element A (G1 point)
    /// @param _pB Proof element B (G2 point)
    /// @param _pC Proof element C (G1 point)
    /// @param _pubSignals Public signals [currentYear, currentMonth, currentDay, ageThreshold, nullifierHash, verifierAddress, isValid]
    /// @return success True if the proof is valid and nullifier is fresh
    function verifyAgeProof(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[7] calldata _pubSignals
    ) external whenNotPaused returns (bool success) {
        // Extract public signals
        // _pubSignals layout: [currentYear, currentMonth, currentDay, ageThreshold, nullifierHash, verifierAddress, isValid]
        uint256 ageThreshold = _pubSignals[3];
        bytes32 nullifierHash = bytes32(_pubSignals[4]);
        address verifierAddr = address(uint160(_pubSignals[5]));

        // Validations
        if (ageThreshold == 0 || ageThreshold > 150) revert InvalidAgeThreshold();
        if (nullifierHash == bytes32(0)) revert InvalidNullifierHash();
        if (verifierAddr == address(0)) revert InvalidVerifierAddress();

        // Check nullifier hasn't been used (call NullifierRegistry)
        (bool callSuccess, bytes memory data) = nullifierRegistry.staticcall(
            abi.encodeWithSignature("isNullifierUsed(bytes32)", nullifierHash)
        );
        if (callSuccess && abi.decode(data, (bool))) {
            revert NullifierAlreadyUsed();
        }

        // Verify the Groth16 proof on-chain
        bool proofValid = groth16Verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
        if (!proofValid) revert InvalidProof();

        // Mark nullifier as used
        (bool markSuccess,) = nullifierRegistry.call(
            abi.encodeWithSignature(
                "markNullifierUsed(bytes32,address,bytes32)",
                nullifierHash,
                verifierAddr,
                keccak256("AGE_VERIFICATION")
            )
        );
        require(markSuccess, "Failed to mark nullifier");

        // Record verification
        verifications[nullifierHash] = VerificationRecord({
            prover: msg.sender,
            verifier: verifierAddr,
            ageThreshold: ageThreshold,
            nullifierHash: nullifierHash,
            timestamp: block.timestamp,
            isValid: true
        });

        verificationCount[msg.sender]++;
        totalVerifications++;

        emit ProofVerified(
            nullifierHash,
            msg.sender,
            verifierAddr,
            ageThreshold,
            true,
            block.timestamp
        );

        return true;
    }

    /// @notice Verify a proof without submitting on-chain (view function, no state changes)
    function verifyProofOnly(
        uint[2] calldata _pA,
        uint[2][2] calldata _pB,
        uint[2] calldata _pC,
        uint[7] calldata _pubSignals
    ) external view returns (bool) {
        return groth16Verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
    }

    /// @notice Get verification record by nullifier
    function getVerification(bytes32 nullifierHash) external view returns (VerificationRecord memory) {
        return verifications[nullifierHash];
    }

    /// @notice Update the Groth16 verifier contract address
    function setGroth16Verifier(address _newVerifier) external onlyOwner {
        address old = address(groth16Verifier);
        groth16Verifier = IGroth16Verifier(_newVerifier);
        emit VerifierUpdated(old, _newVerifier);
    }

    /// @notice Update the NullifierRegistry address
    function setNullifierRegistry(address _newRegistry) external onlyOwner {
        address old = nullifierRegistry;
        nullifierRegistry = _newRegistry;
        emit NullifierRegistryUpdated(old, _newRegistry);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
