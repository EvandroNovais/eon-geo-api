import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import authService from '../services/auth.service';
import { createErrorResponse, createApiError } from '../utils/response.util';
import { ErrorCodes } from '../types/api.types';
import winston from 'winston';
import config from '../config';

class ApiKeyRateLimit {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });
  }

  /**
   * Rate limiting middleware that uses API key specific limits
   */
  checkApiKeyRateLimit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // If no API key is attached, skip rate limiting (auth middleware will handle it)
      if (!req.apiKey) {
        next();
        return;
      }

      // Check rate limits using the API key
      const rateLimitResult = await authService.checkRateLimit(req.apiKey);
      
      if (!rateLimitResult.allowed) {
        res.status(429).json(createErrorResponse(createApiError(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          'API key rate limit exceeded',
          `Daily limit of ${req.apiKey.rateLimit.requestsPerDay} requests exceeded for your ${req.apiKey.plan} plan. Resets at ${rateLimitResult.resetTime.toISOString()}`
        )));
        return;
      }

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': req.apiKey.rateLimit.requestsPerDay.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime.getTime() / 1000).toString(),
        'X-API-Plan': req.apiKey.plan
      });

      next();
    } catch (error) {
      this.logger.error('Rate limit check error:', error);
      // Continue on error - don't block the request
      next();
    }
  };

  /**
   * Record usage after successful request
   */
  recordApiKeyUsage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Record usage after response is sent
    res.on('finish', async () => {
      if (req.apiKey && res.statusCode < 500) {
        try {
          await authService.recordUsage(req.apiKey);
        } catch (error) {
          this.logger.error('Error recording API usage:', error);
        }
      }
    });

    next();
  };
}

const apiKeyRateLimit = new ApiKeyRateLimit();

export default apiKeyRateLimit;
export { apiKeyRateLimit };