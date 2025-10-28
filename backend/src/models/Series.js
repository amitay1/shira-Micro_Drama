const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ====================
// Series Model
// ====================
const Series = sequelize.define('Series', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      len: {
        args: [1, 500],
        msg: 'Title must be between 1 and 500 characters'
      }
    }
  },
  
  slug: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  
  short_description: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  
  thumbnail_url: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '9:16 portrait thumbnail'
  },
  
  banner_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Landscape banner for web'
  },
  
  trailer_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Trailer video URL'
  },
  
  genre: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Array of genres: drama, thriller, romance, comedy, action, horror, sci-fi, etc.'
  },
  
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Searchable tags'
  },
  
  age_rating: {
    type: DataTypes.ENUM('G', 'PG', 'PG-13', '13+', '16+', '18+', 'R', 'NC-17'),
    defaultValue: 'PG-13',
    comment: 'Content rating'
  },
  
  language: {
    type: DataTypes.STRING(5),
    defaultValue: 'en',
    validate: {
      isIn: {
        args: [['en', 'he', 'ar', 'es', 'fr', 'ko', 'ja', 'zh']],
        msg: 'Invalid language code'
      }
    }
  },
  
  available_languages: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['en'],
    comment: 'Languages available for subtitles/audio'
  },
  
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1900,
      max: 2100
    }
  },
  
  total_seasons: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  
  total_episodes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  
  season_pass_price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 49.90,
    comment: 'Price for full season access in ILS'
  },
  
  free_episodes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    comment: 'Number of free episodes before paywall'
  },
  
  status: {
    type: DataTypes.ENUM('draft', 'ready', 'live', 'archived', 'deleted'),
    defaultValue: 'draft'
  },
  
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Show in featured carousel'
  },
  
  is_trending: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Mark as trending'
  },
  
  is_original: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Platform original content'
  },
  
  view_count: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  
  like_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  favorite_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  rating_average: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.0,
    validate: {
      min: 0.0,
      max: 5.0
    }
  },
  
  rating_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  completion_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.0,
    comment: 'Percentage of users who complete the series'
  },
  
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'User ID of creator/admin who added this'
  },
  
  published_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  release_schedule: {
    type: DataTypes.JSONB,
    defaultValue: null,
    comment: 'Release schedule for episodes'
  },
  
  cast: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of cast members with name, role, photo'
  },
  
  crew: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Director, writer, producer, etc.'
  },
  
  production_company: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  imdb_id: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  
  tmdb_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional flexible metadata'
  },
  
  seo_title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  seo_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  seo_keywords: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
}, {
  tableName: 'series',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['status'] },
    { fields: ['is_featured'] },
    { fields: ['is_trending'] },
    { fields: ['genre'], using: 'GIN' },
    { fields: ['tags'], using: 'GIN' },
    { fields: ['language'] },
    { fields: ['year'] },
    { fields: ['created_at'] },
    { fields: ['published_date'] },
    { fields: ['view_count'] },
    { fields: ['rating_average'] }
  ]
});

// ====================
// Instance Methods
// ====================

/**
 * Increment view count
 */
Series.prototype.incrementViews = async function(amount = 1) {
  this.view_count = parseInt(this.view_count) + amount;
  await this.save();
};

/**
 * Update rating
 */
Series.prototype.updateRating = async function(newRating) {
  const totalRating = this.rating_average * this.rating_count;
  this.rating_count += 1;
  this.rating_average = (totalRating + newRating) / this.rating_count;
  await this.save();
};

/**
 * Check if series is available
 */
Series.prototype.isAvailable = function() {
  return this.status === 'live' && 
         (!this.published_date || new Date(this.published_date) <= new Date());
};

// ====================
// Hooks
// ====================

/**
 * Generate slug before creating
 */
Series.beforeCreate(async (series) => {
  if (!series.slug) {
    series.slug = series.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Ensure uniqueness
    const existingSeries = await Series.findOne({ where: { slug: series.slug } });
    if (existingSeries) {
      series.slug = `${series.slug}-${Date.now()}`;
    }
  }
});

// ====================
// Class Methods
// ====================

/**
 * Find live series by slug
 */
Series.findBySlug = async function(slug) {
  return await this.findOne({
    where: { 
      slug,
      status: 'live'
    }
  });
};

/**
 * Get featured series
 */
Series.getFeatured = async function(limit = 10) {
  return await this.findAll({
    where: {
      status: 'live',
      is_featured: true
    },
    order: [['created_at', 'DESC']],
    limit
  });
};

/**
 * Get trending series
 */
Series.getTrending = async function(limit = 20) {
  return await this.findAll({
    where: {
      status: 'live',
      is_trending: true
    },
    order: [
      ['view_count', 'DESC'],
      ['rating_average', 'DESC']
    ],
    limit
  });
};

// ====================
// Exports
// ====================
module.exports = Series;
