const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('phone')
      .trim()
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage('Please provide a valid phone number'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['teacher', 'headteacher', 'admin', 'district_officer', 'national_admin'])
      .withMessage('Invalid role'),
    body('school')
      .optional()
      .isMongoId()
      .withMessage('Invalid school ID'),
    validate,
  ],
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  [
    body('phone')
      .trim()
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage('Please provide a valid phone number'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  authController.login
);

/**
 * @route   POST /api/auth/verify-phone
 * @desc    Verify phone number with code
 * @access  Public
 */
router.post(
  '/verify-phone',
  [
    body('phone')
      .trim()
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage('Please provide a valid phone number'),
    body('code')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be 6 digits'),
    validate,
  ],
  authController.verifyPhone
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification code
 * @access  Public
 */
router.post(
  '/resend-verification',
  [
    body('phone')
      .trim()
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage('Please provide a valid phone number'),
    validate,
  ],
  authController.resendVerification
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/me',
  authenticate,
  [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('schoolInfo.name').optional().trim().notEmpty().withMessage('School name cannot be empty'),
    body('schoolInfo.district').optional().trim().notEmpty().withMessage('District cannot be empty'),
    body('schoolInfo.region').optional().trim(),
    body('schoolInfo.address').optional().trim(),
    validate,
  ],
  authController.updateMe
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
    validate,
  ],
  authController.changePassword
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset code
 * @access  Public
 */
router.post(
  '/forgot-password',
  [
    body('phone')
      .trim()
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage('Please provide a valid phone number'),
    validate,
  ],
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with code
 * @access  Public
 */
router.post(
  '/reset-password',
  [
    body('phone')
      .trim()
      .matches(/^\+?[0-9]{10,15}$/)
      .withMessage('Please provide a valid phone number'),
    body('code')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('Reset code must be 6 digits'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
    validate,
  ],
  authController.resetPassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

module.exports = router;
