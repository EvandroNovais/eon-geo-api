import { Request } from 'express';

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  description?: string;
  userId?: string;
  plan: ApiKeyPlan;
  status: ApiKeyStatus;
  permissions: ApiPermission[];
  rateLimit: RateLimit;
  usage: Usage;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
}

export enum ApiKeyPlan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export enum ApiKeyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked'
}

export enum ApiPermission {
  GEOCODING_READ = 'geocoding:read',
  DISTANCE_READ = 'distance:read',
  ADMIN_READ = 'admin:read',
  ADMIN_WRITE = 'admin:write'
}

export interface RateLimit {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  requestsPerMonth: number;
}

export interface Usage {
  totalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
  lastResetDate: Date;
}

export interface CreateApiKeyRequest {
  name: string;
  description?: string;
  plan: ApiKeyPlan;
  permissions: ApiPermission[];
  expiresInDays?: number;
}

export interface CreateApiKeyResponse {
  id: string;
  key: string;
  name: string;
  plan: ApiKeyPlan;
  permissions: ApiPermission[];
  rateLimit: RateLimit;
  createdAt: Date;
  expiresAt?: Date;
  warning: string;
}

export interface ListApiKeysResponse {
  apiKeys: Omit<ApiKey, 'key'>[];
  total: number;
}

export interface AuthenticatedRequest extends Request {
  apiKey?: ApiKey;
  user?: {
    id: string;
    permissions: ApiPermission[];
  };
}

// Rate limiting plans configuration
export const RATE_LIMIT_PLANS: Record<ApiKeyPlan, RateLimit> = {
  [ApiKeyPlan.FREE]: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
    requestsPerDay: 1000,
    requestsPerMonth: 10000
  },
  [ApiKeyPlan.BASIC]: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    requestsPerMonth: 100000
  },
  [ApiKeyPlan.PREMIUM]: {
    requestsPerMinute: 300,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    requestsPerMonth: 1000000
  },
  [ApiKeyPlan.ENTERPRISE]: {
    requestsPerMinute: 1000,
    requestsPerHour: 20000,
    requestsPerDay: 200000,
    requestsPerMonth: 5000000
  }
};

// Default permissions by plan
export const DEFAULT_PERMISSIONS: Record<ApiKeyPlan, ApiPermission[]> = {
  [ApiKeyPlan.FREE]: [ApiPermission.GEOCODING_READ],
  [ApiKeyPlan.BASIC]: [ApiPermission.GEOCODING_READ, ApiPermission.DISTANCE_READ],
  [ApiKeyPlan.PREMIUM]: [ApiPermission.GEOCODING_READ, ApiPermission.DISTANCE_READ],
  [ApiKeyPlan.ENTERPRISE]: [
    ApiPermission.GEOCODING_READ, 
    ApiPermission.DISTANCE_READ, 
    ApiPermission.ADMIN_READ
  ]
};