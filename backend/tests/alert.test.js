const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const Beneficiary = require('../src/models/Beneficiary');
const Transaction = require('../src/models/Transaction');
const Alert = require('../src/models/Alert');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('Module 7: Alert Service Tests', () => {
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

  // TC-M7-001: Automatic Alert Generation on Flagged Transaction
  test('TC-M7-001: Flagged transaction automatically generates a MEDIUM severity alert for sender', async () => {
    const sender = await registerUser('Alert Sender', 'alert.sender@test.com');
    const recipient = await registerUser('Alert Recipient', 'alert.recipient@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    // Add extra funds to sender
    await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ amount: 20000 });

    // Add new beneficiary (< 24h)
    await request(app)
      .post('/api/beneficiaries')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientEmail: 'alert.recipient@test.com', nickname: 'New Beneficiary' });

    // Send 15,000 from unknown device -> triggers Score = 55 (FLAGGED_FOR_REVIEW)
    const txRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'unregistered-phone')
      .send({ recipientId, amount: 15000, note: 'Trigger review alert' });

    expect(txRes.status).toBe(202);

    // Query alerts collection for sender
    const alerts = await Alert.find({ userId: senderId });
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe('MEDIUM');
    expect(alerts[0].title).toBe('Additional verification is required for this payment.');
    expect(alerts[0].isRead).toBe(false);
  });

  // TC-M7-002: Customer Queries Own Alerts (GET /api/alerts) and marks as read
  test('TC-M7-002: Customer retrieves alerts and marks alert as read with PATCH', async () => {
    const sender = await registerUser('Reader User', 'reader@test.com');
    const recipient = await registerUser('Recipient User', 'recip@test.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    // Trigger blocked transaction to generate HIGH alert
    await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ amount: 60000 });

    await request(app)
      .post('/api/beneficiaries')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({ recipientEmail: 'recip@test.com', nickname: 'New Beneficiary' });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${sender.token}`)
      .set('x-device-id', 'attacker-phone')
      .send({ recipientId, amount: 55000 });

    // Retrieve alerts via API
    const listRes = await request(app)
      .get('/api/alerts')
      .set('Authorization', `Bearer ${sender.token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.alerts.length).toBe(1);
    const alertId = listRes.body.data.alerts[0]._id;

    // Mark as read
    const patchRes = await request(app)
      .patch(`/api/alerts/${alertId}/read`)
      .set('Authorization', `Bearer ${sender.token}`);

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.alert.isRead).toBe(true);
  });
});
