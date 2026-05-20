/**
 * Global Error Handler Middleware
 */
import logger from '../utils/logger.js';

export function errorMiddleware(err, req, res, next) {
  logger.error(err.message, { stack: err.stack, path: req.path });

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
