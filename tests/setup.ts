// Test setup file
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Mock Redis for tests
jest.mock('../src/services/cache.service', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  isConnectedToRedis: jest.fn().mockReturnValue(true),
  generateKey: jest.fn((prefix: string, ...parts: string[]) => `${prefix}:${parts.join(':')}`),
}));

// Global test timeout
jest.setTimeout(10000);