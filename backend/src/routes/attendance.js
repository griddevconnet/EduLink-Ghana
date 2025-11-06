const express = require('express');
const { body, query } = require('express-validator');
const attendanceController = require('../controllers/attendanceController');
const { authenticate, requirePermission } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/attendance
 * @desc    Mark attendance for a student
 * @access  Teacher, Headteacher
 */
router.post(
  '/',
  requirePermission('teacher'),
  [
    body('student').isMongoId().withMessage('Valid student ID is required'),
    body('school').isMongoId().withMessage('Valid school ID is required'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('status')
      .isIn(['present', 'absent', 'excused', 'late'])
      .withMessage('Invalid attendance status'),
    body('reason')
      .optional()
      .isIn([
        'sick',
        'travel',
        'family_emergency',
        'work',
        'migration',
        'weather',
        'transport',
        'other',
        'unknown',
      ])
      .withMessage('Invalid absence reason'),
    body('reasonDetails').optional().trim(),
    body('notes').optional().trim(),
    validate,
  ],
  attendanceController.markAttendance
);

/**
 * @route   POST /api/attendance/bulk
 * @desc    Bulk mark attendance
 * @access  Teacher, Headteacher
 */
router.post(
  '/bulk',
  requirePermission('teacher'),
  [
    body('school').isMongoId().withMessage('Valid school ID is required'),
    body('date').optional().isISO8601().withMessage('Invalid date format'),
    body('records').isArray({ min: 1 }).withMessage('Records array is required'),
    body('records.*.student').isMongoId().withMessage('Valid student ID is required'),
    body('records.*.status')
      .isIn(['present', 'absent', 'excused', 'late'])
      .withMessage('Invalid status'),
    validate,
  ],
  attendanceController.bulkMarkAttendance
);

/**
 * @route   GET /api/attendance/follow-up
 * @desc    Get attendance records needing follow-up
 * @access  Private
 */
router.get(
  '/follow-up',
  [
    query('school').optional().isMongoId().withMessage('Invalid school ID'),
    validate,
  ],
  attendanceController.getFollowUpRequired
);

/**
 * @route   GET /api/attendance/stats/absences
 * @desc    Get absence statistics
 * @access  Private
 */
router.get(
  '/stats/absences',
  [
    query('school').optional().isMongoId().withMessage('Invalid school ID'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    validate,
  ],
  attendanceController.getAbsenceStats
);

/**
 * @route   GET /api/attendance/student/:studentId
 * @desc    Get attendance for a specific student
 * @access  Private
 */
router.get(
  '/student/:studentId',
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    validate,
  ],
  attendanceController.getStudentAttendance
);

/**
 * @route   GET /api/attendance/school/:schoolId/date/:date
 * @desc    Get school attendance for a specific date
 * @access  Private
 */
router.get('/school/:schoolId/date/:date', attendanceController.getSchoolAttendanceByDate);

/**
 * @route   GET /api/attendance
 * @desc    Get attendance records with filters
 * @access  Private
 */
router.get(
  '/',
  [
    query('school').optional().isMongoId().withMessage('Invalid school ID'),
    query('student').optional().isMongoId().withMessage('Invalid student ID'),
    query('status').optional().isIn(['present', 'absent', 'excused', 'late']),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('followUpRequired').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  attendanceController.getAttendance
);

/**
 * @route   POST /api/attendance/:id/complete-followup
 * @desc    Mark follow-up as complete
 * @access  Teacher, Headteacher
 */
router.post(
  '/:id/complete-followup',
  requirePermission('teacher'),
  [
    body('reason')
      .optional()
      .isIn([
        'sick',
        'travel',
        'family_emergency',
        'work',
        'migration',
        'weather',
        'transport',
        'other',
        'unknown',
      ]),
    body('reasonDetails').optional().trim(),
    validate,
  ],
  attendanceController.completeFollowUp
);

/**
 * @route   PUT /api/attendance/:id
 * @desc    Update attendance record
 * @access  Teacher, Headteacher
 */
router.put(
  '/:id',
  requirePermission('teacher'),
  [
    body('status')
      .optional()
      .isIn(['present', 'absent', 'excused', 'late'])
      .withMessage('Invalid status'),
    body('reason')
      .optional()
      .isIn([
        'sick',
        'travel',
        'family_emergency',
        'work',
        'migration',
        'weather',
        'transport',
        'other',
        'unknown',
      ]),
    body('reasonDetails').optional().trim(),
    body('notes').optional().trim(),
    validate,
  ],
  attendanceController.updateAttendance
);

module.exports = router;
