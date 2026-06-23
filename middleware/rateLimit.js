const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_UPLOAD_MAX } = require('../config/constants');

// General API rate limiter
const rateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: { 
    error: 'Too many requests, please try again later',
    retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) + ' seconds'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});

// Stricter limiter for uploads
const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: RATE_LIMIT_UPLOAD_MAX || 50,
  message: { 
    error: 'Upload limit exceeded. Try again later.',
    retryAfter: '1 hour'
  },
});

// Chat message rate limiter
const chatRateLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 10, // 10 messages per 10 seconds
  message: { 
    error: 'Slow down! Too many messages.',
    retryAfter: '10 seconds'
  },
});

module.exports = { rateLimiter, uploadRateLimiter, chatRateLimiter };