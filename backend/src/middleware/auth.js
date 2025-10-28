const jwt = require('jsonwebtoken');
const { getCache, setCache } = require('../config/redis');
const logger = require('../utils/logger');

// ====================
// JWT Token Verification Middleware
// ====================
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header must be in format: Bearer <token>'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Check if token is blacklisted (logged out)
    const isBlacklisted = await getCache(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please log in again.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user session exists in cache
    const cachedUser = await getCache(`user:${decoded.userId}`);
    
    if (cachedUser) {
      // Use cached user data
      req.user = cachedUser;
    } else {
      // Fetch user from database
      const User = require('../models/User');
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token is invalid.'
        });
      }
      
      // Cache user data for 15 minutes
      await setCache(`user:${decoded.userId}`, user.toJSON(), 900);
      req.user = user.toJSON();
    }
    
    // Attach user ID and token to request
    req.userId = decoded.userId;
    req.token = token;
    
    // Log user action
    logger.logUserAction(req.userId, 'API_REQUEST', {
      method: req.method,
      path: req.path,
      ip: req.ip
    });
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
        code: 'INVALID_TOKEN'
      });
    }
    
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error occurred'
    });
  }
};

// ====================
// Admin Authorization Middleware
// ====================
const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Check if user has admin role
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      logger.warn(`Unauthorized admin access attempt by user ${req.userId}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization error occurred'
    });
  }
};

// ====================
// Optional Auth Middleware (for public/private routes)
// ====================
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue as guest
      req.user = null;
      req.userId = null;
      return next();
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const cachedUser = await getCache(`user:${decoded.userId}`);
    
    if (cachedUser) {
      req.user = cachedUser;
      req.userId = decoded.userId;
    } else {
      const User = require('../models/User');
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });
      
      if (user) {
        await setCache(`user:${decoded.userId}`, user.toJSON(), 900);
        req.user = user.toJSON();
        req.userId = decoded.userId;
      }
    }
    
    next();
  } catch (error) {
    // Token is invalid, continue as guest
    req.user = null;
    req.userId = null;
    next();
  }
};

// ====================
// Subscription Check Middleware
// ====================
const subscriptionMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const Subscription = require('../models/Subscription');
    const subscription = await Subscription.findOne({
      where: {
        user_id: req.userId,
        status: 'active'
      }
    });
    
    if (!subscription || new Date(subscription.end_date) < new Date()) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required to access this content',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }
    
    req.subscription = subscription;
    next();
  } catch (error) {
    logger.error('Subscription middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Subscription verification error'
    });
  }
};

// ====================
// Exports
// ====================
module.exports = authMiddleware;
module.exports.adminMiddleware = adminMiddleware;
module.exports.optionalAuthMiddleware = optionalAuthMiddleware;
module.exports.subscriptionMiddleware = subscriptionMiddleware;
