const express = require('express');
const { db, auth } = require('../config/firebase');
const { validateUsername, validateEmail, validatePassword, sanitizeString } = require('../middleware/validation');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register new user (Firestore only, Firebase Auth handled on client)
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;
    
    // Validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const sanitizedUsername = sanitizeString(username);
    const sanitizedName = sanitizeString(name);
    const sanitizedEmail = sanitizeString(email);
    
    if (!validateUsername(sanitizedUsername)) {
      return res.status(400).json({ error: 'Username must be 3-20 characters (letters, numbers, underscore)' });
    }
    
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const fullUsername = sanitizedUsername.startsWith('@') ? sanitizedUsername : `@${sanitizedUsername}`;
    
    // Check if username exists
    const existingUser = await db.collection('users').where('username', '==', fullUsername).get();
    if (!existingUser.empty) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    
    // Check if email exists
    const existingEmail = await db.collection('users').where('email', '==', sanitizedEmail).get();
    if (!existingEmail.empty) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Simple hash for password (in production, use bcrypt)
    const hashPassword = (pw) => {
      let h = 0;
      for (let i = 0; i < pw.length; i++) {
        const c = pw.charCodeAt(i);
        h = ((h << 5) - h) + c;
        h = h & h;
      }
      return 'h_' + Math.abs(h).toString(16);
    };
    
    // Create user in Firestore
    const userData = {
      name: sanitizedName,
      username: fullUsername,
      email: sanitizedEmail,
      password: hashPassword(password),
      avatar: null,
      bio: '',
      website: '',
      friends: [],
      besties: [],
      posts: [],
      createdAt: new Date().toISOString(),
    };
    
    const userRef = await db.collection('users').add(userData);
    
    // Initialize wallet
    await db.collection('wallets').doc(userRef.id).set({
      userId: userRef.id,
      username: fullUsername,
      chicken: 10,
      lion: 5,
      fish: 8,
      bike: 3,
      createdAt: new Date().toISOString(),
    });
    
    res.status(201).json({
      success: true,
      userId: userRef.id,
      username: fullUsername,
      message: 'User created successfully',
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Verify user credentials
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const sanitizedUsername = sanitizeString(username);
    const fullUsername = sanitizedUsername.startsWith('@') ? sanitizedUsername : `@${sanitizedUsername}`;
    
    // Find user by username or email
    let userQuery = await db.collection('users').where('username', '==', fullUsername).limit(1).get();
    
    if (userQuery.empty) {
      userQuery = await db.collection('users').where('email', '==', sanitizedUsername).limit(1).get();
    }
    
    if (userQuery.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    
    // Verify password
    const hashPassword = (pw) => {
      let h = 0;
      for (let i = 0; i < pw.length; i++) {
        const c = pw.charCodeAt(i);
        h = ((h << 5) - h) + c;
        h = h & h;
      }
      return 'h_' + Math.abs(h).toString(16);
    };
    
    if (userData.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return user data (no token - client uses Firebase Auth)
    res.status(200).json({
      success: true,
      userId: userDoc.id,
      username: userData.username,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      message: 'Login successful',
    });
    
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

/**
 * GET /api/auth/verify
 * Verify user exists
 */
router.get('/verify/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({
      exists: true,
      userId: userDoc.id,
      username: userDoc.data().username,
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;