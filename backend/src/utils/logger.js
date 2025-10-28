const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ====================
// Custom Log Formats
// ====================
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// ====================
// Winston Logger Configuration
// ====================
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'shira-backend' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Console output for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  
  // Handle unhandled rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// ====================
// Production-specific configuration
// ====================
if (process.env.NODE_ENV === 'production') {
  // Remove console transport in production
  logger.remove(winston.transports.Console);
  
  // Add more specific log levels
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'warn.log'),
    level: 'warn',
    maxsize: 5242880,
    maxFiles: 3
  }));
}

// ====================
// Helper Functions
// ====================

/**
 * Log API request
 */
logger.logRequest = (req, res) => {
  logger.info(`${req.method} ${req.url} - ${res.statusCode} - ${req.ip}`);
};

/**
 * Log database query
 */
logger.logQuery = (query, duration) => {
  logger.debug(`Query executed in ${duration}ms: ${query}`);
};

/**
 * Log video processing
 */
logger.logVideoProcessing = (videoId, status, message) => {
  logger.info(`Video Processing [${videoId}] - ${status}: ${message}`);
};

/**
 * Log payment transaction
 */
logger.logPayment = (userId, amount, currency, status) => {
  logger.info(`Payment [${userId}] - ${amount} ${currency} - ${status}`);
};

/**
 * Log user action
 */
logger.logUserAction = (userId, action, details) => {
  logger.info(`User Action [${userId}] - ${action}: ${JSON.stringify(details)}`);
};

// ====================
// Exports
// ====================
module.exports = logger;
