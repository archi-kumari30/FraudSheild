const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('Module 3: Wallet Service Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
  });

  // Helper to register a customer and return user + token
  const registerCustomer = async (email = 'customer@test.com') => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Customer',
        email,
        password: 'Password123!'
      });
    return res.body.data;
  };

  // TC-M3-001: Automatic Wallet Provisioning on Customer Registration
  test('TC-M3-001: Automatic wallet provisioning initializes 10000 INR balance on registration', async () => {
    const data = await registerCustomer('wallet.user@test.com');
    const user = data.user;

    const wallet = await Wallet.findOne({ userId: user._id || user.id });
    expect(wallet).not.toBeNull();
    expect(wallet.availableBalance).toBe(10000);
    expect(wallet.heldBalance).toBe(0);
    expect(wallet.currency).toBe('INR');
  });

  // TC-M3-002: Customer Retrieves Own Wallet Balances (GET /api/wallet)
  test('TC-M3-002: Customer retrieves own wallet balances with GET /api/wallet', async () => {
    const { token } = await registerCustomer('balance.query@test.com');

    const res = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.availableBalance).toBe(10000);
    expect(res.body.data.heldBalance).toBe(0);
    expect(res.body.data.currency).toBe('INR');
  });

  // TC-M3-003: Simulated Test Deposit Succeeds
  test('TC-M3-003: Simulated test deposit credits available balance accurately', async () => {
    const { token } = await registerCustomer('deposit.user@test.com');

    const depositRes = await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 5000 });

    expect(depositRes.status).toBe(200);
    expect(depositRes.body.success).toBe(true);
    expect(depositRes.body.data.availableBalance).toBe(15000);
    expect(depositRes.body.data.heldBalance).toBe(0);

    // Verify GET /api/wallet reflects new balance
    const walletRes = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${token}`);

    expect(walletRes.body.data.availableBalance).toBe(15000);
  });

  // TC-M3-004: Negative and Zero Deposit Rejection
  test('TC-M3-004: Negative and zero deposit requests are rejected with 400', async () => {
    const { token } = await registerCustomer('zero.user@test.com');

    const zeroRes = await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 0 });

    expect(zeroRes.status).toBe(400);
    expect(zeroRes.body.success).toBe(false);

    const negRes = await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: -500 });

    expect(negRes.status).toBe(400);
    expect(negRes.body.success).toBe(false);

    // Balance remains 10000
    const checkRes = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${token}`);

    expect(checkRes.body.data.availableBalance).toBe(10000);
  });

  // EC-M3-003: Extreme deposit limit rejection
  test('EC-M3-003: Deposit exceeding limit (> 10,000,000) rejected with 400', async () => {
    const { token } = await registerCustomer('extreme.user@test.com');

    const res = await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 10000001 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('AMOUNT_EXCEEDS_LIMIT');
  });

  // EC-M3-010: Concurrent deposits atomically calculate correct balance
  test('EC-M3-010: Concurrent deposits credit balance atomically without race condition', async () => {
    const { token } = await registerCustomer('concurrent.user@test.com');

    // Fire 5 concurrent deposits of 1000 each
    const promises = [1, 2, 3, 4, 5].map(() =>
      request(app)
        .post('/api/wallet/deposit')
        .set('Authorization', `Bearer ${token}`)
        .send({ amount: 1000 })
    );

    const responses = await Promise.all(promises);
    responses.forEach((res) => expect(res.status).toBe(200));

    const finalRes = await request(app)
      .get('/api/wallet')
      .set('Authorization', `Bearer ${token}`);

    // Starting 10,000 + (5 * 1000) = 15,000
    expect(finalRes.body.data.availableBalance).toBe(15000);
  });
});
