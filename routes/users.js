const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

// GET user profile
router.get('/:userId', async (req, res, next) => {
    try {
        const userId = req.params.userId;
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(userDoc.data());
    } catch (error) {
        next(error);
    }
});

module.exports = router
