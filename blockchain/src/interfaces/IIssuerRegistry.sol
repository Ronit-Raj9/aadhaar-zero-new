// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIssuerRegistry {
    struct IssuerMetadata {
        string name;
        uint256 addedAt;
        bool isActive;
        uint256 credentialsIssued;
    }

    function addIssuer(address issuerAddress, string calldata issuerName) external;
    function removeIssuer(address issuerAddress) external;
    function isAuthorizedIssuer(address issuerAddress) external view returns (bool);
    function getIssuerInfo(address issuerAddress) external view returns (IssuerMetadata memory);
    function incrementCredentialCount(address issuerAddress) external;
    function getIssuerCount() external view returns (uint256);

    event IssuerAdded(address indexed issuer, string name, uint256 timestamp);
    event IssuerRevoked(address indexed issuer, uint256 timestamp);
}
