const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization', 'creditcard', 'apikey', 'refreshtoken'];
const GENESIS_HASH = 'GENESIS_HASH_FRAUDSHIELD_ROOT';

/**
 * Recursively sanitize metadata to remove sensitive credentials
 * @param {Object} data
 * @returns {Object}
 */
const sanitizeMetadata = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeMetadata);

  const sanitized = {};
  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (val && typeof val === 'object') {
      sanitized[key] = sanitizeMetadata(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
};

/**
 * Compute deterministic SHA-256 hash for audit record chaining
 * @param {string} previousHash
 * @param {number} sequenceNumber
 * @param {Date|string} timestamp
 * @param {string} eventType
 * @param {string|null} actorId
 * @param {string} actorRole
 * @param {Object} targetEntity
 * @param {Object} metadata
 * @param {string} ipAddress
 * @returns {string}
 */
const computeAuditHash = (
  previousHash,
  sequenceNumber,
  timestamp,
  eventType,
  actorId,
  actorRole,
  targetEntity = {},
  metadata = {},
  ipAddress = 'unknown'
) => {
  const tsIso = new Date(timestamp).toISOString();
  const actId = actorId ? actorId.toString() : '';
  const tgtType = targetEntity?.entityType || '';
  const tgtId = targetEntity?.entityId ? targetEntity.entityId.toString() : '';
  const metaStr = JSON.stringify(metadata || {});
  const ip = ipAddress || 'unknown';

  const canonical = `${previousHash}|${sequenceNumber}|${tsIso}|${eventType}|${actId}|${actorRole}|${tgtType}|${tgtId}|${metaStr}|${ip}`;
  return crypto.createHash('sha256').update(canonical).digest('hex');
};

/**
 * Log a security or business event with cryptographic SHA-256 hash chaining
 * @param {Object} eventData
 * @returns {Promise<AuditLog|null>}
 */
const logEvent = async ({
  eventType,
  actorId = null,
  actorRole = 'system',
  targetEntity = {},
  metadata = {},
  ipAddress = 'unknown'
}) => {
  try {
    const cleanMetadata = sanitizeMetadata(metadata);
    const now = new Date();

    // 1. Fetch latest record to construct cryptographic hash chain
    const latest = await AuditLog.findOne().sort({ sequenceNumber: -1 });
    const sequenceNumber = latest && typeof latest.sequenceNumber === 'number' ? latest.sequenceNumber + 1 : 1;
    const previousHash = latest && latest.hash ? latest.hash : GENESIS_HASH;

    // 2. Compute canonical SHA-256 seal
    const hash = computeAuditHash(
      previousHash,
      sequenceNumber,
      now,
      eventType,
      actorId,
      actorRole || (actorId ? 'customer' : 'system'),
      targetEntity,
      cleanMetadata,
      ipAddress
    );

    const logEntry = new AuditLog({
      sequenceNumber,
      previousHash,
      hash,
      eventType,
      actorId: actorId || null,
      actorRole: actorRole || (actorId ? 'customer' : 'system'),
      targetEntity: {
        entityType: targetEntity.entityType || null,
        entityId: targetEntity.entityId || null
      },
      metadata: cleanMetadata,
      ipAddress: ipAddress || 'unknown',
      timestamp: now
    });

    await logEntry.save();
    return logEntry;
  } catch (err) {
    // EC-M9-001: Non-blocking resilience — log to console, do not throw or crash caller
    console.error('[AUDIT LOG ERROR] Failed to record audit event:', err.message);
    return null;
  }
};

/**
 * Verify cryptographic hash-chain integrity of the tamper-evident audit ledger
 * @returns {Promise<Object>}
 */
const verifyAuditIntegrity = async () => {
  const logs = await AuditLog.find().sort({ sequenceNumber: 1 });
  const tamperedRecords = [];

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    // Check 1: Chain link verification (previousHash must match preceding hash)
    if (log.previousHash !== expectedPrevHash) {
      tamperedRecords.push({
        sequenceNumber: log.sequenceNumber,
        recordId: log._id,
        error: 'PREVIOUS_HASH_MISMATCH',
        storedPreviousHash: log.previousHash,
        expectedPreviousHash: expectedPrevHash
      });
    }

    // Check 2: Payload hash verification (recomputed hash must match stored hash)
    const recomputed = computeAuditHash(
      log.previousHash,
      log.sequenceNumber,
      log.timestamp,
      log.eventType,
      log.actorId,
      log.actorRole,
      log.targetEntity,
      log.metadata,
      log.ipAddress
    );

    if (log.hash && log.hash !== recomputed) {
      tamperedRecords.push({
        sequenceNumber: log.sequenceNumber,
        recordId: log._id,
        error: 'CANONICAL_HASH_MISMATCH',
        storedHash: log.hash,
        recomputedHash: recomputed
      });
    }

    expectedPrevHash = log.hash || recomputed;
  }

  return {
    isValid: tamperedRecords.length === 0,
    totalVerified: logs.length,
    tamperedCount: tamperedRecords.length,
    tamperedRecords,
    lastVerifiedHash: logs.length > 0 ? logs[logs.length - 1].hash : GENESIS_HASH,
    verifiedAt: new Date().toISOString()
  };
};

/**
 * Retrieve paginated audit logs with search filters
 * @param {Object} queryParams
 * @returns {Promise<{logs: Array, pagination: Object}>}
 */
const getAuditLogs = async (queryParams = {}) => {
  let { page = 1, limit = 20, eventType, actorId, entityId, startDate, endDate } = queryParams;

  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const filter = {};

  if (eventType) {
    filter.eventType = eventType;
  }

  if (actorId) {
    filter.actorId = actorId;
  }

  if (entityId) {
    filter['targetEntity.entityId'] = entityId;
  }

  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) {
      filter.timestamp.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.timestamp.$lte = new Date(endDate);
    }
  }

  const skip = (page - 1) * limit;

  const [logs, totalCount] = await Promise.all([
    AuditLog.find(filter)
      .sort({ sequenceNumber: -1, timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actorId', 'name email role'),
    AuditLog.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    logs,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      limit
    }
  };
};

module.exports = {
  logEvent,
  verifyAuditIntegrity,
  getAuditLogs,
  sanitizeMetadata,
  computeAuditHash,
  GENESIS_HASH
};
