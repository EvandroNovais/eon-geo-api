import { setTimeout } from 'timers/promises';
import { ApiResponse, ApiError } from '../types/api.types';

/**
 * Creates a standardized success response
 * @param data - The data to include in the response
 * @returns Formatted API response
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a standardized error response
 * @param error - The error information
 * @returns Formatted API error response
 */
export function createErrorResponse(error: ApiError): ApiResponse<null> {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates an ApiError object
 * @param code - Error code
 * @param message - Error message
 * @param details - Optional error details
 * @returns ApiError object
 */
export function createApiError(
  code: string,
  message: string,
  details?: string
): ApiError {
  return {
    code,
    message,
    details,
  };
}

/**
 * Delays execution for the specified time
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return setTimeout(ms);
}

/**
 * Retries an async operation with exponential backoff
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @returns Promise with the operation result
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      const delayMs = baseDelay * Math.pow(2, attempt);
      await delay(delayMs);
    }
  }

  throw lastError!;
}

/**
 * Validates that a value is not null or undefined
 * @param value - Value to check
 * @param name - Name of the value for error message
 * @throws Error if value is null or undefined
 */
export function assertNotNull<T>(value: T | null | undefined, name: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`${name} cannot be null or undefined`);
  }
}