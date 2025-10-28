const express = require('express');
const router = express.Router();
const PlaybackSession = require('../models/PlaybackSession');
const Episode = require('../models/Episode');
const Series = require('../models/Series');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// ====================
// POST /playback/start
// Start a new playback session
// ====================
router.post('/start', asyncHandler(async (req, res) => {
  const { episode_id, platform, device_id, device_type, os_version, app_version, ip_address } = req.body;
  const userId = req.userId;
  
  if (!episode_id || !platform) {
    throw new ValidationError('episode_id and platform are required');
  }
  
  // Get episode details
  const episode = await Episode.findByPk(episode_id);
  
  if (!episode) {
    throw new NotFoundError('Episode');
  }
  
  // Check if there's an active session for this user and episode
  let session = await PlaybackSession.getActiveSession(userId, episode_id);
  
  if (session) {
    // Resume existing session
    logger.logUserAction(userId, 'PLAYBACK_RESUME', {
      episodeId: episode_id,
      sessionId: session.id,
      lastPosition: session.last_position
    });
    
    return res.json({
      success: true,
      message: 'Resumed existing session',
      data: {
        session,
        lastPosition: session.last_position
      }
    });
  }
  
  // Create new session
  session = await PlaybackSession.startSession(
    userId,
    episode_id,
    episode.series_id,
    platform,
    device_id,
    {
      device_type,
      os_version,
      app_version,
      ip_address: ip_address || req.ip
    }
  );
  
  // Increment view count (async)
  episode.incrementViews(true).catch(err => 
    logger.error('Failed to increment views:', err)
  );
  
  logger.logUserAction(userId, 'PLAYBACK_START', {
    episodeId: episode_id,
    sessionId: session.id
  });
  
  res.json({
    success: true,
    message: 'Playback session started',
    data: { session }
  });
}));

// ====================
// POST /playback/heartbeat
// Update playback progress (called every 30 seconds)
// ====================
router.post('/heartbeat', asyncHandler(async (req, res) => {
  const { session_id, position, quality, buffering_count, buffering_duration } = req.body;
  const userId = req.userId;
  
  if (!session_id || position === undefined) {
    throw new ValidationError('session_id and position are required');
  }
  
  const session = await PlaybackSession.findOne({
    where: {
      id: session_id,
      user_id: userId
    }
  });
  
  if (!session) {
    throw new NotFoundError('Playback session');
  }
  
  // Update progress
  await session.updateProgress(position, quality);
  
  // Update buffering stats if provided
  if (buffering_count !== undefined) {
    session.buffering_count += buffering_count;
  }
  
  if (buffering_duration !== undefined) {
    session.buffering_duration += buffering_duration;
  }
  
  await session.save();
  
  res.json({
    success: true,
    message: 'Progress updated',
    data: {
      lastPosition: session.last_position,
      completed: session.completed,
      completionPercentage: session.completion_percentage
    }
  });
}));

// ====================
// POST /playback/complete
// Mark playback as completed
// ====================
router.post('/complete', asyncHandler(async (req, res) => {
  const { session_id, final_position } = req.body;
  const userId = req.userId;
  
  if (!session_id) {
    throw new ValidationError('session_id is required');
  }
  
  const session = await PlaybackSession.findOne({
    where: {
      id: session_id,
      user_id: userId
    }
  });
  
  if (!session) {
    throw new NotFoundError('Playback session');
  }
  
  // End session
  await session.endSession(final_position || session.last_position);
  
  logger.logUserAction(userId, 'PLAYBACK_COMPLETE', {
    episodeId: session.episode_id,
    sessionId: session.id,
    watchTime: session.duration_watched,
    completed: session.completed
  });
  
  res.json({
    success: true,
    message: 'Playback completed',
    data: {
      session,
      watchTime: session.duration_watched
    }
  });
}));

// ====================
// PUT /playback/progress
// Save playback progress (for resume later)
// ====================
router.put('/progress', asyncHandler(async (req, res) => {
  const { episode_id, position } = req.body;
  const userId = req.userId;
  
  if (!episode_id || position === undefined) {
    throw new ValidationError('episode_id and position are required');
  }
  
  // Get or create active session
  let session = await PlaybackSession.getActiveSession(userId, episode_id);
  
  if (!session) {
    // Create new session if none exists
    const episode = await Episode.findByPk(episode_id);
    if (!episode) {
      throw new NotFoundError('Episode');
    }
    
    session = await PlaybackSession.startSession(
      userId,
      episode_id,
      episode.series_id,
      'unknown',
      null,
      {}
    );
  }
  
  // Update position
  await session.updateProgress(position);
  
  res.json({
    success: true,
    message: 'Progress saved',
    data: {
      lastPosition: session.last_position
    }
  });
}));

// ====================
// GET /playback/continue-watching
// Get continue watching list
// ====================
router.get('/continue-watching', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const userId = req.userId;
  
  // Get incomplete sessions
  const sessions = await PlaybackSession.findAll({
    where: {
      user_id: userId,
      completed: false,
      last_position: {
        [PlaybackSession.sequelize.Sequelize.Op.gt]: 0
      }
    },
    order: [['started_at', 'DESC']],
    limit: parseInt(limit),
    include: [
      {
        model: Episode,
        as: 'episode',
        attributes: ['id', 'title', 'thumbnail_url', 'duration', 'episode_number']
      },
      {
        model: Series,
        as: 'series',
        attributes: ['id', 'title', 'thumbnail_url']
      }
    ],
    distinct: true,
    group: ['PlaybackSession.episode_id']
  });
  
  res.json({
    success: true,
    data: {
      continueWatching: sessions.map(session => ({
        episode: session.episode,
        series: session.series,
        lastPosition: session.last_position,
        progress: session.completion_percentage,
        lastWatched: session.started_at
      }))
    }
  });
}));

// ====================
// POST /playback/quality-switch
// Log quality switch event
// ====================
router.post('/quality-switch', asyncHandler(async (req, res) => {
  const { session_id, from_quality, to_quality } = req.body;
  const userId = req.userId;
  
  if (!session_id || !from_quality || !to_quality) {
    throw new ValidationError('session_id, from_quality, and to_quality are required');
  }
  
  const session = await PlaybackSession.findOne({
    where: {
      id: session_id,
      user_id: userId
    }
  });
  
  if (session) {
    await session.logQualitySwitch(from_quality, to_quality, new Date());
  }
  
  res.json({
    success: true,
    message: 'Quality switch logged'
  });
}));

// ====================
// POST /playback/error
// Log playback error
// ====================
router.post('/error', asyncHandler(async (req, res) => {
  const { session_id, error_code, error_message, timestamp } = req.body;
  const userId = req.userId;
  
  if (!session_id || !error_code) {
    throw new ValidationError('session_id and error_code are required');
  }
  
  const session = await PlaybackSession.findOne({
    where: {
      id: session_id,
      user_id: userId
    }
  });
  
  if (session) {
    session.errors.push({
      code: error_code,
      message: error_message,
      timestamp: timestamp || new Date()
    });
    await session.save();
    
    logger.error('Playback error:', {
      userId,
      sessionId: session_id,
      episodeId: session.episode_id,
      error: error_code,
      message: error_message
    });
  }
  
  res.json({
    success: true,
    message: 'Error logged'
  });
}));

module.exports = router;
