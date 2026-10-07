const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');
const auditService = require('../src/services/auditService');
const { generateToken } = require('../src/utils/token');

describe('Tamper-Evident SHA-256 Audit Chain Suite', () => {
  let admin, adminToken;

  beforeEach(async () => {
    try {
      await AuditLog.collection.deleteMany({});
    } catch (e) {}

    admin = await User.create({
      name: 'Auditor Admin',
      email: `auditor_${Date.now()}_${Math.random().toString(36).substring(7)}@fraudshield.internal`,
      passwordHash: await User.hashPassword('AdminPassword123!'),
      role: 'admin'
    });
    adminToken = generateToken({ id: admin._id, role: 'admin' });
  });

  test('TC-AUDIT-001: Sequential audit logs form linked SHA-256 cryptographic chain', async () => {
    const entry1 = await auditService.logEvent({
      eventType: 'SYSTEM_STARTUP',
      actorRole: 'system',
      metadata: { node: 'worker-1' }
    });

    const entry2 = await auditService.logEvent({
      eventType: 'CUSTOMER_ALERT_CREATED',
      actorRole: 'system',
      metadata: { alertLevel: 'HIGH' }
    });

    expect(entry1.hash).toBeDefined();
    expect(entry2.hash).toBeDefined();
    expect(entry2.previousHash).toBe(entry1.hash);
    expect(entry2.sequenceNumber).toBe(entry1.sequenceNumber + 1);
  });

  test('TC-AUDIT-002: Audit integrity verification reports valid chain via API', async () => {
    // Generate valid logs
    await auditService.logEvent({
      eventType: 'AUTH_LOGIN_SUCCESS',
      actorRole: 'admin',
      actorId: admin._id,
      metadata: { email: admin.email }
    });

    const res = await request(app)
      .get('/api/admin/audit-logs/verify')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.totalVerified).toBeGreaterThanOrEqual(1);
  });
});
