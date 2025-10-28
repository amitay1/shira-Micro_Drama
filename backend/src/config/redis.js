const Redis = require('ioredis');
const logger = require('../utils/logger');

// ====================
// Redis Client Configuration
// ====================
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  lazyConnect: false
};

// ====================
// Create Redis Client
// ====================
let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = new Redis(redisConfig);
    
    // Connection event listeners
    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });
    
    redisClient.on('ready', () => {
      logger.info('Redis connection has been established successfully.');
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });
    
    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });
    
    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
    
    return redisClient;
  } catch (error) {
    logger.error('Unable to connect to Redis:', error);
    throw error;
  }
};

// ====================
// Redis Helper Functions
// ====================

/**
 * Get value from Redis cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Parsed value or null
 */
const getCache = async (key) => {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
};

/**
 * Set value in Redis cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 3600)
 * @returns {Promise<boolean>} - Success status
 */
const setCache = async (key, value, ttl = 3600) => {
  try {
    await redisClient.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error(`Redis SET error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete key from Redis cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Success status
 */
const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Redis DEL error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete multiple keys matching a pattern
 * @param {string} pattern - Key pattern (e.g., 'user:*')
 * @returns {Promise<number>} - Number of keys deleted
 */
const deleteCachePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) return 0;
    
    const result = await redisClient.del(...keys);
    return result;
  } catch (error) {
    logger.error(`Redis DEL pattern error for ${pattern}:`, error);
    return 0;
  }
};

/**
 * Check if key exists in Redis
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Exists status
 */
const existsCache = async (key) => {
  try {
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error(`Redis EXISTS error for key ${key}:`, error);
    return false;
  }
};

/**
 * Increment counter in Redis
 * @param {string} key - Counter key
 * @param {number} amount - Amount to increment (default: 1)
 * @returns {Promise<number>} - New counter value
 */
const incrementCounter = async (key, amount = 1) => {
  try {
    return await redisClient.incrby(key, amount);
  } catch (error) {
    logger.error(`Redis INCR error for key ${key}:`, error);
    return 0;
  }
};

// ====================
// Close Redis Connection
// ====================
const closeRedisConnection = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
    throw error;
  }
};

// ====================
// Exports
// ====================
module.exports = {
  redisClient,
  connectRedis,
  closeRedisConnection,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  existsCache,
  incrementCounter
};
