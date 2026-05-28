// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/IssuerRegistry.sol";
import "../src/NullifierRegistry.sol";
import "../src/ConsentRegistry.sol";
import "../src/RevocationRegistry.sol";
import "../src/VerifierRegistry.sol";
import "../src/AuditTrail.sol";
import "../src/Groth16Verifier.sol";
import "../src/ZKPVerificationOrchestrator.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with deployer:", deployer);
        console.log("Deployer balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy IssuerRegistry
        IssuerRegistry issuerRegistry = new IssuerRegistry();
        console.log("IssuerRegistry deployed at:", address(issuerRegistry));

        // 2. Deploy NullifierRegistry
        NullifierRegistry nullifierRegistry = new NullifierRegistry();
        console.log("NullifierRegistry deployed at:", address(nullifierRegistry));

        // 3. Deploy ConsentRegistry
        ConsentRegistry consentRegistry = new ConsentRegistry();
        console.log("ConsentRegistry deployed at:", address(consentRegistry));

        // 4. Deploy RevocationRegistry
        RevocationRegistry revocationRegistry = new RevocationRegistry();
        console.log("RevocationRegistry deployed at:", address(revocationRegistry));

        // 5. Deploy VerifierRegistry
        VerifierRegistry verifierRegistry = new VerifierRegistry();
        console.log("VerifierRegistry deployed at:", address(verifierRegistry));

        // 6. Deploy AuditTrail
        AuditTrail auditTrail = new AuditTrail();
        console.log("AuditTrail deployed at:", address(auditTrail));

        // 7. Deploy Groth16Verifier (auto-generated from circom/snarkjs)
        Groth16Verifier groth16Verifier = new Groth16Verifier();
        console.log("Groth16Verifier deployed at:", address(groth16Verifier));

        // 8. Deploy ZKPVerificationOrchestrator
        ZKPVerificationOrchestrator zkpOrchestrator = new ZKPVerificationOrchestrator(
            address(groth16Verifier),
            address(nullifierRegistry)
        );
        console.log("ZKPVerificationOrchestrator deployed at:", address(zkpOrchestrator));

        // Setup: Add deployer as initial issuer and authorized revoker
        issuerRegistry.addIssuer(deployer, "Aadhaar-Zero Platform");
        revocationRegistry.authorizeRevoker(deployer);

        // Setup: Register deployer as initial verifier
        verifierRegistry.registerVerifier(deployer, "Aadhaar-Zero Platform", VerifierRegistry.VerifierCategory.GOVERNMENT);

        vm.stopBroadcast();

        // Log all addresses for frontend config
        console.log("\n--- Contract Addresses (copy to frontend .env) ---");
        console.log("NEXT_PUBLIC_ISSUER_REGISTRY=", address(issuerRegistry));
        console.log("NEXT_PUBLIC_NULLIFIER_REGISTRY=", address(nullifierRegistry));
        console.log("NEXT_PUBLIC_CONSENT_REGISTRY=", address(consentRegistry));
        console.log("NEXT_PUBLIC_REVOCATION_REGISTRY=", address(revocationRegistry));
        console.log("NEXT_PUBLIC_VERIFIER_REGISTRY=", address(verifierRegistry));
        console.log("NEXT_PUBLIC_AUDIT_TRAIL=", address(auditTrail));
        console.log("NEXT_PUBLIC_GROTH16_VERIFIER=", address(groth16Verifier));
        console.log("NEXT_PUBLIC_ZKP_ORCHESTRATOR=", address(zkpOrchestrator));
    }
}
