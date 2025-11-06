/**
 * Middleware Index
 * Central export for all middleware
 */

const { authenticate, authorize, requirePermission, requireSchoolAccess, optionalAuth } = require('./auth');
const validate = require('./validate');
const { errorHandler, notFound } = require('./errorHandler');

module.exports = {
  // Auth middleware
  authenticate,
  authorize,
  requirePermission,
  requireSchoolAccess,
  optionalAuth,
  
  // Validation
  validate,
  
  // Error handling
  errorHandler,
  notFound,
};
