const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const logger = require('../utils/logger');
const { uploadToS3, deleteFromS3 } = require('./storage');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

// ====================
// Video Processing Configuration
// ====================
const VIDEO_RESOLUTIONS = [
  { name: '240p', width: 426, height: 240, bitrate: '300k' },
  { name: '360p', width: 640, height: 360, bitrate: '600k' },
  { name: '540p', width: 960, height: 540, bitrate: '1200k' },
  { name: '720p', width: 1280, height: 720, bitrate: '1800k' },
  { name: '1080p', width: 1920, height: 1080, bitrate: '3000k' }
];

// ====================
// Helper Functions
// ====================

/**
 * Get video metadata
 * @param {string} inputPath - Path to video file
 * @returns {Promise<Object>} - Video metadata
 */
const getVideoMetadata = (inputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        logger.error('FFprobe error:', err);
        return reject(err);
      }
      
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      
      resolve({
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitrate: metadata.format.bit_rate,
        codec: videoStream?.codec_name,
        width: videoStream?.width,
        height: videoStream?.height,
        framerate: eval(videoStream?.r_frame_rate), // e.g., "30/1" -> 30
        aspectRatio: `${videoStream?.width}:${videoStream?.height}`,
        hasAudio: !!audioStream
      });
    });
  });
};

/**
 * Transcode video to multiple resolutions (ABR ladder)
 * @param {string} inputPath - Input video file path
 * @param {string} outputDir - Output directory
 * @param {Object} options - Transcoding options
 * @returns {Promise<Array>} - Array of transcoded files
 */
const transcodeVideo = async (inputPath, outputDir, options = {}) => {
  try {
    logger.info('Starting video transcoding:', inputPath);
    
    // Get input video metadata
    const metadata = await getVideoMetadata(inputPath);
    logger.info('Video metadata:', metadata);
    
    // Determine which resolutions to create based on input resolution
    const maxHeight = metadata.height;
    const resolutionsToCreate = VIDEO_RESOLUTIONS.filter(r => r.height <= maxHeight);
    
    logger.info(`Creating ${resolutionsToCreate.length} resolutions`);
    
    // Transcode each resolution
    const transcodedFiles = [];
    
    for (const resolution of resolutionsToCreate) {
      const outputPath = `${outputDir}/${resolution.name}.mp4`;
      
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .output(outputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .size(`${resolution.width}x${resolution.height}`)
          .videoBitrate(resolution.bitrate)
          .audioBitrate('128k')
          .format('mp4')
          .outputOptions([
            '-preset fast',
            '-movflags +faststart', // Enable streaming
            '-pix_fmt yuv420p'
          ])
          .on('start', (cmd) => {
            logger.info(`Transcoding ${resolution.name}:`, cmd);
          })
          .on('progress', (progress) => {
            logger.debug(`${resolution.name} progress:`, progress.percent + '%');
          })
          .on('end', () => {
            logger.info(`Finished transcoding ${resolution.name}`);
            transcodedFiles.push({
              resolution: resolution.name,
              path: outputPath,
              width: resolution.width,
              height: resolution.height,
              bitrate: resolution.bitrate
            });
            resolve();
          })
          .on('error', (err) => {
            logger.error(`Error transcoding ${resolution.name}:`, err);
            reject(err);
          })
          .run();
      });
    }
    
    logger.info('Video transcoding completed');
    return transcodedFiles;
  } catch (error) {
    logger.error('Transcoding failed:', error);
    throw error;
  }
};

/**
 * Generate HLS playlist
 * @param {string} inputPath - Input video file
 * @param {string} outputDir - Output directory
 * @returns {Promise<string>} - Path to master playlist
 */
const generateHLSPlaylist = (inputPath, outputDir) => {
  return new Promise((resolve, reject) => {
    const outputPath = `${outputDir}/master.m3u8`;
    
    ffmpeg(inputPath)
      .outputOptions([
        '-codec: copy',
        '-start_number 0',
        '-hls_time 6',
        '-hls_list_size 0',
        '-f hls'
      ])
      .output(outputPath)
      .on('end', () => {
        logger.info('HLS playlist generated:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error('HLS generation error:', err);
        reject(err);
      })
      .run();
  });
};

/**
 * Generate video thumbnail
 * @param {string} inputPath - Input video file
 * @param {string} outputPath - Output image path
 * @param {number} timeInSeconds - Time position to capture (default: 5)
 * @returns {Promise<string>} - Path to thumbnail
 */
const generateThumbnail = (inputPath, outputPath, timeInSeconds = 5) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timeInSeconds],
        filename: outputPath,
        size: '1080x1920' // 9:16 aspect ratio for vertical video
      })
      .on('end', () => {
        logger.info('Thumbnail generated:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error('Thumbnail generation error:', err);
        reject(err);
      });
  });
};

/**
 * Extract audio from video
 * @param {string} inputPath - Input video file
 * @param {string} outputPath - Output audio file path
 * @returns {Promise<string>} - Path to audio file
 */
const extractAudio = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .noVideo()
      .audioCodec('aac')
      .audioBitrate('128k')
      .on('end', () => {
        logger.info('Audio extracted:', outputPath);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error('Audio extraction error:', err);
        reject(err);
      })
      .run();
  });
};

/**
 * Complete video processing pipeline
 * @param {string} inputPath - Input video file
 * @param {string} seriesId - Series ID
 * @param {string} episodeId - Episode ID
 * @returns {Promise<Object>} - Processing results
 */
const processVideoComplete = async (inputPath, seriesId, episodeId) => {
  try {
    logger.info('Starting complete video processing pipeline');
    
    // 1. Get metadata
    const metadata = await getVideoMetadata(inputPath);
    
    // 2. Transcode to multiple resolutions
    const outputDir = `/tmp/transcode/${seriesId}/${episodeId}`;
    const transcodedFiles = await transcodeVideo(inputPath, outputDir);
    
    // 3. Generate HLS playlist
    const hlsPlaylist = await generateHLSPlaylist(transcodedFiles[0].path, outputDir);
    
    // 4. Generate thumbnail
    const thumbnailPath = `${outputDir}/thumbnail.jpg`;
    await generateThumbnail(inputPath, thumbnailPath);
    
    // 5. Upload all files to S3
    const bucket = process.env.S3_BUCKET_VIDEO;
    const uploadPromises = [];
    
    // Upload transcoded videos
    for (const file of transcodedFiles) {
      const key = `videos/${seriesId}/${episodeId}/${file.resolution}.mp4`;
      uploadPromises.push(
        uploadToS3(bucket, key, require('fs').readFileSync(file.path), 'video/mp4')
      );
    }
    
    // Upload HLS playlist
    uploadPromises.push(
      uploadToS3(bucket, `videos/${seriesId}/${episodeId}/master.m3u8`, 
                require('fs').readFileSync(hlsPlaylist), 'application/x-mpegURL')
    );
    
    // Upload thumbnail
    uploadPromises.push(
      uploadToS3(process.env.S3_BUCKET_THUMBNAILS, 
                `thumbnails/${seriesId}/${episodeId}/thumbnail.jpg`,
                require('fs').readFileSync(thumbnailPath), 'image/jpeg')
    );
    
    const uploadedUrls = await Promise.all(uploadPromises);
    
    logger.info('Video processing pipeline completed successfully');
    
    return {
      metadata,
      transcodedFiles: transcodedFiles.map((f, i) => ({
        ...f,
        url: uploadedUrls[i]
      })),
      hlsManifestUrl: uploadedUrls[transcodedFiles.length],
      thumbnailUrl: uploadedUrls[uploadedUrls.length - 1]
    };
  } catch (error) {
    logger.error('Video processing pipeline failed:', error);
    throw error;
  }
};

// ====================
// Exports
// ====================
module.exports = {
  getVideoMetadata,
  transcodeVideo,
  generateHLSPlaylist,
  generateThumbnail,
  extractAudio,
  processVideoComplete
};
