const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const medicationRoutes = require('./routes/medications');
const healthRoutes = require('./routes/health');
const emergencyRoutes = require('./routes/emergency');
const brainTrainingRoutes = require('./routes/brainTraining');
const voiceRoutes = require('./routes/voice');
const sensorRoutes = require('./routes/sensors');
const notificationRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const familyRoutes = require('./routes/family');
const callRoutes = require('./routes/calls');
const geofencingRoutes = require('./routes/geofencing');
const profileRoutes = require('./routes/profile');

// Import services
const WebSocketService = require('./services/webSocketService');
// DISABLED: Automatic sensor monitoring and scheduled tasks should only run when app is active
require('./services/medicationReminderScheduler'); // Enable medication reminder scheduler

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize WebSocket service
const webSocketService = new WebSocketService(app);

// Security middleware
app.use(helmet());

// Rate limiting - DISABLED FOR TESTING
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: {
//     error: 'Too many requests from this IP, please try again later.'
//   }
// });
// app.use(limiter);

// Stricter rate limiting for auth endpoints - DISABLED FOR TESTING
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 requests per windowMs for auth
//   message: {
//     error: 'Too many authentication attempts, please try again later.'
//   }
// });

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourfrontend.com'] // Replace with your frontend URL
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:19000', 'http://localhost:19001', 'http://localhost:19002'],
  credentials: true
}));

// Body parsing middleware with custom error handling
app.use((req, res, next) => {
  // Skip JSON parsing for DELETE requests with no content-length or empty content-length
  if (req.method === 'DELETE' && (!req.get('Content-Length') || req.get('Content-Length') === '0')) {
    return next();
  }
  
  // Custom JSON parsing with better error handling
  express.json({ limit: '10mb' })(req, res, (err) => {
    if (err) {
      logger.error('JSON parsing error:', {
        error: err.message,
        body: req.body,
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
        method: req.method,
        url: req.url
      });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON data',
        details: err.message
      });
    }
    next();
  });
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Debug logging for all incoming requests and headers
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`);
  logger.info(`Headers: ${JSON.stringify(req.headers)}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Elderly Companion Backend',
    version: '1.0.0'
  });
});

// Test endpoint to verify response format
app.get('/test-response', (req, res) => {
  console.log('Test response endpoint hit');
  const testResponse = { success: true, imageUrl: 'https://example.com/test.jpg' };
  console.log('Sending test response:', testResponse);
  res.json(testResponse);
});

// API routes
app.use('/api/auth', authRoutes); // Rate limiter disabled for testing
app.use('/api/medications', medicationRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/brain-training', brainTrainingRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/geofencing', geofencingRoutes);
app.use('/api/profile', profileRoutes);

// Catch-all route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on 0.0.0.0:3000');
});


// Start server
webSocketService.server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`WebSocket server ready`);
});

module.exports = app;
