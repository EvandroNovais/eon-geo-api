import { Router } from 'express';
import { createApiKey, listApiKeys, revokeApiKey, createMasterKey } from '../controllers/auth.controller';
import authMiddleware from '../middleware/auth.middleware';
import { ApiPermission } from '../types/auth.types';

const router = Router();

// Create API key (requires admin permissions)
router.post('/keys', 
  authMiddleware.authenticate,
  authMiddleware.requirePermission(ApiPermission.ADMIN_WRITE),
  createApiKey
);

// List API keys (requires admin read permissions)
router.get('/keys',
  authMiddleware.authenticate,
  authMiddleware.requirePermission(ApiPermission.ADMIN_READ),
  listApiKeys
);

// Revoke API key (requires admin write permissions)
router.delete('/keys/:keyId',
  authMiddleware.authenticate,
  authMiddleware.requirePermission(ApiPermission.ADMIN_WRITE),
  revokeApiKey
);

// Create master key (development only, no auth required)
router.post('/master-key', createMasterKey);

export default router;