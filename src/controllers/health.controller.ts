import { Request, Response } from 'express';
import { HealthCheck } from '../types/api.types';
import { createSuccessResponse } from '../utils/response.util';
import cacheService from '../services/cache.service';
import geocodingService from '../services/geocoding.service';

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Verifica o status da aplicação e serviços externos (Redis, ViaCEP)
 *     responses:
 *       200:
 *         description: Service is healthy
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
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                           example: healthy
 *                           description: Overall health status
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                           example: '2025-09-12T14:00:00.000Z'
 *                         uptime:
 *                           type: number
 *                           example: 3600
 *                           description: Application uptime in seconds
 *                         services:
 *                           type: object
 *                           properties:
 *                             redis:
 *                               type: string
 *                               enum: [connected, disconnected]
 *                               example: connected
 *                               description: Redis cache service status
 *                             viaCep:
 *                               type: string
 *                               enum: [available, unavailable]
 *                               example: available
 *                               description: ViaCEP external API status
 *       503:
 *         description: Service is unhealthy
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
 *                         status:
 *                           type: string
 *                           example: unhealthy
 *                         services:
 *                           type: object
 *                           description: One or more services are not available
 */
export async function healthCheck(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  
  // Check external services
  const [redisStatus, viaCepStatus] = await Promise.allSettled([
    checkRedisStatus(),
    checkViaCepStatus(),
  ]);

  const isRedisConnected = redisStatus.status === 'fulfilled' && redisStatus.value;
  const isViaCepAvailable = viaCepStatus.status === 'fulfilled' && viaCepStatus.value;

  const healthData: HealthCheck = {
    status: isRedisConnected && isViaCepAvailable ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      redis: isRedisConnected ? 'connected' : 'disconnected',
      viaCep: isViaCepAvailable ? 'available' : 'unavailable',
    },
  };

  const responseTime = Date.now() - startTime;
  res.setHeader('X-Response-Time', `${responseTime}ms`);
  
  const statusCode = healthData.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(createSuccessResponse(healthData));
}

async function checkRedisStatus(): Promise<boolean> {
  try {
    return cacheService.isConnectedToRedis();
  } catch {
    return false;
  }
}

async function checkViaCepStatus(): Promise<boolean> {
  try {
    return await geocodingService.isViaCepAvailable();
  } catch {
    return false;
  }
}