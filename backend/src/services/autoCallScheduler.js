const { Attendance, Student, CallLog } = require('../models');
const { initiateAbsenceCall } = require('./callService');
const logger = require('../utils/logger');

/**
 * Auto Call Scheduler
 * Handles automated follow-up calls for absent students
 */

/**
 * Process pending follow-ups and trigger AI calls
 * Should run at end of school day (e.g., 4:00 PM)
 */
const processEndOfDayFollowUps = async () => {
  try {
    logger.info('🤖 Starting end-of-day follow-up processing...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find all absences from today that need follow-up
    const pendingFollowUps = await Attendance.find({
      date: today,
      status: 'absent',
      followUpRequired: true,
      followUpCompleted: false,
      callTriggered: false, // Haven't triggered automated call yet
    })
    .populate('student', 'firstName lastName parentContacts')
    .populate('school', 'name');
    
    logger.info(`Found ${pendingFollowUps.length} students needing follow-up calls`);
    
    const results = {
      total: pendingFollowUps.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      details: [],
    };
    
    for (const attendance of pendingFollowUps) {
      try {
        // Check if teacher already made a manual call
        const existingCall = await CallLog.findOne({
          student: attendance.student._id,
          attendance: attendance._id,
        });
        
        if (existingCall) {
          logger.info(`Skipping ${attendance.student.firstName} - teacher already called`);
          results.skipped++;
          
          // Mark as call triggered to avoid future auto-calls
          attendance.callTriggered = true;
          await attendance.save();
          continue;
        }
        
        // Get primary parent contact
        const student = attendance.student;
        const primaryContact = student.parentContacts?.[0];
        
        if (!primaryContact || !primaryContact.phone) {
          logger.warn(`No contact info for ${student.firstName} ${student.lastName}`);
          results.skipped++;
          continue;
        }
        
        // Initiate automated call
        logger.info(`📞 Initiating automated call for ${student.firstName} ${student.lastName}`);
        
        const callResult = await initiateAbsenceCall(
          student,
          attendance,
          primaryContact
        );
        
        if (callResult.success) {
          results.successful++;
          
          // Mark call as triggered
          attendance.callTriggered = true;
          await attendance.save();
          
          results.details.push({
            student: `${student.firstName} ${student.lastName}`,
            phone: primaryContact.phone,
            status: 'success',
            callId: callResult.callId,
          });
          
          logger.info(`✅ Call initiated successfully for ${student.firstName}`);
        } else {
          results.failed++;
          results.errors.push({
            student: `${student.firstName} ${student.lastName}`,
            error: callResult.error,
          });
          
          results.details.push({
            student: `${student.firstName} ${student.lastName}`,
            phone: primaryContact.phone,
            status: 'failed',
            error: callResult.error,
          });
          
          logger.error(`❌ Call failed for ${student.firstName}:`, callResult.error);
        }
        
        // Add delay between calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        
      } catch (error) {
        results.failed++;
        results.errors.push({
          student: attendance.student ? 
            `${attendance.student.firstName} ${attendance.student.lastName}` : 
            'Unknown',
          error: error.message,
        });
        
        logger.error('Error processing follow-up:', error);
      }
    }
    
    logger.info('🎉 End-of-day follow-up processing complete:', results);
    
    return results;
  } catch (error) {
    logger.error('Fatal error in end-of-day processing:', error);
    throw error;
  }
};

/**
 * Check if it's time to run end-of-day processing
 * @returns {Boolean}
 */
const shouldRunEndOfDayProcessing = () => {
  const now = new Date();
  const hour = now.getHours();
  
  // Run between 4:00 PM and 5:00 PM (16:00 - 17:00)
  return hour >= 16 && hour < 17;
};

/**
 * Process retry calls for failed attempts
 * Should run periodically throughout the day
 */
const processRetryCallsAsync = async () => {
  try {
    logger.info('🔄 Processing retry calls...');
    
    const now = new Date();
    
    // Find calls that need retry
    const retryCalls = await CallLog.find({
      result: { $in: ['no_answer', 'busy', 'failed'] },
      attemptNumber: { $lt: 3 }, // Max 3 attempts
      retryScheduled: false,
      $or: [
        { retryAt: { $lte: now } },
        { retryAt: null },
      ],
    })
    .populate('student', 'firstName lastName parentContacts')
    .populate('attendance');
    
    logger.info(`Found ${retryCalls.length} calls to retry`);
    
    for (const callLog of retryCalls) {
      try {
        // Schedule retry (will be picked up by next run)
        callLog.retryScheduled = true;
        callLog.retryAt = new Date(now.getTime() + 30 * 60 * 1000); // Retry in 30 minutes
        await callLog.save();
        
        logger.info(`Scheduled retry for call ${callLog._id}`);
      } catch (error) {
        logger.error('Error scheduling retry:', error);
      }
    }
    
    return { processed: retryCalls.length };
  } catch (error) {
    logger.error('Error processing retry calls:', error);
    throw error;
  }
};

/**
 * Get follow-up statistics
 */
const getFollowUpStats = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = await Attendance.aggregate([
      {
        $match: {
          date: today,
          status: 'absent',
        },
      },
      {
        $group: {
          _id: null,
          totalAbsences: { $sum: 1 },
          followUpRequired: {
            $sum: { $cond: ['$followUpRequired', 1, 0] },
          },
          followUpCompleted: {
            $sum: { $cond: ['$followUpCompleted', 1, 0] },
          },
          callTriggered: {
            $sum: { $cond: ['$callTriggered', 1, 0] },
          },
        },
      },
    ]);
    
    const result = stats[0] || {
      totalAbsences: 0,
      followUpRequired: 0,
      followUpCompleted: 0,
      callTriggered: 0,
    };
    
    result.pending = result.followUpRequired - result.followUpCompleted - result.callTriggered;
    
    return result;
  } catch (error) {
    logger.error('Error getting follow-up stats:', error);
    throw error;
  }
};

module.exports = {
  processEndOfDayFollowUps,
  shouldRunEndOfDayProcessing,
  processRetryCallsAsync,
  getFollowUpStats,
};
