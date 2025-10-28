const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { setCache, deleteCache } = require('../config/redis');
const { ValidationError, UnauthorizedError } = require('../middleware/errorHandler');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// ====================
// Helper Functions
// ====================

/**
 * Generate JWT tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  );
  
  const refreshToken = jwt.sign(
    { userId, tokenId: uuidv4() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d' }
  );
  
  return { accessToken, refreshToken };
};

// ====================
// POST /auth/register
// Register new user
// ====================
router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, full_name, date_of_birth, country, language } = req.body;
  
  // Validation
  if (!email || !password || !full_name) {
    throw new ValidationError('Email, password, and full name are required');
  }
  
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  
  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ValidationError('Email already registered');
  }
  
  // Create new user
  const user = await User.create({
    email: email.toLowerCase(),
    password,
    full_name,
    date_of_birth,
    country,
    language: language || 'en'
  });
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);
  
  // Cache user data
  await setCache(`user:${user.id}`, user.toSafeObject(), 900); // 15 minutes
  
  logger.logUserAction(user.id, 'REGISTER', { email: user.email });
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toSafeObject(),
      accessToken,
      refreshToken
    }
  });
}));

// ====================
// POST /auth/login
// Login user
// ====================
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password, device_id, platform } = req.body;
  
  // Validation
  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }
  
  // Find user
  const user = await User.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  // Check if user is active
  if (!user.is_active || user.is_banned) {
    throw new UnauthorizedError('Account is inactive or banned');
  }
  
  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }
  
  // Update last login
  user.last_login = new Date();
  user.login_count += 1;
  await user.save();
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);
  
  // Cache user data
  await setCache(`user:${user.id}`, user.toSafeObject(), 900);
  
  logger.logUserAction(user.id, 'LOGIN', {
    email: user.email,
    platform,
    device_id
  });
  
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toSafeObject(),
      accessToken,
      refreshToken
    }
  });
}));

// ====================
// POST /auth/logout
// Logout user
// ====================
router.post('/logout', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Blacklist the token
    await setCache(`blacklist:${token}`, true, 7 * 24 * 60 * 60); // 7 days
    
    // Get user ID from token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Remove user from cache
      await deleteCache(`user:${decoded.userId}`);
      
      logger.logUserAction(decoded.userId, 'LOGOUT', {});
    } catch (error) {
      // Token invalid, but still return success
    }
  }
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

// ====================
// POST /auth/refresh-token
// Refresh access token
// ====================
router.post('/refresh-token', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }
  
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
    
    res.json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}));

// ====================
// POST /auth/forgot-password
// Request password reset
// ====================
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    throw new ValidationError('Email is required');
  }
  
  const user = await User.findByEmail(email);
  
  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({
      success: true,
      message: 'If the email exists, a password reset link will be sent'
    });
  }
  
  // Generate reset token
  const resetToken = uuidv4();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  user.reset_password_token = resetToken;
  user.reset_password_expires = resetExpires;
  await user.save();
  
  // TODO: Send email with reset link
  // const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  // await sendPasswordResetEmail(user.email, resetLink);
  
  logger.info(`Password reset requested for user ${user.id}`);
  
  res.json({
    success: true,
    message: 'If the email exists, a password reset link will be sent',
    ...(process.env.NODE_ENV === 'development' && { resetToken }) // Only in dev
  });
}));

// ====================
// POST /auth/reset-password
// Reset password with token
// ====================
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    throw new ValidationError('Token and new password are required');
  }
  
  if (newPassword.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }
  
  // Find user with valid reset token
  const user = await User.findOne({
    where: {
      reset_password_token: token,
      reset_password_expires: {
        [User.sequelize.Sequelize.Op.gt]: new Date()
      }
    }
  });
  
  if (!user) {
    throw new UnauthorizedError('Invalid or expired reset token');
  }
  
  // Update password
  user.password = newPassword;
  user.reset_password_token = null;
  user.reset_password_expires = null;
  await user.save();
  
  // Invalidate all existing sessions
  await deleteCache(`user:${user.id}`);
  
  logger.logUserAction(user.id, 'PASSWORD_RESET', {});
  
  res.json({
    success: true,
    message: 'Password reset successful'
  });
}));

// ====================
// POST /auth/verify-email
// Verify email address
// ====================
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    throw new ValidationError('Verification token is required');
  }
  
  const user = await User.findOne({
    where: { verification_token: token }
  });
  
  if (!user) {
    throw new UnauthorizedError('Invalid verification token');
  }
  
  user.is_verified = true;
  user.verification_token = null;
  await user.save();
  
  logger.logUserAction(user.id, 'EMAIL_VERIFIED', {});
  
  res.json({
    success: true,
    message: 'Email verified successfully'
  });
}));

// ====================
// Exports
// ====================
module.exports = router;
