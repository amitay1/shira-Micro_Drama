const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ====================
// Season Model
// ====================
const Season = sequelize.define('Season', {
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
  
  season_number: {
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
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  thumbnail_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  total_episodes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  release_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  status: {
    type: DataTypes.ENUM('draft', 'ready', 'live', 'archived'),
    defaultValue: 'draft'
  },
  
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'seasons',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['series_id'] },
    { fields: ['season_number'] },
    { fields: ['status'] },
    {
      fields: ['series_id', 'season_number'],
      unique: true,
      name: 'unique_series_season'
    }
  ]
});

module.exports = Season;
