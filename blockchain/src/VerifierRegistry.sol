// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title VerifierRegistry - Whitelist trusted verifiers
/// @notice Manages authorized verifiers (banks, fintechs, government services)
/// @dev Includes reputation scoring system
contract VerifierRegistry is Ownable, Pausable {
    enum VerifierCategory {
        BANK,
        FINTECH,
        TELECOM,
        ECOMMERCE,
        GOVERNMENT,
        INSURANCE,
        OTHER
    }

    struct VerifierMetadata {
        string name;
        VerifierCategory category;
        uint8 reputationScore; // 0-100
        uint256 verificationCount;
        bool isActive;
        uint256 registeredAt;
    }

    mapping(address => VerifierMetadata) public verifiers;
    mapping(address => bool) public authorizedVerifiers;
    address[] public verifierList;

    event VerifierRegistered(address indexed verifier, string name, VerifierCategory category);
    event VerifierRemoved(address indexed verifier);
    event ReputationUpdated(address indexed verifier, uint8 newScore);
    event VerificationCounted(address indexed verifier, uint256 newCount);

    constructor() Ownable(msg.sender) {}

    /// @notice Register a new authorized verifier (admin only)
    function registerVerifier(address verifier, string calldata name, VerifierCategory category)
        external
        onlyOwner
        whenNotPaused
    {
        require(verifier != address(0), "Invalid address");
        require(!authorizedVerifiers[verifier], "Already registered");
        require(bytes(name).length > 0, "Name required");

        verifiers[verifier] = VerifierMetadata({
            name: name,
            category: category,
            reputationScore: 50, // Start at neutral
            verificationCount: 0,
            isActive: true,
            registeredAt: block.timestamp
        });

        authorizedVerifiers[verifier] = true;
        verifierList.push(verifier);

        emit VerifierRegistered(verifier, name, category);
    }

    /// @notice Remove a verifier (admin only)
    function removeVerifier(address verifier) external onlyOwner {
        require(authorizedVerifiers[verifier], "Not registered");

        authorizedVerifiers[verifier] = false;
        verifiers[verifier].isActive = false;

        emit VerifierRemoved(verifier);
    }

    /// @notice Check if verifier is authorized
    function isAuthorizedVerifier(address verifier) external view returns (bool) {
        return authorizedVerifiers[verifier];
    }

    /// @notice Get verifier metadata
    function getVerifierInfo(address verifier) external view returns (VerifierMetadata memory) {
        return verifiers[verifier];
    }

    /// @notice Update verifier reputation score (admin only)
    function updateVerifierReputation(address verifier, uint8 score) external onlyOwner {
        require(authorizedVerifiers[verifier], "Not registered");
        require(score <= 100, "Score must be 0-100");

        verifiers[verifier].reputationScore = score;

        emit ReputationUpdated(verifier, score);
    }

    /// @notice Increment verification count for a verifier
    function incrementVerificationCount(address verifier) external whenNotPaused {
        require(authorizedVerifiers[verifier], "Not authorized verifier");
        verifiers[verifier].verificationCount++;
        emit VerificationCounted(verifier, verifiers[verifier].verificationCount);
    }

    /// @notice Get total number of registered verifiers
    function getVerifierCount() external view returns (uint256) {
        return verifierList.length;
    }

    /// @notice Get verifier address by index
    function getVerifierAt(uint256 index) external view returns (address) {
        require(index < verifierList.length, "Index out of bounds");
        return verifierList[index];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
