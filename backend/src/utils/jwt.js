const jwt = require('jsonwebtoken');

/**
 * JWT Utility Functions
 */

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token
 * @param {String} expiresIn - Token expiration (default: 7d)
 * @returns {String} JWT token
 */
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
  });
};

/**
 * Generate access token for user
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateAccessToken = (user) => {
  const payload = {
    userId: user._id,
    role: user.role,
    phone: user.phone,
  };
  
  // Include school ID if user has a school
  if (user.school) {
    payload.school = user.school._id || user.school;
  }
  
  return generateToken(
    payload,
    process.env.JWT_EXPIRES_IN || '7d'
  );
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateRefreshToken = (user) => {
  return generateToken(
    {
      userId: user._id,
      type: 'refresh',
    },
    '30d'
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Decode JWT token without verification
 * @param {String} token - JWT token
 * @returns {Object} Decoded payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
};
