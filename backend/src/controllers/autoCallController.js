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
 * @access Teacher, Headteacher, Admin
 */
const triggerFollowUpProcessing = async (req, res, next) => {
  try {
    logger.info('Manual trigger of follow-up processing by:', req.user.phone || req.user.email);
    
    const results = await processEndOfDayFollowUps();
    
    // Format response for consistency
    const response = {
      totalProcessed: results.total || 0,
      successfulCalls: results.successful || 0,
      failedCalls: results.failed || 0,
      skipped: results.skipped || 0,
      details: results.details || [],
      errors: results.errors || [],
    };
    
    success(res, response, 'Follow-up processing completed');
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
    const { Attendance } = require('../models');
    
    // Get aggregate stats
    const stats = await getFollowUpStats();
    
    // Get list of students needing follow-up
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const students = await Attendance.find({
      date: today,
      status: 'absent',
      followUpRequired: true,
      followUpCompleted: false,
      callTriggered: false,
    })
      .populate('student', 'firstName lastName')
      .populate('school', 'name')
      .lean();
    
    // Format student data
    const studentList = students.map(record => ({
      attendanceId: record._id,
      studentId: record.student?._id,
      studentName: `${record.student?.firstName} ${record.student?.lastName}`,
      schoolName: record.school?.name,
      absentDate: record.date,
      followUpRequired: record.followUpRequired,
      callTriggered: record.callTriggered,
    }));
    
    success(res, {
      ...stats,
      pendingFollowUps: studentList.length,
      students: studentList,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  triggerFollowUpProcessing,
  triggerRetryProcessing,
  getStats,
};
