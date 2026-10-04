const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Wallet = require('../src/models/Wallet');
const Transaction = require('../src/models/Transaction');
const Alert = require('../src/models/Alert');
const seedAdmin = require('../src/scripts/seedAdmin');
const config = require('../src/config');
const { connectDB, disconnectDB } = require('../src/config/db');
const { sanitizeContext, assertZeroPii } = require('../src/ai/piiSanitizer');
const geminiClient = require('../src/ai/geminiClient');

describe('Module 8: Gemini AI Investigation Assistant Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Transaction.deleteMany({});
    await Alert.deleteMany({});
    await disconnectDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await Transaction.deleteMany({});
    await Alert.deleteMany({});
    jest.restoreAllMocks();
  });

  const registerCustomer = async (name, email) => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name,
        email,
        password: 'Password123!'
      });
    return res.body.data;
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

  const createFlaggedTransaction = async () => {
    const sender = await registerCustomer('Johnathan Doe', 'john.doe@secret.com');
    const recipient = await registerCustomer('Jane Smith', 'jane.smith@secret.com');

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    await Wallet.findOneAndUpdate({ userId: senderId }, { availableBalance: 15000, heldBalance: 15000 });

    const transaction = new Transaction({
      senderId,
      recipientId,
      amount: 15000,
      currency: 'INR',
      status: 'FLAGGED_FOR_REVIEW',
      riskScore: 55,
      riskLevel: 'MEDIUM',
      triggeredRules: [
        { ruleCode: 'RULE_BENEFICIARY_NEW', weight: 30, reason: 'High transfer to newly added beneficiary' },
        { ruleCode: 'RULE_DEVICE_NEW', weight: 25, reason: 'Transaction from unrecognized device' }
      ],
      deviceContext: {
        deviceId: 'unrecognized-uuid-999',
        ipAddress: '198.51.100.42',
        userAgent: 'Secret-Browser'
      }
    });

    await transaction.save();
    return { sender, recipient, transaction };
  };

  // TC-M8-001: Admin Successfully Generates AI Brief On-Demand
  test('TC-M8-001: Admin generates structured AI brief containing summary and checklist', async () => {
    const { transaction } = await createFlaggedTransaction();
    const admin = await loginAdmin();

    // Mock Gemini model
    const mockModel = {
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify({
              caseSummary: 'The transaction involves a substantial transfer to an unfamiliar recipient from a new device.',
              riskPatterns: [
                'New beneficiary combined with unverified device suggests account takeover pattern.',
                'Transfer value significantly exceeds historical baseline.'
              ],
              investigationChecklist: [
                'Call customer on registered phone to confirm transaction authorization.',
                'Review recent password reset or device registration history.',
                'Cross-reference recipient account with known fraud lists.'
              ]
            })
        }
      })
    };
    jest.spyOn(geminiClient, 'getInvestigationModel').mockReturnValue(mockModel);

    const res = await request(app)
      .post(`/api/admin/reviews/${transaction._id}/ai-analyze`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.aiInvestigation).toBeDefined();
    expect(res.body.data.aiInvestigation.caseSummary).toContain('substantial transfer');
    expect(res.body.data.aiInvestigation.riskPatterns.length).toBe(2);
    expect(res.body.data.aiInvestigation.investigationChecklist.length).toBe(3);
    expect(res.body.data.isFallback).toBe(false);
  });

  // TC-M8-002: PII Sanitization Assertion Before External Dispatch
  test('TC-M8-002: Context dispatched to Gemini contains zero raw customer names, emails, or account IDs', async () => {
    const { sender, recipient, transaction } = await createFlaggedTransaction();

    const populatedTx = await Transaction.findById(transaction._id)
      .populate('senderId', 'name email passwordHash')
      .populate('recipientId', 'name email');

    const sanitized = sanitizeContext(populatedTx, { historyAvg: 2000, daysSinceLastActivity: 5 });
    const sanitizedString = JSON.stringify(sanitized);

    // Verify raw identity strings are absent
    const prohibitedSecrets = [
      'john.doe@secret.com',
      'jane.smith@secret.com',
      'Johnathan Doe',
      'Jane Smith',
      '198.51.100.42'
    ];

    expect(assertZeroPii(sanitizedString, prohibitedSecrets)).toBe(true);
    expect(sanitized.senderAlias).toBe('Customer_Sender');
    expect(sanitized.recipientAlias).toBe('Recipient_Beneficiary');
    expect(sanitized.senderAccountId).toMatch(/^ACC-\*\*\*/);
  });

  // TC-M8-003: Gemini API Failure Returns Graceful Fallback
  test('TC-M8-003: External Gemini API failure triggers fallback without crashing server', async () => {
    const { transaction } = await createFlaggedTransaction();
    const admin = await loginAdmin();

    // Mock Gemini API failure
    const mockModel = {
      generateContent: jest.fn().mockRejectedValue(new Error('Google API Unavailable (503)'))
    };
    jest.spyOn(geminiClient, 'getInvestigationModel').mockReturnValue(mockModel);

    const res = await request(app)
      .post(`/api/admin/reviews/${transaction._id}/ai-analyze`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.aiInvestigation.isFallback).toBe(true);
    expect(res.body.data.aiInvestigation.caseSummary).toBeDefined();
    expect(res.body.data.aiInvestigation.investigationChecklist.length).toBeGreaterThan(0);
  });

  // TC-M8-004: Request Timeout Exceeding 5,000ms Triggers Fallback
  test('TC-M8-004: Gemini call exceeding timeout threshold returns graceful fallback', async () => {
    const { transaction } = await createFlaggedTransaction();
    const admin = await loginAdmin();

    // Mock Gemini API delay beyond timeout
    const mockModel = {
      generateContent: jest.fn().mockImplementation(() => {
        return new Promise((resolve) => setTimeout(resolve, 6000));
      })
    };
    jest.spyOn(geminiClient, 'getInvestigationModel').mockReturnValue(mockModel);

    // Speed up test by advancing timers or testing fallback logic directly
    const res = await request(app)
      .post(`/api/admin/reviews/${transaction._id}/ai-analyze`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.aiInvestigation.isFallback).toBe(true);
  }, 10000);

  // TC-M8-005: Customer Blocked from Invoking AI Assistant
  test('TC-M8-005: Customer role is blocked from calling AI investigation endpoint with 403', async () => {
    const { sender, transaction } = await createFlaggedTransaction();

    const res = await request(app)
      .post(`/api/admin/reviews/${transaction._id}/ai-analyze`)
      .set('Authorization', `Bearer ${sender.token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // TC-M8-006: Advisory-Only Guarantee (AI Cannot Mutate State)
  test('TC-M8-006: AI analysis has ZERO impact on transaction status, risk score, or wallet balances', async () => {
    const { sender, recipient, transaction } = await createFlaggedTransaction();
    const admin = await loginAdmin();

    const senderId = sender.user._id || sender.user.id;
    const recipientId = recipient.user._id || recipient.user.id;

    // Check pre-call state
    const preTx = await Transaction.findById(transaction._id);
    const preSenderWallet = await Wallet.findOne({ userId: senderId });
    const preRecipientWallet = await Wallet.findOne({ userId: recipientId });

    // Execute AI analysis
    const res = await request(app)
      .post(`/api/admin/reviews/${transaction._id}/ai-analyze`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(res.status).toBe(200);

    // Check post-call state
    const postTx = await Transaction.findById(transaction._id);
    const postSenderWallet = await Wallet.findOne({ userId: senderId });
    const postRecipientWallet = await Wallet.findOne({ userId: recipientId });

    // Invariants strictly preserved
    expect(postTx.status).toBe(preTx.status); // Strictly FLAGGED_FOR_REVIEW
    expect(postTx.riskScore).toBe(preTx.riskScore); // Strictly 55
    expect(postSenderWallet.availableBalance).toBe(preSenderWallet.availableBalance);
    expect(postSenderWallet.heldBalance).toBe(preSenderWallet.heldBalance);
    expect(postRecipientWallet.availableBalance).toBe(preRecipientWallet.availableBalance);
  });
});
