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
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                       example: 3600
 *                       description: Uptime in seconds
 *                     services:
 *                       type: object
 *                       properties:
 *                         redis:
 *                           type: string
 *                           enum: [connected, disconnected]
 *                           example: connected
 *                         viaCep:
 *                           type: string
 *                           enum: [available, unavailable]
 *                           example: available
 *                 timestamp:
 *                   type: string
 *                   format: date-time
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