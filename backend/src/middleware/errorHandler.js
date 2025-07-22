const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  // Default error
  let error = { message: 'Server Error' };

  // Validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, status: 400 };
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Invalid token', status: 401 };
  }

  // Duplicate key error
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, status: 400 };
  }

  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
