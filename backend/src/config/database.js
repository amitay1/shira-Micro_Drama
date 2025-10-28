const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// ====================
// PostgreSQL Connection with Sequelize
// ====================
const sequelize = new Sequelize(
  process.env.DB_NAME || 'shira_streaming',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    
    // Connection Pool Configuration
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      min: parseInt(process.env.DB_POOL_MIN) || 5,
      acquire: 30000,
      idle: 10000
    },
    
    // Logging
    logging: process.env.NODE_ENV === 'development' 
      ? (msg) => logger.debug(msg) 
      : false,
    
    // Performance
    benchmark: process.env.NODE_ENV === 'development',
    
    // Timezone
    timezone: '+00:00',
    
    // SSL Configuration for production
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    
    // Model definitions
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// ====================
// Connection Test & Sync
// ====================
const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connection has been established successfully.');
    
    // Auto-sync models in development (careful in production!)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: false }); // Create tables if they don't exist
      logger.info('Database models synchronized');
    }
    
    return sequelize;
  } catch (error) {
    logger.error('Unable to connect to PostgreSQL database:', error);
    throw error;
  }
};

// ====================
// Connection Close
// ====================
const closePostgreSQLConnection = async () => {
  try {
    await sequelize.close();
    logger.info('PostgreSQL connection closed');
  } catch (error) {
    logger.error('Error closing PostgreSQL connection:', error);
    throw error;
  }
};

// ====================
// Exports
// ====================
module.exports = {
  sequelize,
  connectPostgreSQL,
  closePostgreSQLConnection,
  Sequelize
};
