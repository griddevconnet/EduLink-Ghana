const { Queue, Worker } = require('bullmq');
const { initiateAbsenceCall } = require('../services/callService');
const { Student, Attendance } = require('../models');
const logger = require('../utils/logger');

/**
 * Call Queue
 * Handles async call processing with BullMQ
 */

let callQueue = null;
let callWorker = null;

// Only initialize queue if Redis is available
if (process.env.REDIS_URL || process.env.REDIS_HOST) {
  try {
    // Redis connection
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    };

    // Create call queue
    callQueue = new Queue('calls', { connection });
    logger.info('Call queue initialized with Redis');
  } catch (error) {
    logger.warn('Failed to initialize call queue, running without job processing:', error.message);
    callQueue = null;
  }
} else {
  logger.warn('No Redis configuration found, running without job processing');
}

/**
 * Add absence call to queue
 * @param {String} studentId - Student ID
 * @param {String} attendanceId - Attendance ID
 * @param {Object} contact - Parent contact
 * @param {Object} options - Job options
 * @returns {Promise} Job
 */
const queueAbsenceCall = async (studentId, attendanceId, contact, options = {}) => {
  if (!callQueue) {
    logger.warn('Call queue not available, skipping absence call for student:', studentId);
    return { id: 'no-queue', status: 'skipped' };
  }

  try {
    const job = await callQueue.add(
      'absence-followup',
      {
        studentId,
        attendanceId,
        contact,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000, // 1 minute
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
        ...options,
      }
    );
    
    logger.info(`Absence call queued: Job ${job.id} for student ${studentId}`);
    
    return job;
  } catch (error) {
    logger.error('Failed to queue absence call:', error);
    throw error;
  }
};

/**
 * Add retry call to queue
 * @param {String} callLogId - Call log ID
 * @param {Number} delayMs - Delay in milliseconds
 * @returns {Promise} Job
 */
const queueRetryCall = async (callLogId, delayMs = 6 * 60 * 60 * 1000) => {
  try {
    const job = await callQueue.add(
      'retry-call',
      {
        callLogId,
      },
      {
        delay: delayMs,
        attempts: 1,
      }
    );
    
    logger.info(`Retry call queued: Job ${job.id} for call ${callLogId}`);
    
    return job;
  } catch (error) {
    logger.error('Failed to queue retry call:', error);
    throw error;
  }
};

/**
 * Add bulk calls to queue
 * @param {Array} calls - Array of call data
 * @returns {Promise} Jobs
 */
const queueBulkCalls = async (calls) => {
  try {
    const jobs = await callQueue.addBulk(
      calls.map((call) => ({
        name: 'absence-followup',
        data: call,
        opts: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 60000,
          },
        },
      }))
    );
    
    logger.info(`Bulk calls queued: ${jobs.length} jobs`);
    
    return jobs;
  } catch (error) {
    logger.error('Failed to queue bulk calls:', error);
    throw error;
  }
};

// Create worker to process jobs (only if queue exists)
if (callQueue) {
  try {
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    };

    callWorker = new Worker(
      'calls',
      async (job) => {
        logger.info(`Processing job ${job.id}: ${job.name}`);
        
        try {
          if (job.name === 'absence-followup') {
            const { studentId, attendanceId, contact } = job.data;
            
            // Get student and attendance
            const student = await Student.findById(studentId).populate('school', 'name');
            const attendance = await Attendance.findById(attendanceId);
            
            if (!student || !attendance) {
              throw new Error('Student or attendance not found');
            }
            
            // Initiate call
            const result = await initiateAbsenceCall(student, attendance, contact);
            
            if (!result.success) {
              throw new Error(result.error);
            }
            
            return result;
          } else if (job.name === 'retry-call') {
            const { callLogId } = job.data;
            
            // TODO: Implement retry logic
            logger.info(`Retrying call ${callLogId}`);
            
            return { success: true };
          }
        } catch (error) {
          logger.error(`Job ${job.id} failed:`, error);
          throw error;
        }
      },
      {
        connection,
        concurrency: 5, // Process 5 calls concurrently
      }
    );
    
    logger.info('Call worker initialized successfully');
  } catch (error) {
    logger.warn('Failed to initialize call worker:', error.message);
    callWorker = null;
  }
}

// Worker event handlers (only if worker exists)
if (callWorker) {
  callWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });

  callWorker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed:`, err);
  });

  callWorker.on('error', (err) => {
    logger.error('Worker error:', err);
  });
}

/**
 * Get queue statistics
 * @returns {Promise} Queue stats
 */
const getQueueStats = async () => {
  if (!callQueue) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      total: 0,
      status: 'queue_unavailable'
    };
  }

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      callQueue.getWaitingCount(),
      callQueue.getActiveCount(),
      callQueue.getCompletedCount(),
      callQueue.getFailedCount(),
      callQueue.getDelayedCount(),
    ]);
    
    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    throw error;
  }
};

/**
 * Pause queue
 * @returns {Promise}
 */
const pauseQueue = async () => {
  await callQueue.pause();
  logger.info('Call queue paused');
};

/**
 * Resume queue
 * @returns {Promise}
 */
const resumeQueue = async () => {
  await callQueue.resume();
  logger.info('Call queue resumed');
};

/**
 * Clear queue
 * @returns {Promise}
 */
const clearQueue = async () => {
  await callQueue.drain();
  logger.info('Call queue cleared');
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing call worker...');
  await callWorker.close();
  await callQueue.close();
});

module.exports = {
  callQueue,
  callWorker,
  queueAbsenceCall,
  queueRetryCall,
  queueBulkCalls,
  getQueueStats,
  pauseQueue,
  resumeQueue,
  clearQueue,
};
