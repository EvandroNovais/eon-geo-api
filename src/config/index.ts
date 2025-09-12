import { Config } from '../types/api.types';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL || '86400', 10),
    connectionTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000', 10),
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '3000', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE,
  },
  apiKeys: {
    opencage: process.env.OPENCAGE_API_KEY,
    googleMaps: process.env.GOOGLE_MAPS_API_KEY,
  },
};

export default config;