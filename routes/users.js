const express = require("express");
const router = express.Router();

const { db } = require("../config/firebase");
const { verifyToken } = require("../middleware/auth");
const { logger } = require("../utils/logger");

// Authentication required for all routes
router.use(verifyToken);

/**
 * GET Public User Profile
 * GET /api/users/:userId
 */
router.get("/:userId", async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Validate Firebase UID length
        if (
            !userId ||
            typeof userId !== "string" ||
            userId.length < 20 ||
            userId.length > 128
        ) {
            return res.status(400).json({
                error: "Invalid user id"
            });
        }

        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        const user = userDoc.data();

        // Only return public profile fields
        const publicProfile = {
            uid: userId,
            username: user.username || "",
            displayName: user.displayName || "",
            profileImage: user.profileImage || "",
            bio: user.bio || "",
            verified: !!user.verified,
            followers: Number(user.followers || 0),
            following: Number(user.following || 0),
            posts: Number(user.posts || 0),
            lastSeen: user.lastSeen || null
        };

        logger.info(
            `User ${req.user.uid} viewed profile ${userId}`
        );

        return res.status(200).json(publicProfile);

    } catch (error) {
        logger.error("Users route error:", error);
        next(error);
    }
});

module.exports = router;
