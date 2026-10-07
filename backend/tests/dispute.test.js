const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const Transaction = require('../src/models/Transaction');
const Dispute = require('../src/models/Dispute');
const Alert = require('../src/models/Alert');
const AuditLog = require('../src/models/AuditLog');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('Dispute Management & Security Telemetry Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Transaction.deleteMany({});
    await Dispute.deleteMany({});
    await Alert.deleteMany({});
    try {
      await AuditLog.collection.deleteMany({});
    } catch (e) {
      // ignore
    }
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Transaction.deleteMany({});
    await Dispute.deleteMany({});
    await Alert.deleteMany({});
    try {
      await AuditLog.collection.deleteMany({});
    } catch (e) {
      // ignore
    }
  });

  const registerUser = async (name, email) => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name,
        email,
        password: 'Password123!'
      });
    const data = res.body.data;
    const userId = data.user._id || data.user.id;
    const pinHash = await User.hashPin('123456');
    await User.findByIdAndUpdate(userId, { transactionPinHash: pinHash });
    return data;
  };

  const getAdminToken = async () => {
    // Seed admin
    const seedAdmin = require('../src/scripts/seedAdmin');
    await seedAdmin();

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@fraudshield.internal',
        password: 'AdminSecurePassword123!'
      });
    return res.body.data.token;
  };

  // Helper: create an approved transaction between sender and recipient
  const createApprovedTransaction = async (sender, recipient, amount = 1000) => {
    // First register beneficiary
    await request(app)
      .post('/api/beneficiaries')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        recipientAccountId: recipient.user._id || recipient.user.id,
        nickname: recipient.user.name
      });

    // Make beneficiary older than 24h to avoid rule trigger
    const Beneficiary = require('../src/models/Beneficiary');
    await Beneficiary.updateMany({}, { createdAt: new Date(Date.now() - 48 * 3600 * 1000) });

    // Register sender device
    const UserDevice = require('../src/models/UserDevice');
    await UserDevice.create({
      userId: sender.user._id || sender.user.id,
      deviceId: 'sender-trusted-mac-01',
      userAgent: 'Mozilla/5.0 Chrome',
      ipAddress: '192.168.1.100',
      firstSeenAt: new Date(Date.now() - 48 * 3600 * 1000),
      lastSeenAt: new Date()
    });

    // Perform transaction
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'sender-trusted-mac-01')
      .send({
        recipientId: recipient.user._id || recipient.user.id,
        amount,
        note: 'Service payment',
        transactionPin: '123456'
      });

    return res.body.data.transaction;
  };

  test('TC-DISPUTE-001: Customer can raise dispute on APPROVED transaction', async () => {
    const sender = await registerUser('Alice Sender', 'alice@test.com');
    const recipient = await registerUser('Bob Recipient', 'bob@test.com');

    const tx = await createApprovedTransaction(sender, recipient, 1200);
    expect(tx.status).toBe('APPROVED');

    const res = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        transactionId: tx._id,
        reason: 'Payment sent to wrong recipient by mistake'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dispute.status).toBe('OPEN');
    expect(res.body.data.dispute.amount).toBe(1200);

    // Verify transaction updated
    const updatedTx = await Transaction.findById(tx._id);
    expect(updatedTx.isDisputed).toBe(true);
    expect(updatedTx.disputeId.toString()).toBe(res.body.data.dispute._id.toString());

    // Verify audit log recorded
    const auditLogs = await AuditLog.find({ eventType: 'DISPUTE_CREATED' });
    expect(auditLogs.length).toBe(1);
    expect(auditLogs[0].metadata.amount).toBe(1200);
  });

  test('TC-DISPUTE-002: Rejects dispute on non-approved transaction', async () => {
    const sender = await registerUser('Alice Sender', 'alice@test.com');
    const recipient = await registerUser('Bob Recipient', 'bob@test.com');

    const tx = new Transaction({
      senderId: sender.user._id || sender.user.id,
      recipientId: recipient.user._id || recipient.user.id,
      amount: 500,
      currency: 'INR',
      status: 'BLOCKED',
      riskScore: 85,
      riskLevel: 'HIGH',
      triggeredRules: []
    });
    await tx.save();

    const res = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        transactionId: tx._id,
        reason: 'Payment sent to wrong recipient'
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TRANSACTION_STATUS');
  });

  test('TC-DISPUTE-003: Rejects dispute if user is not the sender', async () => {
    const sender = await registerUser('Alice Sender', 'alice@test.com');
    const recipient = await registerUser('Bob Recipient', 'bob@test.com');
    const thirdParty = await registerUser('Charlie Intruder', 'charlie@test.com');

    const tx = await createApprovedTransaction(sender, recipient, 1000);

    const res = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${thirdParty.token}`)
      .send({
        transactionId: tx._id,
        reason: 'Payment dispute by unauthorized user'
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('TC-DISPUTE-004: Prevents duplicate dispute on the same transaction', async () => {
    const sender = await registerUser('Alice Sender', 'alice@test.com');
    const recipient = await registerUser('Bob Recipient', 'bob@test.com');

    const tx = await createApprovedTransaction(sender, recipient, 800);

    const res1 = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        transactionId: tx._id,
        reason: 'Mistaken transfer amount'
      });
    expect(res1.status).toBe(201);

    const res2 = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        transactionId: tx._id,
        reason: 'Duplicate dispute attempt'
      });
    expect(res2.status).toBe(409);
    expect(res2.body.error.code).toBe('DUPLICATE_DISPUTE');
  });

  test('TC-DISPUTE-005: Recipient can view dispute and submit response', async () => {
    const sender = await registerUser('Alice Sender', 'alice@test.com');
    const recipient = await registerUser('Bob Recipient', 'bob@test.com');

    const tx = await createApprovedTransaction(sender, recipient, 1500);

    const disputeRes = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        transactionId: tx._id,
        reason: 'Transferred by mistake'
      });

    const disputeId = disputeRes.body.data.dispute._id;

    // Recipient lists disputes
    const listRes = await request(app)
      .get('/api/disputes')
      .set('Authorization', `Bearer ${recipient.token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.disputes.length).toBe(1);

    // Recipient responds
    const responseRes = await request(app)
      .post(`/api/disputes/${disputeId}/recipient-response`)
      .set('Authorization', `Bearer ${recipient.token}`)
      .send({
        recognized: false,
        agreesToReturn: true,
        responseNote: 'I do not recognize sender and agree to return the funds.'
      });

    expect(responseRes.status).toBe(200);
    expect(responseRes.body.data.dispute.status).toBe('RECIPIENT_RESPONDED');
    expect(responseRes.body.data.dispute.recipientResponse.agreesToReturn).toBe(true);

    // Recipient response alone does NOT change transaction status or refund funds
    const currentTx = await Transaction.findById(tx._id);
    expect(currentTx.status).toBe('APPROVED');
  });

  test('TC-DISPUTE-006: Non-recipient cannot submit recipient response', async () => {
    const sender = await registerUser('Alice Sender', 'alice@test.com');
    const recipient = await registerUser('Bob Recipient', 'bob@test.com');
    const impostor = await registerUser('Eve Impostor', 'eve@test.com');

    const tx = await createApprovedTransaction(sender, recipient, 700);

    const disputeRes = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        transactionId: tx._id,
        reason: 'Payment sent to wrong account'
      });

    const disputeId = disputeRes.body.data.dispute._id;

    const responseRes = await request(app)
      .post(`/api/disputes/${disputeId}/recipient-response`)
      .set('Authorization', `Bearer ${impostor.token}`)
      .send({
        recognized: false,
        agreesToReturn: true,
        responseNote: 'Impostor attempting response'
      });

    expect(responseRes.status).toBe(403);
    expect(responseRes.body.error.code).toBe('FORBIDDEN');
  });

  test('TC-DISPUTE-007: Admin can view disputes in admin queue', async () => {
    const sender = await registerUser('Alice Sender', 'alice@test.com');
    const recipient = await registerUser('Bob Recipient', 'bob@test.com');
    const adminToken = await getAdminToken();

    const tx = await createApprovedTransaction(sender, recipient, 600);
    await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        transactionId: tx._id,
        reason: 'Accidental payment'
      });

    const adminQueueRes = await request(app)
      .get('/api/admin/disputes')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminQueueRes.status).toBe(200);
    expect(adminQueueRes.body.data.disputes.length).toBe(1);
    expect(adminQueueRes.body.data.disputes[0].amount).toBe(600);
  });

  test('TC-DISPUTE-008: Admin approves refund -> atomic balance update, REFUNDED status, and audit logs', async () => {
    const sender = await registerUser('Alice Sender', 'alice@test.com');
    const recipient = await registerUser('Bob Recipient', 'bob@test.com');
    const adminToken = await getAdminToken();

    const tx = await createApprovedTransaction(sender, recipient, 2000);

    // Initial balances after approved transfer:
    // Sender had 10,000 - 2,000 = 8,000
    // Recipient had 10,000 + 2,000 = 12,000
    const senderWalletBefore = await Wallet.findOne({ userId: sender.user._id || sender.user.id });
    const recipientWalletBefore = await Wallet.findOne({ userId: recipient.user._id || recipient.user.id });
    expect(senderWalletBefore.availableBalance).toBe(8000);
    expect(recipientWalletBefore.availableBalance).toBe(12000);

    const disputeRes = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        transactionId: tx._id,
        reason: 'Mistaken transfer to wrong user'
      });

    const disputeId = disputeRes.body.data.dispute._id;

    // Admin resolves with REFUND
    const resolveRes = await request(app)
      .post(`/api/admin/disputes/${disputeId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'REFUND',
        resolutionNotes: 'Accidental transfer verified with recipient agreement. Approved refund.'
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.dispute.status).toBe('RESOLVED_REFUNDED');
    expect(resolveRes.body.data.dispute.adminDecision.decision).toBe('REFUND');

    // Check balances after refund:
    // Sender credited +2,000 => 10,000
    // Recipient debited -2,000 => 10,000
    const senderWalletAfter = await Wallet.findOne({ userId: sender.user._id || sender.user.id });
    const recipientWalletAfter = await Wallet.findOne({ userId: recipient.user._id || recipient.user.id });
    expect(senderWalletAfter.availableBalance).toBe(10000);
    expect(recipientWalletAfter.availableBalance).toBe(10000);

    // Check transaction status
    const updatedTx = await Transaction.findById(tx._id);
    expect(updatedTx.status).toBe('REFUNDED');

    // Check audit logs
    const refundAudit = await AuditLog.findOne({ eventType: 'DISPUTE_REFUND_PROCESSED' });
    expect(refundAudit).toBeTruthy();
    expect(refundAudit.metadata.amount).toBe(2000);
  });

  test('TC-DISPUTE-009: Admin refund fails if recipient has insufficient available balance (negative balance guard)', async () => {
    const sender = await registerUser('Alice Sender', 'alice@test.com');
    const recipient = await registerUser('Bob Recipient', 'bob@test.com');
    const adminToken = await getAdminToken();

    const tx = await createApprovedTransaction(sender, recipient, 5000);

    const disputeRes = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        transactionId: tx._id,
        reason: 'Mistaken transfer'
      });

    const disputeId = disputeRes.body.data.dispute._id;

    // Simulate recipient having depleted their available balance to below 5000 (e.g. 100)
    await Wallet.findOneAndUpdate(
      { userId: recipient.user._id || recipient.user.id },
      { $set: { availableBalance: 100 } }
    );

    const resolveRes = await request(app)
      .post(`/api/admin/disputes/${disputeId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'REFUND',
        resolutionNotes: 'Attempting refund when recipient balance is depleted.'
      });

    expect(resolveRes.status).toBe(400);
    expect(resolveRes.body.error.code).toBe('INSUFFICIENT_FUNDS_FOR_REFUND');

    // Ensure recipient balance did NOT go negative and sender was not credited
    const recipientWallet = await Wallet.findOne({ userId: recipient.user._id || recipient.user.id });
    expect(recipientWallet.availableBalance).toBe(100);

    const txCheck = await Transaction.findById(tx._id);
    expect(txCheck.status).toBe('APPROVED');
  });

  test('TC-DISPUTE-010: Admin rejects dispute -> transaction remains APPROVED, dispute status REJECTED', async () => {
    const sender = await registerUser('Alice Sender', 'alice@test.com');
    const recipient = await registerUser('Bob Recipient', 'bob@test.com');
    const adminToken = await getAdminToken();

    const tx = await createApprovedTransaction(sender, recipient, 1000);

    const disputeRes = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        transactionId: tx._id,
        reason: 'Buyer remorse on service delivery'
      });

    const disputeId = disputeRes.body.data.dispute._id;

    const resolveRes = await request(app)
      .post(`/api/admin/disputes/${disputeId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'REJECT',
        resolutionNotes: 'Merchant proved services were rendered correctly. Dispute rejected.'
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.dispute.status).toBe('REJECTED');
    expect(resolveRes.body.data.dispute.adminDecision.decision).toBe('REJECT');

    const txCheck = await Transaction.findById(tx._id);
    expect(txCheck.status).toBe('APPROVED');
  });

  test('TC-DISPUTE-011: Prevents double resolution of already resolved dispute', async () => {
    const sender = await registerUser('Alice Sender', 'alice@test.com');
    const recipient = await registerUser('Bob Recipient', 'bob@test.com');
    const adminToken = await getAdminToken();

    const tx = await createApprovedTransaction(sender, recipient, 1000);

    const disputeRes = await request(app)
      .post('/api/disputes')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        transactionId: tx._id,
        reason: 'Accidental payment'
      });

    const disputeId = disputeRes.body.data.dispute._id;

    // First resolution
    await request(app)
      .post(`/api/admin/disputes/${disputeId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'REFUND',
        resolutionNotes: 'Legitimate dispute approved for refund.'
      });

    // Second resolution attempt
    const secondRes = await request(app)
      .post(`/api/admin/disputes/${disputeId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'REFUND',
        resolutionNotes: 'Duplicate refund attempt that should be blocked.'
      });

    expect(secondRes.status).toBe(409);
    expect(secondRes.body.error.code).toBe('ALREADY_RESOLVED');
  });

  test('TC-DISPUTE-012: Suspicious device detection creates customer security alert and audit telemetry', async () => {
    const sender = await registerUser('Alice Sender', 'alice@test.com');
    const recipient = await registerUser('Bob Recipient', 'bob@test.com');

    // Transaction from an unrecognized device
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'unrecognized-foreign-device-99')
      .send({
        recipientId: recipient.user._id || recipient.user.id,
        amount: 2500,
        note: 'Transfer from unknown device',
        transactionPin: '123456'
      });

    expect(res.body.success).toBe(true);
    const tx = res.body.data.transaction;
    expect(tx.deviceContext.isKnownDevice).toBe(false);

    // Verify customer alert generated
    const alerts = await Alert.find({ userId: sender.user._id || sender.user.id });
    expect(alerts.length).toBeGreaterThan(0);

    // Verify audit logs for suspicious attempt and new device
    const newDeviceLogs = await AuditLog.find({ eventType: 'NEW_DEVICE_DETECTED' });
    expect(newDeviceLogs.length).toBe(1);

    const suspiciousLogs = await AuditLog.find({ eventType: 'SUSPICIOUS_PAYMENT_ATTEMPT' });
    expect(suspiciousLogs.length).toBe(1);
  });
});
