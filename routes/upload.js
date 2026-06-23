const express = require('express');
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');
const { uploadRateLimiter } = require('../middleware/rateLimit');
const { uploadImage, uploadVideo } = require('../services/s3Service');
const { validateFileType } = require('../middleware/validation');
const { MAX_FILE_SIZE_BYTES, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } = require('../config/constants');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

/**
 * POST /api/upload
 * Upload image or video to S3
 */
router.post('/', verifyToken, uploadRateLimiter, upload.single('file'), async (req, res, next) => {
  try {
    const { type } = req.body;
    const file = req.file;
    const userId = req.user.uid;
    
    // Validate file exists
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    // Validate file type
    let isValidType = false;
    if (type === 'image') {
      isValidType = validateFileType(file, 'image');
    } else if (type === 'video') {
      isValidType = validateFileType(file, 'video');
    } else {
      return res.status(400).json({ error: 'Invalid type. Must be "image" or "video"' });
    }
    
    if (!isValidType) {
      return res.status(400).json({ 
        error: `Invalid file type. Allowed: ${type === 'image' ? ALLOWED_IMAGE_TYPES.join(', ') : ALLOWED_VIDEO_TYPES.join(', ')}` 
      });
    }
    
    // Upload to S3
    let result;
    if (type === 'image') {
      result = await uploadImage(file, userId);
    } else {
      result = await uploadVideo(file, userId);
    }
    
    res.status(200).json({
      success: true,
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      type: type,
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
});

/**
 * POST /api/upload/base64
 * Upload base64 image to S3 (for cropped images)
 */
router.post('/base64', verifyToken, uploadRateLimiter, async (req, res, next) => {
  try {
    const { imageData, type } = req.body;
    const userId = req.user.uid;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    
    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');
    
    // Determine file extension
    const mimeMatch = imageData.match(/^data:image\/(\w+);base64,/);
    const extension = mimeMatch ? mimeMatch[1] : 'jpg';
    
    const file = {
      buffer: fileBuffer,
      originalname: `cropped_${Date.now()}.${extension}`,
      mimetype: `image/${extension}`,
    };
    
    const result = await uploadImage(file, userId, { compress: true });
    
    res.status(200).json({
      success: true,
      url: result.url,
      key: result.key,
    });
    
  } catch (error) {
    console.error('Base64 upload error:', error);
    next(error);
  }
});

module.exports = router;