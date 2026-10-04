const AuditLog = require('../models/AuditLog');

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization', 'creditcard', 'apikey', 'refreshtoken'];

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
 * Log a security or business event in an immutable, non-blocking manner
 * @param {Object} eventData
 * @param {string} eventData.eventType
 * @param {string|ObjectId|null} [eventData.actorId]
 * @param {string} [eventData.actorRole='system']
 * @param {Object} [eventData.targetEntity]
 * @param {Object} [eventData.metadata]
 * @param {string} [eventData.ipAddress='unknown']
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
    const logEntry = new AuditLog({
      eventType,
      actorId: actorId || null,
      actorRole: actorRole || (actorId ? 'customer' : 'system'),
      targetEntity: {
        entityType: targetEntity.entityType || null,
        entityId: targetEntity.entityId || null
      },
      metadata: cleanMetadata,
      ipAddress: ipAddress || 'unknown',
      timestamp: new Date()
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
 * Retrieve paginated audit logs with search filters
 * @param {Object} queryParams
 * @returns {Promise<{logs: Array, pagination: Object}>}
 */
const getAuditLogs = async (queryParams = {}) => {
  let { page = 1, limit = 20, eventType, actorId, startDate, endDate } = queryParams;

  // EC-M9-005: Limit validation and clamping
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const filter = {};

  if (eventType) {
    filter.eventType = eventType;
  }

  if (actorId) {
    filter.actorId = actorId;
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
      .sort({ timestamp: -1 })
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
  getAuditLogs,
  sanitizeMetadata
};
