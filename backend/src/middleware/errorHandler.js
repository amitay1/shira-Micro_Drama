const logger = require('../utils/logger');

// ====================
// Custom Error Classes
// ====================
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

class PaymentError extends AppError {
  constructor(message) {
    super(message, 402, 'PAYMENT_REQUIRED');
  }
}

// ====================
// Error Handler Middleware
// ====================
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.userId || 'guest',
    ip: req.ip
  });
  
  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      errors
    });
  }
  
  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0].path;
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code: 'DUPLICATE_ENTRY'
    });
  }
  
  // Sequelize Foreign Key Constraint Error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference to related resource',
      code: 'FOREIGN_KEY_ERROR'
    });
  }
  
  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  // Multer File Upload Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size is too large',
        code: 'FILE_TOO_LARGE'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      code: 'FILE_UPLOAD_ERROR'
    });
  }
  
  // MongoDB Errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      code: 'INVALID_ID'
    });
  }
  
  // Custom App Errors
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.errors && { errors: err.errors })
    });
  }
  
  // Default Error Response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  });
};

// ====================
// Async Handler Wrapper
// ====================
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ====================
// Exports
// ====================
module.exports = errorHandler;
module.exports.AppError = AppError;
module.exports.ValidationError = ValidationError;
module.exports.NotFoundError = NotFoundError;
module.exports.UnauthorizedError = UnauthorizedError;
module.exports.ForbiddenError = ForbiddenError;
module.exports.ConflictError = ConflictError;
module.exports.PaymentError = PaymentError;
module.exports.asyncHandler = asyncHandler;
