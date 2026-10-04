const beneficiaryService = require('../services/beneficiaryService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Add a new beneficiary
 * POST /api/beneficiaries
 */
const addBeneficiary = async (req, res, next) => {
  try {
    const { recipientEmail, nickname } = req.body;

    if (!recipientEmail) {
      return errorResponse(res, 400, 'Recipient email is required', 'MISSING_RECIPIENT');
    }

    const beneficiary = await beneficiaryService.addBeneficiary(
      req.user._id,
      recipientEmail,
      nickname
    );

    return successResponse(res, 201, 'Beneficiary added successfully', {
      beneficiary
    });
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

/**
 * List saved beneficiaries
 * GET /api/beneficiaries
 */
const getBeneficiaries = async (req, res, next) => {
  try {
    const beneficiaries = await beneficiaryService.getBeneficiaries(req.user._id);

    return successResponse(res, 200, 'Beneficiaries retrieved successfully', {
      beneficiaries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a beneficiary
 * DELETE /api/beneficiaries/:id
 */
const deleteBeneficiary = async (req, res, next) => {
  try {
    const { id } = req.params;

    await beneficiaryService.deleteBeneficiary(req.user._id, id);

    return successResponse(res, 200, 'Beneficiary removed successfully');
  } catch (error) {
    if (error.status) {
      return errorResponse(res, error.status, error.message, error.code);
    }
    next(error);
  }
};

module.exports = {
  addBeneficiary,
  getBeneficiaries,
  deleteBeneficiary
};
