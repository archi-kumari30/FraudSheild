const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const UserDevice = require('../src/models/UserDevice');
const deviceService = require('../src/services/deviceService');
const { connectDB, disconnectDB } = require('../src/config/db');

describe('Module 4: Device & Context Tracking Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await UserDevice.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await UserDevice.deleteMany({});
  });

  const registerUser = async (email = 'device.user@test.com') => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Device Test User',
        email,
        password: 'Password123!'
      });
    return res.body.data;
  };

  // TC-M4-001: Device Context Middleware Attaches Normalized Context
  test('TC-M4-001: Device context middleware attaches normalized context to req', async () => {
    const res = await request(app)
      .get('/api/test-device-context')
      .set('x-device-id', 'dev-uuid-12345')
      .set('User-Agent', 'Mozilla/5.0 Chrome/120');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deviceContext.deviceId).toBe('dev-uuid-12345');
    expect(res.body.deviceContext.userAgent).toContain('Chrome/120');
    expect(res.body.deviceContext.ipAddress).toBeDefined();
    expect(res.body.deviceContext.isVerified).toBe(true);
  });

  // TC-M4-002: Missing x-device-id Handled Gracefully
  test('TC-M4-002: Missing x-device-id header defaults safely without throwing', async () => {
    const res = await request(app).get('/api/test-device-context');

    expect(res.status).toBe(200);
    expect(res.body.deviceContext.deviceId).toBe('unspecified-device');
    expect(res.body.deviceContext.isVerified).toBe(false);
  });

  // TC-M4-003: Unrecognized Device Correctly Identified as New
  test('TC-M4-003: Unrecognized device returns isKnownDevice = false', async () => {
    const { user } = await registerUser('newdev@test.com');
    const userId = user._id || user.id;

    const isKnown = await deviceService.isKnownDevice(userId, 'unseen-device-999');
    expect(isKnown).toBe(false);
  });

  // TC-M4-004: Previously Registered Device Correctly Identified as Known
  test('TC-M4-004: Registered device returns isKnownDevice = true on subsequent queries', async () => {
    const { user } = await registerUser('knowndev@test.com');
    const userId = user._id || user.id;

    await deviceService.registerDevice(userId, {
      deviceId: 'known-device-101',
      userAgent: 'Mozilla/5.0 TestBrowser',
      ipAddress: '127.0.0.1'
    });

    const isKnown = await deviceService.isKnownDevice(userId, 'known-device-101');
    expect(isKnown).toBe(true);
  });

  // TC-M4-005: Customer Queries Registered Devices (GET /api/devices)
  test('TC-M4-005: Authenticated customer retrieves list of registered devices', async () => {
    const { user, token } = await registerUser('listdev@test.com');
    const userId = user._id || user.id;

    await deviceService.registerDevice(userId, {
      deviceId: 'device-laptop-01',
      userAgent: 'Laptop-Browser',
      ipAddress: '192.168.1.10'
    });

    await deviceService.registerDevice(userId, {
      deviceId: 'device-mobile-02',
      userAgent: 'Mobile-App',
      ipAddress: '192.168.1.20'
    });

    const res = await request(app)
      .get('/api/devices')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.devices.length).toBe(2);
    expect(res.body.data.devices[0].deviceId).toBeDefined();
    expect(res.body.data.devices[0].firstSeenAt).toBeDefined();
    expect(res.body.data.devices[0].lastSeenAt).toBeDefined();
  });

  // TC-M4-006: Device Registry Isolation Between Users
  test('TC-M4-006: Device registered for User A is not considered known for User B', async () => {
    const userA = await registerUser('usera.dev@test.com');
    const userB = await registerUser('userb.dev@test.com');

    const userAId = userA.user._id || userA.user.id;
    const userBId = userB.user._id || userB.user.id;

    // Register device for User A
    await deviceService.registerDevice(userAId, {
      deviceId: 'shared-pc-01',
      userAgent: 'Shared-PC',
      ipAddress: '10.0.0.1'
    });

    // Check device for User A -> true
    expect(await deviceService.isKnownDevice(userAId, 'shared-pc-01')).toBe(true);

    // Check device for User B -> false
    expect(await deviceService.isKnownDevice(userBId, 'shared-pc-01')).toBe(false);
  });

  // Invalid device ID header sanitization
  test('Invalid x-device-id header with invalid characters is sanitized to invalid-device-id', async () => {
    const res = await request(app)
      .get('/api/test-device-context')
      .set('x-device-id', 'invalid*chars!#$');

    expect(res.status).toBe(200);
    expect(res.body.deviceContext.deviceId).toBe('invalid-device-id');
    expect(res.body.deviceContext.isVerified).toBe(false);
  });
});
