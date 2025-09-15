import { Request, Response } from 'express';
import { CreateApiKeyRequest, AuthenticatedRequest } from '../types/auth.types';
import authService from '../services/auth.service';
import { createSuccessResponse, createErrorResponse, createApiError } from '../utils/response.util';
import { ErrorCodes } from '../types/api.types';

/**
 * @swagger
 * /api/v1/auth/keys:
 *   post:
 *     summary: Create a new API key
 *     tags: [Authentication]
 *     description: |
 *       Creates a new API key with specified permissions and plan.
 *       Requires admin permissions to create keys for others.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - plan
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My App API Key"
 *                 description: Descriptive name for the API key
 *               description:
 *                 type: string
 *                 example: "API key for mobile application"
 *                 description: Optional description
 *               plan:
 *                 type: string
 *                 enum: [free, basic, premium, enterprise]
 *                 example: "basic"
 *                 description: API key plan determining rate limits
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [geocoding:read, distance:read, admin:read, admin:write]
 *                 example: ["geocoding:read", "distance:read"]
 *                 description: Specific permissions (optional, defaults based on plan)
 *               expiresInDays:
 *                 type: number
 *                 example: 365
 *                 description: Number of days until expiration (optional)
 *           examples:
 *             basic_key:
 *               summary: Basic API Key
 *               value:
 *                 name: "Production App"
 *                 plan: "basic"
 *                 description: "API key for production application"
 *             premium_key:
 *               summary: Premium API Key
 *               value:
 *                 name: "Analytics Service"
 *                 plan: "premium"
 *                 permissions: ["geocoding:read", "distance:read"]
 *                 expiresInDays: 730
 *     responses:
 *       201:
 *         description: API key created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Unique API key identifier
 *                         key:
 *                           type: string
 *                           description: The actual API key (store securely)
 *                         name:
 *                           type: string
 *                         plan:
 *                           type: string
 *                         permissions:
 *                           type: array
 *                           items:
 *                             type: string
 *                         rateLimit:
 *                           type: object
 *                           properties:
 *                             requestsPerDay:
 *                               type: number
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         warning:
 *                           type: string
 *                           example: "Store this API key securely. It will not be shown again."
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function createApiKey(req: Request, res: Response): Promise<void> {
  try {
    const createRequest: CreateApiKeyRequest = req.body;

    // Validate required fields
    if (!createRequest.name || !createRequest.plan) {
      res.status(400).json(createErrorResponse(createApiError(
        ErrorCodes.VALIDATION_ERROR,
        'Missing required fields',
        'Name and plan are required'
      )));
      return;
    }

    const result = await authService.createApiKey(createRequest);
    res.status(201).json(createSuccessResponse(result));
  } catch (error) {
    res.status(500).json(createErrorResponse(createApiError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to create API key',
      'An error occurred while creating the API key'
    )));
  }
}

/**
 * @swagger
 * /api/v1/auth/keys:
 *   get:
 *     summary: List API keys
 *     tags: [Authentication]
 *     description: |
 *       Lists all API keys (without exposing the actual key values).
 *       Requires admin permissions.
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         apiKeys:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               plan:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                               permissions:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                               usage:
 *                                 type: object
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                               lastUsedAt:
 *                                 type: string
 *                                 format: date-time
 *                         total:
 *                           type: number
 */
export async function listApiKeys(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const result = await authService.listApiKeys();
    res.json(createSuccessResponse(result));
  } catch (error) {
    res.status(500).json(createErrorResponse(createApiError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to list API keys',
      'An error occurred while retrieving API keys'
    )));
  }
}

/**
 * @swagger
 * /api/v1/auth/keys/{keyId}:
 *   delete:
 *     summary: Revoke an API key
 *     tags: [Authentication]
 *     description: |
 *       Revokes an API key, making it invalid for future requests.
 *       Requires admin permissions.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: keyId
 *         required: true
 *         schema:
 *           type: string
 *         description: API key identifier or the key itself
 *         example: "eon_abc123_def456"
 *     responses:
 *       200:
 *         description: API key revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         revoked:
 *                           type: boolean
 *                           example: true
 *                         message:
 *                           type: string
 *                           example: "API key revoked successfully"
 *       404:
 *         description: API key not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function revokeApiKey(req: Request, res: Response): Promise<void> {
  try {
    const { keyId } = req.params;
    const success = await authService.revokeApiKey(keyId);

    if (!success) {
      res.status(404).json(createErrorResponse(createApiError(
        ErrorCodes.INVALID_API_KEY,
        'API key not found',
        'The specified API key could not be found'
      )));
      return;
    }

    res.json(createSuccessResponse({
      revoked: true,
      message: 'API key revoked successfully'
    }));
  } catch (error) {
    res.status(500).json(createErrorResponse(createApiError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to revoke API key',
      'An error occurred while revoking the API key'
    )));
  }
}

/**
 * @swagger
 * /api/v1/auth/master-key:
 *   post:
 *     summary: Create master API key (Development only)
 *     tags: [Authentication]
 *     description: |
 *       Creates a master API key with full permissions.
 *       Only available in development environment for initial setup.
 *     responses:
 *       201:
 *         description: Master API key created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         masterKey:
 *                           type: string
 *                           description: The master API key
 *                         warning:
 *                           type: string
 *       403:
 *         description: Not available in production
 */
export async function createMasterKey(req: Request, res: Response): Promise<void> {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json(createErrorResponse(createApiError(
      ErrorCodes.FORBIDDEN,
      'Master key creation not allowed in production',
      'Master keys can only be created in development environment'
    )));
    return;
  }

  try {
    const masterKey = await authService.createMasterApiKey();
    res.status(201).json(createSuccessResponse({
      masterKey,
      warning: 'Store this master key securely. It has full admin access.'
    }));
  } catch (error) {
    res.status(500).json(createErrorResponse(createApiError(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to create master key',
      'An error occurred while creating the master key'
    )));
  }
}