const { S3Client } = require('@aws-sdk/client-s3');

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  maxAttempts: 3,
  retryMode: 'adaptive',
});

const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const S3_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_URL_EXPIRY = 3600; // 1 hour for presigned URLs

module.exports = {
  s3Client,
  S3_BUCKET_NAME,
  S3_REGION,
  S3_URL_EXPIRY,
};