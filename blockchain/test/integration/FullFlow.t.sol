// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/IssuerRegistry.sol";
import "../../src/NullifierRegistry.sol";
import "../../src/ConsentRegistry.sol";
import "../../src/RevocationRegistry.sol";
import "../../src/VerifierRegistry.sol";
import "../../src/AuditTrail.sol";

/// @title Full Integration Test - Simulates complete verification flow
contract FullFlowTest is Test {
    IssuerRegistry public issuerRegistry;
    NullifierRegistry public nullifierRegistry;
    ConsentRegistry public consentRegistry;
    RevocationRegistry public revocationRegistry;
    VerifierRegistry public verifierRegistry;
    AuditTrail public auditTrail;

    address public admin;
    address public issuer;
    address public verifier;
    address public user;
    address public backendSigner;

    function setUp() public {
        admin = address(this);
        issuer = makeAddr("issuer");
        verifier = makeAddr("verifier");
        user = makeAddr("user");
        backendSigner = makeAddr("backend");

        // Deploy all contracts
        issuerRegistry = new IssuerRegistry();
        nullifierRegistry = new NullifierRegistry();
        consentRegistry = new ConsentRegistry();
        revocationRegistry = new RevocationRegistry();
        verifierRegistry = new VerifierRegistry();
        auditTrail = new AuditTrail();

        // Setup roles
        issuerRegistry.addIssuer(issuer, "UIDAI");
        verifierRegistry.registerVerifier(verifier, "HDFC Bank", VerifierRegistry.VerifierCategory.BANK);
        revocationRegistry.authorizeRevoker(issuer);
        auditTrail.authorizeSubmitter(backendSigner);
    }

    /// @notice Test: Complete credential issuance → verification → consent → audit flow
    function test_FullVerificationFlow() public {
        // Step 1: Verify issuer is authorized
        assertTrue(issuerRegistry.isAuthorizedIssuer(issuer));

        // Step 2: Issuer increments credential count
        issuerRegistry.incrementCredentialCount(issuer);
        assertEq(issuerRegistry.getIssuerInfo(issuer).credentialsIssued, 1);

        // Step 3: Generate credential ID (off-chain hash)
        bytes32 credentialId = keccak256(abi.encodePacked(issuer, user, "AADHAAR", block.timestamp));

        // Step 4: Verify credential is not revoked
        assertFalse(revocationRegistry.isRevoked(credentialId));

        // Step 5: Verify verifier is authorized
        assertTrue(verifierRegistry.isAuthorizedVerifier(verifier));

        // Step 6: Generate nullifier (off-chain)
        bytes32 nullifier = keccak256(abi.encodePacked(credentialId, verifier, block.timestamp, "userSecret"));
        bytes32 purposeHash = keccak256("BANK_KYC");

        // Step 7: Check nullifier hasn't been used
        assertFalse(nullifierRegistry.isNullifierUsed(nullifier));

        // Step 8: Mark nullifier as used (backend does this after ZK proof verification)
        vm.prank(backendSigner);
        nullifierRegistry.markNullifierUsed(nullifier, verifier, purposeHash);
        assertTrue(nullifierRegistry.isNullifierUsed(nullifier));

        // Step 9: Record consent (user signs this)
        bytes32 consentHash = keccak256(abi.encodePacked(user, verifier, purposeHash, block.timestamp));
        bytes32 attributesRoot = keccak256("age_over_18");

        vm.prank(user);
        consentRegistry.recordConsent(consentHash, attributesRoot, verifier, purposeHash);
        assertTrue(consentRegistry.isConsentActive(consentHash));

        // Step 10: Increment verifier count
        verifierRegistry.incrementVerificationCount(verifier);
        assertEq(verifierRegistry.getVerifierInfo(verifier).verificationCount, 1);

        // Step 11: Anchor audit log (backend does this in batches)
        bytes32 logHash = keccak256(
            abi.encodePacked("VERIFICATION", nullifier, verifier, block.timestamp, uint256(15), "SUCCESS")
        );
        bytes32 merkleRoot = keccak256(abi.encodePacked(logHash)); // Simplified single-leaf tree

        vm.prank(backendSigner);
        auditTrail.anchorMerkleRoot(merkleRoot, 1);
        assertEq(auditTrail.getBatchCount(), 1);
    }

    /// @notice Test: Replay attack is blocked
    function test_ReplayAttackBlocked() public {
        bytes32 nullifier = keccak256("proof_1");
        bytes32 purposeHash = keccak256("BANK_KYC");

        // First use succeeds
        nullifierRegistry.markNullifierUsed(nullifier, verifier, purposeHash);

        // Replay attempt fails
        vm.expectRevert("Nullifier already used");
        nullifierRegistry.markNullifierUsed(nullifier, verifier, purposeHash);
    }

    /// @notice Test: Revoked credential is detected
    function test_RevokedCredentialDetected() public {
        bytes32 credentialId = keccak256("credential_1");

        // Initially not revoked
        assertFalse(revocationRegistry.isRevoked(credentialId));

        // Issuer revokes
        vm.prank(issuer);
        revocationRegistry.revokeCredential(credentialId, "FRAUD");

        // Now detected as revoked
        assertTrue(revocationRegistry.isRevoked(credentialId));
    }

    /// @notice Test: User can revoke consent (DPDP compliance)
    function test_UserRevokesConsent() public {
        bytes32 consentHash = keccak256("consent_1");
        bytes32 attributesRoot = keccak256("attrs");
        bytes32 purposeHash = keccak256("BANK_KYC");

        vm.prank(user);
        consentRegistry.recordConsent(consentHash, attributesRoot, verifier, purposeHash);
        assertTrue(consentRegistry.isConsentActive(consentHash));

        vm.prank(user);
        consentRegistry.revokeConsent(consentHash);
        assertFalse(consentRegistry.isConsentActive(consentHash));
    }

    /// @notice Test: Unauthorized issuer cannot be used
    function test_UnauthorizedIssuerRejected() public {
        address rogueIssuer = makeAddr("rogue");
        assertFalse(issuerRegistry.isAuthorizedIssuer(rogueIssuer));
    }

    /// @notice Test: Unauthorized verifier detected
    function test_UnauthorizedVerifierRejected() public {
        address rogueVerifier = makeAddr("rogueVerifier");
        assertFalse(verifierRegistry.isAuthorizedVerifier(rogueVerifier));
    }

    /// @notice Test: Bulk revocation (data breach scenario)
    function test_BulkRevocation() public {
        bytes32[] memory ids = new bytes32[](3);
        ids[0] = keccak256("cred_1");
        ids[1] = keccak256("cred_2");
        ids[2] = keccak256("cred_3");

        vm.prank(issuer);
        revocationRegistry.bulkRevoke(ids, "DATA_BREACH");

        for (uint256 i = 0; i < ids.length; i++) {
            assertTrue(revocationRegistry.isRevoked(ids[i]));
        }
    }
}
