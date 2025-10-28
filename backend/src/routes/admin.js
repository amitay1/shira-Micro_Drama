const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Series = require('../models/Series');
const Season = require('../models/Season');
const Episode = require('../models/Episode');
const Subscription = require('../models/Subscription');
const Purchase = require('../models/Purchase');
const PlaybackSession = require('../models/PlaybackSession');
const { adminMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Apply admin middleware to all routes
router.use(adminMiddleware);

// ====================
// Dashboard Analytics
// ====================
router.get('/dashboard', asyncHandler(async (req, res) => {
  // Get key metrics
  const totalUsers = await User.count({ where: { is_active: true } });
  const totalSeries = await Series.count({ where: { status: 'live' } });
  const totalEpisodes = await Episode.count({ where: { status: 'live' } });
  const activeSubscriptions = await Subscription.count({ where: { status: 'active' } });
  
  // Get today's metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const newUsersToday = await User.count({
    where: {
      created_at: {
        [User.sequelize.Sequelize.Op.gte]: today
      }
    }
  });
  
  const viewsToday = await PlaybackSession.count({
    where: {
      started_at: {
        [PlaybackSession.sequelize.Sequelize.Op.gte]: today
      }
    }
  });
  
  // Revenue metrics
  const revenueToday = await Purchase.sum('amount', {
    where: {
      status: 'completed',
      created_at: {
        [Purchase.sequelize.Sequelize.Op.gte]: today
      }
    }
  }) || 0;
  
  const revenueThisMonth = await Purchase.sum('amount', {
    where: {
      status: 'completed',
      created_at: {
        [Purchase.sequelize.Sequelize.Op.gte]: new Date(today.getFullYear(), today.getMonth(), 1)
      }
    }
  }) || 0;
  
  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalSeries,
        totalEpisodes,
        activeSubscriptions
      },
      today: {
        newUsers: newUsersToday,
        views: viewsToday,
        revenue: revenueToday
      },
      thisMonth: {
        revenue: revenueThisMonth
      }
    }
  });
}));

// ====================
// User Management
// ====================
router.get('/users', asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0, search, status = 'active' } = req.query;
  
  const where = {};
  
  if (search) {
    where[User.sequelize.Sequelize.Op.or] = [
      { email: { [User.sequelize.Sequelize.Op.iLike]: `%${search}%` } },
      { full_name: { [User.sequelize.Sequelize.Op.iLike]: `%${search}%` } }
    ];
  }
  
  if (status === 'active') {
    where.is_active = true;
  } else if (status === 'inactive') {
    where.is_active = false;
  }
  
  const users = await User.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    attributes: { exclude: ['password'] }
  });
  
  const total = await User.count({ where });
  
  res.json({
    success: true,
    data: {
      users,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    }
  });
}));

router.get('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] }
  });
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  // Get user statistics
  const subscription = await Subscription.getActiveSubscription(id);
  const totalViews = await PlaybackSession.count({ where: { user_id: id } });
  const totalPurchases = await Purchase.count({ where: { user_id: id } });
  
  res.json({
    success: true,
    data: {
      user,
      stats: {
        subscription,
        totalViews,
        totalPurchases
      }
    }
  });
}));

router.put('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, is_active, is_banned, ban_reason } = req.body;
  
  const user = await User.findByPk(id);
  
  if (!user) {
    throw new NotFoundError('User');
  }
  
  if (role) user.role = role;
  if (is_active !== undefined) user.is_active = is_active;
  if (is_banned !== undefined) {
    user.is_banned = is_banned;
    user.ban_reason = ban_reason || null;
  }
  
  await user.save();
  
  logger.logUserAction(req.userId, 'ADMIN_USER_UPDATE', {
    targetUserId: id,
    changes: { role, is_active, is_banned }
  });
  
  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user: user.toSafeObject() }
  });
}));

// ====================
// Series Management
// ====================
router.post('/series', asyncHandler(async (req, res) => {
  const {
    title,
    description,
    short_description,
    thumbnail_url,
    banner_url,
    genre,
    tags,
    age_rating,
    language,
    year
  } = req.body;
  
  if (!title || !description || !thumbnail_url) {
    throw new ValidationError('title, description, and thumbnail_url are required');
  }
  
  const series = await Series.create({
    title,
    description,
    short_description,
    thumbnail_url,
    banner_url,
    genre: genre || [],
    tags: tags || [],
    age_rating: age_rating || 'PG-13',
    language: language || 'en',
    year,
    created_by: req.userId,
    status: 'draft'
  });
  
  logger.logUserAction(req.userId, 'ADMIN_SERIES_CREATE', {
    seriesId: series.id,
    title: series.title
  });
  
  res.status(201).json({
    success: true,
    message: 'Series created successfully',
    data: { series }
  });
}));

router.put('/series/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const series = await Series.findByPk(id);
  
  if (!series) {
    throw new NotFoundError('Series');
  }
  
  // Update fields
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined && series[key] !== undefined) {
      series[key] = updates[key];
    }
  });
  
  await series.save();
  
  logger.logUserAction(req.userId, 'ADMIN_SERIES_UPDATE', {
    seriesId: id,
    changes: Object.keys(updates)
  });
  
  res.json({
    success: true,
    message: 'Series updated successfully',
    data: { series }
  });
}));

router.delete('/series/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const series = await Series.findByPk(id);
  
  if (!series) {
    throw new NotFoundError('Series');
  }
  
  series.status = 'deleted';
  await series.save();
  
  logger.logUserAction(req.userId, 'ADMIN_SERIES_DELETE', {
    seriesId: id
  });
  
  res.json({
    success: true,
    message: 'Series deleted successfully'
  });
}));

// ====================
// Episode Management
// ====================
router.post('/episodes', asyncHandler(async (req, res) => {
  const {
    series_id,
    season_id,
    episode_number,
    title,
    description,
    duration,
    thumbnail_url,
    unlock_type = 'free',
    unlock_cost = 0
  } = req.body;
  
  if (!series_id || !episode_number || !title || !duration || !thumbnail_url) {
    throw new ValidationError('series_id, episode_number, title, duration, and thumbnail_url are required');
  }
  
  const episode = await Episode.create({
    series_id,
    season_id,
    episode_number,
    title,
    description,
    duration,
    thumbnail_url,
    unlock_type,
    unlock_cost,
    status: 'draft'
  });
  
  logger.logUserAction(req.userId, 'ADMIN_EPISODE_CREATE', {
    episodeId: episode.id,
    seriesId: series_id,
    title: episode.title
  });
  
  res.status(201).json({
    success: true,
    message: 'Episode created successfully',
    data: { episode }
  });
}));

router.put('/episodes/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const episode = await Episode.findByPk(id);
  
  if (!episode) {
    throw new NotFoundError('Episode');
  }
  
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined && episode[key] !== undefined) {
      episode[key] = updates[key];
    }
  });
  
  await episode.save();
  
  logger.logUserAction(req.userId, 'ADMIN_EPISODE_UPDATE', {
    episodeId: id,
    changes: Object.keys(updates)
  });
  
  res.json({
    success: true,
    message: 'Episode updated successfully',
    data: { episode }
  });
}));

router.delete('/episodes/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const episode = await Episode.findByPk(id);
  
  if (!episode) {
    throw new NotFoundError('Episode');
  }
  
  episode.status = 'deleted';
  await episode.save();
  
  logger.logUserAction(req.userId, 'ADMIN_EPISODE_DELETE', {
    episodeId: id
  });
  
  res.json({
    success: true,
    message: 'Episode deleted successfully'
  });
}));

// ====================
// Analytics
// ====================
router.get('/analytics', asyncHandler(async (req, res) => {
  const { period = '7days' } = req.query;
  
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '24hours':
      startDate.setHours(startDate.getHours() - 24);
      break;
    case '7days':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30days':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90days':
      startDate.setDate(startDate.getDate() - 90);
      break;
  }
  
  // Get analytics data
  const newUsers = await User.count({
    where: {
      created_at: {
        [User.sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    }
  });
  
  const totalViews = await PlaybackSession.count({
    where: {
      started_at: {
        [PlaybackSession.sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    }
  });
  
  const revenue = await Purchase.sum('amount', {
    where: {
      status: 'completed',
      created_at: {
        [Purchase.sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    }
  }) || 0;
  
  const newSubscriptions = await Subscription.count({
    where: {
      created_at: {
        [Subscription.sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    }
  });
  
  res.json({
    success: true,
    data: {
      period,
      dateRange: {
        start: startDate,
        end: endDate
      },
      metrics: {
        newUsers,
        totalViews,
        revenue,
        newSubscriptions
      }
    }
  });
}));

module.exports = router;
