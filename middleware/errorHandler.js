const { logger } = require('../utils/logger');

/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      error: 'File too large. Max size: 10MB',
      code: 'FILE_TOO_LARGE'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ 
      error: 'Unexpected file field',
      code: 'UNEXPECTED_FILE'
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: err.message,
      code: 'VALIDATION_ERROR'
    });
  }
  
  // S3 errors
  if (err.name === 'NoSuchKey') {
    return res.status(404).json({ 
      error: 'File not found in storage',
      code: 'FILE_NOT_FOUND'
    });
  }
  
  // Firebase errors
  if (err.code && err.code.startsWith('auth/')) {
    return res.status(401).json({ 
      error: err.message,
      code: err.code
    });
  }
  
  // Firestore errors
  if (err.code === 'permission-denied') {
    return res.status(403).json({ 
      error: 'Permission denied',
      code: 'PERMISSION_DENIED'
    });
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(statusCode).json({ 
    error: message,
    code: err.code || 'INTERNAL_ERROR'
  });
}

/**
 * 404 handler
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({ 
    error: `Route not found: ${req.method} ${req.url}`,
    code: 'ROUTE_NOT_FOUND'
  });
}

module.exports = { errorHandler, notFoundHandler };