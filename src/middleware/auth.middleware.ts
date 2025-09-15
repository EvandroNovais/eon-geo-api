import { Request, Response, NextFunction } from 'express';
import { ApiPermission, AuthenticatedRequest } from '../types/auth.types';
import authService from '../services/auth.service';
import { createErrorResponse, createApiError } from '../utils/response.util';
import { ErrorCodes } from '../types/api.types';
import winston from 'winston';
import config from '../config';

class AuthMiddleware {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });
  }

  /**
   * Main authentication middleware
   */
  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiKey = this.extractApiKey(req);

      if (!apiKey) {
        res.status(401).json(createErrorResponse(createApiError(
          ErrorCodes.UNAUTHORIZED,
          'API key is required',
          'Provide a valid API key in the X-API-Key header or as api_key query parameter'
        )));
        return;
      }

      // Validate API key
      const validatedApiKey = await authService.validateApiKey(apiKey);
      if (!validatedApiKey) {
        res.status(401).json(createErrorResponse(createApiError(
          ErrorCodes.INVALID_API_KEY,
          'Invalid API key',
          'The provided API key is invalid or has been revoked'
        )));
        return;
      }

      // Check rate limits
      const rateLimitResult = await authService.checkRateLimit(validatedApiKey);
      if (!rateLimitResult.allowed) {
        res.status(429).json(createErrorResponse(createApiError(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          'Rate limit exceeded',
          `Daily limit of ${validatedApiKey.rateLimit.requestsPerDay} requests exceeded. Resets at ${rateLimitResult.resetTime.toISOString()}`
        )));
        return;
      }

      // Record usage
      await authService.recordUsage(validatedApiKey);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': validatedApiKey.rateLimit.requestsPerDay.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': Math.floor(rateLimitResult.resetTime.getTime() / 1000).toString(),
        'X-API-Plan': validatedApiKey.plan
      });

      // Attach API key to request
      req.apiKey = validatedApiKey;
      req.user = {
        id: validatedApiKey.id,
        permissions: validatedApiKey.permissions
      };

      this.logger.info(`Authenticated request with API key: ${validatedApiKey.id} (plan: ${validatedApiKey.plan})`);
      next();

    } catch (error) {
      this.logger.error('Authentication error:', error);
      res.status(500).json(createErrorResponse(createApiError(
        ErrorCodes.INTERNAL_ERROR,
        'Authentication failed',
        'An error occurred during authentication'
      )));
    }
  };

  /**
   * Permission check middleware factory
   */
  requirePermission = (permission: ApiPermission) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.apiKey) {
        res.status(401).json(createErrorResponse(createApiError(
          ErrorCodes.UNAUTHORIZED,
          'Authentication required',
          'This endpoint requires authentication'
        )));
        return;
      }

      if (!authService.hasPermission(req.apiKey, permission)) {
        res.status(403).json(createErrorResponse(createApiError(
          ErrorCodes.FORBIDDEN,
          'Insufficient permissions',
          `This endpoint requires ${permission} permission`
        )));
        return;
      }

      next();
    };
  };

  /**
   * Optional authentication middleware (doesn't fail if no API key)
   */
  optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const apiKey = this.extractApiKey(req);

      if (apiKey) {
        const validatedApiKey = await authService.validateApiKey(apiKey);
        if (validatedApiKey) {
          req.apiKey = validatedApiKey;
          req.user = {
            id: validatedApiKey.id,
            permissions: validatedApiKey.permissions
          };
        }
      }

      next();
    } catch (error) {
      this.logger.error('Optional authentication error:', error);
      next(); // Continue without authentication
    }
  };

  /**
   * Admin-only middleware
   */
  requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.apiKey) {
      res.status(401).json(createErrorResponse(createApiError(
        ErrorCodes.UNAUTHORIZED,
        'Authentication required',
        'Admin access requires authentication'
      )));
      return;
    }

    const hasAdminRead = authService.hasPermission(req.apiKey, ApiPermission.ADMIN_READ);
    const hasAdminWrite = authService.hasPermission(req.apiKey, ApiPermission.ADMIN_WRITE);

    if (!hasAdminRead && !hasAdminWrite) {
      res.status(403).json(createErrorResponse(createApiError(
        ErrorCodes.FORBIDDEN,
        'Admin access required',
        'This endpoint requires administrator permissions'
      )));
      return;
    }

    next();
  };

  /**
   * Extract API key from request headers or query parameters
   */
  private extractApiKey(req: Request): string | null {
    // Check X-API-Key header (preferred)
    const headerKey = req.header('X-API-Key');
    if (headerKey) {
      return headerKey;
    }

    // Check Authorization header (Bearer token format)
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check query parameter (fallback)
    const queryKey = req.query.api_key as string;
    if (queryKey) {
      return queryKey;
    }

    return null;
  }
}

export default new AuthMiddleware();