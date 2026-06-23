const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { s3Client, S3_BUCKET_NAME, S3_URL_EXPIRY } = require('../config/s3');

/**
 * Generate unique file key for S3
 */
function generateFileKey(userId, fileType, originalName) {
  const extension = originalName.split('.').pop();
  const timestamp = Date.now();
  const uniqueId = uuidv4().slice(0, 8);
  return `uploads/${userId}/${timestamp}_${uniqueId}.${extension}`;
}

/**
 * Upload file to S3
 */
async function uploadToS3(fileBuffer, key, contentType) {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000',
  });
  
  await s3Client.send(command);
  
  // Generate public URL
  const publicUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  
  return {
    key,
    url: publicUrl,
    bucket: S3_BUCKET_NAME,
  };
}

/**
 * Upload image with optional compression
 */
async function uploadImage(file, userId, options = {}) {
  const { compress = true, maxWidth = 1200, maxHeight = 1200 } = options;
  
  let imageBuffer = file.buffer;
  
  if (compress) {
    // Compress and resize image using sharp
    imageBuffer = await sharp(file.buffer)
      .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
  }
  
  const key = generateFileKey(userId, 'image', file.originalname);
  return uploadToS3(imageBuffer, key, 'image/jpeg');
}

/**
 * Upload video file (no compression)
 */
async function uploadVideo(file, userId) {
  const key = generateFileKey(userId, 'video', file.originalname);
  return uploadToS3(file.buffer, key, file.mimetype);
}

/**
 * Delete file from S3
 */
async function deleteFromS3(key) {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
  });
  
  await s3Client.send(command);
  return true;
}

/**
 * Generate presigned URL for temporary access
 */
async function getPresignedUrl(key, expiresIn = S3_URL_EXPIRY) {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Batch delete multiple files
 */
async function batchDeleteFromS3(keys) {
  const deletePromises = keys.map(key => deleteFromS3(key));
  await Promise.all(deletePromises);
  return true;
}

module.exports = {
  uploadImage,
  uploadVideo,
  deleteFromS3,
  batchDeleteFromS3,
  getPresignedUrl,
  generateFileKey,
};