const express = require('express');
const router = express.Router();
const Series = require('../models/Series');
const Episode = require('../models/Episode');
const { optionalAuthMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { ValidationError } = require('../middleware/errorHandler');
const { getCache, setCache } = require('../config/redis');

// ====================
// GET /search
// Search series and episodes
// ====================
router.get('/', optionalAuthMiddleware, asyncHandler(async (req, res) => {
  const { 
    q, 
    type = 'all', 
    genre,
    language,
    sort = 'relevance',
    limit = 20,
    offset = 0
  } = req.query;
  
  if (!q || q.trim().length === 0) {
    throw new ValidationError('Search query is required');
  }
  
  const searchQuery = q.trim();
  const cacheKey = `search:${searchQuery}:${type}:${genre}:${sort}:${limit}:${offset}`;
  
  let results = await getCache(cacheKey);
  
  if (!results) {
    results = {};
    
    // Build search conditions
    const searchConditions = {
      [Series.sequelize.Sequelize.Op.or]: [
        {
          title: {
            [Series.sequelize.Sequelize.Op.iLike]: `%${searchQuery}%`
          }
        },
        {
          description: {
            [Series.sequelize.Sequelize.Op.iLike]: `%${searchQuery}%`
          }
        },
        {
          tags: {
            [Series.sequelize.Sequelize.Op.overlap]: [searchQuery.toLowerCase()]
          }
        }
      ]
    };
    
    // Add additional filters
    const where = {
      status: 'live',
      ...searchConditions
    };
    
    if (genre) {
      where.genre = {
        [Series.sequelize.Sequelize.Op.contains]: [genre]
      };
    }
    
    if (language) {
      where.language = language;
    }
    
    // Build order clause
    let order;
    switch (sort) {
      case 'relevance':
        // TODO: Implement proper relevance scoring
        order = [['view_count', 'DESC']];
        break;
      case 'latest':
        order = [['published_date', 'DESC']];
        break;
      case 'popular':
        order = [['view_count', 'DESC']];
        break;
      case 'rating':
        order = [['rating_average', 'DESC']];
        break;
      default:
        order = [['created_at', 'DESC']];
    }
    
    // Search series
    if (type === 'all' || type === 'series') {
      const series = await Series.findAll({
        where,
        order,
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: { exclude: ['metadata'] }
      });
      
      const totalSeries = await Series.count({ where });
      
      results.series = {
        items: series,
        total: totalSeries
      };
    }
    
    // Search episodes
    if (type === 'all' || type === 'episodes') {
      const episodeWhere = {
        status: 'live',
        [Episode.sequelize.Sequelize.Op.or]: [
          {
            title: {
              [Episode.sequelize.Sequelize.Op.iLike]: `%${searchQuery}%`
            }
          },
          {
            description: {
              [Episode.sequelize.Sequelize.Op.iLike]: `%${searchQuery}%`
            }
          }
        ]
      };
      
      const episodes = await Episode.findAll({
        where: episodeWhere,
        order: [['view_count', 'DESC']],
        limit: type === 'episodes' ? parseInt(limit) : 10,
        offset: type === 'episodes' ? parseInt(offset) : 0,
        attributes: { exclude: ['video_url', 'hls_manifest_url', 'dash_manifest_url'] },
        include: [
          {
            model: Series,
            as: 'series',
            attributes: ['id', 'title', 'thumbnail_url']
          }
        ]
      });
      
      const totalEpisodes = await Episode.count({ where: episodeWhere });
      
      results.episodes = {
        items: episodes,
        total: totalEpisodes
      };
    }
    
    // Cache for 5 minutes
    await setCache(cacheKey, results, 300);
  }
  
  res.json({
    success: true,
    data: {
      query: searchQuery,
      results,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    }
  });
}));

// ====================
// GET /search/suggestions
// Get search suggestions/autocomplete
// ====================
router.get('/suggestions', asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;
  
  if (!q || q.trim().length < 2) {
    return res.json({
      success: true,
      data: { suggestions: [] }
    });
  }
  
  const searchQuery = q.trim();
  const cacheKey = `search:suggestions:${searchQuery}:${limit}`;
  
  let suggestions = await getCache(cacheKey);
  
  if (!suggestions) {
    // Get matching series titles
    const series = await Series.findAll({
      where: {
        status: 'live',
        title: {
          [Series.sequelize.Sequelize.Op.iLike]: `%${searchQuery}%`
        }
      },
      order: [['view_count', 'DESC']],
      limit: parseInt(limit),
      attributes: ['id', 'title', 'thumbnail_url']
    });
    
    suggestions = series.map(s => ({
      type: 'series',
      id: s.id,
      title: s.title,
      thumbnail: s.thumbnail_url
    }));
    
    // Cache for 10 minutes
    await setCache(cacheKey, suggestions, 600);
  }
  
  res.json({
    success: true,
    data: { suggestions }
  });
}));

// ====================
// GET /search/popular
// Get popular search terms
// ====================
router.get('/popular', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const cacheKey = `search:popular:${limit}`;
  let popularSearches = await getCache(cacheKey);
  
  if (!popularSearches) {
    // Get most viewed series as popular searches
    const popular = await Series.findAll({
      where: { status: 'live' },
      order: [['view_count', 'DESC']],
      limit: parseInt(limit),
      attributes: ['title', 'genre']
    });
    
    popularSearches = [
      ...popular.map(s => s.title),
      ...popular.flatMap(s => s.genre)
    ].slice(0, parseInt(limit));
    
    // Remove duplicates
    popularSearches = [...new Set(popularSearches)];
    
    // Cache for 1 hour
    await setCache(cacheKey, popularSearches, 3600);
  }
  
  res.json({
    success: true,
    data: { popularSearches }
  });
}));

// ====================
// GET /search/filters
// Get available search filters
// ====================
router.get('/filters', asyncHandler(async (req, res) => {
  const cacheKey = 'search:filters';
  let filters = await getCache(cacheKey);
  
  if (!filters) {
    // Get unique genres
    const series = await Series.findAll({
      where: { status: 'live' },
      attributes: ['genre', 'language', 'age_rating']
    });
    
    const genres = [...new Set(series.flatMap(s => s.genre))].sort();
    const languages = [...new Set(series.map(s => s.language))].sort();
    const ageRatings = [...new Set(series.map(s => s.age_rating))].sort();
    
    filters = {
      genres,
      languages,
      ageRatings,
      sortOptions: [
        { value: 'relevance', label: 'Most Relevant' },
        { value: 'latest', label: 'Latest' },
        { value: 'popular', label: 'Most Popular' },
        { value: 'rating', label: 'Highest Rated' }
      ]
    };
    
    // Cache for 1 hour
    await setCache(cacheKey, filters, 3600);
  }
  
  res.json({
    success: true,
    data: { filters }
  });
}));

module.exports = router;
