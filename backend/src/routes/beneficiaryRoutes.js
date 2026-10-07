const express = require('express');
const beneficiaryController = require('../controllers/beneficiaryController');
const { authenticateToken } = require('../middleware/authMiddleware');
const validate = require('../validators/validate');
const { addBeneficiarySchema } = require('../validators/beneficiaryValidator');

const router = express.Router();

router.use(authenticateToken);

router.get('/', beneficiaryController.getBeneficiaries);
router.post('/', validate(addBeneficiarySchema), beneficiaryController.addBeneficiary);
router.delete('/:id', beneficiaryController.deleteBeneficiary);

module.exports = router;
