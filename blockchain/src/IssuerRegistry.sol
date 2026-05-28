// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title IssuerRegistry - Whitelist authorized credential issuers
/// @notice Only admin can add/remove issuers. Anyone can verify issuer status.
/// @dev Prevents rogue entities from issuing fake credentials
contract IssuerRegistry is Ownable, Pausable {
    struct IssuerMetadata {
        string name;
        uint256 addedAt;
        bool isActive;
        uint256 credentialsIssued;
    }

    mapping(address => IssuerMetadata) public issuers;
    mapping(address => bool) public authorizedIssuers;
    address[] public issuerList;

    event IssuerAdded(address indexed issuer, string name, uint256 timestamp);
    event IssuerRevoked(address indexed issuer, uint256 timestamp);
    event CredentialCounted(address indexed issuer, uint256 newCount);

    constructor() Ownable(msg.sender) {}

    /// @notice Add a new authorized issuer (admin only)
    /// @param issuerAddress Wallet address of the issuer
    /// @param issuerName Human-readable name (e.g., "UIDAI", "RBI")
    function addIssuer(address issuerAddress, string calldata issuerName) external onlyOwner whenNotPaused {
        require(issuerAddress != address(0), "Invalid address");
        require(!authorizedIssuers[issuerAddress], "Already authorized");
        require(bytes(issuerName).length > 0, "Name required");

        issuers[issuerAddress] = IssuerMetadata({
            name: issuerName,
            addedAt: block.timestamp,
            isActive: true,
            credentialsIssued: 0
        });

        authorizedIssuers[issuerAddress] = true;
        issuerList.push(issuerAddress);

        emit IssuerAdded(issuerAddress, issuerName, block.timestamp);
    }

    /// @notice Revoke issuer authorization (admin only)
    function removeIssuer(address issuerAddress) external onlyOwner {
        require(authorizedIssuers[issuerAddress], "Not authorized");

        authorizedIssuers[issuerAddress] = false;
        issuers[issuerAddress].isActive = false;

        emit IssuerRevoked(issuerAddress, block.timestamp);
    }

    /// @notice Check if an address is an authorized issuer
    function isAuthorizedIssuer(address issuerAddress) external view returns (bool) {
        return authorizedIssuers[issuerAddress];
    }

    /// @notice Get full metadata for an issuer
    function getIssuerInfo(address issuerAddress) external view returns (IssuerMetadata memory) {
        return issuers[issuerAddress];
    }

    /// @notice Increment credential count for an issuer
    function incrementCredentialCount(address issuerAddress) external whenNotPaused {
        require(authorizedIssuers[issuerAddress], "Not authorized issuer");
        issuers[issuerAddress].credentialsIssued++;
        emit CredentialCounted(issuerAddress, issuers[issuerAddress].credentialsIssued);
    }

    /// @notice Get total number of registered issuers
    function getIssuerCount() external view returns (uint256) {
        return issuerList.length;
    }

    /// @notice Get issuer address by index
    function getIssuerAt(uint256 index) external view returns (address) {
        require(index < issuerList.length, "Index out of bounds");
        return issuerList[index];
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
