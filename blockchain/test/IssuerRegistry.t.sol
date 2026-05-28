// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/IssuerRegistry.sol";

contract IssuerRegistryTest is Test {
    IssuerRegistry public registry;
    address public owner;
    address public issuer1;
    address public issuer2;

    function setUp() public {
        owner = address(this);
        issuer1 = makeAddr("issuer1");
        issuer2 = makeAddr("issuer2");
        registry = new IssuerRegistry();
    }

    function test_AddIssuer() public {
        registry.addIssuer(issuer1, "UIDAI");

        assertTrue(registry.isAuthorizedIssuer(issuer1));
        assertEq(registry.getIssuerCount(), 1);

        IssuerRegistry.IssuerMetadata memory info = registry.getIssuerInfo(issuer1);
        assertEq(info.name, "UIDAI");
        assertTrue(info.isActive);
        assertEq(info.credentialsIssued, 0);
    }

    function test_AddMultipleIssuers() public {
        registry.addIssuer(issuer1, "UIDAI");
        registry.addIssuer(issuer2, "RBI");

        assertTrue(registry.isAuthorizedIssuer(issuer1));
        assertTrue(registry.isAuthorizedIssuer(issuer2));
        assertEq(registry.getIssuerCount(), 2);
    }

    function test_RevertAddDuplicate() public {
        registry.addIssuer(issuer1, "UIDAI");
        vm.expectRevert("Already authorized");
        registry.addIssuer(issuer1, "UIDAI Again");
    }

    function test_RevertAddZeroAddress() public {
        vm.expectRevert("Invalid address");
        registry.addIssuer(address(0), "Invalid");
    }

    function test_RevertAddEmptyName() public {
        vm.expectRevert("Name required");
        registry.addIssuer(issuer1, "");
    }

    function test_RemoveIssuer() public {
        registry.addIssuer(issuer1, "UIDAI");
        registry.removeIssuer(issuer1);

        assertFalse(registry.isAuthorizedIssuer(issuer1));
        assertFalse(registry.getIssuerInfo(issuer1).isActive);
    }

    function test_RevertRemoveUnauthorized() public {
        vm.expectRevert("Not authorized");
        registry.removeIssuer(issuer1);
    }

    function test_IncrementCredentialCount() public {
        registry.addIssuer(issuer1, "UIDAI");
        registry.incrementCredentialCount(issuer1);
        registry.incrementCredentialCount(issuer1);

        assertEq(registry.getIssuerInfo(issuer1).credentialsIssued, 2);
    }

    function test_OnlyOwnerCanAdd() public {
        vm.prank(issuer1);
        vm.expectRevert();
        registry.addIssuer(issuer2, "Rogue Issuer");
    }

    function test_PauseUnpause() public {
        registry.pause();

        vm.expectRevert();
        registry.addIssuer(issuer1, "UIDAI");

        registry.unpause();
        registry.addIssuer(issuer1, "UIDAI");
        assertTrue(registry.isAuthorizedIssuer(issuer1));
    }

    function test_EmitIssuerAdded() public {
        vm.expectEmit(true, false, false, true);
        emit IssuerRegistry.IssuerAdded(issuer1, "UIDAI", block.timestamp);
        registry.addIssuer(issuer1, "UIDAI");
    }

    function test_EmitIssuerRevoked() public {
        registry.addIssuer(issuer1, "UIDAI");

        vm.expectEmit(true, false, false, true);
        emit IssuerRegistry.IssuerRevoked(issuer1, block.timestamp);
        registry.removeIssuer(issuer1);
    }

    function test_GetIssuerAt() public {
        registry.addIssuer(issuer1, "UIDAI");
        registry.addIssuer(issuer2, "RBI");

        assertEq(registry.getIssuerAt(0), issuer1);
        assertEq(registry.getIssuerAt(1), issuer2);
    }

    function test_RevertGetIssuerAtOutOfBounds() public {
        vm.expectRevert("Index out of bounds");
        registry.getIssuerAt(0);
    }
}
