import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import config from './config';
import routes from './routes';
import cacheService from './services/cache.service';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { generalRateLimit } from './middleware/rateLimit.middleware';
import winston from 'winston';

const app = express();

// Logger setup
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

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EON GEO API - Geocodificação de CEPs',
      version: '1.0.0',
      description: 'API RESTful robusta para geocodificação de CEPs brasileiros e cálculo de distâncias entre coordenadas geográficas',
      contact: {
        name: 'EON GEO API Support',
        email: 'support@eongeo.com',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Development Server',
      },
      {
        url: 'https://geo-api.eontecnologia.com',
        description: 'Production Server',
      },
    ],
    tags: [
      {
        name: 'Info',
        description: 'API information and documentation',
      },
      {
        name: 'Health',
        description: 'Health check and system status',
      },
      {
        name: 'Geocoding',
        description: 'CEP geocoding operations',
      },
      {
        name: 'Distance',
        description: 'Distance calculation operations',
      },
    ],
    components: {
      schemas: {
        Coordinates: {
          type: 'object',
          required: ['latitude', 'longitude'],
          properties: {
            latitude: {
              type: 'number',
              minimum: -90,
              maximum: 90,
              example: -23.5613,
              description: 'Latitude in decimal degrees'
            },
            longitude: {
              type: 'number',
              minimum: -180,
              maximum: 180,
              example: -46.6565,
              description: 'Longitude in decimal degrees'
            }
          }
        },
        Address: {
          type: 'object',
          properties: {
            cep: {
              type: 'string',
              example: '01310-100',
              description: 'Brazilian postal code'
            },
            logradouro: {
              type: 'string',
              example: 'Avenida Paulista',
              description: 'Street name'
            },
            bairro: {
              type: 'string',
              example: 'Bela Vista',
              description: 'Neighborhood'
            },
            localidade: {
              type: 'string',
              example: 'São Paulo',
              description: 'City name'
            },
            uf: {
              type: 'string',
              example: 'SP',
              description: 'State abbreviation'
            }
          }
        },
        GeocodingResult: {
          type: 'object',
          properties: {
            coordinates: {
              '$ref': '#/components/schemas/Coordinates'
            },
            address: {
              '$ref': '#/components/schemas/Address'
            }
          }
        },
        DistanceResult: {
          type: 'object',
          properties: {
            distance: {
              type: 'object',
              properties: {
                kilometers: {
                  type: 'number',
                  example: 357.42,
                  description: 'Distance in kilometers'
                },
                miles: {
                  type: 'number', 
                  example: 222.15,
                  description: 'Distance in miles'
                }
              }
            },
            origin: {
              '$ref': '#/components/schemas/Coordinates'
            },
            destination: {
              '$ref': '#/components/schemas/Coordinates'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data (varies by endpoint)'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-09-12T14:00:00.000Z'
            }
          }
        },
        ApiError: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'INVALID_CEP'
                },
                message: {
                  type: 'string',
                  example: 'CEP format is invalid'
                },
                details: {
                  type: 'string',
                  example: 'CEP must contain 8 digits'
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-09-12T14:00:00.000Z'
            }
          }
        }
      }
    }
  },
  apis: [
    './src/controllers/*.ts', 
    './src/routes/*.ts',
    './src/app.ts'
  ], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.nodeEnv === 'production' ? false : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Rate limiting
app.use(generalRateLimit);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// API documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0 }
    .swagger-ui .scheme-container { background: none; box-shadow: none; }
  `,
  customSiteTitle: 'EON GEO API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true,
  },
}));

// Debug endpoint for swagger spec
app.get('/api/swagger.json', (req, res) => {
  res.json(swaggerSpec);
});

// API routes
app.use('/api/v1', routes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Information
 *     tags: [Info]
 *     description: Returns basic information about the EON GEO API
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: EON GEO API
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 description:
 *                   type: string
 *                 environment:
 *                   type: string
 *                   example: production
 *                 endpoints:
 *                   type: object
 *                 documentation:
 *                   type: string
 *                   example: /api/docs
 */
// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'EON GEO API',
    version: '1.0.0',
    description: 'API RESTful robusta para geocodificação de CEPs brasileiros e cálculo de distâncias entre coordenadas geográficas',
    environment: config.nodeEnv,
    endpoints: {
      health: '/api/v1/health',
      docs: '/api/docs',
      geocoding: '/api/v1/geocoding/cep/{cep}',
      distance: {
        ceps: '/api/v1/distance/ceps',
        coordinates: '/api/v1/distance/coordinates'
      }
    },
    documentation: '/api/docs',
    examples: {
      geocoding: '/api/v1/geocoding/cep/01310-100',
      health: '/api/v1/health'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await cacheService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await cacheService.disconnect();
  process.exit(0);
});

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to Redis
    await cacheService.connect();
    logger.info('Connected to Redis successfully');

    const server = app.listen(config.port, config.host, () => {
      logger.info(`Server running on http://${config.host}:${config.port}`);
      logger.info(`API Documentation available at http://${config.host}:${config.port}/api/docs`);
      logger.info(`Health check available at http://${config.host}:${config.port}/api/v1/health`);
    });

    // Handle server shutdown
    const shutdown = async (): Promise<void> => {
      logger.info('Shutting down server...');
      server.close(() => {
        logger.info('HTTP server closed');
      });
      
      await cacheService.disconnect();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;