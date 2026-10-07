const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const Beneficiary = require('../src/models/Beneficiary');
const Transaction = require('../src/models/Transaction');
const { generateToken } = require('../src/utils/token');

describe('Step-Up Transaction PIN Authentication Suite', () => {
  let user, userToken, recipient, recipientToken;

  beforeEach(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Beneficiary.deleteMany({});
    await Transaction.deleteMany({});

    user = await User.create({
      name: 'PIN Customer',
      email: `pin_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
      passwordHash: await User.hashPassword('Password123!'),
      role: 'customer'
    });
    userToken = generateToken({ id: user._id, role: 'customer' });

    recipient = await User.create({
      name: 'PIN Recipient',
      email: `recip_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
      passwordHash: await User.hashPassword('Password123!'),
      role: 'customer'
    });
    recipientToken = generateToken({ id: recipient._id, role: 'customer' });

    await Wallet.create({ userId: user._id, availableBalance: 20000, heldBalance: 0 });
    await Wallet.create({ userId: recipient._id, availableBalance: 1000, heldBalance: 0 });

    await Beneficiary.create({
      userId: user._id,
      recipientAccountId: recipient._id,
      nickname: 'Trusted Recipient',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
    });
  });

  test('TC-PIN-001: Customer can setup 6-digit transaction PIN with password confirmation', async () => {
    const res = await request(app)
      .post('/api/auth/pin/setup')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        pin: '123456',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hasTransactionPin).toBe(true);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.transactionPinHash).toBeDefined();
    expect(updatedUser.transactionPinHash).not.toBe('123456');
  });

  test('TC-PIN-002: Customer can verify valid PIN and is rejected on invalid PIN', async () => {
    // Setup PIN
    await request(app)
      .post('/api/auth/pin/setup')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ pin: '654321', password: 'Password123!' });

    // Verify correct PIN
    const validRes = await request(app)
      .post('/api/auth/pin/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ pin: '654321' });

    expect(validRes.status).toBe(200);
    expect(validRes.body.success).toBe(true);
    expect(validRes.body.data.verified).toBe(true);

    // Verify incorrect PIN
    const invalidRes = await request(app)
      .post('/api/auth/pin/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ pin: '000000' });

    expect(invalidRes.status).toBe(401);
    expect(invalidRes.body.success).toBe(false);
    expect(invalidRes.body.error.code).toBe('INVALID_PIN');
    expect(invalidRes.body.data.remainingAttempts).toBe(2);
  });

  test('TC-PIN-003: Outgoing transfer with correct PIN succeeds and debits wallet', async () => {
    // Setup PIN first
    await request(app)
      .post('/api/auth/pin/setup')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ pin: '123456', password: 'Password123!' });

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recipientId: recipient._id.toString(),
        amount: 2000,
        note: 'Normal transfer',
        transactionPin: '123456'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPROVED');

    const senderWallet = await Wallet.findOne({ userId: user._id });
    expect(senderWallet.availableBalance).toBe(18000);
  });

  test('TC-PIN-004: Outgoing transfer with wrong PIN is rejected with 401 INVALID_PIN and balance untouched', async () => {
    // Setup PIN first
    await request(app)
      .post('/api/auth/pin/setup')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ pin: '123456', password: 'Password123!' });

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recipientId: recipient._id.toString(),
        amount: 2000,
        note: 'Wrong PIN attempt',
        transactionPin: '999999'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_PIN');

    // Balance remains 100% untouched
    const senderWallet = await Wallet.findOne({ userId: user._id });
    expect(senderWallet.availableBalance).toBe(20000);
    expect(senderWallet.heldBalance).toBe(0);

    const recipientWallet = await Wallet.findOne({ userId: recipient._id });
    expect(recipientWallet.availableBalance).toBe(1000);
  });

  test('TC-PIN-005: Outgoing transfer with no PIN configured is rejected with 400 TRANSACTION_PIN_NOT_SET', async () => {
    // User does NOT configure PIN
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recipientId: recipient._id.toString(),
        amount: 2000,
        note: 'Unconfigured PIN attempt',
        transactionPin: '123456'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TRANSACTION_PIN_NOT_SET');

    // Balance remains untouched
    const senderWallet = await Wallet.findOne({ userId: user._id });
    expect(senderWallet.availableBalance).toBe(20000);
  });

  test('TC-PIN-006: Reset forgotten PIN with account password succeeds', async () => {
    // Initially set PIN
    await request(app)
      .post('/api/auth/pin/setup')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ pin: '111111', password: 'Password123!' });

    // Reset PIN using account password
    const res = await request(app)
      .post('/api/auth/pin/reset')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        password: 'Password123!',
        newPin: '888888'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify new PIN works for transfer
    const txRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        recipientId: recipient._id.toString(),
        amount: 1500,
        transactionPin: '888888'
      });

    expect(txRes.status).toBe(200);
    expect(txRes.body.data.status).toBe('APPROVED');
  });

  test('TC-PIN-007: Reset forgotten PIN with incorrect account password fails with 401 INVALID_PASSWORD', async () => {
    // Initially set PIN
    await request(app)
      .post('/api/auth/pin/setup')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ pin: '111111', password: 'Password123!' });

    // Attempt reset with wrong password
    const res = await request(app)
      .post('/api/auth/pin/reset')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        password: 'WrongPassword!',
        newPin: '999999'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_PASSWORD');
  });
});
