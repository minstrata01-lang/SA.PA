/**
 * CORS configuration
 */
import config from './index.js';

export const corsOptions = {
  origin: config.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

export default corsOptions;
