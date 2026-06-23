const express = require('express');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const { TOKEN_PRICES, WITHDRAWAL_RATES } = require('../config/constants');

const router = express.Router();

/**
 * GET /api/wallet
 * Get user's wallet balance
 */
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    
    const walletDoc = await db.collection('wallets').doc(userId).get();
    
    if (!walletDoc.exists) {
      // Create default wallet
      const defaultWallet = {
        userId,
        username: `@${userId.slice(0, 8)}`,
        chicken: 10,
        lion: 5,
        fish: 8,
        bike: 3,
        createdAt: new Date().toISOString(),
      };
      await db.collection('wallets').doc(userId).set(defaultWallet);
      return res.status(200).json(defaultWallet);
    }
    
    res.status(200).json(walletDoc.data());
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wallet/deposit
 * Add tokens (simulated purchase)
 */
router.post('/deposit', verifyToken, async (req, res, next) => {
  try {
    const { token, amount } = req.body;
    const userId = req.user.uid;
    
    if (!token || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid token or amount' });
    }
    
    const price = TOKEN_PRICES[token];
    if (!price) {
      return res.status(400).json({ error: 'Invalid token type' });
    }
    
    const walletRef = db.collection('wallets').doc(userId);
    const walletDoc = await walletRef.get();
    
    if (!walletDoc.exists) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    const currentBalance = walletDoc.data()[token] || 0;
    const newBalance = currentBalance + amount;
    
    await walletRef.update({
      [token]: newBalance,
      updatedAt: new Date().toISOString(),
    });
    
    // Record transaction
    await db.collection('transactions').add({
      userId,
      type: 'deposit',
      token,
      amount,
      cashValue: price * amount,
      timestamp: new Date().toISOString(),
    });
    
    res.status(200).json({
      success: true,
      token,
      newBalance,
      amountAdded: amount,
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wallet/withdraw
 * Withdraw tokens (cash out)
 */
router.post('/withdraw', verifyToken, async (req, res, next) => {
  try {
    const { token, amount } = req.body;
    const userId = req.user.uid;
    
    if (!token || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid token or amount' });
    }
    
    const rate = WITHDRAWAL_RATES[token];
    if (!rate) {
      return res.status(400).json({ error: 'Invalid token type' });
    }
    
    const walletRef = db.collection('wallets').doc(userId);
    const walletDoc = await walletRef.get();
    
    if (!walletDoc.exists) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    const currentBalance = walletDoc.data()[token] || 0;
    
    if (amount > currentBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    const newBalance = currentBalance - amount;
    
    await walletRef.update({
      [token]: newBalance,
      updatedAt: new Date().toISOString(),
    });
    
    // Record transaction
    await db.collection('transactions').add({
      userId,
      type: 'withdrawal',
      token,
      amount,
      cashValue: rate * amount,
      timestamp: new Date().toISOString(),
    });
    
    res.status(200).json({
      success: true,
      token,
      newBalance,
      amountWithdrawn: amount,
      cashValue: rate * amount,
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/wallet/transactions
 * Get user's transaction history
 */
router.get('/transactions', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { limit = 50 } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 50, 200);
    
    const snapshot = await db.collection('transactions')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(parsedLimit)
      .get();
    
    const transactions = [];
    snapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    res.status(200).json({ transactions });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;