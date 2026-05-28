// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title ConsentRegistry - DPDP Act compliance consent audit trail
/// @notice Immutable on-chain record of user consent for data sharing
/// @dev No PII stored - only cryptographic commitments
contract ConsentRegistry is Ownable, Pausable {
    struct ConsentRecord {
        bytes32 consentHash;
        bytes32 attributesMerkleRoot; // Merkle root of shared attributes
        address user; // User's wallet address
        address verifier;
        uint256 timestamp;
        bool revoked;
        bytes32 purposeCode; // e.g., keccak256("AGE_VERIFICATION")
    }

    mapping(bytes32 => ConsentRecord) public consents;
    mapping(address => bytes32[]) public userConsents; // User's consent history

    uint256 public totalConsents;

    event ConsentRecorded(
        bytes32 indexed consentHash, address indexed user, address indexed verifier, bytes32 purposeCode
    );
    event ConsentRevoked(bytes32 indexed consentHash, address indexed user, uint256 timestamp);

    constructor() Ownable(msg.sender) {}

    /// @notice Record a consent commitment on-chain
    /// @param consentHash Unique hash of the consent (generated off-chain)
    /// @param attributesMerkleRoot Merkle root of attributes being shared
    /// @param verifier Address of the verifier receiving data
    /// @param purposeCode Hash of the purpose (e.g., keccak256("BANK_KYC"))
    function recordConsent(bytes32 consentHash, bytes32 attributesMerkleRoot, address verifier, bytes32 purposeCode)
        external
        whenNotPaused
    {
        require(consentHash != bytes32(0), "Invalid consent hash");
        require(consents[consentHash].timestamp == 0, "Consent already recorded");
        require(verifier != address(0), "Invalid verifier");

        consents[consentHash] = ConsentRecord({
            consentHash: consentHash,
            attributesMerkleRoot: attributesMerkleRoot,
            user: msg.sender,
            verifier: verifier,
            timestamp: block.timestamp,
            revoked: false,
            purposeCode: purposeCode
        });

        userConsents[msg.sender].push(consentHash);
        totalConsents++;

        emit ConsentRecorded(consentHash, msg.sender, verifier, purposeCode);
    }

    /// @notice Revoke a previously given consent (DPDP right to erasure)
    /// @param consentHash Hash of the consent to revoke
    function revokeConsent(bytes32 consentHash) external {
        ConsentRecord storage record = consents[consentHash];
        require(record.timestamp != 0, "Consent not found");
        require(record.user == msg.sender, "Not consent owner");
        require(!record.revoked, "Already revoked");

        record.revoked = true;

        emit ConsentRevoked(consentHash, msg.sender, block.timestamp);
    }

    /// @notice Verify a consent record exists and is active
    function verifyConsent(bytes32 consentHash) external view returns (ConsentRecord memory) {
        return consents[consentHash];
    }

    /// @notice Check if consent is active (exists and not revoked)
    function isConsentActive(bytes32 consentHash) external view returns (bool) {
        ConsentRecord memory record = consents[consentHash];
        return record.timestamp != 0 && !record.revoked;
    }

    /// @notice Get all consent hashes for a user
    function getUserConsents(address user) external view returns (bytes32[] memory) {
        return userConsents[user];
    }

    /// @notice Get number of consents for a user
    function getUserConsentCount(address user) external view returns (uint256) {
        return userConsents[user].length;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
