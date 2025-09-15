export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  cep: string;
  logradouro: string;
  complemento?: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
}

export interface GeocodingResult {
  coordinates: Coordinates;
  address: Address;
}

export interface DistanceResult {
  distance: {
    kilometers: number;
    miles: number;
  };
  origin: Coordinates;
  destination: Coordinates;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
}

export interface DistanceBetweenCepsRequest {
  originCep: string;
  destinationCep: string;
}

export interface DistanceBetweenCoordinatesRequest {
  origin: Coordinates;
  destination: Coordinates;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface Config {
  port: number;
  host: string;
  nodeEnv: string;
  redis: {
    url: string;
    ttl: number;
    connectionTimeout?: number;
    commandTimeout?: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    file?: string;
  };
  apiKeys?: {
    opencage?: string;
    googleMaps?: string;
  };
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    redis: 'connected' | 'disconnected';
    viaCep: 'available' | 'unavailable';
  };
}

export enum ErrorCodes {
  INVALID_CEP = 'INVALID_CEP',
  CEP_NOT_FOUND = 'CEP_NOT_FOUND',
  INVALID_COORDINATES = 'INVALID_COORDINATES',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_API_KEY = 'INVALID_API_KEY',
  API_KEY_EXPIRED = 'API_KEY_EXPIRED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  meta?: any;
}