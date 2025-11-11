const express = require('express');
const router = express.Router();
const {
  triggerFollowUpProcessing,
  triggerRetryProcessing,
  getStats,
} = require('../controllers/autoCallController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/auto-calls/process-followups
 * @desc    Manually trigger end-of-day follow-up processing
 * @access  Headteacher, Admin
 */
router.post(
  '/process-followups',
  authorize('headteacher', 'admin'),
  triggerFollowUpProcessing
);

/**
 * @route   POST /api/auto-calls/process-retries
 * @desc    Process retry calls for failed attempts
 * @access  Headteacher, Admin
 */
router.post(
  '/process-retries',
  authorize('headteacher', 'admin'),
  triggerRetryProcessing
);

/**
 * @route   GET /api/auto-calls/stats
 * @desc    Get follow-up call statistics
 * @access  Teacher, Headteacher, Admin
 */
router.get(
  '/stats',
  authorize('teacher', 'headteacher', 'admin', 'district_officer'),
  getStats
);

module.exports = router;
