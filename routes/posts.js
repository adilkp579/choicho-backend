const express = require('express');
const { db } = require('../config/firebase');
const { verifyToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/posts
 * Get posts with pagination
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { limit = 20, lastDoc } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 20, 100);
    
    let query = db.collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(parsedLimit);
    
    if (lastDoc) {
      const lastDocSnapshot = await db.collection('posts').doc(lastDoc).get();
      if (lastDocSnapshot.exists) {
        query = query.startAfter(lastDocSnapshot);
      }
    }
    
    const snapshot = await query.get();
    
    const posts = [];
    snapshot.forEach(doc => {
      posts.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? new Date(doc.data().createdAt).toISOString() : null,
      });
    });
    
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    
    res.status(200).json({
      posts,
      lastDoc: lastVisible ? lastVisible.id : null,
      hasMore: snapshot.docs.length === parsedLimit,
    });
    
  } catch (error) {
    console.error('Get posts error:', error);
    next(error);
  }
});

/**
 * GET /api/posts/user/:username
 * Get posts by specific user
 */
router.get('/user/:username', optionalAuth, async (req, res, next) => {
  try {
    const { username } = req.params;
    const { limit = 20 } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 20, 100);
    
    const snapshot = await db.collection('posts')
      .where('username', '==', username)
      .orderBy('createdAt', 'desc')
      .limit(parsedLimit)
      .get();
    
    const posts = [];
    snapshot.forEach(doc => {
      posts.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? new Date(doc.data().createdAt).toISOString() : null,
      });
    });
    
    res.status(200).json({ posts });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/posts
 * Create a new post
 */
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { username, type, data, s3Key, caption } = req.body;
    const userId = req.user.uid;
    
    if (!data || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const postData = {
      userId,
      username: username || `@${userId.slice(0, 8)}`,
      type: type === 'reel' ? 'reel' : 'image',
      data,
      s3Key,
      caption: caption || '',
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
    };
    
    const docRef = await db.collection('posts').add(postData);
    
    // Update user's posts array
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const posts = userData.posts || [];
      posts.unshift({
        id: docRef.id,
        type: postData.type,
        src: postData.data,
        s3Key,
        caption: postData.caption,
        createdAt: postData.createdAt,
        likes: 0,
      });
      await userRef.update({ posts });
    }
    
    res.status(201).json({
      success: true,
      postId: docRef.id,
      ...postData,
    });
    
  } catch (error) {
    console.error('Create post error:', error);
    next(error);
  }
});

/**
 * PUT /api/posts/:postId/like
 * Like or unlike a post
 */
router.put('/:postId/like', verifyToken, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { liked } = req.body;
    
    const postRef = db.collection('posts').doc(postId);
    const increment = liked ? 1 : -1;
    
    await postRef.update({
      likes: db.firestore.FieldValue.increment(increment),
    });
    
    res.status(200).json({ success: true, liked });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/posts/:postId/comments
 * Get comments for a post
 */
router.get('/:postId/comments', async (req, res, next) => {
  try {
    const { postId } = req.params;
    
    const snapshot = await db.collection('posts')
      .doc(postId)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .get();
    
    const comments = [];
    snapshot.forEach(doc => {
      comments.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? new Date(doc.data().createdAt).toISOString() : null,
      });
    });
    
    res.status(200).json({ comments });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/posts/:postId/comments
 * Add a comment to a post
 */
router.post('/:postId/comments', verifyToken, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { text, username } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Comment text required' });
    }
    
    const commentData = {
      text,
      username: username || `@${req.user.uid.slice(0, 8)}`,
      userId: req.user.uid,
      createdAt: new Date().toISOString(),
      parentId: null,
    };
    
    const commentRef = await db.collection('posts')
      .doc(postId)
      .collection('comments')
      .add(commentData);
    
    // Increment comment count on post
    await db.collection('posts').doc(postId).update({
      comments: db.firestore.FieldValue.increment(1),
    });
    
    res.status(201).json({
      success: true,
      commentId: commentRef.id,
      ...commentData,
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;