/**
 * Standardized API Response Utilities
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {String} message - Success message
 * @param {Number} statusCode - HTTP status code
 */
const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Created response (201)
 * @param {Object} res - Express response object
 * @param {Object} data - Created resource
 * @param {String} message - Success message
 */
const created = (res, data, message = 'Resource created successfully') => {
  return success(res, data, message, 201);
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {String} error - Error message
 * @param {Number} statusCode - HTTP status code
 * @param {Object} details - Additional error details
 */
const error = (res, error, statusCode = 500, details = null) => {
  const response = {
    success: false,
    error,
  };
  
  if (details) {
    response.details = details;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Bad request response (400)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Object} details - Validation details
 */
const badRequest = (res, message = 'Bad request', details = null) => {
  return error(res, message, 400, details);
};

/**
 * Unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

/**
 * Forbidden response (403)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403);
};

/**
 * Not found response (404)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @param {Number} total - Total items
 */
const paginated = (res, data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
};

module.exports = {
  success,
  created,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  paginated,
};
