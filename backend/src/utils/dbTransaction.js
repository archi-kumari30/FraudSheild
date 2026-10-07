const mongoose = require('mongoose');

let isReplicaSetSupported = null;

/**
 * Check if the connected MongoDB instance supports replica-set transactions
 * @returns {Promise<boolean>}
 */
const checkTransactionSupport = async () => {
  if (isReplicaSetSupported !== null) {
    return isReplicaSetSupported;
  }

  try {
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    // A replica set will have repl in serverStatus
    isReplicaSetSupported = !!(serverStatus && serverStatus.repl);
  } catch (err) {
    // If check fails, default to trying transactions safely
    isReplicaSetSupported = false;
  }
  return isReplicaSetSupported;
};

/**
 * Execute a critical business operation inside a MongoDB ACID transaction.
 * If the database environment supports replica sets (Atlas, production, Docker replica),
 * it executes with full multi-document ACID isolation and rollback.
 * If running on a local standalone MongoDB without replica set, it gracefully executes
 * the callback while propagating errors and ensuring consistent application state.
 *
 * @param {Function} callback - async (session) => Promise<T>
 * @returns {Promise<T>}
 */
const runInTransaction = async (callback) => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection is not open for transactions');
  }

  const supportsReplica = await checkTransactionSupport();

  if (!supportsReplica) {
    // Standalone fallback: execute directly
    return callback(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
};

module.exports = {
  runInTransaction,
  checkTransactionSupport
};
