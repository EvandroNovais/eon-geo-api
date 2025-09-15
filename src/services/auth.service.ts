import crypto from 'crypto';
import winston from 'winston';
import { 
  ApiKey, 
  ApiKeyPlan, 
  ApiKeyStatus, 
  ApiPermission, 
  CreateApiKeyRequest, 
  CreateApiKeyResponse,
  ListApiKeysResponse,
  RATE_LIMIT_PLANS,
  DEFAULT_PERMISSIONS,
  RateLimit,
  Usage
} from '../types/auth.types';
import cacheService from './cache.service';
import config from '../config';

class AuthService {
  private logger: winston.Logger;
  private readonly API_KEY_PREFIX = 'eon_';
  private readonly CACHE_PREFIX = 'apikey:';
  private readonly USAGE_PREFIX = 'usage:';

  constructor() {
    this.logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });
  }

  /**
   * Generate a new API key
   */
  generateApiKey(): string {
    const randomBytes = crypto.randomBytes(32);
    const timestamp = Date.now().toString(36);
    const random = randomBytes.toString('hex');
    return `${this.API_KEY_PREFIX}${timestamp}_${random}`;
  }

  /**
   * Create a new API key
   */
  async createApiKey(request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    const id = crypto.randomUUID();
    const key = this.generateApiKey();
    const now = new Date();
    const expiresAt = request.expiresInDays 
      ? new Date(now.getTime() + (request.expiresInDays * 24 * 60 * 60 * 1000))
      : undefined;

    const apiKey: ApiKey = {
      id,
      key,
      name: request.name,
      description: request.description,
      plan: request.plan,
      status: ApiKeyStatus.ACTIVE,
      permissions: request.permissions.length > 0 
        ? request.permissions 
        : DEFAULT_PERMISSIONS[request.plan],
      rateLimit: RATE_LIMIT_PLANS[request.plan],
      usage: {
        totalRequests: 0,
        requestsToday: 0,
        requestsThisMonth: 0,
        lastResetDate: now
      },
      createdAt: now,
      updatedAt: now,
      expiresAt,
      lastUsedAt: undefined
    };

    // Store in cache (Redis)
    const cacheKey = this.getCacheKey(key);
    await cacheService.set(cacheKey, apiKey, 0); // No expiration

    this.logger.info(`Created new API key: ${id} for plan: ${request.plan}`);

    return {
      id: apiKey.id,
      key: apiKey.key,
      name: apiKey.name,
      plan: apiKey.plan,
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
      warning: 'Store this API key securely. It will not be shown again.'
    };
  }

  /**
   * Validate an API key
   */
  async validateApiKey(key: string): Promise<ApiKey | null> {
    if (!key || !key.startsWith(this.API_KEY_PREFIX)) {
      return null;
    }

    try {
      const cacheKey = this.getCacheKey(key);
      const apiKey = await cacheService.get<ApiKey>(cacheKey);

      if (!apiKey) {
        this.logger.warn(`API key not found: ${key.substring(0, 10)}...`);
        return null;
      }

      // Check if key is active
      if (apiKey.status !== ApiKeyStatus.ACTIVE) {
        this.logger.warn(`API key is not active: ${key.substring(0, 10)}... (status: ${apiKey.status})`);
        return null;
      }

      // Check if key has expired
      if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
        this.logger.warn(`API key has expired: ${key.substring(0, 10)}...`);
        await this.revokeApiKey(key);
        return null;
      }

      // Update last used timestamp
      apiKey.lastUsedAt = new Date();
      await cacheService.set(cacheKey, apiKey, 0);

      return apiKey;
    } catch (error) {
      this.logger.error('Error validating API key:', error);
      return null;
    }
  }

  /**
   * Check rate limits for an API key
   */
  async checkRateLimit(apiKey: ApiKey): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const now = new Date();
    const usageKey = `${this.USAGE_PREFIX}${apiKey.id}:${now.toISOString().split('T')[0]}`;
    
    try {
      let usage = await cacheService.get<Usage>(usageKey);
      
      if (!usage) {
        usage = {
          totalRequests: 0,
          requestsToday: 0,
          requestsThisMonth: 0,
          lastResetDate: now
        };
      }

      // Check daily limit
      if (usage.requestsToday >= apiKey.rateLimit.requestsPerDay) {
        const resetTime = new Date(now);
        resetTime.setHours(24, 0, 0, 0);
        
        return {
          allowed: false,
          remaining: 0,
          resetTime
        };
      }

      return {
        allowed: true,
        remaining: apiKey.rateLimit.requestsPerDay - usage.requestsToday,
        resetTime: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      this.logger.error('Error checking rate limit:', error);
      return { allowed: true, remaining: 1000, resetTime: new Date() };
    }
  }

  /**
   * Record API usage
   */
  async recordUsage(apiKey: ApiKey): Promise<void> {
    const now = new Date();
    const usageKey = `${this.USAGE_PREFIX}${apiKey.id}:${now.toISOString().split('T')[0]}`;
    
    try {
      let usage = await cacheService.get<Usage>(usageKey);
      
      if (!usage) {
        usage = {
          totalRequests: 0,
          requestsToday: 0,
          requestsThisMonth: 0,
          lastResetDate: now
        };
      }

      usage.totalRequests++;
      usage.requestsToday++;
      usage.requestsThisMonth++;

      // Store usage with 24h TTL
      await cacheService.set(usageKey, usage, 24 * 60 * 60);

      // Update API key usage
      const apiKeyCacheKey = this.getCacheKey(apiKey.key);
      apiKey.usage = usage;
      await cacheService.set(apiKeyCacheKey, apiKey, 0);

    } catch (error) {
      this.logger.error('Error recording usage:', error);
    }
  }

  /**
   * Check if API key has permission
   */
  hasPermission(apiKey: ApiKey, permission: ApiPermission): boolean {
    return apiKey.permissions.includes(permission);
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(key: string): Promise<boolean> {
    try {
      const cacheKey = this.getCacheKey(key);
      const apiKey = await cacheService.get<ApiKey>(cacheKey);

      if (!apiKey) {
        return false;
      }

      apiKey.status = ApiKeyStatus.REVOKED;
      apiKey.updatedAt = new Date();

      await cacheService.set(cacheKey, apiKey, 0);
      
      this.logger.info(`Revoked API key: ${apiKey.id}`);
      return true;
    } catch (error) {
      this.logger.error('Error revoking API key:', error);
      return false;
    }
  }

  /**
   * List API keys (without the actual key value)
   */
  async listApiKeys(): Promise<ListApiKeysResponse> {
    // For now, return empty list as we don't have a persistent database
    // In a real implementation, you would query a database
    return {
      apiKeys: [],
      total: 0
    };
  }

  /**
   * Create a master API key for initial setup
   */
  async createMasterApiKey(): Promise<string> {
    const masterKey = await this.createApiKey({
      name: 'Master Key',
      description: 'Administrator master key',
      plan: ApiKeyPlan.ENTERPRISE,
      permissions: [
        ApiPermission.GEOCODING_READ,
        ApiPermission.DISTANCE_READ,
        ApiPermission.ADMIN_READ,
        ApiPermission.ADMIN_WRITE
      ]
    });

    this.logger.info(`Created master API key: ${masterKey.id}`);
    return masterKey.key;
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }
}

export default new AuthService();