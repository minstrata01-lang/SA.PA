/**
 * Rate Limiter Middleware
 * Protects API endpoints from abuse.
 */
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: true, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for order creation
export const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: true, message: 'Too many order attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
