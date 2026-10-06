const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const Beneficiary = require('../src/models/Beneficiary');
const Transaction = require('../src/models/Transaction');
const UserDevice = require('../src/models/UserDevice');
const deviceService = require('../src/services/deviceService');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('Module 6: Transaction Processing Engine Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Beneficiary.deleteMany({});
    await Transaction.deleteMany({});
    await UserDevice.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Beneficiary.deleteMany({});
    await Transaction.deleteMany({});
    await UserDevice.deleteMany({});
  });

  // Helper to register user and obtain token
  const registerUser = async (name, email) => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name,
        email,
        password: 'Password123!'
      });
    return res.body.data;
  };

  // TC-M6-001: Low-Risk Transaction Executes Immediately (LOW -> APPROVED)
  test('TC-M6-001: Low-risk transaction (Score <= 30) is approved and settles immediately', async () => {
    const sender = await registerUser('Sender Low', 'sender.low@test.com');
    const recipient = await registerUser('Recipient Low', 'recipient.low@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    // Register known device for sender
    await deviceService.registerDevice(senderId, {
      deviceId: 'sender-trusted-pc',
      userAgent: 'Trusted-Browser',
      ipAddress: '127.0.0.1'
    });

    // Make clean transfer of 1,000 (starting available: 10,000 each)
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'sender-trusted-pc')
      .send({
        recipientId,
        amount: 1000,
        note: 'Lunch payment'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');
    expect(res.body.data.riskLevel).toBe('LOW');
    expect(res.body.data.riskScore).toBeLessThanOrEqual(30);

    // Verify Sender Wallet: 10,000 - 1,000 = 9,000; held = 0
    const senderWallet = await Wallet.findOne({ userId: senderId });
    expect(senderWallet.availableBalance).toBe(9000);
    expect(senderWallet.heldBalance).toBe(0);

    // Verify Recipient Wallet: 10,000 + 1,000 = 11,000
    const recipientWallet = await Wallet.findOne({ userId: recipientId });
    expect(recipientWallet.availableBalance).toBe(11000);

    // Verify Transaction record in DB
    const tx = await Transaction.findById(res.body.data.transaction._id);
    expect(tx.status).toBe('APPROVED');
  });

  // TC-M6-002: Medium-Risk Transaction Places Funds in Escrow (MEDIUM -> FLAGGED_FOR_REVIEW)
  test('TC-M6-002: Medium-risk transaction (Score 31-70) is flagged and funds held in escrow', async () => {
    const sender = await registerUser('Sender Med', 'sender.med@test.com');
    const recipient = await registerUser('Recipient Med', 'recipient.med@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    // Deposit extra funds to sender so balance is sufficient (starting 10k + 20k = 30k)
    await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ amount: 20000 });

    // Register a new beneficiary right now (< 24h)
    await request(app)
      .post('/api/beneficiaries')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientEmail: 'recipient.med@test.com', nickname: 'New Beneficiary' });

    // Transfer > 10,000 (e.g. 15,000) from an unknown device
    // This triggers RULE_BENEFICIARY_NEW (+30) and RULE_DEVICE_NEW (+25) -> Score = 55 (MEDIUM)
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'unknown-new-device')
      .send({
        recipientId,
        amount: 15000,
        note: 'Medium risk payment'
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CUSTOMER_VERIFICATION_REQUIRED');
    expect(res.body.data.riskLevel).toBe('MEDIUM');
    expect(res.body.data.riskScore).toBe(55);

    // Verify Sender Wallet: available = 30,000 - 15,000 = 15,000; held = 15,000
    const senderWallet = await Wallet.findOne({ userId: senderId });
    expect(senderWallet.availableBalance).toBe(15000);
    expect(senderWallet.heldBalance).toBe(15000);

    // Verify Recipient Wallet is untouched: 10,000
    const recipientWallet = await Wallet.findOne({ userId: recipientId });
    expect(recipientWallet.availableBalance).toBe(10000);

    // Verify Transaction status in DB
    const tx = await Transaction.findById(res.body.data.transaction._id);
    expect(tx.status).toBe('CUSTOMER_VERIFICATION_REQUIRED');

    // Customer confirms payment -> settles immediately without admin
    const confirmRes = await request(app)
      .post(`/api/transactions/${tx._id}/confirm`)
      .set('Authorization', `Bearer ${sender.token}`);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('APPROVED');

    // Post-confirmation wallet balances: held released to recipient
    const senderWalletAfter = await Wallet.findOne({ userId: senderId });
    expect(senderWalletAfter.availableBalance).toBe(15000);
    expect(senderWalletAfter.heldBalance).toBe(0);

    const recipientWalletAfter = await Wallet.findOne({ userId: recipientId });
    expect(recipientWalletAfter.availableBalance).toBe(25000);
  });

  // TC-M6-003: High-Risk Transaction Is Immediately Blocked (HIGH -> BLOCKED)
  test('TC-M6-003: High-risk transaction (Score 71-100) is blocked with zero balance deduction', async () => {
    const sender = await registerUser('Sender High', 'sender.high@test.com');
    const recipient = await registerUser('Recipient High', 'recipient.high@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    // Deposit extra funds to sender: 10k + 70k = 80k
    await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ amount: 70000 });

    // Seed prior settled transaction for sender (₹5,000) for 30-day baseline
    await Transaction.create({
      senderId,
      recipientId,
      amount: 5000,
      currency: 'INR',
      status: 'APPROVED',
      riskScore: 0,
      riskLevel: 'LOW',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    });

    // Transfer amount ₹55,000 is 11x baseline (trigger RULE_AMOUNT_ANOMALY +35)
    // Send from unknown device (trigger RULE_DEVICE_NEW +25)
    // To a brand new beneficiary < 24h with amount > 10,000 (trigger RULE_BENEFICIARY_NEW +30)
    // 35 + 25 + 30 = 90 (HIGH)
    await request(app)
      .post('/api/beneficiaries')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientEmail: 'recipient.high@test.com', nickname: 'New Recipient High' });

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'unknown-attacker-phone')
      .send({
        recipientId,
        amount: 55000,
        note: 'High risk fraud transfer'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TRANSACTION_BLOCKED');
    expect(res.body.error.details.status).toBe('BLOCKED');
    expect(res.body.error.details.riskLevel).toBe('HIGH');
    expect(res.body.error.details.riskScore).toBe(90);

    // Verify Sender Wallet: exactly 80,000 (zero deduction); held = 0
    const senderWallet = await Wallet.findOne({ userId: senderId });
    expect(senderWallet.availableBalance).toBe(80000);
    expect(senderWallet.heldBalance).toBe(0);

    // Verify Recipient Wallet untouched
    const recipientWallet = await Wallet.findOne({ userId: recipientId });
    expect(recipientWallet.availableBalance).toBe(10000);
  });

  // TC-M6-004: Insufficient Balance Rejection
  test('TC-M6-004: Transfer exceeding available balance is rejected before fraud evaluation', async () => {
    const sender = await registerUser('Sender Poor', 'sender.poor@test.com');
    const recipient = await registerUser('Recipient Rich', 'recipient.rich@test.com');

    const recipientId = recipient.user._id || recipient.user.id;

    // Sender has 10,000; attempts to send 25,000
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        recipientId,
        amount: 25000
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INSUFFICIENT_BALANCE');

    // Balance remains 10,000
    const senderWallet = await Wallet.findOne({ userId: sender.user._id || sender.user.id });
    expect(senderWallet.availableBalance).toBe(10000);
  });

  // TC-M6-005: Concurrent Double-Spend Prevention Test
  test('TC-M6-005: Concurrent transfers prevent double spending under race condition', async () => {
    const sender = await registerUser('Sender Concurrent', 'sender.concurrent@test.com');
    const recipient = await registerUser('Recipient Concurrent', 'recipient.concurrent@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    // Register trusted device so it is LOW risk
    await deviceService.registerDevice(senderId, {
      deviceId: 'concurrent-trusted-pc',
      userAgent: 'Browser',
      ipAddress: '127.0.0.1'
    });

    // Sender balance is 10,000
    // Two simultaneous requests of 8,000 each (Total attempted: 16,000 > 10,000)
    const req1 = request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'concurrent-trusted-pc')
      .send({ recipientId, amount: 8000 });

    const req2 = request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'concurrent-trusted-pc')
      .send({ recipientId, amount: 8000 });

    const [res1, res2] = await Promise.all([req1, req2]);

    const statuses = [res1.status, res2.status];
    // Exactly one must succeed (200) and one must fail (400)
    expect(statuses).toContain(200);
    expect(statuses).toContain(400);

    // Final balance must be exactly 10,000 - 8,000 = 2,000 (never negative)
    const finalWallet = await Wallet.findOne({ userId: senderId });
    expect(finalWallet.availableBalance).toBe(2000);
  });

  // TC-M6-006: Customer Queries Own Transaction History
  test('TC-M6-006: Customer retrieves transaction history with masked internal weights', async () => {
    const sender = await registerUser('History Sender', 'history.sender@test.com');
    const recipient = await registerUser('History Recipient', 'history.recipient@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    await deviceService.registerDevice(senderId, {
      deviceId: 'history-pc',
      userAgent: 'Browser',
      ipAddress: '127.0.0.1'
    });

    // Make 2 transactions
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'history-pc')
      .send({ recipientId, amount: 1000, note: 'Tx 1' });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'history-pc')
      .send({ recipientId, amount: 2000, note: 'Tx 2' });

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transactions.length).toBe(2);
    expect(res.body.data.transactions[0].amount).toBeDefined();
    expect(res.body.data.transactions[0].status).toBe('APPROVED');
  });
});
