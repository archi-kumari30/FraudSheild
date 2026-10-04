const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const Beneficiary = require('../src/models/Beneficiary');
const Transaction = require('../src/models/Transaction');
const Alert = require('../src/models/Alert');
const seedAdmin = require('../src/scripts/seedAdmin');
const config = require('../src/config');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('Module 7: Fraud Alert & Incident Review Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Beneficiary.deleteMany({});
    await Transaction.deleteMany({});
    await Alert.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Beneficiary.deleteMany({});
    await Transaction.deleteMany({});
    await Alert.deleteMany({});
  });

  const registerCustomer = async (name, email) => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name,
        email,
        password: 'Password123!'
      });
    return res.body.data;
  };

  const loginAdmin = async () => {
    await seedAdmin();
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: config.adminSeed.email,
        password: config.adminSeed.password
      });
    return res.body.data;
  };

  // Helper to create a transaction in FLAGGED_FOR_REVIEW
  const setupFlaggedTransaction = async (senderAmount = 25000, transferAmount = 15000) => {
    const sender = await registerCustomer('Sender Review', 'sender.review@test.com');
    const recipient = await registerCustomer('Recipient Review', 'recipient.review@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    // Set initial balances
    await Wallet.findOneAndUpdate({ userId: senderId }, { availableBalance: senderAmount, heldBalance: 0 });
    await Wallet.findOneAndUpdate({ userId: recipientId }, { availableBalance: 5000, heldBalance: 0 });

    // Add beneficiary < 24h
    await request(app)
      .post('/api/beneficiaries')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientEmail: 'recipient.review@test.com', nickname: 'Review Beneficiary' });

    // Post transaction from new device
    const txRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'flagged-device-x')
      .send({ recipientId, amount: transferAmount, note: 'Payment under review' });

    return {
      sender,
      recipient,
      senderId,
      recipientId,
      transactionId: txRes.body.data.transaction._id
    };
  };

  // TC-M7-003: Admin Views Pending Review Queue (GET /api/admin/reviews)
  test('TC-M7-003: Admin views pending review queue and sees flagged cases', async () => {
    await setupFlaggedTransaction();
    const admin = await loginAdmin();

    const res = await request(app)
      .get('/api/admin/reviews')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reviews.length).toBe(1);
    expect(res.body.data.reviews[0].status).toBe('FLAGGED_FOR_REVIEW');
    expect(res.body.data.reviews[0].triggeredRules.length).toBeGreaterThan(0);
  });

  // TC-M7-004: Customer Blocked from Admin Review Queue
  test('TC-M7-004: Customer role is blocked from accessing admin review queue with HTTP 403', async () => {
    const customer = await registerCustomer('Customer NonAdmin', 'nonadmin@test.com');

    const res = await request(app)
      .get('/api/admin/reviews')
      .set('Authorization', `Bearer ${customer.token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // TC-M7-005: Admin Manual Approve Settles Escrow Funds
  test('TC-M7-005: Admin manual APPROVE releases escrow and credits recipient balance', async () => {
    const { senderId, recipientId, transactionId } = await setupFlaggedTransaction(25000, 15000);
    const admin = await loginAdmin();

    // Prior state: Sender available = 10,000, held = 15,000; Recipient available = 5,000
    const res = await request(app)
      .post(`/api/admin/reviews/${transactionId}/resolve`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        decision: 'APPROVE',
        resolutionNotes: 'Verified customer identity and phone confirmation approved.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction.status).toBe('APPROVED');
    expect(res.body.data.transaction.resolutionStatus).toBe('APPROVED');

    // Sender held balance becomes 0
    const senderWallet = await Wallet.findOne({ userId: senderId });
    expect(senderWallet.heldBalance).toBe(0);
    expect(senderWallet.availableBalance).toBe(10000);

    // Recipient available balance credited: 5,000 + 15,000 = 20,000
    const recipientWallet = await Wallet.findOne({ userId: recipientId });
    expect(recipientWallet.availableBalance).toBe(20000);
  });

  // TC-M7-006: Admin Manual Reject Refunds Escrow Funds to Sender
  test('TC-M7-006: Admin manual REJECT refunds escrow back to sender available balance', async () => {
    const { senderId, recipientId, transactionId } = await setupFlaggedTransaction(25000, 12000);
    const admin = await loginAdmin();

    // Prior state: Sender available = 13,000, held = 12,000; Recipient available = 5,000
    const res = await request(app)
      .post(`/api/admin/reviews/${transactionId}/resolve`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        decision: 'REJECT',
        resolutionNotes: 'Customer confirmed account compromised; suspicious transfer blocked.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction.status).toBe('REJECTED');
    expect(res.body.data.transaction.resolutionStatus).toBe('REJECTED');

    // Sender held balance becomes 0; available balance refunded: 13,000 + 12,000 = 25,000
    const senderWallet = await Wallet.findOne({ userId: senderId });
    expect(senderWallet.heldBalance).toBe(0);
    expect(senderWallet.availableBalance).toBe(25000);

    // Recipient balance unchanged at 5,000
    const recipientWallet = await Wallet.findOne({ userId: recipientId });
    expect(recipientWallet.availableBalance).toBe(5000);
  });

  // TC-M7-007: Duplicate Resolution Attempt Rejection
  test('TC-M7-007: Duplicate resolution attempt on already-resolved case returns 409 Conflict', async () => {
    const { transactionId } = await setupFlaggedTransaction();
    const admin = await loginAdmin();

    // First resolution
    await request(app)
      .post(`/api/admin/reviews/${transactionId}/resolve`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        decision: 'APPROVE',
        resolutionNotes: 'Initial valid approval by lead fraud analyst.'
      });

    // Second resolution attempt
    const secondRes = await request(app)
      .post(`/api/admin/reviews/${transactionId}/resolve`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        decision: 'REJECT',
        resolutionNotes: 'Attempting conflicting rejection afterwards.'
      });

    expect(secondRes.status).toBe(409);
    expect(secondRes.body.success).toBe(false);
    expect(secondRes.body.error.code).toBe('ALREADY_RESOLVED');
  });

  // TC-M7-008: Missing Resolution Notes Validation (< 10 Characters)
  test('TC-M7-008: Resolution notes shorter than 10 characters are rejected with 400', async () => {
    const { transactionId } = await setupFlaggedTransaction();
    const admin = await loginAdmin();

    const res = await request(app)
      .post(`/api/admin/reviews/${transactionId}/resolve`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        decision: 'APPROVE',
        resolutionNotes: 'too short' // 9 characters
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_RESOLUTION_NOTES');
  });
});
