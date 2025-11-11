const cron = require('node-cron');
const { processEndOfDayFollowUps, processRetryCallsAsync } = require('./autoCallScheduler');
const logger = require('../utils/logger');

/**
 * Cron Job Scheduler
 * Handles automated tasks on schedule
 */

let isRunning = false;

/**
 * Initialize cron jobs
 */
const initializeCronJobs = () => {
  logger.info('🕐 Initializing cron jobs...');
  
  // End-of-day follow-up processing
  // Runs at 4:00 PM every weekday (Monday-Friday)
  cron.schedule('0 16 * * 1-5', async () => {
    if (isRunning) {
      logger.warn('Follow-up processing already running, skipping...');
      return;
    }
    
    try {
      isRunning = true;
      logger.info('⏰ Cron: Starting end-of-day follow-up processing...');
      
      const results = await processEndOfDayFollowUps();
      
      logger.info('✅ Cron: End-of-day processing complete:', results);
    } catch (error) {
      logger.error('❌ Cron: Error in end-of-day processing:', error);
    } finally {
      isRunning = false;
    }
  }, {
    timezone: "Africa/Accra" // Ghana timezone
  });
  
  // Retry processing
  // Runs every 30 minutes during school hours (8 AM - 6 PM)
  cron.schedule('*/30 8-18 * * 1-5', async () => {
    try {
      logger.info('⏰ Cron: Processing retry calls...');
      
      const results = await processRetryCallsAsync();
      
      logger.info('✅ Cron: Retry processing complete:', results);
    } catch (error) {
      logger.error('❌ Cron: Error in retry processing:', error);
    }
  }, {
    timezone: "Africa/Accra"
  });
  
  logger.info('✅ Cron jobs initialized successfully');
  logger.info('📅 End-of-day processing: 4:00 PM weekdays');
  logger.info('🔄 Retry processing: Every 30 minutes (8 AM - 6 PM)');
};

/**
 * Stop all cron jobs
 */
const stopCronJobs = () => {
  logger.info('Stopping cron jobs...');
  cron.getTasks().forEach(task => task.stop());
};

module.exports = {
  initializeCronJobs,
  stopCronJobs,
};
