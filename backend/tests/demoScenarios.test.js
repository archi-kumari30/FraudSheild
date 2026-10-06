const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const Beneficiary = require('../src/models/Beneficiary');
const Transaction = require('../src/models/Transaction');
const Alert = require('../src/models/Alert');
const UserDevice = require('../src/models/UserDevice');
const { generateToken } = require('../src/utils/token');

describe('Definition of Done Demo Scenarios & Rebuild Verification', () => {
  let senderUser, recipientUser, adminUser;
  let senderToken, adminToken;
  const knownDeviceId = 'device-corp-verified-001';
  const newDeviceId = 'device-suspicious-new-999';

  beforeEach(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Beneficiary.deleteMany({});
    await Transaction.deleteMany({});
    await Alert.deleteMany({});
    await UserDevice.deleteMany({});

    // Seed Sender User
    senderUser = await User.create({
      name: 'Alice Sender',
      email: 'alice.sender@example.com',
      passwordHash: '$2a$10$wT0XlTfHh/2Yh.gJ3Y3BPe6vR.uE9mG8uH3q5tY9y.w6w9v1q.wqu',
      role: 'customer'
    });
    senderToken = generateToken(senderUser);

    // Initial wallet balance: ₹100,000
    await Wallet.create({
      userId: senderUser._id,
      availableBalance: 100000,
      heldBalance: 0,
      currency: 'INR'
    });

    // Seed Recipient User
    recipientUser = await User.create({
      name: 'Bob Recipient',
      email: 'bob.recipient@example.com',
      passwordHash: '$2a$10$wT0XlTfHh/2Yh.gJ3Y3BPe6vR.uE9mG8uH3q5tY9y.w6w9v1q.wqu',
      role: 'customer'
    });

    await Wallet.create({
      userId: recipientUser._id,
      availableBalance: 5000,
      heldBalance: 0,
      currency: 'INR'
    });

    // Seed Admin User
    adminUser = await User.create({
      name: 'Chief Fraud Officer',
      email: 'officer@fraudshield.internal',
      passwordHash: '$2a$10$wT0XlTfHh/2Yh.gJ3Y3BPe6vR.uE9mG8uH3q5tY9y.w6w9v1q.wqu',
      role: 'admin'
    });
    adminToken = generateToken(adminUser);

    // Register known device for Alice
    await UserDevice.create({
      userId: senderUser._id,
      deviceId: knownDeviceId,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      ipAddress: '192.168.1.100',
      isTrusted: true,
      firstSeenAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      lastSeenAt: new Date()
    });
  });

  describe('Demo Scenario 1: Low Risk -> APPROVED', () => {
    it('₹2,000 transfer with known device and known beneficiary executes immediately with score 0 (LOW, APPROVED)', async () => {
      // Create established beneficiary (added 48 hours ago)
      const establishedBeneficiary = await Beneficiary.create({
        userId: senderUser._id,
        recipientAccountId: recipientUser._id,
        nickname: 'Bob Established',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) // 48 hours ago
      });

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderToken}`)
        .set('x-device-id', knownDeviceId)
        .send({
          recipientId: recipientUser._id.toString(),
          amount: 2000,
          note: 'Dinner split'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
      expect(res.body.data.riskScore).toBe(0);
      expect(res.body.data.riskLevel).toBe('LOW');

      // Verify wallet balances: sender debited, recipient credited
      const senderWallet = await Wallet.findOne({ userId: senderUser._id });
      const recipientWallet = await Wallet.findOne({ userId: recipientUser._id });

      expect(senderWallet.availableBalance).toBe(98000); // 100,000 - 2,000
      expect(senderWallet.heldBalance).toBe(0);
      expect(recipientWallet.availableBalance).toBe(7000); // 5,000 + 2,000
    });
  });

  describe('Demo Scenario 2: Medium Risk -> CUSTOMER_VERIFICATION_REQUIRED & Escalate', () => {
    it('₹15,000 transfer with new device and beneficiary requires customer verification, held in escrow, settled when confirmed', async () => {
      // Beneficiary added 2 hours ago (< 24h)
      await Beneficiary.deleteMany({});
      await Beneficiary.create({
        userId: senderUser._id,
        recipientAccountId: recipientUser._id,
        nickname: 'Bob New Beneficiary',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago (< 24h)
      });

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderToken}`)
        .set('x-device-id', newDeviceId) // Unrecognized device
        .send({
          recipientId: recipientUser._id.toString(),
          amount: 15000,
          note: 'Project consultation fee'
        });

      expect(res.status).toBe(202);
      expect(res.body.data.status).toBe('CUSTOMER_VERIFICATION_REQUIRED');
      expect(res.body.data.riskLevel).toBe('MEDIUM');
      expect(res.body.data.riskScore).toBe(55); // 25 (device) + 30 (beneficiary)

      const txId = res.body.data.transaction._id;

      // Verify escrow hold: sender availableBalance debited, heldBalance credited, recipient untouched
      const senderWalletAfterFlag = await Wallet.findOne({ userId: senderUser._id });
      const recipientWalletAfterFlag = await Wallet.findOne({ userId: recipientUser._id });

      expect(senderWalletAfterFlag.availableBalance).toBe(85000); // 100,000 - 15,000
      expect(senderWalletAfterFlag.heldBalance).toBe(15000);      // 15,000 in escrow
      expect(recipientWalletAfterFlag.availableBalance).toBe(5000); // untouched

      // Verify it does NOT appear in pending Admin Review Queue (no admin dependency!)
      const reviewQueueRes = await request(app)
        .get('/api/admin/reviews/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(reviewQueueRes.status).toBe(200);
      const reviewsList = reviewQueueRes.body.data.reviews || reviewQueueRes.body.data;
      expect(reviewsList.some(tx => tx._id.toString() === txId.toString())).toBe(false);

      // Customer Confirms the transaction via self-service verification
      const confirmRes = await request(app)
        .post(`/api/transactions/${txId}/confirm`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send();

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.data.status).toBe('APPROVED');

      // Verify wallet settlement: heldBalance released to recipient
      const senderWalletAfterApproval = await Wallet.findOne({ userId: senderUser._id });
      const recipientWalletAfterApproval = await Wallet.findOne({ userId: recipientUser._id });

      expect(senderWalletAfterApproval.availableBalance).toBe(85000);
      expect(senderWalletAfterApproval.heldBalance).toBe(0);
      expect(recipientWalletAfterApproval.availableBalance).toBe(20000); // 5,000 + 15,000
    });

    it('If customer reports unauthorized / escalates, it goes to admin review where admin can reject and refund', async () => {
      await Beneficiary.create({
        userId: senderUser._id,
        recipientAccountId: recipientUser._id,
        nickname: 'Bob Flagged',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      });

      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderToken}`)
        .set('x-device-id', newDeviceId)
        .send({
          recipientId: recipientUser._id.toString(),
          amount: 15000
        });

      expect(res.status).toBe(202);
      expect(res.body.data.status).toBe('CUSTOMER_VERIFICATION_REQUIRED');
      const txId = res.body.data.transaction._id;

      // Customer reports unauthorized / escalates
      const escalateRes = await request(app)
        .post(`/api/transactions/${txId}/escalate`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          reason: 'Suspicious login detected, unauthorized payment'
        });

      expect(escalateRes.status).toBe(200);
      expect(escalateRes.body.data.status).toBe('FLAGGED_FOR_REVIEW');

      // Now it appears in Admin Review Queue
      const reviewQueueRes = await request(app)
        .get('/api/admin/reviews/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(reviewQueueRes.status).toBe(200);
      const reviewsList = reviewQueueRes.body.data.reviews || reviewQueueRes.body.data;
      expect(reviewsList.some(tx => tx._id.toString() === txId.toString())).toBe(true);

      // Admin Rejects transaction
      const rejectRes = await request(app)
        .post(`/api/admin/reviews/${txId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'REJECT',
          resolutionNotes: 'Suspected unauthorized account takeover. Refunded to sender.'
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.status).toBe('REJECTED');

      // Verify refund: heldBalance returned to sender availableBalance
      const senderWallet = await Wallet.findOne({ userId: senderUser._id });
      const recipientWallet = await Wallet.findOne({ userId: recipientUser._id });

      expect(senderWallet.availableBalance).toBe(100000); // Restored
      expect(senderWallet.heldBalance).toBe(0);
      expect(recipientWallet.availableBalance).toBe(5000); // Untouched
    });
  });

  describe('Demo Scenario 3: High Risk -> BLOCKED', () => {
    it('₹60,000 transfer with new device and new beneficiary is immediately blocked with score 90 (HIGH, BLOCKED)', async () => {
      // Beneficiary added 2 hours ago (< 24 hours) -> RULE_BENEFICIARY_NEW (+30)
      await Beneficiary.create({
        userId: senderUser._id,
        recipientAccountId: recipientUser._id,
        nickname: 'Suspicious Mule',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      });

      // Seed an approved historical transaction so Alice has a 30-day baseline (₹5,000)
      await Transaction.create({
        senderId: senderUser._id,
        recipientId: recipientUser._id,
        amount: 5000,
        currency: 'INR',
        status: 'APPROVED',
        riskScore: 0,
        riskLevel: 'LOW',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      });

      // Amount ₹60,000 is 12x historical baseline (₹5,000) -> RULE_AMOUNT_ANOMALY (+35)
      // New device -> RULE_DEVICE_NEW (+25)
      // New beneficiary (< 24h & amount > 10,000) -> RULE_BENEFICIARY_NEW (+30)
      // Total score: 35 + 25 + 30 = 90 / 100 -> HIGH (71-100) -> BLOCKED
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${senderToken}`)
        .set('x-device-id', newDeviceId)
        .send({
          recipientId: recipientUser._id.toString(),
          amount: 60000,
          note: 'Urgent wire transfer'
        });

      expect([400, 403]).toContain(res.status);
      expect(res.body.success).toBe(false);
      expect(res.body.data.status).toBe('BLOCKED');
      expect(res.body.data.riskLevel).toBe('HIGH');
      expect(res.body.data.riskScore).toBe(90);

      // Verify rule breakdown explanation
      const triggeredCodes = res.body.data.transaction.triggeredRules.map(r => r.ruleCode);
      expect(triggeredCodes).toContain('RULE_AMOUNT_ANOMALY');
      expect(triggeredCodes).toContain('RULE_DEVICE_NEW');
      expect(triggeredCodes).toContain('RULE_BENEFICIARY_NEW');

      // Verify zero balance deductions
      const senderWallet = await Wallet.findOne({ userId: senderUser._id });
      const recipientWallet = await Wallet.findOne({ userId: recipientUser._id });

      expect(senderWallet.availableBalance).toBe(100000); // ZERO deduction
      expect(senderWallet.heldBalance).toBe(0);
      expect(recipientWallet.availableBalance).toBe(5000); // ZERO credit
    });
  });
});
