const express = require('express');
const beneficiaryController = require('../controllers/beneficiaryController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', beneficiaryController.getBeneficiaries);
router.post('/', beneficiaryController.addBeneficiary);
router.delete('/:id', beneficiaryController.deleteBeneficiary);

module.exports = router;
