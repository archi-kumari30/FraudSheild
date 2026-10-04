const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const { connectDB, disconnectDB } = require('../src/config/db');
const seedAdmin = require('../src/scripts/seedAdmin');
const config = require('../src/config');

describe('Module 2: Authentication & Authorization Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  // TC-M2-001: Successful Customer Registration
  test('TC-M2-001: Successful Customer Registration creates user and returns JWT', async () => {
    const payload = {
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: 'Password123!'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.name).toBe('Alice Smith');
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.user.role).toBe('customer');
    expect(res.body.data.user.passwordHash).toBeUndefined();

    // Verify database record
    const savedUser = await User.findOne({ email: 'alice@example.com' });
    expect(savedUser).not.toBeNull();
    expect(savedUser.role).toBe('customer');
    expect(savedUser.passwordHash).toBeDefined();
    expect(savedUser.passwordHash).not.toBe(payload.password);
  });

  // TC-M2-002: Duplicate Email Registration Rejection
  test('TC-M2-002: Duplicate Email Registration is rejected with HTTP 409', async () => {
    const initialUser = {
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: 'Password123!'
    };

    // First registration
    await request(app).post('/api/auth/register').send(initialUser);

    // Duplicate registration attempt
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Duplicate',
        email: 'alice@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Email already registered');
    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  // TC-M2-003: Registration Payload Role Tampering (Privilege Escalation Prevention)
  test('TC-M2-003: Registration payload role tampering is ignored and forces customer role', async () => {
    const maliciousPayload = {
      name: 'Eve Attacker',
      email: 'eve@example.com',
      password: 'Password123!',
      role: 'admin'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(maliciousPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('customer');

    const dbUser = await User.findOne({ email: 'eve@example.com' });
    expect(dbUser.role).toBe('customer');
  });

  // TC-M2-004: Successful Customer Login
  test('TC-M2-004: Successful Customer Login returns HTTP 200 and signed JWT', async () => {
    const credentials = {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      password: 'SecurePassword123!'
    };

    await request(app).post('/api/auth/register').send(credentials);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'bob@example.com',
        password: 'SecurePassword123!'
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeDefined();
    expect(loginRes.body.data.user.email).toBe('bob@example.com');
    expect(loginRes.body.data.user.role).toBe('customer');
    expect(loginRes.body.data.user.passwordHash).toBeUndefined();
  });

  // TC-M2-005: Login with Incorrect Password
  test('TC-M2-005: Login with incorrect password returns generic 401 error', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Carol White',
      email: 'carol@example.com',
      password: 'Password123!'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'carol@example.com',
        password: 'WrongPassword999!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Invalid email or password');
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  // TC-M2-006: Authenticated Profile Retrieval (GET /api/auth/me)
  test('TC-M2-006: Authenticated Profile Retrieval returns current user profile without passwordHash', async () => {
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'David Green',
      email: 'david@example.com',
      password: 'Password123!'
    });

    const token = registerRes.body.data.token;

    const profileRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.success).toBe(true);
    expect(profileRes.body.data.user.email).toBe('david@example.com');
    expect(profileRes.body.data.user.role).toBe('customer');
    expect(profileRes.body.data.user.passwordHash).toBeUndefined();
  });

  // TC-M2-007: Missing Authorization Header Rejection
  test('TC-M2-007: Missing Authorization header on protected route returns HTTP 401', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Authentication token required');
    expect(res.body.error.code).toBe('TOKEN_MISSING');
  });

  // TC-M2-008: Role Guard Blocks Customer from Admin Route
  test('TC-M2-008: Role Guard blocks customer role from admin route with HTTP 403', async () => {
    // Register normal customer
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Customer Dave',
      email: 'customer.dave@example.com',
      password: 'Password123!'
    });

    const customerToken = regRes.body.data.token;

    // Attempt to access admin route
    const res = await request(app)
      .get('/api/test-admin')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Access denied: insufficient permissions');
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // TC-M2-009: Admin Seed Script Successfully Provisions Default Administrator
  test('TC-M2-009: Admin Seed script provisions administrator account successfully', async () => {
    await seedAdmin();

    const adminUser = await User.findOne({ email: config.adminSeed.email.toLowerCase() });
    expect(adminUser).not.toBeNull();
    expect(adminUser.role).toBe('admin');

    // Admin can log in successfully
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: config.adminSeed.email,
        password: config.adminSeed.password
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.role).toBe('admin');

    const adminToken = loginRes.body.data.token;

    // Admin can access admin-guarded route
    const adminAccessRes = await request(app)
      .get('/api/test-admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminAccessRes.status).toBe(200);
    expect(adminAccessRes.body.message).toBe('Admin access granted');
  });

  // Additional Edge Cases
  test('EC-M2-002: Malformed email rejected with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Invalid Email',
        email: 'invalid-email-format',
        password: 'Password123!'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('EC-M2-003: Weak password (< 8 chars or no numbers) rejected with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Weak Pass',
        email: 'weak@example.com',
        password: 'short'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('EC-M2-006: Non-existent email login returns generic 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nobody@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  test('EC-M2-008: Malformed or forged token returns 401 TOKEN_INVALID', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.forged.token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  test('EC-M2-009: Expired token returns 401 TOKEN_EXPIRED', async () => {
    // Generate expired token
    const expiredToken = jwt.sign(
      { id: new mongoose.Types.ObjectId(), email: 'expired@test.com', role: 'customer' },
      config.jwtSecret,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  test('EC-M2-011: Inactive user account is rejected', async () => {
    const user = new User({
      name: 'Inactive User',
      email: 'inactive@example.com',
      passwordHash: await User.hashPassword('Password123!'),
      role: 'customer',
      isActive: false
    });
    await user.save();

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'inactive@example.com',
        password: 'Password123!'
      });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.error.code).toBe('ACCOUNT_INACTIVE');
  });
});
