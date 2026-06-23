const { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } = require('../config/constants');

/**
 * Validate file type
 */
function validateFileType(file, type) {
  if (type === 'image') {
    return ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  }
  if (type === 'video') {
    return ALLOWED_VIDEO_TYPES.includes(file.mimetype);
  }
  return false;
}

/**
 * Validate username
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') return false;
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

/**
 * Validate email
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password (min 6 chars)
 */
function validatePassword(password) {
  return password && password.length >= 6;
}

/**
 * Sanitize string input
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

module.exports = {
  validateFileType,
  validateUsername,
  validateEmail,
  validatePassword,
  sanitizeString,
};