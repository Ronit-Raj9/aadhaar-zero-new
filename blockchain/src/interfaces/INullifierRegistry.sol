// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface INullifierRegistry {
    struct NullifierRecord {
        bool used;
        address verifier;
        bytes32 purposeHash;
        uint256 timestamp;
    }

    function markNullifierUsed(bytes32 nullifier, address verifier, bytes32 purposeHash) external;
    function isNullifierUsed(bytes32 nullifier) external view returns (bool);
    function getNullifierMetadata(bytes32 nullifier) external view returns (NullifierRecord memory);
    function getTotalNullifiers() external view returns (uint256);

    event NullifierMarked(
        bytes32 indexed nullifier, address indexed verifier, bytes32 purposeHash, uint256 timestamp
    );
}
