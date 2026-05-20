/**
 * Express Application Setup
 * Configures middleware chain and mounts API routes.
 */
import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import routes from './routes/index.js';

const app = express();

// ── Global Middleware ───────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ───────────────────────────────────────
app.use('/api', apiLimiter);

// ── API Routes ──────────────────────────────────────────
app.use('/api', routes);

// ── Health Check ────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global Error Handler (must be last) ─────────────────
app.use(errorMiddleware);

export default app;
