// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/NullifierRegistry.sol";

contract NullifierRegistryTest is Test {
    NullifierRegistry public registry;
    address public owner;
    address public verifier1;
    address public user1;

    bytes32 public constant NULLIFIER_1 = keccak256("nullifier_1");
    bytes32 public constant NULLIFIER_2 = keccak256("nullifier_2");
    bytes32 public constant PURPOSE_KYC = keccak256("BANK_KYC");

    function setUp() public {
        owner = address(this);
        verifier1 = makeAddr("verifier1");
        user1 = makeAddr("user1");
        registry = new NullifierRegistry();
    }

    function test_MarkNullifierUsed() public {
        registry.markNullifierUsed(NULLIFIER_1, verifier1, PURPOSE_KYC);

        assertTrue(registry.isNullifierUsed(NULLIFIER_1));
        assertEq(registry.getTotalNullifiers(), 1);

        NullifierRegistry.NullifierRecord memory record = registry.getNullifierMetadata(NULLIFIER_1);
        assertTrue(record.used);
        assertEq(record.verifier, verifier1);
        assertEq(record.purposeHash, PURPOSE_KYC);
    }

    function test_RevertReplayAttack() public {
        registry.markNullifierUsed(NULLIFIER_1, verifier1, PURPOSE_KYC);

        vm.expectRevert("Nullifier already used");
        registry.markNullifierUsed(NULLIFIER_1, verifier1, PURPOSE_KYC);
    }

    function test_RevertInvalidVerifier() public {
        vm.expectRevert("Invalid verifier");
        registry.markNullifierUsed(NULLIFIER_1, address(0), PURPOSE_KYC);
    }

    function test_RevertInvalidNullifier() public {
        vm.expectRevert("Invalid nullifier");
        registry.markNullifierUsed(bytes32(0), verifier1, PURPOSE_KYC);
    }

    function test_MultipleNullifiers() public {
        registry.markNullifierUsed(NULLIFIER_1, verifier1, PURPOSE_KYC);
        registry.markNullifierUsed(NULLIFIER_2, verifier1, PURPOSE_KYC);

        assertTrue(registry.isNullifierUsed(NULLIFIER_1));
        assertTrue(registry.isNullifierUsed(NULLIFIER_2));
        assertEq(registry.getTotalNullifiers(), 2);
    }

    function test_UnusedNullifierReturnsFalse() public view {
        assertFalse(registry.isNullifierUsed(NULLIFIER_1));
    }

    function test_RateLimiting() public {
        vm.startPrank(user1);

        // Should allow up to MAX_ACTIONS_PER_HOUR
        for (uint256 i = 0; i < 50; i++) {
            bytes32 nullifier = keccak256(abi.encodePacked("nullifier_", i));
            registry.markNullifierUsed(nullifier, verifier1, PURPOSE_KYC);
        }

        // Next one should fail
        bytes32 extraNullifier = keccak256("extra");
        vm.expectRevert("Rate limit exceeded");
        registry.markNullifierUsed(extraNullifier, verifier1, PURPOSE_KYC);

        vm.stopPrank();
    }

    function test_RateLimitResetsAfterHour() public {
        vm.startPrank(user1);

        for (uint256 i = 0; i < 50; i++) {
            bytes32 nullifier = keccak256(abi.encodePacked("nullifier_", i));
            registry.markNullifierUsed(nullifier, verifier1, PURPOSE_KYC);
        }

        // Warp 1 hour forward
        vm.warp(block.timestamp + 1 hours + 1);

        // Should work again
        bytes32 newNullifier = keccak256("after_reset");
        registry.markNullifierUsed(newNullifier, verifier1, PURPOSE_KYC);
        assertTrue(registry.isNullifierUsed(newNullifier));

        vm.stopPrank();
    }

    function test_PauseBlocks() public {
        registry.pause();

        vm.expectRevert();
        registry.markNullifierUsed(NULLIFIER_1, verifier1, PURPOSE_KYC);

        registry.unpause();
        registry.markNullifierUsed(NULLIFIER_1, verifier1, PURPOSE_KYC);
        assertTrue(registry.isNullifierUsed(NULLIFIER_1));
    }

    function test_EmitNullifierMarked() public {
        vm.expectEmit(true, true, false, true);
        emit NullifierRegistry.NullifierMarked(NULLIFIER_1, verifier1, PURPOSE_KYC, block.timestamp);
        registry.markNullifierUsed(NULLIFIER_1, verifier1, PURPOSE_KYC);
    }
}
