import { Request, Response, NextFunction } from 'express';
import { createErrorResponse, createApiError } from '../utils/response.util';
import { ErrorCodes } from '../types/api.types';
import winston from 'winston';
import config from '../config';

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    ...(config.logging.file ? [new winston.transports.File({ filename: config.logging.file })] : []),
  ],
});

/**
 * Global error handling middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Handle known error codes
  if (Object.values(ErrorCodes).includes(error.message as ErrorCodes)) {
    const statusCode = getStatusCodeForErrorCode(error.message as ErrorCodes);
    const apiError = createApiError(
      error.message as ErrorCodes,
      getErrorMessage(error.message as ErrorCodes)
    );
    
    res.status(statusCode).json(createErrorResponse(apiError));
    return;
  }

  // Handle validation errors from Joi
  if (error.name === 'ValidationError') {
    const apiError = createApiError(
      ErrorCodes.VALIDATION_ERROR,
      'Validation failed',
      error.message
    );
    
    res.status(400).json(createErrorResponse(apiError));
    return;
  }

  // Default to internal server error
  const apiError = createApiError(
    ErrorCodes.INTERNAL_SERVER_ERROR,
    'An unexpected error occurred'
  );
  
  res.status(500).json(createErrorResponse(apiError));
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  const apiError = createApiError(
    'ENDPOINT_NOT_FOUND',
    `Endpoint ${req.method} ${req.path} not found`
  );
  
  res.status(404).json(createErrorResponse(apiError));
}

/**
 * Async error wrapper to catch async errors in route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Maps error codes to HTTP status codes
 */
function getStatusCodeForErrorCode(errorCode: ErrorCodes): number {
  const statusMap: Record<ErrorCodes, number> = {
    [ErrorCodes.INVALID_CEP]: 400,
    [ErrorCodes.CEP_NOT_FOUND]: 404,
    [ErrorCodes.INVALID_COORDINATES]: 400,
    [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
    [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
    [ErrorCodes.INTERNAL_SERVER_ERROR]: 500,
    [ErrorCodes.VALIDATION_ERROR]: 400,
    [ErrorCodes.CACHE_ERROR]: 500,
    [ErrorCodes.UNAUTHORIZED]: 401,
    [ErrorCodes.FORBIDDEN]: 403,
    [ErrorCodes.INVALID_API_KEY]: 401,
    [ErrorCodes.API_KEY_EXPIRED]: 401,
    [ErrorCodes.INTERNAL_ERROR]: 500,
  };

  return statusMap[errorCode] || 500;
}

/**
 * Maps error codes to user-friendly messages
 */
function getErrorMessage(errorCode: ErrorCodes): string {
  const messageMap: Record<ErrorCodes, string> = {
    [ErrorCodes.INVALID_CEP]: 'Invalid CEP format',
    [ErrorCodes.CEP_NOT_FOUND]: 'CEP not found',
    [ErrorCodes.INVALID_COORDINATES]: 'Invalid coordinates',
    [ErrorCodes.SERVICE_UNAVAILABLE]: 'External service temporarily unavailable',
    [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
    [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Internal server error',
    [ErrorCodes.VALIDATION_ERROR]: 'Validation error',
    [ErrorCodes.CACHE_ERROR]: 'Cache service error',
    [ErrorCodes.UNAUTHORIZED]: 'Authentication required',
    [ErrorCodes.FORBIDDEN]: 'Access forbidden',
    [ErrorCodes.INVALID_API_KEY]: 'Invalid API key',
    [ErrorCodes.API_KEY_EXPIRED]: 'API key has expired',
    [ErrorCodes.INTERNAL_ERROR]: 'Internal error',
  };

  return messageMap[errorCode] || 'Unknown error';
}