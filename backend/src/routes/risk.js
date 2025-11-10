const express = require('express');
const router = express.Router();
const {
  calculateRiskScore,
  getRiskScore,
  getAtRiskStudents,
  bulkCalculateRiskScores,
} = require('../controllers/riskController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/risk/at-risk
 * @desc    Get all at-risk students
 * @access  Teacher, Headteacher, Admin
 */
router.get(
  '/at-risk',
  authorize(['teacher', 'headteacher', 'admin', 'district_officer']),
  getAtRiskStudents
);

/**
 * @route   POST /api/risk/calculate/:studentId
 * @desc    Calculate risk score for a specific student
 * @access  Teacher, Headteacher, Admin
 */
router.post(
  '/calculate/:studentId',
  authorize(['teacher', 'headteacher', 'admin']),
  calculateRiskScore
);

/**
 * @route   GET /api/risk/student/:studentId
 * @desc    Get risk score for a specific student
 * @access  Teacher, Headteacher, Admin
 */
router.get(
  '/student/:studentId',
  authorize(['teacher', 'headteacher', 'admin', 'district_officer']),
  getRiskScore
);

/**
 * @route   POST /api/risk/bulk-calculate
 * @desc    Bulk calculate risk scores for all students in a school
 * @access  Headteacher, Admin
 */
router.post(
  '/bulk-calculate',
  authorize(['headteacher', 'admin']),
  bulkCalculateRiskScores
);

module.exports = router;
