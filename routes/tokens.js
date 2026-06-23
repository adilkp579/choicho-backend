const express = require('express');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/tokens/transfer
 * Transfer token gift between users
 */
router.post('/transfer', verifyToken, async (req, res, next) => {
  try {
    const { receiverUid, tokenType, amount, senderUsername, receiverUsername } = req.body;
    const senderUid = req.user.uid;
    
    if (!receiverUid || !tokenType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const participants = [senderUid, receiverUid];
    
    // Record transfer
    const transferData = {
      senderUid,
      receiverUid,
      tokenType,
      amount: amount || 1,
      senderUsername: senderUsername || `@${senderUid.slice(0, 8)}`,
      receiverUsername: receiverUsername || `@${receiverUid.slice(0, 8)}`,
      participants,
      timestamp: new Date().toISOString(),
    };
    
    await db.collection('token_transfers').add(transferData);
    
    res.status(200).json({
      success: true,
      transferId: Date.now(),
      ...transferData,
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tokens/transfers
 * Get user's token transfer history
 */
router.get('/transfers', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { limit = 50 } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 50, 200);
    
    const snapshot = await db.collection('token_transfers')
      .where('participants', 'array-contains', userId)
      .orderBy('timestamp', 'desc')
      .limit(parsedLimit)
      .get();
    
    const transfers = [];
    snapshot.forEach(doc => {
      transfers.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    res.status(200).json({ transfers });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;