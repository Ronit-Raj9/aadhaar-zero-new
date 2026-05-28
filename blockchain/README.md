# Aadhaar-Zero Smart Contracts

Foundry-based smart contracts for the Aadhaar-Zero privacy-preserving identity platform on Base L2.

## Contracts

| Contract | Purpose |
|----------|---------|
| `IssuerRegistry` | Whitelist authorized credential issuers |
| `NullifierRegistry` | Prevent proof replay attacks |
| `ConsentRegistry` | DPDP Act compliance consent trail |
| `RevocationRegistry` | Revoke compromised credentials |
| `VerifierRegistry` | Whitelist trusted verifiers |
| `AuditTrail` | Merkle root anchoring for audit logs |

## Setup

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install OpenZeppelin/openzeppelin-contracts
forge install foundry-rs/forge-std

# Copy env
cp .env.example .env
# Edit .env with your private key and RPC URLs
```

## Build & Test

```bash
forge build
forge test -vvv
forge test --gas-report
```

## Deploy to Base Sepolia

```bash
source .env
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

## Gas Estimates (Base L2)

| Operation | Gas | Cost (~$0.001/gas on Base) |
|-----------|-----|---------------------------|
| Mark Nullifier | ~65,000 | ~$0.005 |
| Record Consent | ~85,000 | ~$0.007 |
| Revoke Credential | ~55,000 | ~$0.004 |
| Anchor Merkle Root | ~50,000 | ~$0.004 |
