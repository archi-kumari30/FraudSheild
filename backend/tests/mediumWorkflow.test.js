const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const Beneficiary = require('../src/models/Beneficiary');
const Transaction = require('../src/models/Transaction');
const UserDevice = require('../src/models/UserDevice');
const Alert = require('../src/models/Alert');
const AuditLog = require('../src/models/AuditLog');
const seedAdmin = require('../src/scripts/seedAdmin');
const config = require('../src/config');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('Medium-Risk Customer Self-Verification Workflow Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Beneficiary.deleteMany({});
    await Transaction.deleteMany({});
    await UserDevice.deleteMany({});
    await Alert.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Beneficiary.deleteMany({});
    await Transaction.deleteMany({});
    await UserDevice.deleteMany({});
    await Alert.deleteMany({});
  });

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

  test('1. LOW risk transaction is automatically APPROVED, funds transferred immediately, no customer verification or admin review needed', async () => {
    const sender = await registerUser('Alice Low', 'alice.low@test.com');
    const recipient = await registerUser('Bob Low', 'bob.low@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    await Wallet.findOneAndUpdate({ userId: senderId }, { availableBalance: 50000, heldBalance: 0 });
    await Wallet.findOneAndUpdate({ userId: recipientId }, { availableBalance: 1000, heldBalance: 0 });

    // Established beneficiary (> 24h)
    await Beneficiary.create({
      userId: senderId,
      recipientAccountId: recipientId,
      nickname: 'Bob Trusted',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    });

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        recipientId,
        amount: 2500,
        note: 'Grocery bill'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');
    expect(res.body.data.riskLevel).toBe('LOW');

    const senderWallet = await Wallet.findOne({ userId: senderId });
    const recipientWallet = await Wallet.findOne({ userId: recipientId });

    expect(senderWallet.availableBalance).toBe(47500);
    expect(senderWallet.heldBalance).toBe(0);
    expect(recipientWallet.availableBalance).toBe(3500);
  });

  test('2 & 3. MEDIUM risk transaction sets status CUSTOMER_VERIFICATION_REQUIRED and holds funds in escrow (sender heldBalance, recipient 0)', async () => {
    const sender = await registerUser('Alice Med', 'alice.med@test.com');
    const recipient = await registerUser('Bob Med', 'bob.med@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    await Wallet.findOneAndUpdate({ userId: senderId }, { availableBalance: 50000, heldBalance: 0 });
    await Wallet.findOneAndUpdate({ userId: recipientId }, { availableBalance: 2000, heldBalance: 0 });

    // Beneficiary added 2 hours ago (< 24h triggers RULE_BENEFICIARY_NEW +30)
    await Beneficiary.create({
      userId: senderId,
      recipientAccountId: recipientId,
      nickname: 'Bob New',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    // Unknown device (+25) + amount 15000 > 10000 (+30) -> Score = 55 (MEDIUM)
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'device-unknown-1')
      .send({
        recipientId,
        amount: 15000,
        note: 'Medium risk payment'
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CUSTOMER_VERIFICATION_REQUIRED');
    expect(res.body.data.riskLevel).toBe('MEDIUM');
    expect(res.body.message).toMatch(/Additional verification is required/i);

    // Escrow verification
    const senderWallet = await Wallet.findOne({ userId: senderId });
    const recipientWallet = await Wallet.findOne({ userId: recipientId });

    expect(senderWallet.availableBalance).toBe(35000); // 50,000 - 15,000
    expect(senderWallet.heldBalance).toBe(15000);      // 15,000 held in escrow
    expect(recipientWallet.availableBalance).toBe(2000); // Recipient receives 0 yet
  });

  test('4. Customer confirms payment: backend validates ownership and state, settles funds, sets APPROVED, logs audit event', async () => {
    const sender = await registerUser('Alice Confirm', 'alice.confirm@test.com');
    const recipient = await registerUser('Bob Confirm', 'bob.confirm@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    await Wallet.findOneAndUpdate({ userId: senderId }, { availableBalance: 50000, heldBalance: 0 });
    await Wallet.findOneAndUpdate({ userId: recipientId }, { availableBalance: 2000, heldBalance: 0 });

    await Beneficiary.create({
      userId: senderId,
      recipientAccountId: recipientId,
      nickname: 'Bob New',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    const initRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'device-unknown-2')
      .send({ recipientId, amount: 15000, note: 'Consulting' });

    expect(initRes.status).toBe(202);
    const txId = initRes.body.data.transaction._id;

    // Customer confirms payment
    const confirmRes = await request(app)
      .post(`/api/transactions/${txId}/confirm`)
      .set('Authorization', `Bearer ${sender.token}`)
      .send();

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);
    expect(confirmRes.body.data.status).toBe('APPROVED');

    // Balance checks: heldBalance released to recipient
    const senderWallet = await Wallet.findOne({ userId: senderId });
    const recipientWallet = await Wallet.findOne({ userId: recipientId });

    expect(senderWallet.availableBalance).toBe(35000);
    expect(senderWallet.heldBalance).toBe(0);
    expect(recipientWallet.availableBalance).toBe(17000); // 2000 + 15000

    // Audit logs check
    const auditLogs = await AuditLog.find({ 'targetEntity.entityId': txId });
    expect(auditLogs.some(log => log.eventType === 'CUSTOMER_VERIFIED')).toBe(true);
    expect(auditLogs.some(log => log.eventType === 'TRANSACTION_SETTLED')).toBe(true);
  });

  test('5. Duplicate confirmation is rejected to prevent race conditions or double settlement', async () => {
    const sender = await registerUser('Alice Dupe', 'alice.dupe@test.com');
    const recipient = await registerUser('Bob Dupe', 'bob.dupe@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    await Wallet.findOneAndUpdate({ userId: senderId }, { availableBalance: 50000, heldBalance: 0 });
    await Wallet.findOneAndUpdate({ userId: recipientId }, { availableBalance: 2000, heldBalance: 0 });

    await Beneficiary.create({
      userId: senderId,
      recipientAccountId: recipientId,
      nickname: 'Bob New',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    const initRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'device-unknown-3')
      .send({ recipientId, amount: 15000 });

    expect(initRes.status).toBe(202);
    const txId = initRes.body.data.transaction._id;

    // First confirmation succeeds
    const firstConfirm = await request(app)
      .post(`/api/transactions/${txId}/confirm`)
      .set('Authorization', `Bearer ${sender.token}`)
      .send();

    expect(firstConfirm.status).toBe(200);
    expect(firstConfirm.body.data.status).toBe('APPROVED');

    // Second confirmation fails
    const secondConfirm = await request(app)
      .post(`/api/transactions/${txId}/confirm`)
      .set('Authorization', `Bearer ${sender.token}`)
      .send();

    expect(secondConfirm.status).toBe(400);
    expect(secondConfirm.body.success).toBe(false);

    // Verify wallet balances didn't settle twice
    const recipientWallet = await Wallet.findOne({ userId: recipientId });
    expect(recipientWallet.availableBalance).toBe(17000); // 2000 + 15000 (not + 30000)
  });

  test('6. Unauthorized customer cannot confirm another users transaction (403 Forbidden)', async () => {
    const sender = await registerUser('Alice Auth', 'alice.auth@test.com');
    const attacker = await registerUser('Attacker', 'attacker@test.com');
    const recipient = await registerUser('Bob Auth', 'bob.auth@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    await Wallet.findOneAndUpdate({ userId: senderId }, { availableBalance: 50000, heldBalance: 0 });
    await Wallet.findOneAndUpdate({ userId: recipientId }, { availableBalance: 2000, heldBalance: 0 });

    await Beneficiary.create({
      userId: senderId,
      recipientAccountId: recipientId,
      nickname: 'Bob New',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    const initRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'device-unknown-4')
      .send({ recipientId, amount: 15000 });

    expect(initRes.status).toBe(202);
    const txId = initRes.body.data.transaction._id;

    // Attacker tries to confirm Alice's transaction
    const unauthorizedRes = await request(app)
      .post(`/api/transactions/${txId}/confirm`)
      .set('Authorization', `Bearer ${attacker.token}`)
      .send();

    expect(unauthorizedRes.status).toBe(403);
    expect(unauthorizedRes.body.success).toBe(false);

    // Verify transaction remains in CUSTOMER_VERIFICATION_REQUIRED
    const tx = await Transaction.findById(txId);
    expect(tx.status).toBe('CUSTOMER_VERIFICATION_REQUIRED');
  });

  test('7. Normal MEDIUM transaction does NOT appear in Admin Review Queue', async () => {
    const sender = await registerUser('Alice Queue', 'alice.queue@test.com');
    const recipient = await registerUser('Bob Queue', 'bob.queue@test.com');
    const admin = await loginAdmin();

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    await Wallet.findOneAndUpdate({ userId: senderId }, { availableBalance: 50000, heldBalance: 0 });
    await Wallet.findOneAndUpdate({ userId: recipientId }, { availableBalance: 2000, heldBalance: 0 });

    await Beneficiary.create({
      userId: senderId,
      recipientAccountId: recipientId,
      nickname: 'Bob New',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    const initRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'device-unknown-5')
      .send({ recipientId, amount: 15000 });

    expect(initRes.status).toBe(202);
    const txId = initRes.body.data.transaction._id;

    // Check Admin Review Queue - it should NOT contain this transaction
    const reviewRes = await request(app)
      .get('/api/admin/reviews/pending')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(reviewRes.status).toBe(200);
    const reviews = reviewRes.body.data.reviews || reviewRes.body.data;
    expect(reviews.some(r => r._id.toString() === txId.toString())).toBe(false);
  });

  test('8. Escalated transaction appears in Admin Review Queue and admin can resolve (REJECT & refund escrow)', async () => {
    const sender = await registerUser('Alice Escalate', 'alice.escalate@test.com');
    const recipient = await registerUser('Bob Escalate', 'bob.escalate@test.com');
    const admin = await loginAdmin();

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    await Wallet.findOneAndUpdate({ userId: senderId }, { availableBalance: 50000, heldBalance: 0 });
    await Wallet.findOneAndUpdate({ userId: recipientId }, { availableBalance: 2000, heldBalance: 0 });

    await Beneficiary.create({
      userId: senderId,
      recipientAccountId: recipientId,
      nickname: 'Bob New',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    const initRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'device-unknown-6')
      .send({ recipientId, amount: 15000 });

    expect(initRes.status).toBe(202);
    const txId = initRes.body.data.transaction._id;

    // Customer reports unauthorized / escalates
    const escalateRes = await request(app)
      .post(`/api/transactions/${txId}/escalate`)
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ reason: 'I did not initiate this payment!' });

    expect(escalateRes.status).toBe(200);
    expect(escalateRes.body.data.status).toBe('FLAGGED_FOR_REVIEW');

    // Admin Review Queue now contains this transaction
    const reviewRes = await request(app)
      .get('/api/admin/reviews/pending')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(reviewRes.status).toBe(200);
    const reviews = reviewRes.body.data.reviews || reviewRes.body.data;
    expect(reviews.some(r => r._id.toString() === txId.toString())).toBe(true);

    // Admin Rejects transaction and refunds sender
    const resolveRes = await request(app)
      .post(`/api/admin/reviews/${txId}/resolve`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        decision: 'REJECT',
        resolutionNotes: 'Confirmed unauthorized takeover. Refunded.'
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe('REJECTED');

    // Balances: sender refunded, recipient untouched
    const senderWallet = await Wallet.findOne({ userId: senderId });
    const recipientWallet = await Wallet.findOne({ userId: recipientId });

    expect(senderWallet.availableBalance).toBe(50000); // Restored
    expect(senderWallet.heldBalance).toBe(0);
    expect(recipientWallet.availableBalance).toBe(2000); // Untouched
  });

  test('9. Re-evaluation during confirmation blocks payment if high risk emerges, refunding escrow to sender', async () => {
    const sender = await registerUser('Alice Reeval', 'alice.reeval@test.com');
    const recipient = await registerUser('Bob Reeval', 'bob.reeval@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    await Wallet.findOneAndUpdate({ userId: senderId }, { availableBalance: 50000, heldBalance: 0 });
    await Wallet.findOneAndUpdate({ userId: recipientId }, { availableBalance: 2000, heldBalance: 0 });

    await Beneficiary.create({
      userId: senderId,
      recipientAccountId: recipientId,
      nickname: 'Bob New',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    const initRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'device-unknown-7')
      .send({ recipientId, amount: 15000 });

    expect(initRes.status).toBe(202);
    const txId = initRes.body.data.transaction._id;

    // Simulate 3 failed transactions occurring just before confirmation (triggers RULE_FAIL_BURST +40)
    // 55 + 40 = 95 -> HIGH RISK
    for (let i = 0; i < 3; i++) {
      await Transaction.create({
        senderId,
        recipientId,
        amount: 1000,
        status: 'BLOCKED',
        riskScore: 30,
        riskLevel: 'LOW',
        createdAt: new Date()
      });
    }

    // Now confirm with unknown device
    const confirmRes = await request(app)
      .post(`/api/transactions/${txId}/confirm`)
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'device-unknown-7')
      .send();

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('BLOCKED');

    // Funds refunded to sender: heldBalance = 0, availableBalance restored to 50000, recipient untouched (2000)
    const senderWallet = await Wallet.findOne({ userId: senderId });
    const recipientWallet = await Wallet.findOne({ userId: recipientId });

    expect(senderWallet.availableBalance).toBe(50000);
    expect(senderWallet.heldBalance).toBe(0);
    expect(recipientWallet.availableBalance).toBe(2000);
  });

  test('10. Issue 3: HIGH-risk ₹50,000 transaction (>70 pts: Anomaly +35, New Device +25, New Beneficiary +30 = 90) is BLOCKED immediately with zero balance deduction and security alert', async () => {
    const sender = await registerUser('Alice HighRisk', 'alice.high@test.com');
    const recipient = await registerUser('Bob Mule', 'bob.mule@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    // Initial balances
    await Wallet.findOneAndUpdate({ userId: senderId }, { availableBalance: 100000, heldBalance: 0 });
    await Wallet.findOneAndUpdate({ userId: recipientId }, { availableBalance: 5000, heldBalance: 0 });

    // 1. Seed a 30-day baseline transaction of ₹5,000 so Alice has historical average = ₹5,000
    await Transaction.create({
      senderId,
      recipientId,
      amount: 5000,
      currency: 'INR',
      status: 'APPROVED',
      riskScore: 0,
      riskLevel: 'LOW',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });

    // 2. Beneficiary added 2 hours ago (< 24h & amount > 10,000) -> RULE_BENEFICIARY_NEW (+30 pts)
    await Beneficiary.create({
      userId: senderId,
      recipientAccountId: recipientId,
      nickname: 'Suspicious Recipient',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    // 3. Amount ₹50,000 is 10x historical baseline (5,000) -> RULE_AMOUNT_ANOMALY (+35 pts)
    // 4. Unknown device -> RULE_DEVICE_NEW (+25 pts)
    // Total score: 35 + 25 + 30 = 90 / 100 -> HIGH (>70) -> BLOCKED
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'unknown-device-high')
      .send({
        recipientId,
        amount: 50000,
        note: 'Urgent payment'
      });

    expect([400, 403]).toContain(res.status);
    expect(res.body.success).toBe(false);
    expect(res.body.data.status).toBe('BLOCKED');
    expect(res.body.data.riskLevel).toBe('HIGH');
    expect(res.body.data.riskScore).toBe(90);

    // Verify rules triggered
    const triggeredCodes = res.body.data.transaction.triggeredRules.map(r => r.ruleCode);
    expect(triggeredCodes).toContain('RULE_AMOUNT_ANOMALY');
    expect(triggeredCodes).toContain('RULE_DEVICE_NEW');
    expect(triggeredCodes).toContain('RULE_BENEFICIARY_NEW');

    // Verify it did NOT enter CUSTOMER_VERIFICATION_REQUIRED
    expect(res.body.data.status).not.toBe('CUSTOMER_VERIFICATION_REQUIRED');

    // Verify wallet balances: zero deductions for sender, zero credit for recipient
    const senderWallet = await Wallet.findOne({ userId: senderId });
    const recipientWallet = await Wallet.findOne({ userId: recipientId });

    expect(senderWallet.availableBalance).toBe(100000); // Intact
    expect(senderWallet.heldBalance).toBe(0);
    expect(recipientWallet.availableBalance).toBe(5000);   // Untouched

    // Verify expected HIGH security alert created
    const alert = await Alert.findOne({
      userId: senderId,
      transactionId: res.body.data.transaction._id,
      severity: 'HIGH'
    });
    expect(alert).not.toBeNull();
    expect(alert.title).toMatch(/blocked/i);

    // Verify appears as BLOCKED in transaction history
    const historyRes = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`);

    expect(historyRes.status).toBe(200);
    const historyList = historyRes.body.data.transactions || historyRes.body.data;
    const foundTx = historyList.find(t => t._id.toString() === res.body.data.transaction._id.toString());
    expect(foundTx).toBeDefined();
    expect(foundTx.status).toBe('BLOCKED');
  });

  test('11. Issue 4: MEDIUM-risk ₹50,000 transaction (Anomaly +35, Known Device +0, Established Beneficiary +0 = 35) enters CUSTOMER_VERIFICATION_REQUIRED, holds funds, and settles to APPROVED upon confirmation', async () => {
    const sender = await registerUser('Alice MedRisk', 'alice.med50k@test.com');
    const recipient = await registerUser('Bob Trusted50k', 'bob.trusted50k@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    // Initial balances
    await Wallet.findOneAndUpdate({ userId: senderId }, { availableBalance: 100000, heldBalance: 0 });
    await Wallet.findOneAndUpdate({ userId: recipientId }, { availableBalance: 5000, heldBalance: 0 });

    // 1. Seed a 30-day baseline transaction of ₹5,000 so historical average = ₹5,000
    await Transaction.create({
      senderId,
      recipientId,
      amount: 5000,
      currency: 'INR',
      status: 'APPROVED',
      riskScore: 0,
      riskLevel: 'LOW',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });

    // 2. Register known trusted device for sender
    const knownDeviceId = 'alice-trusted-macbook';
    await UserDevice.create({
      userId: senderId,
      deviceId: knownDeviceId,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ipAddress: '192.168.1.50',
      isTrusted: true,
      firstSeenAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastSeenAt: new Date()
    });

    // 3. Established beneficiary (added 48 hours ago -> RULE_BENEFICIARY_NEW +0 pts)
    await Beneficiary.create({
      userId: senderId,
      recipientAccountId: recipientId,
      nickname: 'Bob Established Friend',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    });

    // 4. Amount ₹50,000 is 10x historical baseline (5,000) -> RULE_AMOUNT_ANOMALY (+35 pts)
    // Known device -> RULE_DEVICE_NEW (+0 pts)
    // Established beneficiary -> RULE_BENEFICIARY_NEW (+0 pts)
    // Total score = 35 -> MEDIUM (31-70) -> CUSTOMER_VERIFICATION_REQUIRED
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', knownDeviceId)
      .send({
        recipientId,
        amount: 50000,
        note: 'Business consulting payment'
      });

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CUSTOMER_VERIFICATION_REQUIRED');
    expect(res.body.data.riskLevel).toBe('MEDIUM');
    expect(res.body.data.riskScore).toBe(35);

    const txId = res.body.data.transaction._id;

    // Verify escrow hold: sender availableBalance debited by 50k, heldBalance credited by 50k, recipient gets ₹0
    const senderWalletHeld = await Wallet.findOne({ userId: senderId });
    const recipientWalletHeld = await Wallet.findOne({ userId: recipientId });

    expect(senderWalletHeld.availableBalance).toBe(50000); // 100,000 - 50,000
    expect(senderWalletHeld.heldBalance).toBe(50000);      // 50,000 in escrow
    expect(recipientWalletHeld.availableBalance).toBe(5000); // recipient gets ₹0

    // Customer clicks Confirm Payment (POST /api/transactions/:id/confirm)
    const confirmRes = await request(app)
      .post(`/api/transactions/${txId}/confirm`)
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', knownDeviceId)
      .send();

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);
    expect(confirmRes.body.data.status).toBe('APPROVED');

    // Verify settlement: sender heldBalance = 0, recipient receives the 50,000 (5,000 + 50,000 = 55,000)
    const senderWalletFinal = await Wallet.findOne({ userId: senderId });
    const recipientWalletFinal = await Wallet.findOne({ userId: recipientId });

    expect(senderWalletFinal.availableBalance).toBe(50000);
    expect(senderWalletFinal.heldBalance).toBe(0);
    expect(recipientWalletFinal.availableBalance).toBe(55000);
  });
});
