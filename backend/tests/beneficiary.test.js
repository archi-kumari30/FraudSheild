const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Beneficiary = require('../src/models/Beneficiary');
const Wallet = require('../src/models/Wallet');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('Module 3: Beneficiary Service Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Beneficiary.deleteMany({});
    await Wallet.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Beneficiary.deleteMany({});
    await Wallet.deleteMany({});
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

  // TC-M3-005: Add Valid Beneficiary
  test('TC-M3-005: Customer adds existing user as beneficiary successfully', async () => {
    const sender = await registerUser('Sender User', 'sender@test.com');
    const recipient = await registerUser('Recipient Charlie', 'charlie@test.com');

    const res = await request(app)
      .post('/api/beneficiaries')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        recipientEmail: 'charlie@test.com',
        nickname: 'Charlie Personal'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.beneficiary).toBeDefined();
    expect(res.body.data.beneficiary.nickname).toBe('Charlie Personal');
    expect(res.body.data.beneficiary.createdAt).toBeDefined();
    expect(res.body.data.beneficiary.recipientAccountId._id.toString()).toBe(
      (recipient.user._id || recipient.user.id).toString()
    );

    // Verify GET /api/beneficiaries
    const listRes = await request(app)
      .get('/api/beneficiaries')
      .set('Authorization', `Bearer ${sender.token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.beneficiaries.length).toBe(1);
  });

  // TC-M3-006: Self-Beneficiary Rejection
  test('TC-M3-006: Attempting to add self as beneficiary is rejected with 400', async () => {
    const sender = await registerUser('Self User', 'self@test.com');

    const res = await request(app)
      .post('/api/beneficiaries')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        recipientEmail: 'self@test.com',
        nickname: 'My Account'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Cannot add yourself as a beneficiary');
    expect(res.body.error.code).toBe('SELF_BENEFICIARY_PROHIBITED');
  });

  // TC-M3-007: Duplicate Beneficiary Rejection
  test('TC-M3-007: Attempting to add duplicate beneficiary returns 409 Conflict', async () => {
    const sender = await registerUser('Sender User', 'sender2@test.com');
    await registerUser('Recipient Dave', 'dave@test.com');

    // First addition
    await request(app)
      .post('/api/beneficiaries')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        recipientEmail: 'dave@test.com',
        nickname: 'Dave First'
      });

    // Duplicate addition
    const duplicateRes = await request(app)
      .post('/api/beneficiaries')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        recipientEmail: 'dave@test.com',
        nickname: 'Dave Second'
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.error.message).toBe('Beneficiary already added');
    expect(duplicateRes.body.error.code).toBe('BENEFICIARY_EXISTS');
  });

  // TC-M3-008: Delete Beneficiary
  test('TC-M3-008: Customer deletes existing beneficiary from address book', async () => {
    const sender = await registerUser('Sender User', 'sender3@test.com');
    await registerUser('Recipient Eve', 'eve@test.com');

    const addRes = await request(app)
      .post('/api/beneficiaries')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        recipientEmail: 'eve@test.com',
        nickname: 'Eve Work'
      });

    const beneficiaryId = addRes.body.data.beneficiary._id;

    // Delete beneficiary
    const delRes = await request(app)
      .delete(`/api/beneficiaries/${beneficiaryId}`)
      .set('Authorization', `Bearer ${sender.token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // List is now empty
    const listRes = await request(app)
      .get('/api/beneficiaries')
      .set('Authorization', `Bearer ${sender.token}`);

    expect(listRes.body.data.beneficiaries.length).toBe(0);
  });

  // EC-M3-006: Non-existent recipient
  test('EC-M3-006: Adding non-existent user as beneficiary returns 404', async () => {
    const sender = await registerUser('Sender User', 'sender4@test.com');

    const res = await request(app)
      .post('/api/beneficiaries')
      .set('Authorization', `Bearer ${sender.token}`)
      .send({
        recipientEmail: 'ghost@nonexistent.com',
        nickname: 'Ghost'
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RECIPIENT_NOT_FOUND');
  });

  // EC-M3-009: IDOR protection - cannot delete another user's beneficiary
  test('EC-M3-009: Cannot delete another user beneficiary record', async () => {
    const senderA = await registerUser('User A', 'usera@test.com');
    const senderB = await registerUser('User B', 'userb@test.com');
    await registerUser('Target C', 'targetc@test.com');

    // User A adds Target C
    const addRes = await request(app)
      .post('/api/beneficiaries')
      .set('Authorization', `Bearer ${senderA.token}`)
      .send({
        recipientEmail: 'targetc@test.com',
        nickname: 'User A target'
      });

    const beneficiaryId = addRes.body.data.beneficiary._id;

    // User B attempts to delete User A's beneficiary
    const delRes = await request(app)
      .delete(`/api/beneficiaries/${beneficiaryId}`)
      .set('Authorization', `Bearer ${senderB.token}`);

    expect(delRes.status).toBe(404);

    // Beneficiary remains intact for User A
    const listRes = await request(app)
      .get('/api/beneficiaries')
      .set('Authorization', `Bearer ${senderA.token}`);

    expect(listRes.body.data.beneficiaries.length).toBe(1);
  });
});
