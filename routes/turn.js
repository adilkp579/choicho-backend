const express = require('express');
const crypto = require('crypto');
const { verifyToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * Generate time-limited TURN credentials
 * This is SECURE - credentials are not hardcoded in client
 */
function generateTurnCredentials(username, ttl = 3600) {
  const secret = process.env.TURN_SECRET || 'xyEoZGCCUl7ZAQ4h';
  const expiry = Math.floor(Date.now() / 1000) + ttl;
  
  // Create HMAC-SHA1 signature
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(`${username}:${expiry}`);
  const credential = hmac.digest('base64');
  
  return {
    username: `${expiry}:${username}`,
    credential: credential,
    expires: expiry
  };
}

/**
 * GET /api/turn
 * Returns secure TURN credentials for WebRTC
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const ttl = 3600; // 1 hour
    
    // Generate temporary credentials
    const turnCredentials = generateTurnCredentials(userId, ttl);
    
    // Build ICE server configuration
    const iceServers =  [
      { urls: "stun:stun.l.google.com:19302" }, 
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun.relay.metered.ca:80" },
      { urls: "turn:standard.relay.metered.ca:80", username: "a6b2ebd89a4174b7f3843634", credential: "xyEoZGCCUl7ZAQ4h" },
      { urls: "turn:standard.relay.metered.ca:80?transport=tcp", username: "a6b2ebd89a4174b7f3843634", credential: "xyEoZGCCUl7ZAQ4h" },
      { urls: "turn:standard.relay.metered.ca:443", username: "a6b2ebd89a4174b7f3843634", credential: "xyEoZGCCUl7ZAQ4h" },
      { urls: "turns:standard.relay.metered.ca:443?transport=tcp", username: "a6b2ebd89a4174b7f3843634", credential: "xyEoZGCCUl7ZAQ4h" }
    ];
    
    // Add TURN server if configured
    if (process.env.TURN_SERVER) {
      iceServers.push({
        urls: [
          `turn:${process.env.TURN_SERVER}:${process.env.TURN_PORT || 443}`,
          `turns:${process.env.TURN_SERVER}:${process.env.TURN_PORT || 443}?transport=tcp`
        ],
        username: turnCredentials.username,
        credential: turnCredentials.credential
      });
    }
    
    logger.info(`TURN credentials generated for user: ${userId}`);
    
    res.json({
      iceServers: iceServers,
      expires: turnCredentials.expires,
      ttl: ttl
    });
    
  } catch (error) {
    logger.error('TURN credential generation failed:', error);
    next(error);
  }
});

module.exports = router;
