const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ====================
// PlaybackSession Model
// ====================
const PlaybackSession = sequelize.define('PlaybackSession', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  episode_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'episodes',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  
  started_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  last_position: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Last playback position in seconds'
  },
  
  duration_watched: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total seconds watched'
  },
  
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether user watched 90%+ of episode'
  },
  
  completion_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 100
    }
  },
  
  platform: {
    type: DataTypes.ENUM('ios', 'android', 'web'),
    allowNull: false
  },
  
  device_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Unique device identifier'
  },
  
  device_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Device model/type'
  },
  
  os_version: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  
  app_version: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  
  country: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  video_quality: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Quality level watched (240p, 360p, 720p, etc.)'
  },
  
  buffering_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of buffering events'
  },
  
  buffering_duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Total buffering time in seconds'
  },
  
  errors: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of playback errors encountered'
  },
  
  quality_switches: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Log of quality changes during playback'
  },
  
  session_metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional session data'
  }
}, {
  tableName: 'playback_sessions',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['episode_id'] },
    { fields: ['series_id'] },
    { fields: ['completed'] },
    { fields: ['platform'] },
    { fields: ['device_id'] },
    { fields: ['country'] },
    { fields: ['started_at'] },
    { fields: ['created_at'] },
    {
      fields: ['user_id', 'episode_id'],
      name: 'user_episode_session'
    }
  ]
});

// ====================
// Instance Methods
// ====================

/**
 * Update playback progress
 */
PlaybackSession.prototype.updateProgress = async function(position, quality = null) {
  this.last_position = position;
  
  if (quality) {
    this.video_quality = quality;
  }
  
  // Check if completed (90% watched)
  const Episode = require('./Episode');
  const episode = await Episode.findByPk(this.episode_id);
  
  if (episode) {
    this.completion_percentage = (position / episode.duration) * 100;
    
    if (this.completion_percentage >= 90 && !this.completed) {
      this.completed = true;
    }
  }
  
  await this.save();
};

/**
 * End playback session
 */
PlaybackSession.prototype.endSession = async function(finalPosition) {
  this.ended_at = new Date();
  this.last_position = finalPosition;
  
  const watchDuration = Math.floor((this.ended_at - this.started_at) / 1000);
  this.duration_watched = watchDuration;
  
  await this.save();
};

/**
 * Add buffering event
 */
PlaybackSession.prototype.addBuffering = async function(duration) {
  this.buffering_count += 1;
  this.buffering_duration += duration;
  await this.save();
};

/**
 * Log quality switch
 */
PlaybackSession.prototype.logQualitySwitch = async function(fromQuality, toQuality, timestamp) {
  this.quality_switches.push({
    from: fromQuality,
    to: toQuality,
    timestamp: timestamp || new Date()
  });
  await this.save();
};

// ====================
// Class Methods
// ====================

/**
 * Start new playback session
 */
PlaybackSession.startSession = async function(userId, episodeId, seriesId, platform, deviceId, metadata = {}) {
  return await this.create({
    user_id: userId,
    episode_id: episodeId,
    series_id: seriesId,
    platform,
    device_id: deviceId,
    started_at: new Date(),
    session_metadata: metadata
  });
};

/**
 * Get active session for user and episode
 */
PlaybackSession.getActiveSession = async function(userId, episodeId) {
  return await this.findOne({
    where: {
      user_id: userId,
      episode_id: episodeId,
      ended_at: null
    },
    order: [['started_at', 'DESC']]
  });
};

/**
 * Get user's watch history
 */
PlaybackSession.getUserHistory = async function(userId, limit = 50) {
  return await this.findAll({
    where: { user_id: userId },
    order: [['started_at', 'DESC']],
    limit
  });
};

/**
 * Get last watched episode for series
 */
PlaybackSession.getLastWatched = async function(userId, seriesId) {
  return await this.findOne({
    where: {
      user_id: userId,
      series_id: seriesId
    },
    order: [['started_at', 'DESC']]
  });
};

// ====================
// Exports
// ====================
module.exports = PlaybackSession;
