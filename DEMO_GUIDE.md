# Aadhaar-Zero — Demo Recording Guide

## Prerequisites (Start These First)

```bash
# Terminal 1 — PostgreSQL
docker start aadhaar-postgres

# Terminal 2 — Python AI Backend
cd python_backend && ./run.sh

# Terminal 3 — Next.js Frontend
cd frontend && pnpm dev
```

Open browser at **http://localhost:3000**

---

## Scene 1 — Landing Page (`/landing`)

**What to show:**
- Hero section with animated gradient heading "Privacy-First Identity, Powered by Zero-Knowledge Proofs"
- Live stats: 99.9% uptime · 2.1M+ users · 32K+ verifiers
- 6 feature cards (hover each one to see lift animation):
  - Zero-Knowledge Proofs
  - Instant Verification
  - Blockchain Anchored
  - Multi-Modal Liveness
  - One Identity
  - Mobile-First
- "How It Works" — 4-step animated walkthrough
- Click **"Get Started"** to begin enrollment
- Click **"I'm a Verifier"** to jump to verification

---

## Scene 2 — Registration (`/register`)

**What to show:**
- Step 1: Enter full name (e.g. `Raj Kumar`)
- Click "Continue" → Step 2 appears with progress bar
- Enter email (e.g. `raj@demo.com`), password + confirm password
- Click **"Create Account"**
- Automatically redirects to Enrollment Step 1

> **Demo shortcut:** Use `demo@aadhaar-zero.com` / `demo123` on the Login page to skip registration with pre-seeded credentials.

---

## Scene 3 — Login (`/login`)

**What to show:**
- Enter email + password
- The demo credentials box shows `demo@aadhaar-zero.com` / `demo123`
- Click **"Sign In"**
- Redirects to `/dashboard`
- If already logged in, visiting `/login` auto-redirects to Dashboard

---

## Scene 4 — Dashboard (`/dashboard`)

**What to show:**

### Stats Row
- **Active Credentials** — count of valid credentials
- **Pending Verifications** — verification requests awaiting response
- **Privacy Score** — calculated score (60–95%) based on verification success rate

### Blockchain Status Card
- Click the card to expand — shows:
  - Wallet connection status
  - Network (Base Sepolia)
  - All 8 deployed contract addresses with ✓ deployed indicators
  - Connect wallet button (RainbowKit modal)

### Credential Cards
Each card shows:
- Credential type icon + gradient (Aadhaar=blue, PAN=purple, License=amber, Passport=green)
- Holder name, date of birth, issue/expiry date
- Truncated proof hash
- 3 action buttons: **View**, **Share**, **Revoke**

### Activity Timeline
- Chronological log of: credential issued, verification requests, proofs shared
- Status badges: completed / pending / approved
- Relative timestamps ("2 hours ago")

### Add New Credential Button
- Top-right → goes to enrollment flow

---

## Scene 5 — Enrollment Flow (4 Steps)

### Step 1 — Personal Information (`/enroll/step1`)
- Progress bar: 25%
- Fill in: First Name, Last Name, Date of Birth, Email, Phone
- Click **"Next Step"**

### Step 2 — Upload Document (`/enroll/step2`)
- Progress bar: 50%
- Select document type: Aadhaar Card / PAN Card / Driving License / Passport
- Drag-and-drop or click to upload (JPG/PNG/PDF, max 10MB)
- Watch upload progress bar animate
- Auto-extraction fires after upload — shows extracted fields (name, DOB, document number)
- Click **"Next Step"**

### Step 3 — Liveness Verification (`/enroll/step3`)
- Progress bar: 75%
- Camera permission dialog appears
- Live webcam feed (mirrored, with red recording indicator)
- System captures 3 frames automatically
- Sends to AI backend (DeepFace anti-spoofing)
- Liveness score bar fills up (must be ≥ 75% to proceed)
- Shows ✓ Verified or asks to retry
- Click **"Next Step"**

### Step 4 — Consent & Issue (`/enroll/step4`)
- Progress bar: 100%
- Summary card showing all entered details
- Two consent checkboxes:
  - ✓ I agree to the Terms of Service and Privacy Policy
  - ✓ I consent to storing encrypted biometric data
- 7-point feature list (ZKP, selective disclosure, on-chain anchoring, etc.)
- Click **"Issue Credential"** — spinner while processing
- **Success screen animates in:**
  - Large checkmark animation
  - Credential type badge
  - Proof Hash (keccak256)
  - Blockchain TX Hash (links to Base Sepolia)
  - Wallet address
  - Auto-redirects to Dashboard after 2 seconds

---

## Scene 6 — Credential Detail (`/credentials/[id]`)

**Access:** Click **"View"** on any credential card in Dashboard

**What to show:**
- Back button → Dashboard
- Large gradient credential card (color matches type)
- Details grid:
  - Issue Date / Expiry Date
  - Date of Birth / Gender
  - Address (if available)
- **Blockchain Section:**
  - Proof Hash with copy button
  - TX Hash with copy button
  - "View on BaseScan" link → opens `sepolia.basescan.org`
- **Action Buttons:**
  - **Share Credential** → ZKP proof generation page
  - **Revoke** → confirmation toast → credential marked revoked on-chain + DB

---

## Scene 7 — ZKP Proof Generation & Sharing (`/credentials/[id]/share`)

**Access:** Click **"Share"** on Dashboard card or "Share Credential" on detail page

**What to show:**

### Connect Wallet (if not connected)
- WalletConnect modal appears
- Choose wallet (MetaMask, Coinbase, Rainbow, etc.)
- Switch to Base Sepolia network if prompted

### Select Attributes to Disclose
- Checkbox list of credential attributes
- Check only what to reveal (e.g. just "Name" and "Over 18" — hide DOB, address)
- This is the **BBS+ selective disclosure** in action

### Generate Proof
- Click **"Generate Proof"**
- Status machine shows:
  1. "Generating Groth16 Proof..." (snarkJS running in browser)
  2. "Proof Generated ✓" — proof appears
- Click **"Submit On-Chain"**
  3. "Submitting to Base Sepolia..." (MetaMask popup to sign TX)
  4. "Confirming on-chain..."
  5. **"Verified on-chain ✓"** — green badge

### QR Code
- Auto-generated QR code containing the proof token
- Download QR / Copy proof token
- Verifiers can scan this QR to verify instantly

---

## Scene 8 — Verify a Proof (`/verify`)

**Access:** Click **"I'm a Verifier"** on landing, or navigate directly

**What to show:**

### Submit Form
- Organization Name (e.g. `HDFC Bank`)
- Wallet Address (optional — e.g. `0x1234...`)
- Proof Token textarea — paste a proof token from the share page
- Click **"Verify Proof"**

### Success State (animated)
- Large green animated checkmark
- Result card showing:
  - Credential Type
  - Verification Status: ✓ Valid
  - Issuer address
  - Verification timestamp
- **On-Chain Checks Grid:**
  - Nullifier Registry ✓
  - Revocation Check ✓
  - Verifier Authorization ✓
  - Consent Registry ✓
- **AI Risk Score** badge (Low / Medium / High)
- Nullifier TX link on BaseScan
- Privacy notice: "Only disclosed attributes were revealed"

---

## Scene 9 — QR Scanner (`/verify/scan`)

**Access:** Click **"Scan & Verify"** in the Navbar (when logged in)

**What to show:**
- Camera opens with QR scanner overlay
- Point camera at QR code from the Share page
- Auto-verifies instantly on scan
- **Success:** Green checkmark, disclosed attributes table, On-Chain badge, Risk badge
- **Failure:** Red X with error message
- "Scan Another" button to reset

---

## Scene 10 — Wallet Connection (`Navbar`)

**What to show:**
- Click **"Connect Wallet"** in Navbar
- RainbowKit modal:
  - MetaMask
  - Coinbase Wallet
  - Rainbow
  - WalletConnect (scan QR with mobile wallet)
- After connecting: shows account address chip with dropdown:
  - Copy Address
  - View on BaseScan
  - Disconnect
- Wrong Network warning (yellow badge) if not on Base Sepolia
- Switch Network button

---

## Scene 11 — System Benchmark (`/benchmark`)

**Access:** Navigate to `http://localhost:3000/benchmark`

**What to show:**
- Click **"Run Full Suite"** button
- Results appear one by one (staggered animation):

| Operation | Expected Speed |
|---|---|
| keccak256 hashing × 1000 | ⚡ Blazing (<10ms) |
| BBS+ Sign × 100 | ⚡ Blazing |
| BBS+ Proof Gen × 100 | ✓ Fast |
| BBS+ Verify × 100 | ✓ Fast |
| Merkle Tree Build × 1000 | ⚡ Blazing |
| Merkle Proof Verify × 100 | ⚡ Blazing |
| BBS+ Serialization × 1000 | ⚡ Blazing |
| DB Read Latency | ✓ Fast |

- Animated progress bars fill relative to speed
- Speed badges: ⚡ Blazing / ✓ Fast / ~ OK / ⚠ Slow
- Total execution time shown at top

---

## Scene 12 — DPDP Compliance Dashboard (`/compliance`)

**Access:** Navigate to `http://localhost:3000/compliance`

**What to show:**

### Summary Card
- 8/8 compliance checks passed
- "Compliant" green badge

### 8 Compliance Checks (animated grid):
| Check | DPDP Section |
|---|---|
| Consent Management | Section 6 |
| Data Minimization | Section 4(2) |
| Right to Erasure | Section 12(3) |
| Audit Trail | Section 8(7) |
| Unlinkable Verification | Section 8(1) |
| Credential Revocation | Section 12(1) |
| Risk-Based Processing | Section 8(4) |
| Storage Limitation | Section 8(8) |

### Right to Erasure Flow
- Click **"Request Data Erasure"**
- Confirmation warning appears in red
- Click **"Confirm Erasure"**
  - Revokes all credentials on-chain
  - Deletes sessions, device fingerprints, risk profiles
  - Nullifies PII (name → `[ERASED]`, email → null)
  - Creates immutable audit log
  - Shows erasure summary
  - Auto-logs out and redirects to landing page after 3 seconds

---

## Scene 13 — Credential Revocation (from Dashboard)

**What to show:**
- Click **"Revoke"** on a credential card
- Confirmation dialog appears
- Confirm → spinner
- On-chain TX submitted to RevocationRegistry
- DB updated with revocation timestamp
- Card disappears / shows "Revoked" badge
- Activity timeline updates

---

## Key Talking Points for Video

| Feature | Demo It By |
|---|---|
| **Zero-Knowledge Proofs** | Share page → Generate Groth16 proof in browser |
| **Selective Disclosure** | Share page → check only 2 of 5 attributes |
| **On-Chain Verification** | Submit proof → watch TX on BaseScan |
| **AI Liveness** | Enrollment Step 3 → webcam captures frames |
| **BBS+ Signatures** | Generate proof → copy token → paste in Verify page |
| **QR Code Flow** | Share → QR → Scan & Verify page |
| **DPDP Compliance** | Compliance page → 8/8 checks |
| **Data Erasure** | Compliance page → Erase → auto logout |
| **Blockchain Status** | Dashboard → BlockchainStatus card → all 8 contracts |
| **Merkle Audit Trail** | Audit Anchor API anchors logs to Base Sepolia |

---

## URLs Quick Reference

| Page | URL |
|---|---|
| Landing | http://localhost:3000/landing |
| Login | http://localhost:3000/login |
| Register | http://localhost:3000/register |
| Dashboard | http://localhost:3000/dashboard |
| Enroll Step 1 | http://localhost:3000/enroll/step1 |
| Verify Proof | http://localhost:3000/verify |
| QR Scan | http://localhost:3000/verify/scan |
| Benchmark | http://localhost:3000/benchmark |
| DPDP Compliance | http://localhost:3000/compliance |
| BaseScan Contracts | https://sepolia.basescan.org |

---

## Demo Credentials

| Field | Value |
|---|---|
| Email | `demo@aadhaar-zero.com` |
| Password | `demo123` |
| Chain | Base Sepolia (Chain ID: 84532) |
| RPC | https://sepolia.base.org |
