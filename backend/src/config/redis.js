const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis = null;

// Only create Redis connection if URL is provided
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redis.on('error', (err) => {
      logger.error('Redis connection error:', err);
      // Don't crash the app, just log the error
    });

    redis.on('close', () => {
      logger.warn('Redis connection closed');
    });
  } catch (error) {
    logger.warn('Redis not available, running without cache');
    redis = null;
  }
} else {
  logger.warn('No REDIS_URL provided, running without cache');
}

module.exports = redis;
