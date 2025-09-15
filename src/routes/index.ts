import { Router } from 'express';
import { geocodeCep } from '../controllers/geocoding.controller';
import { calculateDistanceBetweenCeps, calculateDistanceBetweenCoordinates } from '../controllers/distance.controller';
import { healthCheck } from '../controllers/health.controller';
import { asyncHandler } from '../middleware/error.middleware';
import { 
  validateCepParam, 
  validateDistanceBetweenCeps, 
  validateDistanceBetweenCoordinates 
} from '../middleware/validation.middleware';
import { 
  geocodingRateLimit, 
  distanceRateLimit 
} from '../middleware/rateLimit.middleware';
import authMiddleware from '../middleware/auth.middleware';
import apiKeyRateLimit from '../middleware/apiKeyRateLimit.middleware';
import { ApiPermission } from '../types/auth.types';
import authRoutes from './auth.routes';

const router = Router();

// Authentication routes
router.use('/auth', authRoutes);

// Health check endpoint (public - no authentication required)
router.get('/health', asyncHandler(healthCheck));

// Geocoding routes (protected)
router.get(
  '/geocoding/cep/:cep',
  authMiddleware.authenticate,
  authMiddleware.requirePermission(ApiPermission.GEOCODING_READ),
  apiKeyRateLimit.checkApiKeyRateLimit,
  apiKeyRateLimit.recordApiKeyUsage,
  validateCepParam,
  asyncHandler(geocodeCep)
);

// Distance calculation routes (protected)
router.post(
  '/distance/ceps',
  authMiddleware.authenticate,
  authMiddleware.requirePermission(ApiPermission.DISTANCE_READ),
  apiKeyRateLimit.checkApiKeyRateLimit,
  apiKeyRateLimit.recordApiKeyUsage,
  validateDistanceBetweenCeps,
  asyncHandler(calculateDistanceBetweenCeps)
);

router.post(
  '/distance/coordinates',
  authMiddleware.authenticate,
  authMiddleware.requirePermission(ApiPermission.DISTANCE_READ),
  apiKeyRateLimit.checkApiKeyRateLimit,
  apiKeyRateLimit.recordApiKeyUsage,
  validateDistanceBetweenCoordinates,
  asyncHandler(calculateDistanceBetweenCoordinates)
);

export default router;