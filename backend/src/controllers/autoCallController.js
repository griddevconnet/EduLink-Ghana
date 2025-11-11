const { processEndOfDayFollowUps, processRetryCallsAsync, getFollowUpStats } = require('../services/autoCallScheduler');
const { success } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Auto Call Controller
 * Handles automated calling endpoints
 */

/**
 * Manually trigger end-of-day follow-up processing
 * POST /api/auto-calls/process-followups
 * @access Admin, Headteacher
 */
const triggerFollowUpProcessing = async (req, res, next) => {
  try {
    logger.info('Manual trigger of follow-up processing by:', req.user.email);
    
    const results = await processEndOfDayFollowUps();
    
    success(res, results, 'Follow-up processing completed');
  } catch (error) {
    next(error);
  }
};

/**
 * Process retry calls
 * POST /api/auto-calls/process-retries
 * @access Admin, Headteacher
 */
const triggerRetryProcessing = async (req, res, next) => {
  try {
    logger.info('Manual trigger of retry processing by:', req.user.email);
    
    const results = await processRetryCallsAsync();
    
    success(res, results, 'Retry processing completed');
  } catch (error) {
    next(error);
  }
};

/**
 * Get follow-up statistics
 * GET /api/auto-calls/stats
 * @access Teacher, Headteacher, Admin
 */
const getStats = async (req, res, next) => {
  try {
    const stats = await getFollowUpStats();
    
    success(res, stats);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  triggerFollowUpProcessing,
  triggerRetryProcessing,
  getStats,
};
