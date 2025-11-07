const express = require('express');
const { body, query } = require('express-validator');
const studentController = require('../controllers/studentController');
const { authenticate, requirePermission } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/students/out-of-school
 * @desc    Get out-of-school children (UNICEF requirement)
 * @access  Private
 */
router.get(
  '/out-of-school',
  [
    query('region').optional().trim(),
    query('district').optional().trim(),
    query('gender').optional().isIn(['Male', 'Female', 'Other']),
    query('disabilityStatus').optional().isIn(['None', 'Visual', 'Hearing', 'Physical', 'Cognitive', 'Multiple']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  studentController.getOutOfSchoolChildren
);

/**
 * @route   GET /api/students/stats/disaggregated
 * @desc    Get disaggregated student statistics (UNICEF requirement)
 * @access  Private
 */
router.get('/stats/disaggregated', studentController.getDisaggregatedStats);

/**
 * @route   POST /api/students
 * @desc    Create new student
 * @access  Teacher, Headteacher, Admin
 */
router.post(
  '/',
  requirePermission('teacher'),
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('otherNames').optional().trim(),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
    body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
    body('disabilityStatus')
      .optional()
      .isIn(['None', 'Visual', 'Hearing', 'Physical', 'Cognitive', 'Multiple'])
      .withMessage('Invalid disability status'),
    body('disabilityDetails').optional().trim(),
    body('school').optional().isMongoId().withMessage('Invalid school ID'),
    body('schoolName').optional().trim().notEmpty().withMessage('School name is required when no school ID provided'),
    body('schoolLocation').optional().trim(),
    body('district').optional().trim(),
    body('region').optional().trim(),
    body('class').optional().trim(),
    body('studentId').optional().trim(),
    body('enrollmentStatus')
      .optional()
      .isIn(['enrolled', 'never_enrolled', 'dropped_out'])
      .withMessage('Invalid enrollment status'),
    body('enrollmentDate').optional().isISO8601().withMessage('Invalid enrollment date'),
    body('dropoutReason')
      .optional()
      .isIn([
        'Poverty',
        'Child Labor',
        'Early Marriage',
        'Pregnancy',
        'Migration',
        'Disability',
        'Distance to School',
        'Lack of Interest',
        'Family Issues',
        'Health Issues',
        'Other',
      ])
      .withMessage('Invalid dropout reason'),
    body('locationType')
      .optional()
      .isIn(['Urban', 'Rural', 'Remote'])
      .withMessage('Invalid location type'),
    body('homeGPS.latitude').optional().isFloat({ min: -90, max: 90 }),
    body('homeGPS.longitude').optional().isFloat({ min: -180, max: 180 }),
    body('community').optional().trim(),
    body('parentContacts').isArray({ min: 1 }).withMessage('At least one parent contact is required'),
    body('parentContacts.*.phone')
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage('Valid phone number is required'),
    body('parentContacts.*.relation')
      .isIn(['Mother', 'Father', 'Guardian', 'Sibling', 'Other'])
      .withMessage('Invalid relation'),
    body('parentContacts.*.name').optional().trim(),
    body('parentContacts.*.preferredLanguage')
      .optional()
      .isIn(['English', 'Twi', 'Ewe', 'Ga', 'Dagbani', 'Hausa', 'Gonja', 'Fante', 'Nzema']),
    body('parentContacts.*.isProxy').optional().isBoolean(),
    body('registrationSource')
      .optional()
      .isIn(['School', 'Community Outreach', 'District Office', 'Mobile App']),
    body('notes').optional().trim(),
    body('specialNeeds')
      .optional()
      .isArray()
      .withMessage('Special needs must be an array'),
    validate,
  ],
  studentController.createStudent
);

/**
 * @route   GET /api/students
 * @desc    Get all students with filters
 * @access  Private
 */
router.get(
  '/',
  [
    query('school').optional().isMongoId().withMessage('Invalid school ID'),
    query('enrollmentStatus').optional().isIn(['enrolled', 'never_enrolled', 'dropped_out']),
    query('gender').optional().isIn(['Male', 'Female', 'Other']),
    query('disabilityStatus').optional().isIn(['None', 'Visual', 'Hearing', 'Physical', 'Cognitive', 'Multiple']),
    query('locationType').optional().isIn(['Urban', 'Rural', 'Remote']),
    query('class').optional().trim(),
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    validate,
  ],
  studentController.getStudents
);

/**
 * @route   GET /api/students/:id
 * @desc    Get single student
 * @access  Private
 */
router.get('/:id', studentController.getStudent);

/**
 * @route   PUT /api/students/:id
 * @desc    Update student
 * @access  Teacher, Headteacher, Admin
 */
router.put(
  '/:id',
  requirePermission('teacher'),
  [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth'),
    body('gender').optional().isIn(['Male', 'Female', 'Other']),
    body('disabilityStatus')
      .optional()
      .isIn(['None', 'Visual', 'Hearing', 'Physical', 'Cognitive', 'Multiple']),
    body('school').optional().isMongoId().withMessage('Invalid school ID'),
    body('enrollmentStatus')
      .optional()
      .isIn(['enrolled', 'never_enrolled', 'dropped_out']),
    body('dropoutDate').optional().isISO8601().withMessage('Invalid dropout date'),
    body('locationType').optional().isIn(['Urban', 'Rural', 'Remote']),
    body('homeGPS.latitude').optional().isFloat({ min: -90, max: 90 }),
    body('homeGPS.longitude').optional().isFloat({ min: -180, max: 180 }),
    body('parentContacts').optional().isArray(),
    validate,
  ],
  studentController.updateStudent
);

/**
 * @route   POST /api/students/:id/verify-contact
 * @desc    Verify parent contact
 * @access  Teacher, Headteacher, Admin
 */
router.post(
  '/:id/verify-contact',
  requirePermission('teacher'),
  [
    body('contactId').notEmpty().withMessage('Contact ID is required'),
    validate,
  ],
  studentController.verifyParentContact
);

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete student (soft delete)
 * @access  Teacher, Headteacher, Admin
 */
router.delete('/:id', requirePermission('teacher'), studentController.deleteStudent);

module.exports = router;
