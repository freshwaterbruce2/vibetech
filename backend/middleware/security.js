const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Security middleware configuration for production deployment
 */

// Helmet security middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:8082"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false // Allow embedding for some use cases
});

// Rate limiting middleware
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs: windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: message || 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent')
    });
    res.status(429).json({ error: 'Too many requests, please try again later' });
  }
});

// General rate limiter
const generalRateLimit = createRateLimit();

// Strict rate limiter for authentication endpoints
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again in 15 minutes'
);

// API rate limiter
const apiRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  30, // 30 requests per minute
  'API rate limit exceeded, please slow down'
);

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      url: req.url,
      method: req.method,
      errors: errors.array(),
      ip: req.ip
    });
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Common validation rules
const blogValidation = [
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters')
    .trim()
    .escape(),
  body('content')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long')
    .trim(),
  body('category')
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
    .trim()
    .escape(),
  body('slug')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens')
    .isLength({ min: 1, max: 100 })
    .withMessage('Slug must be between 1 and 100 characters'),
  body('excerpt')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Excerpt must be less than 500 characters')
    .trim()
];

const leadValidation = [
  body('company_name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Company name must be between 1 and 100 characters')
    .trim()
    .escape(),
  body('contact_email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('contact_name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Contact name must be between 1 and 100 characters')
    .trim()
    .escape(),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
    .trim()
];

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Don't expose error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(err.status || 500).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = {
  securityHeaders,
  generalRateLimit,
  authRateLimit,
  apiRateLimit,
  validateRequest,
  blogValidation,
  leadValidation,
  errorHandler
};