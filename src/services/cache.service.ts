import { createClient, RedisClientType, RedisClientOptions } from 'redis';
import { CacheEntry } from '../types/api.types';
import config from '../config';
import winston from 'winston';

class CacheService {
  private client: RedisClientType;
  private logger: winston.Logger;
  private isConnected: boolean = false;

  constructor() {
    // Configure Redis client options
    const redisOptions: RedisClientOptions = {
      url: config.redis.url,
      socket: {
        connectTimeout: config.redis.connectionTimeout || 5000,
        commandTimeout: config.redis.commandTimeout || 3000,
        reconnectStrategy: (retries) => {
          // Exponential backoff: wait 2^retries * 100ms, max 5 seconds
          const delay = Math.min(Math.pow(2, retries) * 100, 5000);
          this.logger.warn(`Redis reconnection attempt ${retries + 1}, waiting ${delay}ms`);
          return delay;
        }
      },
      // Enable retry on failure
      retry_unfulfilled_commands: true,
    };

    this.client = createClient(redisOptions);
    this.logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [new winston.transports.Console()],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      this.logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis client error:', err);
      this.isConnected = false;
    });

    this.client.on('disconnect', () => {
      this.logger.info('Redis client disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      this.isConnected = false;
    } catch (error) {
      this.logger.error('Failed to disconnect from Redis:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, skipping cache get');
      return null;
    }

    try {
      const data = await this.client.get(key);
      if (!data) return null;

      const cacheEntry: CacheEntry<T> = JSON.parse(data);
      
      // Check if cache entry has expired
      if (Date.now() > cacheEntry.timestamp + cacheEntry.ttl * 1000) {
        await this.delete(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      this.logger.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, skipping cache set');
      return;
    }

    try {
      const ttl = ttlSeconds || config.redis.ttl;
      const cacheEntry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl,
      };

      await this.client.setEx(key, ttl, JSON.stringify(cacheEntry));
    } catch (error) {
      this.logger.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('Redis not connected, skipping cache delete');
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error('Cache delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error('Cache exists error:', error);
      return false;
    }
  }

  isConnectedToRedis(): boolean {
    return this.isConnected;
  }

  generateKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`;
  }
}

export default new CacheService();