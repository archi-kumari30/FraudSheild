const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

/**
 * Service to correlate and construct a chronological attack-chain forensic timeline
 * for an analyst investigating a suspicious transaction.
 */

/**
 * Get unified forensic attack-chain timeline for a transaction
 * @param {string|ObjectId} transactionId
 * @returns {Promise<Object>}
 */
const getTransactionTimeline = async (transactionId) => {
  if (!mongoose.Types.ObjectId.isValid(transactionId)) {
    const error = new Error('Invalid transaction ID');
    error.status = 400;
    error.code = 'INVALID_ID';
    throw error;
  }

  const transaction = await Transaction.findById(transactionId)
    .populate('senderId', 'name email')
    .populate('recipientId', 'name email')
    .populate('assignedAnalyst', 'name email')
    .populate('resolvedBy', 'name email');

  if (!transaction) {
    const error = new Error('Transaction record not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const senderId = transaction.senderId?._id || transaction.senderId;
  const txCreatedAt = new Date(transaction.createdAt);

  // Time window: 48 hours prior to transaction up to 24 hours after or now
  const windowStart = new Date(txCreatedAt.getTime() - 48 * 60 * 60 * 1000);
  const windowEnd = new Date(Math.max(Date.now(), txCreatedAt.getTime() + 24 * 60 * 60 * 1000));

  // 1. Fetch relevant audit log events
  const auditEvents = await AuditLog.find({
    $or: [
      { actorId: senderId, timestamp: { $gte: windowStart, $lte: windowEnd } },
      { 'targetEntity.entityId': transaction._id },
      { 'metadata.transactionId': transaction._id.toString() }
    ]
  }).sort({ timestamp: 1 });

  // 2. Fetch recent prior transactions from this sender in window
  const priorTxs = await Transaction.find({
    senderId,
    _id: { $ne: transaction._id },
    createdAt: { $gte: windowStart, $lte: txCreatedAt }
  }).sort({ createdAt: 1 });

  const timelineEvents = [];

  // Map audit log events to timeline entries
  for (const log of auditEvents) {
    let category = 'SYSTEM';
    let severity = 'INFO';
    let title = log.eventType;
    let description = '';
    let riskDelta = null;

    switch (log.eventType) {
      case 'AUTH_LOGIN_SUCCESS':
        category = 'AUTH';
        severity = 'INFO';
        title = 'User Authentication Succeeded';
        description = `Customer signed in successfully from IP ${log.ipAddress || 'unknown'}.`;
        break;

      case 'AUTH_LOGIN_FAILURE':
        category = 'AUTH';
        severity = 'HIGH';
        title = 'Authentication Failure';
        description = `Failed login attempt (${log.metadata?.reason || 'Invalid Credentials'}).`;
        break;

      case 'NEW_DEVICE_DETECTED':
        category = 'DEVICE';
        severity = 'HIGH';
        title = 'Unrecognized Device Access';
        description = `Transaction originated from unrecognized device identifier: ${log.metadata?.deviceId || 'unknown'}.`;
        riskDelta = '+25';
        break;

      case 'DEVICE_REVOKED':
        category = 'DEVICE';
        severity = 'MEDIUM';
        title = 'Device Revoked by User';
        description = `Customer explicitly revoked device ${log.metadata?.deviceId || ''}.`;
        break;

      case 'BENEFICIARY_ADDED':
        category = 'BENEFICIARY';
        severity = 'MEDIUM';
        title = 'New Beneficiary Added';
        description = `Recipient "${log.metadata?.nickname || 'Account'}" added to address book.`;
        break;

      case 'TRANSACTION_INITIATED':
        category = 'PAYMENT';
        severity = 'INFO';
        title = 'Payment Transfer Initiated';
        description = `Transfer of ₹${(log.metadata?.amount || transaction.amount).toLocaleString('en-IN')} submitted.`;
        break;

      case 'FRAUD_EVALUATION_COMPLETED':
        category = 'FRAUD_ENGINE';
        severity = log.metadata?.riskLevel === 'HIGH' ? 'CRITICAL' : log.metadata?.riskLevel === 'MEDIUM' ? 'HIGH' : 'LOW';
        title = `Fraud Engine Evaluation: ${log.metadata?.riskLevel || transaction.riskLevel} (${log.metadata?.riskScore || transaction.riskScore}/100)`;
        description = `Rules triggered: ${((log.metadata?.triggeredRules || []).map((r) => r.ruleCode || r).join(', ')) || 'None (Normal)'}. Outcome: ${log.metadata?.outcome || transaction.status}.`;
        riskDelta = `Score: ${log.metadata?.riskScore || transaction.riskScore}`;
        break;

      case 'ALERT_GENERATED':
        category = 'ALERT';
        severity = log.metadata?.severity === 'HIGH' ? 'CRITICAL' : 'HIGH';
        title = 'Security Alert Dispatched';
        description = `In-app customer & SOC notification generated (${log.metadata?.severity || 'MEDIUM'} severity).`;
        break;

      case 'CUSTOMER_VERIFICATION_ATTEMPT':
        category = 'CUSTOMER_ACTION';
        severity = 'INFO';
        title = 'Customer Verification Initiated';
        description = 'Customer submitted confirmation response for held funds.';
        break;

      case 'CUSTOMER_VERIFIED':
        category = 'CUSTOMER_ACTION';
        severity = 'LOW';
        title = 'Customer Self-Verified Payment';
        description = 'Customer confirmed authorization of transaction. Released from escrow.';
        break;

      case 'CUSTOMER_VERIFICATION_BLOCKED':
        category = 'FRAUD_ENGINE';
        severity = 'CRITICAL';
        title = 'Payment Blocked Post-Verification';
        description = 'Secondary security re-evaluation detected high-risk signals; funds refunded.';
        break;

      case 'TRANSACTION_ESCALATED_TO_ADMIN':
        category = 'SOC_ACTION';
        severity = 'CRITICAL';
        title = 'Customer Escalated: "Unauthorized Activity"';
        description = `Customer reported transfer was unauthorized: "${log.metadata?.reason || 'Unauthorized'}". Moved to SOC review queue.`;
        break;

      case 'ADMIN_REVIEW_CLAIMED':
        category = 'SOC_ACTION';
        severity = 'INFO';
        title = 'Case Claimed by Analyst';
        description = `SOC Analyst claimed investigation ticket. SLA timer started.`;
        break;

      case 'ADMIN_REVIEW_NOTE_ADDED':
        category = 'SOC_ACTION';
        severity = 'INFO';
        title = 'Investigation Note Appended';
        description = log.metadata?.notePreview || 'Analyst recorded case notes.';
        break;

      case 'ADMIN_REVIEW_APPROVED':
        category = 'SOC_ACTION';
        severity = 'LOW';
        title = 'SOC Review Decision: APPROVED';
        description = `Analyst approved release of escrow funds: "${log.metadata?.notes || 'Approved'}".`;
        break;

      case 'ADMIN_REVIEW_REJECTED':
        category = 'SOC_ACTION';
        severity = 'CRITICAL';
        title = 'SOC Review Decision: REJECTED';
        description = `Analyst declined transaction and refunded sender: "${log.metadata?.notes || 'Rejected'}".`;
        break;

      case 'DISPUTE_CREATED':
        category = 'DISPUTE';
        severity = 'HIGH';
        title = 'Post-Settlement Dispute Raised';
        description = `Sender opened dispute: "${log.metadata?.reason || 'Dispute'}".`;
        break;

      case 'DISPUTE_REFUND_PROCESSED':
        category = 'DISPUTE';
        severity = 'CRITICAL';
        title = 'Dispute Resolved: Refund Credited';
        description = `Admin executed dispute refund of ₹${(log.metadata?.amount || 0).toLocaleString('en-IN')}.`;
        break;

      default:
        category = 'SYSTEM';
        title = log.eventType.replace(/_/g, ' ');
        description = JSON.stringify(log.metadata || {});
    }

    timelineEvents.push({
      id: `audit-${log._id}`,
      timestamp: log.timestamp,
      category,
      severity,
      title,
      description,
      ipAddress: log.ipAddress || 'unknown',
      actorRole: log.actorRole,
      riskDelta
    });
  }

  // Include prior failed transactions if not already in audit log
  for (const pTx of priorTxs) {
    if (pTx.status === 'BLOCKED') {
      const alreadyHas = timelineEvents.some(
        (e) => Math.abs(new Date(e.timestamp).getTime() - new Date(pTx.createdAt).getTime()) < 1000
      );
      if (!alreadyHas) {
        timelineEvents.push({
          id: `tx-${pTx._id}`,
          timestamp: pTx.createdAt,
          category: 'PAYMENT',
          severity: 'HIGH',
          title: 'Prior High-Risk Payment Blocked',
          description: `Previous transfer attempt of ₹${pTx.amount.toLocaleString('en-IN')} was blocked (Score: ${pTx.riskScore}/100).`,
          ipAddress: pTx.deviceContext?.ipAddress || 'unknown',
          actorRole: 'customer',
          riskDelta: 'Prior Block'
        });
      }
    }
  }

  // Ensure current transaction initiation is represented if missing from audit
  const hasTxInit = timelineEvents.some((e) => e.title === 'Payment Transfer Initiated');
  if (!hasTxInit) {
    timelineEvents.push({
      id: `tx-init-${transaction._id}`,
      timestamp: txCreatedAt,
      category: 'PAYMENT',
      severity: 'INFO',
      title: 'Payment Transfer Initiated',
      description: `Transfer of ₹${transaction.amount.toLocaleString('en-IN')} submitted to ${transaction.recipientId?.name || 'Recipient'}.`,
      ipAddress: transaction.deviceContext?.ipAddress || 'unknown',
      actorRole: 'customer',
      riskDelta: null
    });
  }

  // Sort strictly ascending
  timelineEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return {
    transactionId: transaction._id,
    currentStatus: transaction.status,
    amount: transaction.amount,
    riskScore: transaction.riskScore,
    riskLevel: transaction.riskLevel,
    sender: {
      id: senderId,
      name: transaction.senderId?.name || 'Unknown',
      email: transaction.senderId?.email || 'Unknown'
    },
    recipient: {
      id: transaction.recipientId?._id || transaction.recipientId,
      name: transaction.recipientId?.name || 'Unknown',
      email: transaction.recipientId?.email || 'Unknown'
    },
    caseDetails: {
      caseStatus: transaction.caseStatus || 'UNASSIGNED',
      casePriority: transaction.casePriority || 'P3_MEDIUM',
      assignedAnalyst: transaction.assignedAnalyst ? {
        id: transaction.assignedAnalyst._id,
        name: transaction.assignedAnalyst.name,
        email: transaction.assignedAnalyst.email
      } : null,
      claimedAt: transaction.claimedAt,
      slaDeadline: transaction.slaDeadline
    },
    eventsCount: timelineEvents.length,
    timeline: timelineEvents
  };
};

module.exports = {
  getTransactionTimeline
};
