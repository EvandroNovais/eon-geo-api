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

const router = Router();

// Health check endpoint
router.get('/health', asyncHandler(healthCheck));

// Geocoding routes
router.get(
  '/geocoding/cep/:cep',
  geocodingRateLimit,
  validateCepParam,
  asyncHandler(geocodeCep)
);

// Distance calculation routes
router.post(
  '/distance/ceps',
  distanceRateLimit,
  validateDistanceBetweenCeps,
  asyncHandler(calculateDistanceBetweenCeps)
);

router.post(
  '/distance/coordinates',
  distanceRateLimit,
  validateDistanceBetweenCoordinates,
  asyncHandler(calculateDistanceBetweenCoordinates)
);

export default router;