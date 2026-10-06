const EventEmitter = require('events');
const { logEvent } = require('./auditLogger');

class AuditEmitter extends EventEmitter {}
const auditEmitter = new AuditEmitter();

// Handle async audit log events without blocking main thread
auditEmitter.on('audit', async (eventData) => {
  try {
    await logEvent(eventData);
  } catch (err) {
    console.error('[AUDIT EMITTER ERROR]', err.message);
  }
});

module.exports = auditEmitter;
