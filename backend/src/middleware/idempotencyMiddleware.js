const crypto = require('crypto');
const IdempotencyRecord = require('../models/IdempotencyRecord');
const { errorResponse } = require('../utils/apiResponse');

const TTL_HOURS = 24;

/**
 * Deterministically hash request components (method, path, body)
 * @param {string} method
 * @param {string} path
 * @param {Object} body
 * @returns {string}
 */
const computeRequestHash = (method, path, body = {}) => {
  const canonical = `${method.toUpperCase()}:${path.toLowerCase()}:${JSON.stringify(body || {})}`;
  return crypto.createHash('sha256').update(canonical).digest('hex');
};

/**
 * Idempotency middleware for critical payment & financial endpoints.
 * Compliant with IETF HTTP Idempotency-Key draft specifications.
 */
const idempotencyMiddleware = async (req, res, next) => {
  const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

  // If client did not provide an idempotency key, proceed normally
  if (!idempotencyKey) {
    return next();
  }

  const trimmedKey = String(idempotencyKey).trim();

  // Validate key format (must be between 8 and 128 characters)
  if (trimmedKey.length < 8 || trimmedKey.length > 128) {
    return errorResponse(
      res,
      400,
      'Idempotency-Key must be between 8 and 128 characters long',
      'INVALID_IDEMPOTENCY_KEY'
    );
  }

  const userId = req.user ? req.user._id : null;
  if (!userId) {
    return next();
  }

  const requestHash = computeRequestHash(req.method, req.originalUrl || req.url, req.body);
  const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);

  try {
    // 1. Check if a record already exists for this user + key
    let existingRecord = await IdempotencyRecord.findOne({ userId, key: trimmedKey });

    if (existingRecord) {
      // Conflicting payload check: Same key reused with different request payload
      if (existingRecord.requestHash !== requestHash) {
        return errorResponse(
          res,
          409,
          'Idempotency key already used with a different request.',
          'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH'
        );
      }

      // Concurrency check: Request with same key is currently running
      if (existingRecord.status === 'IN_PROGRESS') {
        return errorResponse(
          res,
          409,
          'A request with this idempotency key is currently being processed. Please wait.',
          'IDEMPOTENCY_IN_PROGRESS'
        );
      }

      // Replay completed response
      if (existingRecord.status === 'COMPLETED') {
        res.setHeader('X-Idempotent-Replay', 'true');
        return res.status(existingRecord.responseStatus).json(existingRecord.responseBody);
      }
    }

    // 2. Insert new IN_PROGRESS idempotency lock
    let lockRecord;
    try {
      lockRecord = new IdempotencyRecord({
        key: trimmedKey,
        userId,
        requestHash,
        status: 'IN_PROGRESS',
        expiresAt
      });
      await lockRecord.save();
    } catch (insertError) {
      // Race condition: another thread inserted between findOne and save
      if (insertError.code === 11000) {
        const concurrent = await IdempotencyRecord.findOne({ userId, key: trimmedKey });
        if (concurrent && concurrent.status === 'COMPLETED' && concurrent.requestHash === requestHash) {
          res.setHeader('X-Idempotent-Replay', 'true');
          return res.status(concurrent.responseStatus).json(concurrent.responseBody);
        }
        return errorResponse(
          res,
          409,
          'A request with this idempotency key is currently being processed.',
          'IDEMPOTENCY_IN_PROGRESS'
        );
      }
      throw insertError;
    }

    // 3. Intercept res.json to capture response payload
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const statusCode = res.statusCode;

      // Update idempotency record asynchronously
      if (statusCode < 500) {
        // Cache success and deterministic client results (including 400 Blocked)
        IdempotencyRecord.updateOne(
          { _id: lockRecord._id },
          {
            $set: {
              status: 'COMPLETED',
              responseStatus: statusCode,
              responseBody: body
            }
          }
        ).catch((err) => {
          console.error('[IDEMPOTENCY ERROR] Failed to cache idempotency response:', err.message);
        });
      } else {
        // On 500 internal server error, delete the lock so client can retry safely
        IdempotencyRecord.deleteOne({ _id: lockRecord._id }).catch(() => {});
      }

      return originalJson(body);
    };

    next();
  } catch (error) {
    console.error('[IDEMPOTENCY MIDDLEWARE ERROR]:', error.message);
    next(error);
  }
};

module.exports = idempotencyMiddleware;
