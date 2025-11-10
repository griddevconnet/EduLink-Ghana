require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'EduLink Ghana API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      students: '/api/students',
      schools: '/api/schools',
      attendance: '/api/attendance',
      calls: '/api/calls',
      analytics: '/api/analytics',
    },
  });
});

// Import route modules
const authRoutes = require('./routes/auth');
const schoolRoutes = require('./routes/schools');
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');
const assessmentRoutes = require('./routes/assessments');
const riskRoutes = require('./routes/risk');
const ivrRoutes = require('./routes/ivr');
// const callRoutes = require('./routes/calls');
// const analyticsRoutes = require('./routes/analytics');

// Use route modules
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/ivr', ivrRoutes);
// app.use('/api/calls', callRoutes);
// app.use('/api/analytics', analyticsRoutes);

// Import error handlers
const { notFound, errorHandler } = require('./middleware/errorHandler');

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Connect to database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Initialize call queue (optional - only if Redis is available)
    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
      try {
        require('./jobs/callQueue');
        logger.info('📞 Call queue initialized');
      } catch (error) {
        logger.warn('Call queue not initialized (Redis may not be available):', error.message);
      }
    } else {
      logger.info('📞 Call queue disabled (no Redis configuration)');
    }
    
    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 EduLink Backend running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📞 IVR webhooks: http://localhost:${PORT}/api/ivr`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

startServer();

module.exports = app;
