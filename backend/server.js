/**
 * Server Entry Point
 * Loads environment variables and starts the HTTP server.
 */
import 'dotenv/config';
import app from './src/app.js';
import config from './src/config/index.js';
import logger from './src/utils/logger.js';

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🚀 Stratalift Backend running on port ${PORT}`, {
    env: config.nodeEnv,
    port: PORT,
  });
});
