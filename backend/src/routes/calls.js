const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const {
  createCallLog,
  getStudentCallLogs,
  getCallLogs,
  getCallStats,
  updateCallLog,
  deleteCallLog,
} = require('../controllers/callController');
const { authenticate, authorize } = require('../middleware/auth');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/calls
 * @desc    Create a manual call log
 * @access  Teacher, Headteacher
 */
router.post(
  '/',
  authorize(['teacher', 'headteacher', 'admin']),
  [
    body('studentId').isMongoId().withMessage('Invalid student ID'),
    body('attendanceId').optional().isMongoId().withMessage('Invalid attendance ID'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('contactName').optional().trim(),
    body('result')
      .isIn(['answered', 'no_answer', 'busy', 'failed', 'rejected', 'voicemail'])
      .withMessage('Invalid call result'),
    body('durationSeconds').optional().isInt({ min: 0 }),
    body('dtmfInput').optional().trim(),
    body('dtmfMeaning')
      .optional()
      .isIn(['sick', 'travel', 'work', 'family_emergency', 'other', 'speak_to_teacher']),
    body('notes').optional().trim(),
    validate,
  ],
  createCallLog
);

/**
 * @route   GET /api/calls/student/:studentId
 * @desc    Get call logs for a specific student
 * @access  Teacher, Headteacher, Admin
 */
router.get(
  '/student/:studentId',
  authorize(['teacher', 'headteacher', 'admin', 'district_officer']),
  [
    param('studentId').isMongoId().withMessage('Invalid student ID'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  getStudentCallLogs
);

/**
 * @route   GET /api/calls/stats
 * @desc    Get call statistics
 * @access  Teacher, Headteacher, Admin
 */
router.get(
  '/stats',
  authorize(['teacher', 'headteacher', 'admin', 'district_officer']),
  [
    query('studentId').optional().isMongoId(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate,
  ],
  getCallStats
);

/**
 * @route   GET /api/calls
 * @desc    Get all call logs (with filters)
 * @access  Teacher, Headteacher, Admin
 */
router.get(
  '/',
  authorize(['teacher', 'headteacher', 'admin', 'district_officer']),
  [
    query('student').optional().isMongoId(),
    query('result').optional().isIn(['answered', 'no_answer', 'busy', 'failed', 'rejected', 'voicemail']),
    query('provider').optional().isIn(['africastalking', 'twilio', 'manual']),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  getCallLogs
);

/**
 * @route   PUT /api/calls/:id
 * @desc    Update a call log
 * @access  Teacher, Headteacher, Admin
 */
router.put(
  '/:id',
  authorize(['teacher', 'headteacher', 'admin']),
  [
    param('id').isMongoId().withMessage('Invalid call log ID'),
    body('result')
      .optional()
      .isIn(['answered', 'no_answer', 'busy', 'failed', 'rejected', 'voicemail']),
    body('durationSeconds').optional().isInt({ min: 0 }),
    body('dtmfInput').optional().trim(),
    body('dtmfMeaning')
      .optional()
      .isIn(['sick', 'travel', 'work', 'family_emergency', 'other', 'speak_to_teacher']),
    validate,
  ],
  updateCallLog
);

/**
 * @route   DELETE /api/calls/:id
 * @desc    Delete a call log
 * @access  Teacher, Headteacher, Admin
 */
router.delete(
  '/:id',
  authorize(['teacher', 'headteacher', 'admin']),
  [
    param('id').isMongoId().withMessage('Invalid call log ID'),
    validate,
  ],
  deleteCallLog
);

module.exports = router;
