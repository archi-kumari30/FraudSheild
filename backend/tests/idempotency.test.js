const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const Beneficiary = require('../src/models/Beneficiary');
const Transaction = require('../src/models/Transaction');
const IdempotencyRecord = require('../src/models/IdempotencyRecord');
const { generateToken } = require('../src/utils/token');

describe('Payment Idempotency Suite (IETF-Compliant Key Protection)', () => {
  let sender, recipient, senderToken, beneficiary;

  beforeEach(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Beneficiary.deleteMany({});
    await Transaction.deleteMany({});
    await IdempotencyRecord.deleteMany({});

    const defaultHash = await User.hashPassword('Password123!');
    const pinHash = await User.hashPin('123456');

    sender = await User.create({
      name: 'Alice Sender',
      email: `alice_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
      passwordHash: defaultHash,
      transactionPinHash: pinHash,
      role: 'customer'
    });

    recipient = await User.create({
      name: 'Bob Recipient',
      email: `bob_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
      passwordHash: defaultHash,
      role: 'customer'
    });

    await Wallet.create({
      userId: sender._id,
      availableBalance: 100000,
      heldBalance: 0
    });

    await Wallet.create({
      userId: recipient._id,
      availableBalance: 5000,
      heldBalance: 0
    });

    beneficiary = await Beneficiary.create({
      userId: sender._id,
      recipientAccountId: recipient._id,
      nickname: 'Bob Office'
    });

    senderToken = generateToken({ id: sender._id, role: 'customer' });
  });

  test('TC-IDEM-001: Identical request with same Idempotency-Key returns cached response without duplicate debit', async () => {
    const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const payload = {
      recipientId: recipient._id.toString(),
      amount: 1500,
      note: 'Consulting payment',
      transactionPin: '123456'
    };

    // First request
    const firstRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${senderToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send(payload);

    expect(firstRes.status).toBe(200);
    expect(firstRes.body.success).toBe(true);
    const firstTxId = firstRes.body.data.transaction._id;

    // Check sender wallet
    const senderWalletAfterFirst = await Wallet.findOne({ userId: sender._id });
    expect(senderWalletAfterFirst.availableBalance).toBe(100000 - 1500);

    // Second duplicate request with identical key and payload
    const secondRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${senderToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send(payload);

    expect(secondRes.status).toBe(200);
    expect(secondRes.body.success).toBe(true);
    expect(secondRes.body.data.transaction._id).toBe(firstTxId);
    expect(secondRes.headers['x-idempotent-replay']).toBe('true');

    // Wallet balance should NOT be debited twice
    const senderWalletAfterSecond = await Wallet.findOne({ userId: sender._id });
    expect(senderWalletAfterSecond.availableBalance).toBe(100000 - 1500);

    // Transaction collection should only have 1 record
    const count = await Transaction.countDocuments({ senderId: sender._id });
    expect(count).toBe(1);
  });

  test('TC-IDEM-002: Reusing same Idempotency-Key with conflicting payload returns 409 CONFLICT', async () => {
    const idempotencyKey = `idem-conflict-${Date.now()}`;

    // Request 1: 1,000
    const res1 = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${senderToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        recipientId: recipient._id.toString(),
        amount: 1000,
        note: 'First attempt',
        transactionPin: '123456'
      });

    expect(res1.status).toBe(200);

    // Request 2: Reusing SAME key with DIFFERENT amount (5,000)
    const res2 = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${senderToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        recipientId: recipient._id.toString(),
        amount: 5000,
        note: 'First attempt modified',
        transactionPin: '123456'
      });

    expect(res2.status).toBe(409);
    expect(res2.body.success).toBe(false);
    expect(res2.body.error.code).toBe('IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');
    expect(res2.body.error.message).toBe('Idempotency key already used with a different request.');
  });
});
