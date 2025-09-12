import rateLimit from 'express-rate-limit';
import { createErrorResponse, createApiError } from '../utils/response.util';
import { ErrorCodes } from '../types/api.types';
import config from '../config';

/**
 * General rate limiting middleware
 */
export const generalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes by default
  max: config.rateLimit.maxRequests, // 100 requests per windowMs by default
  message: createErrorResponse(
    createApiError(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      'Too many requests from this IP, please try again later'
    )
  ),
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json(
      createErrorResponse(
        createApiError(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          'Too many requests from this IP, please try again later'
        )
      )
    );
  },
});

/**
 * Strict rate limiting for geocoding endpoints
 */
export const geocodingRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: createErrorResponse(
    createApiError(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      'Too many geocoding requests, please try again later'
    )
  ),
  handler: (req, res) => {
    res.status(429).json(
      createErrorResponse(
        createApiError(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          'Too many geocoding requests, please try again later'
        )
      )
    );
  },
});

/**
 * Moderate rate limiting for distance calculation endpoints
 */
export const distanceRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute
  message: createErrorResponse(
    createApiError(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      'Too many distance calculation requests, please try again later'
    )
  ),
  handler: (req, res) => {
    res.status(429).json(
      createErrorResponse(
        createApiError(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          'Too many distance calculation requests, please try again later'
        )
      )
    );
  },
});