const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const logger = require('../utils/logger');

// ====================
// S3 Client Configuration
// ====================
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// ====================
// Helper Functions
// ====================

/**
 * Upload file to S3
 * @param {string} bucket - S3 bucket name
 * @param {string} key - File key/path in S3
 * @param {Buffer|Stream} body - File content
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL of uploaded file
 */
const uploadToS3 = async (bucket, key, body, contentType = 'application/octet-stream') => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: 'public-read' // Make public, or use 'private' for DRM content
    });
    
    await s3Client.send(command);
    
    // Return CloudFront URL if configured, otherwise S3 URL
    const cdnDomain = process.env.CLOUDFRONT_DOMAIN;
    if (cdnDomain) {
      return `https://${cdnDomain}/${key}`;
    } else {
      return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }
  } catch (error) {
    logger.error('S3 upload error:', error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};

/**
 * Get presigned URL for direct upload from client
 * @param {string} bucket - S3 bucket name
 * @param {string} key - File key/path
 * @param {number} expiresIn - URL expiration in seconds (default: 3600)
 * @returns {Promise<string>} - Presigned URL
 */
const getPresignedUploadUrl = async (bucket, key, expiresIn = 3600) => {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return presignedUrl;
  } catch (error) {
    logger.error('Error generating presigned URL:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

/**
 * Get presigned URL for downloading private files
 * @param {string} bucket - S3 bucket name
 * @param {string} key - File key/path
 * @param {number} expiresIn - URL expiration in seconds (default: 3600)
 * @returns {Promise<string>} - Presigned URL
 */
const getPresignedDownloadUrl = async (bucket, key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return presignedUrl;
  } catch (error) {
    logger.error('Error generating download URL:', error);
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {string} bucket - S3 bucket name
 * @param {string} key - File key/path
 * @returns {Promise<boolean>} - Success status
 */
const deleteFromS3 = async (bucket, key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    await s3Client.send(command);
    logger.info(`Deleted file from S3: ${bucket}/${key}`);
    return true;
  } catch (error) {
    logger.error('S3 delete error:', error);
    throw new Error(`Failed to delete from S3: ${error.message}`);
  }
};

/**
 * Upload video to S3
 * @param {Buffer|Stream} videoFile - Video file content
 * @param {string} filename - Original filename
 * @param {string} seriesId - Series ID
 * @param {string} episodeId - Episode ID
 * @returns {Promise<string>} - S3 URL
 */
const uploadVideo = async (videoFile, filename, seriesId, episodeId) => {
  const bucket = process.env.S3_BUCKET_VIDEO;
  const key = `videos/${seriesId}/${episodeId}/original/${filename}`;
  
  return await uploadToS3(bucket, key, videoFile, 'video/mp4');
};

/**
 * Upload thumbnail
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} filename - Filename
 * @param {string} seriesId - Series ID
 * @returns {Promise<string>} - S3 URL
 */
const uploadThumbnail = async (imageBuffer, filename, seriesId) => {
  const bucket = process.env.S3_BUCKET_THUMBNAILS;
  const key = `thumbnails/${seriesId}/${filename}`;
  
  return await uploadToS3(bucket, key, imageBuffer, 'image/jpeg');
};

/**
 * Generate video upload URL for client
 * @param {string} seriesId - Series ID
 * @param {string} episodeId - Episode ID
 * @param {string} filename - Filename
 * @returns {Promise<Object>} - Upload URL and key
 */
const generateVideoUploadUrl = async (seriesId, episodeId, filename) => {
  const bucket = process.env.S3_BUCKET_TEMP;
  const key = `uploads/${seriesId}/${episodeId}/${Date.now()}-${filename}`;
  
  const uploadUrl = await getPresignedUploadUrl(bucket, key, 3600); // 1 hour
  
  return {
    uploadUrl,
    key,
    bucket
  };
};

// ====================
// Exports
// ====================
module.exports = {
  s3Client,
  uploadToS3,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  deleteFromS3,
  uploadVideo,
  uploadThumbnail,
  generateVideoUploadUrl
};
