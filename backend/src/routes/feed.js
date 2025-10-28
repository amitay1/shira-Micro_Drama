const express = require('express');
const router = express.Router();
const Series = require('../models/Series');
const Episode = require('../models/Episode');
const PlaybackSession = require('../models/PlaybackSession');
const { optionalAuthMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { getCache, setCache } = require('../config/redis');

// ====================
// GET /feed
// Main content feed with personalized recommendations
// ====================
router.get('/', optionalAuthMiddleware, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { limit = 20 } = req.query;
  
  const cacheKey = userId ? `feed:${userId}` : 'feed:guest';
  let feedData = await getCache(cacheKey);
  
  if (!feedData) {
    // Featured series
    const featured = await Series.findAll({
      where: {
        status: 'live',
        is_featured: true
      },
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: { exclude: ['metadata'] }
    });
    
    // Trending series
    const trending = await Series.findAll({
      where: {
        status: 'live',
        is_trending: true
      },
      order: [['view_count', 'DESC']],
      limit: 10,
      attributes: { exclude: ['metadata'] }
    });
    
    // New releases
    const newReleases = await Series.findAll({
      where: { status: 'live' },
      order: [['published_date', 'DESC']],
      limit: 10,
      attributes: { exclude: ['metadata'] }
    });
    
    // Top rated
    const topRated = await Series.findAll({
      where: {
        status: 'live',
        rating_average: {
          [Series.sequelize.Sequelize.Op.gte]: 4.0
        }
      },
      order: [['rating_average', 'DESC']],
      limit: 10,
      attributes: { exclude: ['metadata'] }
    });
    
    feedData = {
      featured,
      trending,
      newReleases,
      topRated
    };
    
    // Add personalized recommendations if user is logged in
    if (userId) {
      // Get user's watch history
      const recentlyWatched = await PlaybackSession.findAll({
        where: { user_id: userId },
        order: [['started_at', 'DESC']],
        limit: 5,
        attributes: ['series_id']
      });
      
      const watchedSeriesIds = recentlyWatched.map(s => s.series_id);
      
      // Find similar series
      if (watchedSeriesIds.length > 0) {
        const watchedSeries = await Series.findAll({
          where: {
            id: watchedSeriesIds
          },
          attributes: ['genre']
        });
        
        const userGenres = [...new Set(watchedSeries.flatMap(s => s.genre))];
        
        const recommended = await Series.findAll({
          where: {
            status: 'live',
            id: {
              [Series.sequelize.Sequelize.Op.notIn]: watchedSeriesIds
            },
            genre: {
              [Series.sequelize.Sequelize.Op.overlap]: userGenres
            }
          },
          order: [['rating_average', 'DESC']],
          limit: 10,
          attributes: { exclude: ['metadata'] }
        });
        
        feedData.recommended = recommended;
      }
    }
    
    // Cache for 5 minutes
    await setCache(cacheKey, feedData, 300);
  }
  
  res.json({
    success: true,
    data: feedData
  });
}));

// ====================
// GET /feed/trending
// Trending content
// ====================
router.get('/trending', asyncHandler(async (req, res) => {
  const { limit = 20, period = 'week' } = req.query;
  
  const cacheKey = `feed:trending:${period}:${limit}`;
  let trending = await getCache(cacheKey);
  
  if (!trending) {
    // Calculate date based on period
    const dateLimit = new Date();
    switch (period) {
      case 'today':
        dateLimit.setDate(dateLimit.getDate() - 1);
        break;
      case 'week':
        dateLimit.setDate(dateLimit.getDate() - 7);
        break;
      case 'month':
        dateLimit.setMonth(dateLimit.getMonth() - 1);
        break;
    }
    
    trending = await Series.findAll({
      where: {
        status: 'live',
        published_date: {
          [Series.sequelize.Sequelize.Op.gte]: dateLimit
        }
      },
      order: [
        ['view_count', 'DESC'],
        ['rating_average', 'DESC']
      ],
      limit: parseInt(limit),
      attributes: { exclude: ['metadata'] }
    });
    
    await setCache(cacheKey, trending, 300);
  }
  
  res.json({
    success: true,
    data: { trending }
  });
}));

// ====================
// GET /feed/recommended
// Personalized recommendations
// ====================
router.get('/recommended', asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const userId = req.userId;
  
  if (!userId) {
    // Return popular content for guests
    const popular = await Series.findAll({
      where: { status: 'live' },
      order: [['view_count', 'DESC']],
      limit: parseInt(limit),
      attributes: { exclude: ['metadata'] }
    });
    
    return res.json({
      success: true,
      data: { recommended: popular }
    });
  }
  
  const cacheKey = `feed:recommended:${userId}`;
  let recommended = await getCache(cacheKey);
  
  if (!recommended) {
    // Get user's watch history and preferences
    const watchHistory = await PlaybackSession.findAll({
      where: { 
        user_id: userId,
        completed: true
      },
      order: [['started_at', 'DESC']],
      limit: 20
    });
    
    if (watchHistory.length > 0) {
      const seriesIds = [...new Set(watchHistory.map(w => w.series_id))];
      
      // Get genres from watched series
      const watchedSeries = await Series.findAll({
        where: { id: seriesIds },
        attributes: ['genre', 'tags']
      });
      
      const userGenres = [...new Set(watchedSeries.flatMap(s => s.genre))];
      const userTags = [...new Set(watchedSeries.flatMap(s => s.tags || []))];
      
      // Find similar series
      recommended = await Series.findAll({
        where: {
          status: 'live',
          id: {
            [Series.sequelize.Sequelize.Op.notIn]: seriesIds
          },
          [Series.sequelize.Sequelize.Op.or]: [
            {
              genre: {
                [Series.sequelize.Sequelize.Op.overlap]: userGenres
              }
            },
            {
              tags: {
                [Series.sequelize.Sequelize.Op.overlap]: userTags
              }
            }
          ]
        },
        order: [
          ['rating_average', 'DESC'],
          ['view_count', 'DESC']
        ],
        limit: parseInt(limit),
        attributes: { exclude: ['metadata'] }
      });
    } else {
      // New user - show popular content
      recommended = await Series.findAll({
        where: { status: 'live' },
        order: [['view_count', 'DESC']],
        limit: parseInt(limit),
        attributes: { exclude: ['metadata'] }
      });
    }
    
    await setCache(cacheKey, recommended, 600); // 10 minutes
  }
  
  res.json({
    success: true,
    data: { recommended }
  });
}));

// ====================
// GET /feed/continue-watching
// Continue watching
// ====================
router.get('/continue-watching', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const userId = req.userId;
  
  if (!userId) {
    return res.json({
      success: true,
      data: { continueWatching: [] }
    });
  }
  
  // Get incomplete sessions grouped by series
  const sessions = await PlaybackSession.findAll({
    where: {
      user_id: userId,
      completed: false,
      last_position: {
        [PlaybackSession.sequelize.Sequelize.Op.gt]: 30 // At least 30 seconds watched
      }
    },
    include: [
      {
        model: Episode,
        as: 'episode',
        attributes: ['id', 'title', 'thumbnail_url', 'duration', 'episode_number', 'series_id']
      },
      {
        model: Series,
        as: 'series',
        attributes: ['id', 'title', 'thumbnail_url']
      }
    ],
    order: [['started_at', 'DESC']],
    limit: parseInt(limit)
  });
  
  // Group by series and get the latest episode for each
  const continueWatching = [];
  const seenSeries = new Set();
  
  for (const session of sessions) {
    if (!seenSeries.has(session.series_id)) {
      continueWatching.push({
        series: session.series,
        episode: session.episode,
        lastPosition: session.last_position,
        progress: session.completion_percentage,
        lastWatched: session.started_at
      });
      seenSeries.add(session.series_id);
    }
  }
  
  res.json({
    success: true,
    data: { continueWatching }
  });
}));

// ====================
// GET /feed/genres/:genre
// Get series by genre
// ====================
router.get('/genres/:genre', asyncHandler(async (req, res) => {
  const { genre } = req.params;
  const { limit = 20, offset = 0 } = req.query;
  
  const series = await Series.findAll({
    where: {
      status: 'live',
      genre: {
        [Series.sequelize.Sequelize.Op.contains]: [genre]
      }
    },
    order: [['rating_average', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    attributes: { exclude: ['metadata'] }
  });
  
  const total = await Series.count({
    where: {
      status: 'live',
      genre: {
        [Series.sequelize.Sequelize.Op.contains]: [genre]
      }
    }
  });
  
  res.json({
    success: true,
    data: {
      genre,
      series,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    }
  });
}));

module.exports = router;
