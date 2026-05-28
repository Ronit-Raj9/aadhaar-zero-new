// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ConsentRegistry.sol";

contract ConsentRegistryTest is Test {
    ConsentRegistry public registry;
    address public owner;
    address public user1;
    address public verifier1;

    bytes32 public constant CONSENT_HASH = keccak256("consent_1");
    bytes32 public constant ATTRIBUTES_ROOT = keccak256("attributes_merkle_root");
    bytes32 public constant PURPOSE_KYC = keccak256("BANK_KYC");

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        verifier1 = makeAddr("verifier1");
        registry = new ConsentRegistry();
    }

    function test_RecordConsent() public {
        vm.prank(user1);
        registry.recordConsent(CONSENT_HASH, ATTRIBUTES_ROOT, verifier1, PURPOSE_KYC);

        ConsentRegistry.ConsentRecord memory record = registry.verifyConsent(CONSENT_HASH);
        assertEq(record.user, user1);
        assertEq(record.verifier, verifier1);
        assertEq(record.purposeCode, PURPOSE_KYC);
        assertFalse(record.revoked);
        assertTrue(registry.isConsentActive(CONSENT_HASH));
    }

    function test_RevertDuplicateConsent() public {
        vm.startPrank(user1);
        registry.recordConsent(CONSENT_HASH, ATTRIBUTES_ROOT, verifier1, PURPOSE_KYC);

        vm.expectRevert("Consent already recorded");
        registry.recordConsent(CONSENT_HASH, ATTRIBUTES_ROOT, verifier1, PURPOSE_KYC);
        vm.stopPrank();
    }

    function test_RevokeConsent() public {
        vm.startPrank(user1);
        registry.recordConsent(CONSENT_HASH, ATTRIBUTES_ROOT, verifier1, PURPOSE_KYC);
        registry.revokeConsent(CONSENT_HASH);
        vm.stopPrank();

        ConsentRegistry.ConsentRecord memory record = registry.verifyConsent(CONSENT_HASH);
        assertTrue(record.revoked);
        assertFalse(registry.isConsentActive(CONSENT_HASH));
    }

    function test_RevertRevokeByNonOwner() public {
        vm.prank(user1);
        registry.recordConsent(CONSENT_HASH, ATTRIBUTES_ROOT, verifier1, PURPOSE_KYC);

        vm.prank(verifier1);
        vm.expectRevert("Not consent owner");
        registry.revokeConsent(CONSENT_HASH);
    }

    function test_RevertDoubleRevoke() public {
        vm.startPrank(user1);
        registry.recordConsent(CONSENT_HASH, ATTRIBUTES_ROOT, verifier1, PURPOSE_KYC);
        registry.revokeConsent(CONSENT_HASH);

        vm.expectRevert("Already revoked");
        registry.revokeConsent(CONSENT_HASH);
        vm.stopPrank();
    }

    function test_UserConsentHistory() public {
        bytes32 consent2 = keccak256("consent_2");

        vm.startPrank(user1);
        registry.recordConsent(CONSENT_HASH, ATTRIBUTES_ROOT, verifier1, PURPOSE_KYC);
        registry.recordConsent(consent2, ATTRIBUTES_ROOT, verifier1, keccak256("AGE_VERIFY"));
        vm.stopPrank();

        bytes32[] memory userConsents = registry.getUserConsents(user1);
        assertEq(userConsents.length, 2);
        assertEq(registry.getUserConsentCount(user1), 2);
    }

    function test_EmitConsentRecorded() public {
        vm.prank(user1);
        vm.expectEmit(true, true, true, true);
        emit ConsentRegistry.ConsentRecorded(CONSENT_HASH, user1, verifier1, PURPOSE_KYC);
        registry.recordConsent(CONSENT_HASH, ATTRIBUTES_ROOT, verifier1, PURPOSE_KYC);
    }

    function test_EmitConsentRevoked() public {
        vm.startPrank(user1);
        registry.recordConsent(CONSENT_HASH, ATTRIBUTES_ROOT, verifier1, PURPOSE_KYC);

        vm.expectEmit(true, true, false, true);
        emit ConsentRegistry.ConsentRevoked(CONSENT_HASH, user1, block.timestamp);
        registry.revokeConsent(CONSENT_HASH);
        vm.stopPrank();
    }
}
