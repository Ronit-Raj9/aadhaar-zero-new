// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title RevocationRegistry - Revoke compromised or expired credentials
/// @notice Only authorized issuers can revoke credentials they issued
/// @dev Credential IDs are hashes - no PII stored on-chain
contract RevocationRegistry is Ownable, Pausable {
    struct RevocationRecord {
        bool revoked;
        address revokedBy; // Issuer address
        uint256 revokedAt;
        string reason; // "EXPIRED", "FRAUD", "USER_REQUEST", "DATA_BREACH"
    }

    mapping(bytes32 => RevocationRecord) public revocations;

    // Authorized issuers who can revoke (linked to IssuerRegistry)
    mapping(address => bool) public authorizedRevokers;

    uint256 public totalRevocations;

    event CredentialRevoked(bytes32 indexed credentialId, address indexed issuer, string reason);
    event RevokerAuthorized(address indexed revoker);
    event RevokerRemoved(address indexed revoker);

    constructor() Ownable(msg.sender) {}

    /// @notice Authorize an address to revoke credentials
    function authorizeRevoker(address revoker) external onlyOwner {
        require(revoker != address(0), "Invalid address");
        authorizedRevokers[revoker] = true;
        emit RevokerAuthorized(revoker);
    }

    /// @notice Remove revocation authorization
    function removeRevoker(address revoker) external onlyOwner {
        authorizedRevokers[revoker] = false;
        emit RevokerRemoved(revoker);
    }

    /// @notice Revoke a single credential
    /// @param credentialId Hash identifying the credential
    /// @param reason Human-readable reason for revocation
    function revokeCredential(bytes32 credentialId, string calldata reason) external whenNotPaused {
        require(authorizedRevokers[msg.sender] || msg.sender == owner(), "Not authorized to revoke");
        require(!revocations[credentialId].revoked, "Already revoked");
        require(credentialId != bytes32(0), "Invalid credential ID");

        revocations[credentialId] = RevocationRecord({
            revoked: true,
            revokedBy: msg.sender,
            revokedAt: block.timestamp,
            reason: reason
        });

        totalRevocations++;

        emit CredentialRevoked(credentialId, msg.sender, reason);
    }

    /// @notice Batch revoke multiple credentials (for data breaches)
    /// @param credentialIds Array of credential ID hashes
    /// @param reason Reason for batch revocation
    function bulkRevoke(bytes32[] calldata credentialIds, string calldata reason) external whenNotPaused {
        require(authorizedRevokers[msg.sender] || msg.sender == owner(), "Not authorized to revoke");

        for (uint256 i = 0; i < credentialIds.length; i++) {
            if (!revocations[credentialIds[i]].revoked && credentialIds[i] != bytes32(0)) {
                revocations[credentialIds[i]] = RevocationRecord({
                    revoked: true,
                    revokedBy: msg.sender,
                    revokedAt: block.timestamp,
                    reason: reason
                });
                totalRevocations++;
                emit CredentialRevoked(credentialIds[i], msg.sender, reason);
            }
        }
    }

    /// @notice Check if a credential has been revoked
    function isRevoked(bytes32 credentialId) external view returns (bool) {
        return revocations[credentialId].revoked;
    }

    /// @notice Get full revocation details
    function getRevocationRecord(bytes32 credentialId) external view returns (RevocationRecord memory) {
        return revocations[credentialId];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
