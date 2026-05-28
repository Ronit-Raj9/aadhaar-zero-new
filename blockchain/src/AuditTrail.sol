// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title AuditTrail - Merkle root anchoring for tamper-evident logs
/// @notice Anchors batch Merkle roots on-chain for off-chain log verification
/// @dev Stores thousands of logs off-chain, one 32-byte root on-chain (~$0.01/batch)
contract AuditTrail is Ownable, Pausable {
    struct AuditBatch {
        bytes32 merkleRoot;
        uint256 batchSize; // Number of logs in this batch
        uint256 timestamp;
        address submitter;
    }

    mapping(uint256 => AuditBatch) public auditBatches;
    uint256 public batchCount;

    // Authorized submitters (backend services)
    mapping(address => bool) public authorizedSubmitters;

    event AuditBatchAnchored(uint256 indexed batchId, bytes32 merkleRoot, uint256 batchSize, address submitter);
    event SubmitterAuthorized(address indexed submitter);
    event SubmitterRemoved(address indexed submitter);

    constructor() Ownable(msg.sender) {
        // Owner is also an authorized submitter
        authorizedSubmitters[msg.sender] = true;
    }

    /// @notice Authorize an address to submit audit batches
    function authorizeSubmitter(address submitter) external onlyOwner {
        require(submitter != address(0), "Invalid address");
        authorizedSubmitters[submitter] = true;
        emit SubmitterAuthorized(submitter);
    }

    /// @notice Remove submitter authorization
    function removeSubmitter(address submitter) external onlyOwner {
        authorizedSubmitters[submitter] = false;
        emit SubmitterRemoved(submitter);
    }

    /// @notice Anchor a Merkle root for a batch of off-chain logs
    /// @param merkleRoot The Merkle root hash of the log batch
    /// @param batchSize Number of logs included in this batch
    function anchorMerkleRoot(bytes32 merkleRoot, uint256 batchSize) external whenNotPaused {
        require(authorizedSubmitters[msg.sender], "Not authorized submitter");
        require(merkleRoot != bytes32(0), "Invalid merkle root");
        require(batchSize > 0, "Batch size must be > 0");

        uint256 batchId = batchCount;

        auditBatches[batchId] = AuditBatch({
            merkleRoot: merkleRoot,
            batchSize: batchSize,
            timestamp: block.timestamp,
            submitter: msg.sender
        });

        batchCount++;

        emit AuditBatchAnchored(batchId, merkleRoot, batchSize, msg.sender);
    }

    /// @notice Verify that a log hash is included in a specific batch using Merkle proof
    /// @param logHash The hash of the individual log entry
    /// @param proof The Merkle proof (array of sibling hashes)
    /// @param batchId The batch to verify against
    /// @return True if the log is included in the batch
    function verifyLogInclusion(bytes32 logHash, bytes32[] calldata proof, uint256 batchId)
        external
        view
        returns (bool)
    {
        require(batchId < batchCount, "Batch does not exist");

        bytes32 computedRoot = logHash;
        for (uint256 i = 0; i < proof.length; i++) {
            if (computedRoot <= proof[i]) {
                computedRoot = keccak256(abi.encodePacked(computedRoot, proof[i]));
            } else {
                computedRoot = keccak256(abi.encodePacked(proof[i], computedRoot));
            }
        }

        return computedRoot == auditBatches[batchId].merkleRoot;
    }

    /// @notice Get a specific audit batch
    function getAuditBatch(uint256 batchId) external view returns (AuditBatch memory) {
        require(batchId < batchCount, "Batch does not exist");
        return auditBatches[batchId];
    }

    /// @notice Get total number of batches
    function getBatchCount() external view returns (uint256) {
        return batchCount;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
