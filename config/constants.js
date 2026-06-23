module.exports = {
  // ============================================
  // TOKEN ECONOMY
  // ============================================
  TOKEN_PRICES: {
    chicken: parseFloat(process.env.TOKEN_PRICE_CHICKEN) || 1.00,
    lion: parseFloat(process.env.TOKEN_PRICE_LION) || 2.00,
    fish: parseFloat(process.env.TOKEN_PRICE_FISH) || 0.50,
    bike: parseFloat(process.env.TOKEN_PRICE_BIKE) || 3.00,
  },
  
  WITHDRAWAL_RATES: {
    chicken: parseFloat(process.env.WITHDRAWAL_RATE_CHICKEN) || 0.80,
    lion: parseFloat(process.env.WITHDRAWAL_RATE_LION) || 1.60,
    fish: parseFloat(process.env.WITHDRAWAL_RATE_FISH) || 0.40,
    bike: parseFloat(process.env.WITHDRAWAL_RATE_BIKE) || 2.40,
  },
  
  TOKEN_EMOJIS: {
    chicken: '🍗',
    lion: '🦁',
    fish: '🐟',
    bike: '🏍️',
  },
  
  VALID_TOKENS: ['chicken', 'lion', 'fish', 'bike'],
  
  // ============================================
  // FILE UPLOAD LIMITS
  // ============================================
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB) || 10,
  MAX_FILE_SIZE_BYTES: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024,
  
  ALLOWED_IMAGE_TYPES: (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp,image/gif').split(','),
  ALLOWED_VIDEO_TYPES: (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/webm').split(','),
  
  // ============================================
  // PAGINATION
  // ============================================
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // ============================================
  // RATE LIMITING
  // ============================================
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  RATE_LIMIT_UPLOAD_MAX: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX) || 50,
  
  // ============================================
  // JWT
  // ============================================
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-this',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
  
  // ============================================
  // MESSAGE LIMITS
  // ============================================
  MAX_MESSAGE_LENGTH: 500,
  MAX_USERNAME_LENGTH: 30,
  MIN_PASSWORD_LENGTH: 6,
};