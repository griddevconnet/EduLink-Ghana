const express = require('express');
const { body, query } = require('express-validator');
const assessmentController = require('../controllers/assessmentController');
const { authenticate, requirePermission } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/assessments
 * @desc    Create learning assessment
 * @access  Teacher, Headteacher
 */
router.post(
  '/',
  requirePermission('teacher'),
  [
    body('student').isMongoId().withMessage('Valid student ID is required'),
    body('school').isMongoId().withMessage('Valid school ID is required'),
    body('assessmentDate').optional().isISO8601().withMessage('Invalid date format'),
    body('literacyLevel')
      .optional()
      .isIn(['below_benchmark', 'meeting_benchmark', 'exceeding_benchmark', 'not_assessed'])
      .withMessage('Invalid literacy level'),
    body('literacyScore').optional().isInt({ min: 0, max: 100 }).withMessage('Score must be 0-100'),
    body('numeracyLevel')
      .optional()
      .isIn(['below_benchmark', 'meeting_benchmark', 'exceeding_benchmark', 'not_assessed'])
      .withMessage('Invalid numeracy level'),
    body('numeracyScore').optional().isInt({ min: 0, max: 100 }).withMessage('Score must be 0-100'),
    body('assessmentType')
      .optional()
      .isIn(['quick_check', 'formal_test', 'observation', 'parent_report'])
      .withMessage('Invalid assessment type'),
    body('classLevel').optional().trim(),
    body('teacherNotes').optional().trim(),
    body('recommendations').optional().isArray(),
    validate,
  ],
  assessmentController.createAssessment
);

/**
 * @route   GET /api/assessments/intervention-needed
 * @desc    Get students needing intervention
 * @access  Private
 */
router.get(
  '/intervention-needed',
  [
    query('school').optional().isMongoId().withMessage('Invalid school ID'),
    validate,
  ],
  assessmentController.getInterventionNeeded
);

/**
 * @route   GET /api/assessments/stats/disaggregated
 * @desc    Get disaggregated learning outcomes (UNICEF requirement)
 * @access  Private
 */
router.get(
  '/stats/disaggregated',
  [
    query('school').optional().isMongoId().withMessage('Invalid school ID'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    validate,
  ],
  assessmentController.getDisaggregatedOutcomes
);

/**
 * @route   GET /api/assessments/student/:studentId
 * @desc    Get assessment history for a student
 * @access  Private
 */
router.get('/student/:studentId', assessmentController.getStudentAssessments);

/**
 * @route   GET /api/assessments/school/:schoolId/summary
 * @desc    Get school assessment summary
 * @access  Private
 */
router.get(
  '/school/:schoolId/summary',
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    validate,
  ],
  assessmentController.getSchoolSummary
);

/**
 * @route   GET /api/assessments
 * @desc    Get assessments with filters
 * @access  Private
 */
router.get(
  '/',
  [
    query('school').optional().isMongoId().withMessage('Invalid school ID'),
    query('student').optional().isMongoId().withMessage('Invalid student ID'),
    query('literacyLevel')
      .optional()
      .isIn(['below_benchmark', 'meeting_benchmark', 'exceeding_benchmark', 'not_assessed']),
    query('numeracyLevel')
      .optional()
      .isIn(['below_benchmark', 'meeting_benchmark', 'exceeding_benchmark', 'not_assessed']),
    query('overallLevel')
      .optional()
      .isIn(['below_benchmark', 'meeting_benchmark', 'exceeding_benchmark', 'not_assessed']),
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  assessmentController.getAssessments
);

/**
 * @route   PUT /api/assessments/:id
 * @desc    Update assessment
 * @access  Teacher, Headteacher
 */
router.put(
  '/:id',
  requirePermission('teacher'),
  [
    body('literacyLevel')
      .optional()
      .isIn(['below_benchmark', 'meeting_benchmark', 'exceeding_benchmark', 'not_assessed']),
    body('literacyScore').optional().isInt({ min: 0, max: 100 }),
    body('numeracyLevel')
      .optional()
      .isIn(['below_benchmark', 'meeting_benchmark', 'exceeding_benchmark', 'not_assessed']),
    body('numeracyScore').optional().isInt({ min: 0, max: 100 }),
    body('teacherNotes').optional().trim(),
    body('recommendations').optional().isArray(),
    body('followUpCompleted').optional().isBoolean(),
    body('followUpDate').optional().isISO8601(),
    validate,
  ],
  assessmentController.updateAssessment
);

/**
 * @route   DELETE /api/assessments/:id
 * @desc    Delete assessment
 * @access  Admin only
 */
router.delete('/:id', requirePermission('admin'), assessmentController.deleteAssessment);

module.exports = router;
