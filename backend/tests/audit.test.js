const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const Transaction = require('../src/models/Transaction');
const Alert = require('../src/models/Alert');
const AuditLog = require('../src/models/AuditLog');
const seedAdmin = require('../src/scripts/seedAdmin');
const config = require('../src/config');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('Module 9: Audit Logging & Observability Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Transaction.deleteMany({});
    await Alert.deleteMany({});
    // Clean up audit logs directly using native collection if needed
    try {
      await AuditLog.collection.drop();
    } catch (e) {
      // ignore
    }
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Transaction.deleteMany({});
    await Alert.deleteMany({});
    try {
      await AuditLog.collection.deleteMany({});
    } catch (e) {
      // ignore
    }
  });

  const registerCustomer = async (name, email) => {
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

  // TC-M9-001: Authentication Login Events Generate Audit Records
  test('TC-M9-001: Successful and failed login attempts create corresponding audit logs', async () => {
    const customer = await registerCustomer('Audit User', 'audit.user@test.com');

    // 1. Successful login
    const successRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'audit.user@test.com',
        password: 'Password123!'
      });
    expect(successRes.status).toBe(200);

    // 2. Failed login with invalid password
    const failRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'audit.user@test.com',
        password: 'WrongPassword999!'
      });
    expect(failRes.status).toBe(401);

    // Query audit logs
    const successLog = await AuditLog.findOne({ eventType: 'AUTH_LOGIN_SUCCESS' });
    const failLog = await AuditLog.findOne({ eventType: 'AUTH_LOGIN_FAILURE' });

    expect(successLog).toBeDefined();
    expect(successLog.actorId.toString()).toBe((customer.user._id || customer.user.id).toString());
    expect(successLog.metadata.password).toBeUndefined();

    expect(failLog).toBeDefined();
    expect(failLog.metadata.reason).toBe('INVALID_PASSWORD');
    expect(failLog.metadata.password).toBeUndefined();
  });

  // TC-M9-002: Transaction Lifecycle Events Generate Audit Records
  test('TC-M9-002: Initiating and scoring a transaction creates TRANSACTION_INITIATED and FRAUD_EVALUATION_COMPLETED audit entries', async () => {
    const sender = await registerCustomer('Alice Sender', 'alice.sender@test.com');
    const recipient = await registerCustomer('Bob Recipient', 'bob.recipient@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    // Execute transfer
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'test-device-uuid')
      .send({
        recipientId,
        amount: 2500,
        note: 'Payment for services',
        transactionPin: '123456'
      });

    expect(res.status).toBe(200);
    const txId = res.body.data.transaction._id;

    // Check audit logs for this transaction
    const initiatedLog = await AuditLog.findOne({
      eventType: 'TRANSACTION_INITIATED',
      'targetEntity.entityId': txId
    });
    const scoredLog = await AuditLog.findOne({
      eventType: 'FRAUD_EVALUATION_COMPLETED',
      'targetEntity.entityId': txId
    });

    expect(initiatedLog).toBeDefined();
    expect(initiatedLog.actorId.toString()).toBe(senderId.toString());
    expect(initiatedLog.metadata.amount).toBe(2500);

    expect(scoredLog).toBeDefined();
    expect(scoredLog.metadata.riskScore).toBeDefined();
    expect(scoredLog.metadata.outcome).toBe('APPROVED');
  });

  // TC-M9-003: Admin Manual Review Actions Generate Audit Records
  test('TC-M9-003: Admin review approval creates immutable audit record with admin ID and resolution notes', async () => {
    const sender = await registerCustomer('Sender Review', 'sender.review@test.com');
    const recipient = await registerCustomer('Recipient Review', 'recipient.review@test.com');
    const admin = await loginAdmin();

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    // Create flagged transaction
    await Wallet.findOneAndUpdate({ userId: senderId }, { availableBalance: 15000, heldBalance: 15000 });
    const transaction = new Transaction({
      senderId,
      recipientId,
      amount: 15000,
      currency: 'INR',
      status: 'FLAGGED_FOR_REVIEW',
      riskScore: 50,
      riskLevel: 'MEDIUM',
      triggeredRules: [{ ruleCode: 'RULE_AMOUNT_SPIKE', weight: 35, reason: 'High amount spike' }]
    });
    await transaction.save();

    // Admin resolves review
    const resolveRes = await request(app)
      .post(`/api/admin/reviews/${transaction._id}/resolve`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        decision: 'APPROVE',
        resolutionNotes: 'Customer verified transfer via phone confirmation'
      });

    expect(resolveRes.status).toBe(200);

    // Verify audit log
    const reviewLog = await AuditLog.findOne({
      eventType: 'ADMIN_REVIEW_APPROVED',
      'targetEntity.entityId': transaction._id
    });

    expect(reviewLog).toBeDefined();
    expect(reviewLog.actorRole).toBe('admin');
    expect(reviewLog.actorId.toString()).toBe((admin.user._id || admin.user.id).toString());
    expect(reviewLog.metadata.notes).toBe('Customer verified transfer via phone confirmation');
  });

  // TC-M9-004: Admin Queries Audit Logs (GET /api/admin/audit-logs)
  test('TC-M9-004: Admin retrieves paginated audit logs with event filtering', async () => {
    const admin = await loginAdmin();

    // Insert mock audit logs
    const logsToInsert = [
      {
        eventType: 'ADMIN_REVIEW_APPROVED',
        actorId: admin.user._id || admin.user.id,
        actorRole: 'admin',
        metadata: { notes: 'Review approved 1' },
        timestamp: new Date()
      },
      {
        eventType: 'ADMIN_REVIEW_REJECTED',
        actorId: admin.user._id || admin.user.id,
        actorRole: 'admin',
        metadata: { notes: 'Review rejected 1' },
        timestamp: new Date()
      }
    ];
    await AuditLog.insertMany(logsToInsert);

    const res = await request(app)
      .get('/api/admin/audit-logs?eventType=ADMIN_REVIEW_APPROVED&page=1&limit=10')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.logs).toBeDefined();
    expect(res.body.data.logs.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.logs[0].eventType).toBe('ADMIN_REVIEW_APPROVED');
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.currentPage).toBe(1);
    expect(res.body.data.pagination.limit).toBe(10);
  });

  // TC-M9-005: Customer Blocked from Audit Log Endpoint
  test('TC-M9-005: Customer role is blocked from calling audit log endpoint with 403', async () => {
    const customer = await registerCustomer('Audit Customer', 'customer.audit@test.com');

    const res = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${customer.token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // TC-M9-006: Audit Log Immutability Enforcement
  test('TC-M9-006: Direct update or delete operations on AuditLog collection are rejected', async () => {
    const log = new AuditLog({
      eventType: 'AUTH_LOGIN_SUCCESS',
      actorRole: 'system',
      metadata: { detail: 'Original log' }
    });
    await log.save();

    // Attempt Mongoose updateOne
    await expect(
      AuditLog.updateOne({ _id: log._id }, { eventType: 'TAMPERED' })
    ).rejects.toThrow('AuditLog records are immutable');

    // Attempt Mongoose deleteOne
    await expect(
      AuditLog.deleteOne({ _id: log._id })
    ).rejects.toThrow('AuditLog records are immutable');

    // Verify record remains untouched
    const freshLog = await AuditLog.findById(log._id);
    expect(freshLog.eventType).toBe('AUTH_LOGIN_SUCCESS');
  });
});
