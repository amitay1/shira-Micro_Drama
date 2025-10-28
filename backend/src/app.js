const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const { connectPostgreSQL } = require('./config/database');
const { connectMongoDB } = require('./config/mongodb');
const { connectRedis } = require('./config/redis');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const seriesRoutes = require('./routes/series');
const episodeRoutes = require('./routes/episodes');
const playbackRoutes = require('./routes/playback');
const purchaseRoutes = require('./routes/purchases');
const subscriptionRoutes = require('./routes/subscriptions');
const feedRoutes = require('./routes/feed');
const searchRoutes = require('./routes/search');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const seasonPassRoutes = require('./routes/seasonPass');

const app = express();

// ====================
// Security Middleware
// ====================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'https:'],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ====================
// CORS Configuration
// ====================
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID', 'X-Platform'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page']
};

app.use(cors(corsOptions));

// ====================
// Rate Limiting
// ====================
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// ====================
// Body Parsing & Compression
// ====================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());

// ====================
// Logging
// ====================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// ====================
// Health Check
// ====================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// ====================
// API Routes
// ====================
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

// Public routes (no authentication required)
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/feed`, feedRoutes); // Some feed endpoints may be public
app.use(`${API_PREFIX}/series`, seriesRoutes); // Browse content
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/season-pass`, seasonPassRoutes); // Season Pass purchasing

// Protected routes (authentication required)
app.use(`${API_PREFIX}/users`, authMiddleware, userRoutes);
app.use(`${API_PREFIX}/episodes`, authMiddleware, episodeRoutes);
app.use(`${API_PREFIX}/playback`, authMiddleware, playbackRoutes);
app.use(`${API_PREFIX}/purchases`, authMiddleware, purchaseRoutes);
app.use(`${API_PREFIX}/subscriptions`, authMiddleware, subscriptionRoutes);
app.use(`${API_PREFIX}/notifications`, authMiddleware, notificationRoutes);

// Admin routes (admin authentication required)
app.use(`${API_PREFIX}/admin`, authMiddleware, adminRoutes);

// ====================
// 404 Handler
// ====================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// ====================
// Error Handler
// ====================
app.use(errorHandler);

// ====================
// Database Connections
// ====================
const initializeDatabase = async () => {
  try {
    // Connect to PostgreSQL
    await connectPostgreSQL();
    logger.info('✓ PostgreSQL connected successfully');

    // Connect to MongoDB
    await connectMongoDB();
    logger.info('✓ MongoDB connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('✓ Redis connected successfully');

    logger.info('✓ All database connections established');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// ====================
// Server Initialization
// ====================
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Initialize databases
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎬 Shira Streaming Platform - Backend API              ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV?.toUpperCase().padEnd(10)}                              ║
║   Port: ${PORT}                                             ║
║   API Version: ${process.env.API_VERSION || 'v1'}                                   ║
║                                                           ║
║   Status: ✓ Server is running                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
      logger.info(`API Base URL: http://localhost:${PORT}${API_PREFIX}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// ====================
// Graceful Shutdown
// ====================
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
