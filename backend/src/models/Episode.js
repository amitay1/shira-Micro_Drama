const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ====================
// Episode Model
// ====================
const Episode = sequelize.define('Episode', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  series_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'series',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  season_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'seasons',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  episode_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  
  slug: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in seconds'
  },
  
  thumbnail_url: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '9:16 portrait thumbnail'
  },
  
  poster_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  preview_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Short preview clip (5-10 seconds)'
  },
  
  video_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Master video file URL'
  },
  
  hls_manifest_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'HLS .m3u8 manifest URL for iOS/Safari'
  },
  
  dash_manifest_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'DASH .mpd manifest URL for Android/Chrome'
  },
  
  is_locked: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether episode requires unlock'
  },
  
  unlock_type: {
    type: DataTypes.ENUM('free', 'coins', 'subscription', 'premium'),
    defaultValue: 'free',
    comment: 'How to unlock this episode'
  },
  
  unlock_cost: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Cost in coins to unlock'
  },
  
  view_count: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  
  unique_view_count: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: 'Unique users who viewed'
  },
  
  like_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  completion_rate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.0,
    comment: 'Percentage of users who completed watching'
  },
  
  average_watch_time: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Average seconds watched'
  },
  
  status: {
    type: DataTypes.ENUM('draft', 'processing', 'ready', 'live', 'archived', 'failed'),
    defaultValue: 'draft'
  },
  
  processing_status: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Transcoding and processing status'
  },
  
  transcoding_job_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Job ID from transcoding service'
  },
  
  drm_key_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'DRM encryption key ID'
  },
  
  published_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  release_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Scheduled release date'
  },
  
  available_resolutions: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    comment: 'Available video resolutions: 240p, 360p, 540p, 720p, 1080p'
  },
  
  subtitles: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of subtitle tracks with language and URL'
  },
  
  audio_tracks: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Alternative audio tracks'
  },
  
  file_size: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: 'Total size in bytes of all video files'
  },
  
  aspect_ratio: {
    type: DataTypes.STRING(10),
    defaultValue: '9:16',
    comment: 'Video aspect ratio'
  },
  
  framerate: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: 'Video framerate (fps)'
  },
  
  bitrate: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Average bitrate in kbps'
  },
  
  codec: {
    type: DataTypes.STRING(50),
    defaultValue: 'H.264',
    comment: 'Video codec used'
  },
  
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional metadata'
  },
  
  analytics_summary: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Aggregated analytics data'
  }
}, {
  tableName: 'episodes',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['series_id'] },
    { fields: ['season_id'] },
    { fields: ['slug'], unique: true },
    { fields: ['episode_number'] },
    { fields: ['status'] },
    { fields: ['is_locked'] },
    { fields: ['unlock_type'] },
    { fields: ['published_date'] },
    { fields: ['release_date'] },
    { fields: ['view_count'] },
    { fields: ['created_at'] },
    { 
      fields: ['series_id', 'episode_number'],
      unique: true,
      name: 'unique_series_episode'
    }
  ]
});

// ====================
// Instance Methods
// ====================

/**
 * Increment view count
 */
Episode.prototype.incrementViews = async function(isUnique = false) {
  this.view_count = parseInt(this.view_count) + 1;
  if (isUnique) {
    this.unique_view_count = parseInt(this.unique_view_count) + 1;
  }
  await this.save();
};

/**
 * Check if episode is available for viewing
 */
Episode.prototype.isAvailable = function() {
  if (this.status !== 'live') return false;
  if (this.release_date && new Date(this.release_date) > new Date()) return false;
  return true;
};

/**
 * Check if user can access (free or unlocked)
 */
Episode.prototype.canAccess = function(userHasSubscription = false, userCoinsBalance = 0) {
  if (!this.is_locked) return true;
  if (this.unlock_type === 'free') return true;
  if (this.unlock_type === 'subscription' && userHasSubscription) return true;
  if (this.unlock_type === 'coins' && userCoinsBalance >= this.unlock_cost) return true;
  return false;
};

/**
 * Get playback URL based on platform
 */
Episode.prototype.getPlaybackUrl = function(platform = 'ios') {
  if (platform === 'ios' || platform === 'safari') {
    return this.hls_manifest_url;
  } else if (platform === 'android' || platform === 'chrome') {
    return this.dash_manifest_url || this.hls_manifest_url;
  }
  return this.hls_manifest_url;
};

/**
 * Update completion rate
 */
Episode.prototype.updateCompletionRate = async function(completed, totalWatched) {
  if (totalWatched === 0) return;
  this.completion_rate = (completed / totalWatched) * 100;
  await this.save();
};

// ====================
// Hooks
// ====================

/**
 * Generate slug before creating
 */
Episode.beforeCreate(async (episode) => {
  if (!episode.slug) {
    const Series = require('./Series');
    const series = await Series.findByPk(episode.series_id);
    
    const baseSlug = `${series.slug}-ep${episode.episode_number}`;
    episode.slug = baseSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Ensure uniqueness
    const existingEpisode = await Episode.findOne({ where: { slug: episode.slug } });
    if (existingEpisode) {
      episode.slug = `${episode.slug}-${Date.now()}`;
    }
  }
});

// ====================
// Class Methods
// ====================

/**
 * Find episode by slug
 */
Episode.findBySlug = async function(slug) {
  return await this.findOne({
    where: { 
      slug,
      status: 'live'
    }
  });
};

/**
 * Get episodes for a series
 */
Episode.getSeriesEpisodes = async function(seriesId, options = {}) {
  const whereClause = {
    series_id: seriesId,
    status: 'live'
  };
  
  return await this.findAll({
    where: whereClause,
    order: [['episode_number', 'ASC']],
    ...options
  });
};

/**
 * Get next episode
 */
Episode.getNextEpisode = async function(currentEpisodeId) {
  const currentEpisode = await this.findByPk(currentEpisodeId);
  if (!currentEpisode) return null;
  
  return await this.findOne({
    where: {
      series_id: currentEpisode.series_id,
      episode_number: { [sequelize.Sequelize.Op.gt]: currentEpisode.episode_number },
      status: 'live'
    },
    order: [['episode_number', 'ASC']]
  });
};

// ====================
// Exports
// ====================
module.exports = Episode;
