const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const CoinBalance = require('../models/CoinBalance');
const PlaybackSession = require('../models/PlaybackSession');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError, ValidationError } = require('../middleware/errorHandler');
const { deleteCache } = require('../config/redis');
const logger = require('../utils/logger');

// ====================
// GET /users/me
// Get current user profile
// ====================
router.get('/me', asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.userId, {
    attributes: { exclude: ['password'] }
  });
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  res.json({
    success: true,
    data: { user: user.toSafeObject() }
  });
}));

// ====================
// PUT /users/me
// Update current user profile
// ====================
router.put('/me', asyncHandler(async (req, res) => {
  const { full_name, phone, date_of_birth, country, language, preferences } = req.body;
  
  const user = await User.findByPk(req.userId);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  // Update fields
  if (full_name) user.full_name = full_name;
  if (phone !== undefined) user.phone = phone;
  if (date_of_birth) user.date_of_birth = date_of_birth;
  if (country) user.country = country;
  if (language) user.language = language;
  if (preferences) user.preferences = { ...user.preferences, ...preferences };
  
  await user.save();
  
  // Clear cache
  await deleteCache(`user:${user.id}`);
  
  logger.logUserAction(user.id, 'PROFILE_UPDATE', { fields: Object.keys(req.body) });
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: user.toSafeObject() }
  });
}));

// ====================
// POST /users/me/avatar
// Upload profile picture
// ====================
router.post('/me/avatar', asyncHandler(async (req, res) => {
  const { avatar_url } = req.body;
  
  if (!avatar_url) {
    throw new ValidationError('Avatar URL is required');
  }
  
  const user = await User.findByPk(req.userId);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  user.profile_picture = avatar_url;
  await user.save();
  
  await deleteCache(`user:${user.id}`);
  
  logger.logUserAction(user.id, 'AVATAR_UPDATE', {});
  
  res.json({
    success: true,
    message: 'Profile picture updated successfully',
    data: { profile_picture: user.profile_picture }
  });
}));

// ====================
// GET /users/me/subscription
// Get user subscription status
// ====================
router.get('/me/subscription', asyncHandler(async (req, res) => {
  const subscription = await Subscription.getActiveSubscription(req.userId);
  
  res.json({
    success: true,
    data: {
      subscription,
      hasActiveSubscription: subscription !== null,
      daysRemaining: subscription ? subscription.getDaysRemaining() : 0
    }
  });
}));

// ====================
// GET /users/me/coins
// Get user coin balance
// ====================
router.get('/me/coins', asyncHandler(async (req, res) => {
  const balance = await CoinBalance.getOrCreate(req.userId);
  
  res.json({
    success: true,
    data: { balance: balance.toJSON() }
  });
}));

// ====================
// GET /users/me/watch-history
// Get user watch history
// ====================
router.get('/me/watch-history', asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  
  const sessions = await PlaybackSession.findAll({
    where: { user_id: req.userId },
    order: [['started_at', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      {
        model: require('../models/Episode'),
        as: 'episode',
        attributes: ['id', 'title', 'thumbnail_url', 'duration']
      },
      {
        model: require('../models/Series'),
        as: 'series',
        attributes: ['id', 'title', 'thumbnail_url']
      }
    ]
  });
  
  res.json({
    success: true,
    data: { 
      sessions,
      total: sessions.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
}));

// ====================
// DELETE /users/me
// Delete user account
// ====================
router.delete('/me', asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.userId);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  // Soft delete - mark as inactive
  user.is_active = false;
  user.email = `deleted_${Date.now()}_${user.email}`;
  await user.save();
  
  // Clear cache
  await deleteCache(`user:${user.id}`);
  
  logger.logUserAction(user.id, 'ACCOUNT_DELETED', {});
  
  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
}));

// ====================
// GET /users/me/stats
// Get user statistics
// ====================
router.get('/me/stats', asyncHandler(async (req, res) => {
  const Episode = require('../models/Episode');
  const Series = require('../models/Series');
  
  // Get watch stats
  const totalWatched = await PlaybackSession.count({
    where: { user_id: req.userId }
  });
  
  const completedEpisodes = await PlaybackSession.count({
    where: { 
      user_id: req.userId,
      completed: true
    }
  });
  
  // Get total watch time
  const watchSessions = await PlaybackSession.findAll({
    where: { user_id: req.userId },
    attributes: ['duration_watched']
  });
  
  const totalWatchTime = watchSessions.reduce((sum, session) => {
    return sum + (session.duration_watched || 0);
  }, 0);
  
  // Get coin balance
  const coinBalance = await CoinBalance.getUserBalance(req.userId);
  
  // Get subscription
  const hasSubscription = await Subscription.hasActiveSubscription(req.userId);
  
  res.json({
    success: true,
    data: {
      totalEpisodesWatched: totalWatched,
      completedEpisodes,
      totalWatchTimeSeconds: totalWatchTime,
      totalWatchTimeHours: Math.round(totalWatchTime / 3600 * 10) / 10,
      coinBalance,
      hasActiveSubscription: hasSubscription
    }
  });
}));

module.exports = router;
