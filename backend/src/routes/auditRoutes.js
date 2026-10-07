const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// All audit log endpoints are strictly admin-only
router.use(authenticateToken, authorizeRole(['admin']));

router.get('/verify', auditController.verifyIntegrity);
router.get('/', auditController.getAuditLogs);

module.exports = router;
