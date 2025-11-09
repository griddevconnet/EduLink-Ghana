const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Please authenticate.',
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password').populate('school', 'name region district');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Token may be invalid.',
      });
    }
    
    if (!user.active) {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive. Please contact administrator.',
      });
    }
    
    // CRITICAL FIX: Use school from JWT token for authorization
    // The JWT token is the source of truth for permissions
    // Convert Mongoose document to plain object to avoid issues
    const userObj = user.toObject();
    
    // Override with JWT school if present
    if (decoded.school) {
      userObj.school = decoded.school;
    }
    
    // Attach plain user object to request
    req.user = userObj;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token. Please authenticate again.',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please login again.',
      });
    }
    
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed.',
    });
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    
    next();
  };
};

/**
 * Permission-based Authorization
 * Uses role hierarchy to check permissions
 */
const requirePermission = (minRole) => {
  const roleHierarchy = {
    teacher: 1,
    headteacher: 2,
    district_officer: 3,
    admin: 4,
    national_admin: 5,
  };
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }
    
    const userLevel = roleHierarchy[req.user.role] || 0;
    const requiredLevel = roleHierarchy[minRole] || 0;
    
    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        error: `Insufficient permissions. Minimum role required: ${minRole}`,
      });
    }
    
    next();
  };
};

/**
 * School-based Authorization
 * Ensures user can only access data from their school
 */
const requireSchoolAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.',
    });
  }
  
  // Admins and national admins can access all schools
  if (['admin', 'national_admin', 'district_officer'].includes(req.user.role)) {
    return next();
  }
  
  // Teachers and headteachers must have a school
  if (!req.user.school) {
    return res.status(403).json({
      success: false,
      error: 'No school assigned to your account.',
    });
  }
  
  // Attach school ID to request for filtering
  req.schoolId = req.user.school._id;
  next();
};

/**
 * Optional Authentication
 * Attaches user if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.active) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed:', error.message);
  }
  
  next();
};

module.exports = {
  authenticate,
  authorize,
  requirePermission,
  requireSchoolAccess,
  optionalAuth,
};
