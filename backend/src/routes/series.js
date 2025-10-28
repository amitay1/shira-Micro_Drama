const express = require('express');
const router = express.Router();
const Series = require('../models/Series');
const Season = require('../models/Season');
const Episode = require('../models/Episode');
const { asyncHandler } = require('../middleware/errorHandler');
const { NotFoundError } = require('../middleware/errorHandler');
const { optionalAuthMiddleware } = require('../middleware/auth');
const { getCache, setCache } = require('../config/redis');

// ====================
// GET /series
// List all series with filters
// ====================
router.get('/', optionalAuthMiddleware, asyncHandler(async (req, res) => {
  const { 
    genre, 
    language, 
    status = 'live',
    sort = 'latest',
    limit = 20,
    offset = 0,
    featured,
    trending
  } = req.query;
  
  // Build where clause
  const where = { status };
  
  if (genre) {
    where.genre = { [Series.sequelize.Sequelize.Op.contains]: [genre] };
  }
  
  if (language) {
    where.language = language;
  }
  
  if (featured === 'true') {
    where.is_featured = true;
  }
  
  if (trending === 'true') {
    where.is_trending = true;
  }
  
  // Build order clause
  let order;
  switch (sort) {
    case 'latest':
      order = [['published_date', 'DESC']];
      break;
    case 'popular':
      order = [['view_count', 'DESC']];
      break;
    case 'rating':
      order = [['rating_average', 'DESC']];
      break;
    case 'title':
      order = [['title', 'ASC']];
      break;
    default:
      order = [['created_at', 'DESC']];
  }
  
  const series = await Series.findAll({
    where,
    order,
    limit: parseInt(limit),
    offset: parseInt(offset),
    attributes: { exclude: ['metadata'] }
  });
  
  const total = await Series.count({ where });
  
  res.json({
    success: true,
    data: {
      series,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    }
  });
}));

// ====================
// GET /series/:id
// Get series details
// ====================
router.get('/:id', optionalAuthMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Try cache first
  const cacheKey = `series:${id}`;
  let series = await getCache(cacheKey);
  
  if (!series) {
    series = await Series.findOne({
      where: { 
        id,
        status: 'live'
      },
      include: [
        {
          model: Season,
          as: 'seasons',
          where: { status: 'live' },
          required: false,
          attributes: ['id', 'season_number', 'title', 'total_episodes', 'thumbnail_url']
        }
      ]
    });
    
    if (!series) {
      throw new NotFoundError('Series');
    }
    
    // Cache for 15 minutes
    await setCache(cacheKey, series.toJSON(), 900);
  }
  
  // Increment view count (async, don't wait)
  if (typeof series.incrementViews === 'function') {
    series.incrementViews().catch(err => console.error('Failed to increment views:', err));
  }
  
  res.json({
    success: true,
    data: { series }
  });
}));

// ====================
// GET /series/:id/seasons
// Get all seasons for a series
// ====================
router.get('/:id/seasons', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const seasons = await Season.findAll({
    where: {
      series_id: id,
      status: 'live'
    },
    order: [['season_number', 'ASC']]
  });
  
  res.json({
    success: true,
    data: { seasons }
  });
}));

// ====================
// GET /series/:id/episodes
// Get all episodes for a series
// ====================
router.get('/:id/episodes', optionalAuthMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { season_number, limit = 50, offset = 0 } = req.query;
  
  const where = {
    series_id: id,
    status: 'live'
  };
  
  if (season_number) {
    const season = await Season.findOne({
      where: {
        series_id: id,
        season_number: parseInt(season_number)
      }
    });
    
    if (season) {
      where.season_id = season.id;
    }
  }
  
  const episodes = await Episode.findAll({
    where,
    order: [['episode_number', 'ASC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    attributes: { 
      exclude: ['video_url', 'hls_manifest_url', 'dash_manifest_url', 'processing_status'] 
    }
  });
  
  const total = await Episode.count({ where });
  
  res.json({
    success: true,
    data: {
      episodes,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    }
  });
}));

// ====================
// GET /series/featured
// Get featured series
// ====================
router.get('/featured/list', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const cacheKey = `series:featured:${limit}`;
  let featured = await getCache(cacheKey);
  
  if (!featured) {
    featured = await Series.getFeatured(parseInt(limit));
    await setCache(cacheKey, featured, 600); // 10 minutes
  }
  
  res.json({
    success: true,
    data: { series: featured }
  });
}));

// ====================
// GET /series/trending/list
// Get trending series
// ====================
router.get('/trending/list', asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  
  const cacheKey = `series:trending:${limit}`;
  let trending = await getCache(cacheKey);
  
  if (!trending) {
    trending = await Series.getTrending(parseInt(limit));
    await setCache(cacheKey, trending, 300); // 5 minutes
  }
  
  res.json({
    success: true,
    data: { series: trending }
  });
}));

// ====================
// GET /series/:id/related
// Get related series
// ====================
router.get('/:id/related', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 10 } = req.query;
  
  // Get current series
  const currentSeries = await Series.findByPk(id);
  
  if (!currentSeries) {
    throw new NotFoundError('Series');
  }
  
  // Find series with similar genres
  const related = await Series.findAll({
    where: {
      id: { [Series.sequelize.Sequelize.Op.ne]: id },
      status: 'live',
      genre: { 
        [Series.sequelize.Sequelize.Op.overlap]: currentSeries.genre 
      }
    },
    order: [['rating_average', 'DESC']],
    limit: parseInt(limit),
    attributes: { exclude: ['metadata', 'description'] }
  });
  
  res.json({
    success: true,
    data: { series: related }
  });
}));

module.exports = router;
