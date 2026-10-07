const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const Transaction = require('../src/models/Transaction');
const AuditLog = require('../src/models/AuditLog');
const { generateToken } = require('../src/utils/token');

describe('SOC Case Management & Forensic Timeline Suite', () => {
  let admin, analyst, customer, customer2, adminToken, analystToken, flaggedTx;

  beforeEach(async () => {
    const defaultHash = await User.hashPassword('Password123!');
    admin = await User.create({
      name: 'SOC Lead Admin',
      email: `admin_${Date.now()}_${Math.random().toString(36).substring(7)}@fraudshield.internal`,
      passwordHash: defaultHash,
      role: 'admin'
    });

    analyst = await User.create({
      name: 'SOC Analyst Jane',
      email: `analyst_${Date.now()}_${Math.random().toString(36).substring(7)}@fraudshield.internal`,
      passwordHash: defaultHash,
      role: 'admin'
    });

    customer = await User.create({
      name: 'Customer Dave',
      email: `dave_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
      passwordHash: defaultHash,
      role: 'customer'
    });

    customer2 = await User.create({
      name: 'Customer Eve',
      email: `eve_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
      passwordHash: defaultHash,
      role: 'customer'
    });

    adminToken = generateToken({ id: admin._id, role: 'admin' });
    analystToken = generateToken({ id: analyst._id, role: 'admin' });

    flaggedTx = await Transaction.create({
      senderId: customer._id,
      recipientId: customer2._id,
      amount: 45000,
      status: 'FLAGGED_FOR_REVIEW',
      riskScore: 55,
      riskLevel: 'MEDIUM',
      caseStatus: 'UNASSIGNED',
      casePriority: 'P3_MEDIUM',
      triggeredRules: [
        {
          ruleCode: 'RULE_VELOCITY_HIGH',
          weight: 25,
          reason: 'Hourly velocity threshold exceeded'
        }
      ],
      attributionWaterfall: [
        {
          ruleCode: 'RULE_VELOCITY_HIGH',
          points: 25,
          reason: 'Hourly velocity threshold exceeded',
          metric: '1-Hour Transaction Count',
          observedValue: '4 transactions',
          baselineValue: 'Max 3 / hr',
          deviation: '133% of hourly ceiling',
          severity: 'HIGH'
        }
      ]
    });
  });

  test('TC-SOC-001: Analyst claims review case and updates status to CLAIMED', async () => {
    const res = await request(app)
      .post(`/api/admin/reviews/${flaggedTx._id}/claim`)
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction.caseStatus).toBe('CLAIMED');
    expect(res.body.data.transaction.assignedAnalyst._id.toString()).toBe(analyst._id.toString());

    // Another analyst trying to claim the already claimed case should be rejected
    const secondClaimRes = await request(app)
      .post(`/api/admin/reviews/${flaggedTx._id}/claim`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(secondClaimRes.status).toBe(409);
    expect(secondClaimRes.body.error.code).toBe('CASE_ALREADY_CLAIMED');
  });

  test('TC-SOC-002: Assigned analyst can append investigation notes', async () => {
    // First claim
    await request(app)
      .post(`/api/admin/reviews/${flaggedTx._id}/claim`)
      .set('Authorization', `Bearer ${analystToken}`);

    const res = await request(app)
      .post(`/api/admin/reviews/${flaggedTx._id}/notes`)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ note: 'Contacted customer regarding rapid transfer frequency.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction.caseStatus).toBe('UNDER_INVESTIGATION');
    expect(res.body.data.transaction.investigationNotes.length).toBe(1);
    expect(res.body.data.transaction.investigationNotes[0].note).toBe(
      'Contacted customer regarding rapid transfer frequency.'
    );
  });

  test('TC-SOC-003: Analyst can release claimed case back to UNASSIGNED queue', async () => {
    // Claim first
    await request(app)
      .post(`/api/admin/reviews/${flaggedTx._id}/claim`)
      .set('Authorization', `Bearer ${analystToken}`);

    const res = await request(app)
      .post(`/api/admin/reviews/${flaggedTx._id}/release`)
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction.caseStatus).toBe('UNASSIGNED');
    expect(res.body.data.transaction.assignedAnalyst).toBeNull();
  });

  test('TC-SOC-004: Case timeline returns correlated attack-chain forensic steps', async () => {
    // Log an audit event
    await AuditLog.create({
      eventType: 'AUTH_LOGIN_SUCCESS',
      actorId: customer._id,
      actorRole: 'customer',
      metadata: { ipAddress: '192.168.1.100' }
    });

    const res = await request(app)
      .get(`/api/admin/reviews/${flaggedTx._id}/timeline`)
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.timeline)).toBe(true);
    expect(res.body.data.timeline.length).toBeGreaterThanOrEqual(1);
  });
});
