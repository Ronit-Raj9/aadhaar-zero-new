// prisma/seed.ts – Database seeding with demo data
// Run with: npx prisma db seed (or npx tsx prisma/seed.ts)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ---- Users ----

  const demoUser = await prisma.user.upsert({
    where: { walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0' },
    update: {},
    create: {
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      email: 'demo@aadhaar-zero.com',
      name: 'Ronit Raj',
      role: 'USER',
      lastLoginAt: new Date(),
    },
  });
  console.log(`✅ Demo user: ${demoUser.name} (${demoUser.id})`);

  const demoUser2 = await prisma.user.upsert({
    where: { walletAddress: '0x8f8a3B8c8D8E8f8a1b2c3d4e5f6a7b8c9d0e1f2a' },
    update: {},
    create: {
      walletAddress: '0x8f8a3B8c8D8E8f8a1b2c3d4e5f6a7b8c9d0e1f2a',
      email: 'khushi@aadhaar-zero.com',
      name: 'Khushi Singh',
      role: 'USER',
      lastLoginAt: new Date(),
    },
  });
  console.log(`✅ Demo user 2: ${demoUser2.name} (${demoUser2.id})`);

  // Using valid hex wallet addresses for verifier, issuer, admin
  const verifierUser = await prisma.user.upsert({
    where: { walletAddress: '0xABCDEF0000000000000000000000000000000001' },
    update: {},
    create: {
      walletAddress: '0xABCDEF0000000000000000000000000000000001',
      email: 'hdfc@verifier.com',
      name: 'HDFC Bank Verifier',
      role: 'VERIFIER',
      lastLoginAt: new Date(),
    },
  });
  console.log(`✅ Verifier: ${verifierUser.name} (${verifierUser.id})`);

  const issuerUser = await prisma.user.upsert({
    where: { walletAddress: '0xFEDCBA0000000000000000000000000000000001' },
    update: {},
    create: {
      walletAddress: '0xFEDCBA0000000000000000000000000000000001',
      email: 'issuer@uidai.gov.in',
      name: 'UIDAI Issuer',
      role: 'ISSUER',
      lastLoginAt: new Date(),
    },
  });
  console.log(`✅ Issuer: ${issuerUser.name} (${issuerUser.id})`);

  const adminUser = await prisma.user.upsert({
    where: { walletAddress: '0xADDAD00000000000000000000000000000000001' },
    update: {},
    create: {
      walletAddress: '0xADDAD00000000000000000000000000000000001',
      email: 'admin@aadhaar-zero.com',
      name: 'System Admin',
      role: 'ADMIN',
      lastLoginAt: new Date(),
    },
  });
  console.log(`✅ Admin: ${adminUser.name} (${adminUser.id})`);;

  // ---- Credentials ----

  const aadhaarCred = await prisma.credential.upsert({
    where: { credentialHash: '0x7f8a9c2d1e4b6f3a9c2d1e4b6f3a9c2d1e4b6f3a9c2d1e4b6f3a9c2d1e4b6f3a' },
    update: {},
    create: {
      userId: demoUser.id,
      credentialType: 'AADHAAR',
      credentialHash: '0x7f8a9c2d1e4b6f3a9c2d1e4b6f3a9c2d1e4b6f3a9c2d1e4b6f3a9c2d1e4b6f3a',
      attributes: {
        name: 'RONIT RAJ',
        dob: '2000-01-01',
        ageRange: '18-30',
        ageOver18: true,
        state: 'MADHYA PRADESH',
        city: 'GWALIOR',
        number_masked: 'XXXX XXXX 1234',
      },
      signature: '0xBBS_SIG_AADHAAR_MOCK_001',
      issuerAddress: '0xFEDCBA0000000000000000000000000000000001',
      issuedAt: new Date('2026-01-15'),
      expiresAt: new Date('2031-01-15'),
      metadata: {
        documentVerification: { valid: true, confidence: 0.94 },
        livenessCheck: { score: 0.96, live: true },
        riskScore: 12,
      },
    },
  });
  console.log(`✅ Aadhaar credential: ${aadhaarCred.id}`);

  const panCred = await prisma.credential.upsert({
    where: { credentialHash: '0x8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b' },
    update: {},
    create: {
      userId: demoUser.id,
      credentialType: 'PAN',
      credentialHash: '0x8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
      attributes: {
        name: 'RONIT RAJ',
        panNumber_masked: 'AABCD****X',
        fatherName: 'RAJ KUMAR',
      },
      signature: '0xBBS_SIG_PAN_MOCK_001',
      issuerAddress: '0xFEDCBA0000000000000000000000000000000001',
      issuedAt: new Date('2026-01-20'),
      expiresAt: new Date('2036-01-20'),
    },
  });
  console.log(`✅ PAN credential: ${panCred.id}`);

  const dlCred = await prisma.credential.upsert({
    where: { credentialHash: '0x9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c' },
    update: {},
    create: {
      userId: demoUser2.id,
      credentialType: 'DL',
      credentialHash: '0x9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c',
      attributes: {
        name: 'KHUSHI SINGH',
        dob: '1999-05-15',
        ageOver18: true,
        ageRange: '18-30',
        licenseNumber_masked: 'DL-0001-****',
        vehicleClasses: ['LMV', 'MCWG'],
      },
      signature: '0xBBS_SIG_DL_MOCK_001',
      issuerAddress: '0xFEDCBA0000000000000000000000000000000001',
      issuedAt: new Date('2025-06-05'),
      expiresAt: new Date('2030-06-04'),
    },
  });
  console.log(`✅ DL credential: ${dlCred.id}`);

  // ---- Verifications ----

  const verification1 = await prisma.verification.create({
    data: {
      credentialId: aadhaarCred.id,
      verifierAddress: '0xVerifier0000000000000000000000000000000001',
      verifierName: 'HDFC Bank',
      nullifier: '0xNULLIFIER_HDFC_KYC_001',
      consentHash: '0xCONSENT_HASH_001',
      revealedAttributes: { name: 'RONIT RAJ', ageRange: '18-30', state: 'MADHYA PRADESH' },
      purpose: 'BANK_KYC',
      riskScore: 12,
      riskLevel: 'LOW',
      verificationStatus: 'SUCCESS',
      blockchainTxHash: '0xMOCK_TX_001',
      timestamp: new Date('2026-02-10'),
      metadata: { ip: '103.45.x.x', device: 'Chrome/Desktop' },
    },
  });
  console.log(`✅ Verification (HDFC KYC): ${verification1.id}`);

  const verification2 = await prisma.verification.create({
    data: {
      credentialId: aadhaarCred.id,
      verifierAddress: '0xVerifier0000000000000000000000000000000002',
      verifierName: 'Zomato',
      nullifier: '0xNULLIFIER_ZOMATO_AGE_001',
      consentHash: '0xCONSENT_HASH_002',
      revealedAttributes: { ageOver18: true },
      purpose: 'AGE_VERIFICATION',
      riskScore: 8,
      riskLevel: 'LOW',
      verificationStatus: 'SUCCESS',
      blockchainTxHash: '0xMOCK_TX_002',
      timestamp: new Date('2026-02-15'),
    },
  });
  console.log(`✅ Verification (Zomato age): ${verification2.id}`);

  const verification3 = await prisma.verification.create({
    data: {
      credentialId: panCred.id,
      verifierAddress: '0xVerifier0000000000000000000000000000000003',
      verifierName: 'Zerodha',
      nullifier: '0xNULLIFIER_ZERODHA_PAN_001',
      consentHash: '0xCONSENT_HASH_003',
      revealedAttributes: { name: 'RONIT RAJ', panNumber_masked: 'AABCD****X' },
      purpose: 'DEMAT_KYC',
      riskScore: 18,
      riskLevel: 'LOW',
      verificationStatus: 'SUCCESS',
      blockchainTxHash: '0xMOCK_TX_003',
      timestamp: new Date('2026-02-17'),
    },
  });
  console.log(`✅ Verification (Zerodha PAN): ${verification3.id}`);

  // ---- Audit Logs ----

  const auditEvents = [
    {
      eventType: 'USER_REGISTERED' as const,
      userId: demoUser.id,
      metadata: { walletAddress: demoUser.walletAddress },
      timestamp: new Date('2026-01-15T10:00:00Z'),
    },
    {
      eventType: 'CREDENTIAL_ISSUED' as const,
      userId: demoUser.id,
      credentialId: aadhaarCred.id,
      metadata: { credentialType: 'AADHAAR', issuer: issuerUser.walletAddress },
      timestamp: new Date('2026-01-15T11:00:00Z'),
    },
    {
      eventType: 'CREDENTIAL_ISSUED' as const,
      userId: demoUser.id,
      credentialId: panCred.id,
      metadata: { credentialType: 'PAN', issuer: issuerUser.walletAddress },
      timestamp: new Date('2026-01-20T09:30:00Z'),
    },
    {
      eventType: 'VERIFICATION' as const,
      userId: demoUser.id,
      verificationId: verification1.id,
      metadata: { verifier: 'HDFC Bank', purpose: 'BANK_KYC', riskScore: 12 },
      timestamp: new Date('2026-02-10T14:00:00Z'),
    },
    {
      eventType: 'CONSENT_RECORDED' as const,
      userId: demoUser.id,
      metadata: { consentHash: '0xCONSENT_HASH_001', txHash: '0xMOCK_TX_001' },
      timestamp: new Date('2026-02-10T14:00:05Z'),
    },
    {
      eventType: 'VERIFICATION' as const,
      userId: demoUser.id,
      verificationId: verification2.id,
      metadata: { verifier: 'Zomato', purpose: 'AGE_VERIFICATION', riskScore: 8 },
      timestamp: new Date('2026-02-15T18:30:00Z'),
    },
    {
      eventType: 'VERIFICATION' as const,
      userId: demoUser.id,
      verificationId: verification3.id,
      metadata: { verifier: 'Zerodha', purpose: 'DEMAT_KYC', riskScore: 18 },
      timestamp: new Date('2026-02-17T11:15:00Z'),
    },
  ];

  for (const event of auditEvents) {
    await prisma.auditLog.create({ data: event });
  }
  console.log(`✅ ${auditEvents.length} audit log entries created`);

  // ---- Device Fingerprints ----

  await prisma.deviceFingerprint.create({
    data: {
      userId: demoUser.id,
      fingerprintHash: '0xDEVICE_FP_001',
      deviceModel: 'Pixel 8 Pro',
      osVersion: 'Android 15',
      appVersion: '1.0.0',
      trustScore: 92,
      verificationCount: 5,
    },
  });
  console.log('✅ Device fingerprint seeded');

  // ---- Risk Profile ----

  await prisma.riskProfile.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      baselineRiskScore: 15,
      behavioralProfile: {
        avgSessionDuration: 180,
        typicalVerificationTime: '09:00-18:00',
        preferredDevice: 'mobile',
      },
      locationHistory: [
        { lat: 26.2183, lon: 78.1828, city: 'Gwalior', timestamp: '2026-02-10' },
        { lat: 26.2183, lon: 78.1828, city: 'Gwalior', timestamp: '2026-02-15' },
      ],
      verificationPatterns: {
        avgPerWeek: 2,
        commonPurposes: ['BANK_KYC', 'AGE_VERIFICATION'],
        commonVerifiers: ['HDFC Bank', 'Zomato'],
      },
    },
  });
  console.log('✅ Risk profile seeded');

  // ---- Nullifier Cache ----

  const nullifiers = [
    '0xNULLIFIER_HDFC_KYC_001',
    '0xNULLIFIER_ZOMATO_AGE_001',
    '0xNULLIFIER_ZERODHA_PAN_001',
  ];

  for (const nullifier of nullifiers) {
    await prisma.nullifierCache.upsert({
      where: { nullifier },
      update: {},
      create: {
        nullifier,
        isUsed: true,
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`✅ ${nullifiers.length} nullifier cache entries seeded`);

  console.log('\n🎉 Database seeding complete!');
  console.log('\n📋 Summary:');
  console.log(`   Users:          ${await prisma.user.count()}`);
  console.log(`   Credentials:    ${await prisma.credential.count()}`);
  console.log(`   Verifications:  ${await prisma.verification.count()}`);
  console.log(`   Audit Logs:     ${await prisma.auditLog.count()}`);
  console.log(`   Nullifier Cache: ${await prisma.nullifierCache.count()}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
