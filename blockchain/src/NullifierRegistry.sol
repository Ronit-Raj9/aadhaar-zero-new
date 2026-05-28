// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title NullifierRegistry - Prevent proof replay attacks
/// @notice Tracks used nullifiers to ensure each ZK proof can only be used once
/// @dev Critical for preventing identity farming and mule networks
contract NullifierRegistry is Ownable, Pausable {
    struct NullifierRecord {
        bool used;
        address verifier;
        bytes32 purposeHash;
        uint256 timestamp;
    }

    mapping(bytes32 => NullifierRecord) public nullifiers;

    // Rate limiting: max actions per address per hour
    mapping(address => uint256) public lastActionTimestamp;
    mapping(address => uint256) public actionsInCurrentHour;
    uint256 public constant MAX_ACTIONS_PER_HOUR = 50;

    // Stats
    uint256 public totalNullifiers;

    event NullifierMarked(
        bytes32 indexed nullifier, address indexed verifier, bytes32 purposeHash, uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

    /// @notice Mark a nullifier as used (prevents replay)
    /// @param nullifier The unique nullifier hash
    /// @param verifier Address of the verifier consuming this proof
    /// @param purposeHash Hash of the verification purpose (e.g., keccak256("BANK_KYC"))
    function markNullifierUsed(bytes32 nullifier, address verifier, bytes32 purposeHash) external whenNotPaused {
        require(!nullifiers[nullifier].used, "Nullifier already used");
        require(verifier != address(0), "Invalid verifier");
        require(nullifier != bytes32(0), "Invalid nullifier");

        // Rate limiting
        if (block.timestamp - lastActionTimestamp[msg.sender] > 1 hours) {
            actionsInCurrentHour[msg.sender] = 0;
            lastActionTimestamp[msg.sender] = block.timestamp;
        }
        require(actionsInCurrentHour[msg.sender] < MAX_ACTIONS_PER_HOUR, "Rate limit exceeded");
        actionsInCurrentHour[msg.sender]++;

        nullifiers[nullifier] = NullifierRecord({
            used: true,
            verifier: verifier,
            purposeHash: purposeHash,
            timestamp: block.timestamp
        });

        totalNullifiers++;

        emit NullifierMarked(nullifier, verifier, purposeHash, block.timestamp);
    }

    /// @notice Check if a nullifier has been used
    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return nullifiers[nullifier].used;
    }

    /// @notice Get full record for a nullifier
    function getNullifierMetadata(bytes32 nullifier) external view returns (NullifierRecord memory) {
        return nullifiers[nullifier];
    }

    /// @notice Get total nullifiers registered
    function getTotalNullifiers() external view returns (uint256) {
        return totalNullifiers;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
