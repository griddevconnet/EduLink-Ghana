const express = require('express');
const { body, query } = require('express-validator');
const schoolController = require('../controllers/schoolController');
const { authenticate, requirePermission } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/schools
 * @desc    Create new school
 * @access  Admin only
 */
router.post(
  '/',
  requirePermission('admin'),
  [
    body('name').trim().notEmpty().withMessage('School name is required'),
    body('region')
      .notEmpty()
      .withMessage('Region is required')
      .isIn([
        'Greater Accra',
        'Ashanti',
        'Western',
        'Central',
        'Eastern',
        'Volta',
        'Northern',
        'Upper East',
        'Upper West',
        'Brong Ahafo',
        'Savannah',
        'North East',
        'Bono',
        'Bono East',
        'Ahafo',
        'Oti',
      ])
      .withMessage('Invalid region'),
    body('district').trim().notEmpty().withMessage('District is required'),
    body('address').optional().trim(),
    body('gps.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('gps.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('headteacher.name').optional().trim(),
    body('headteacher.phone')
      .optional()
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage('Invalid phone number'),
    body('headteacher.email').optional().isEmail().withMessage('Invalid email'),
    body('type')
      .optional()
      .isIn(['Primary', 'Junior High', 'Senior High', 'Combined'])
      .withMessage('Invalid school type'),
    body('ownership')
      .optional()
      .isIn(['Public', 'Private', 'Mission', 'NGO'])
      .withMessage('Invalid ownership type'),
    body('primaryLanguages')
      .optional()
      .isArray()
      .withMessage('Primary languages must be an array'),
    validate,
  ],
  schoolController.createSchool
);

/**
 * @route   GET /api/schools
 * @desc    Get all schools with filters
 * @access  Private
 */
router.get(
  '/',
  [
    query('region').optional().trim(),
    query('district').optional().trim(),
    query('type').optional().isIn(['Primary', 'Junior High', 'Senior High', 'Combined']),
    query('ownership').optional().isIn(['Public', 'Private', 'Mission', 'NGO']),
    query('active').optional().isBoolean(),
    query('search').optional().trim(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    validate,
  ],
  schoolController.getSchools
);

/**
 * @route   GET /api/schools/region/:region
 * @desc    Get schools by region
 * @access  Private
 */
router.get('/region/:region', schoolController.getSchoolsByRegion);

/**
 * @route   GET /api/schools/district/:district
 * @desc    Get schools by district
 * @access  Private
 */
router.get('/district/:district', schoolController.getSchoolsByDistrict);

/**
 * @route   GET /api/schools/:id
 * @desc    Get single school
 * @access  Private
 */
router.get('/:id', schoolController.getSchool);

/**
 * @route   GET /api/schools/:id/stats
 * @desc    Get school statistics
 * @access  Private
 */
router.get('/:id/stats', schoolController.getSchoolStats);

/**
 * @route   PUT /api/schools/:id
 * @desc    Update school
 * @access  Admin or Headteacher of the school
 */
router.put(
  '/:id',
  requirePermission('headteacher'),
  [
    body('name').optional().trim().notEmpty().withMessage('School name cannot be empty'),
    body('region')
      .optional()
      .isIn([
        'Greater Accra',
        'Ashanti',
        'Western',
        'Central',
        'Eastern',
        'Volta',
        'Northern',
        'Upper East',
        'Upper West',
        'Brong Ahafo',
        'Savannah',
        'North East',
        'Bono',
        'Bono East',
        'Ahafo',
        'Oti',
      ])
      .withMessage('Invalid region'),
    body('district').optional().trim().notEmpty().withMessage('District cannot be empty'),
    body('gps.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('gps.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('headteacher.phone')
      .optional()
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage('Invalid phone number'),
    body('headteacher.email').optional().isEmail().withMessage('Invalid email'),
    body('type')
      .optional()
      .isIn(['Primary', 'Junior High', 'Senior High', 'Combined'])
      .withMessage('Invalid school type'),
    body('ownership')
      .optional()
      .isIn(['Public', 'Private', 'Mission', 'NGO'])
      .withMessage('Invalid ownership type'),
    body('totalStudents').optional().isInt({ min: 0 }).withMessage('Total students must be non-negative'),
    body('totalTeachers').optional().isInt({ min: 0 }).withMessage('Total teachers must be non-negative'),
    validate,
  ],
  schoolController.updateSchool
);

/**
 * @route   DELETE /api/schools/:id
 * @desc    Delete school (soft delete)
 * @access  Admin only
 */
router.delete('/:id', requirePermission('admin'), schoolController.deleteSchool);

module.exports = router;
