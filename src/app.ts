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
    },
    paths: {
      '/api/v1/health': {
        get: {
          summary: 'Health check endpoint',
          tags: ['Health'],
          description: 'Verifica o status da aplicação e serviços externos (Redis, ViaCEP)',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: {
                              status: { type: 'string', enum: ['healthy', 'unhealthy'], example: 'healthy' },
                              timestamp: { type: 'string', format: 'date-time' },
                              uptime: { type: 'number', example: 3600 },
                              services: {
                                type: 'object',
                                properties: {
                                  redis: { type: 'string', enum: ['connected', 'disconnected'] },
                                  viaCep: { type: 'string', enum: ['available', 'unavailable'] }
                                }
                              }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/geocoding/cep/{cep}': {
        get: {
          summary: 'Geocodifica um CEP brasileiro',
          tags: ['Geocoding'],
          description: 'Converte um CEP brasileiro em coordenadas geográficas',
          parameters: [
            {
              in: 'path',
              name: 'cep',
              required: true,
              schema: { type: 'string', pattern: '^[0-9]{5}-?[0-9]{3}$' },
              description: 'CEP brasileiro no formato 12345-678 ou 12345678',
              examples: {
                paulista: { value: '01310-100', summary: 'Avenida Paulista, São Paulo' },
                copacabana: { value: '22070-900', summary: 'Copacabana, Rio de Janeiro' }
              }
            }
          ],
          responses: {
            '200': {
              description: 'Geocodificação realizada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/GeocodingResult' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '400': {
              description: 'Formato de CEP inválido',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' }
                }
              }
            },
            '404': {
              description: 'CEP não encontrado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' }
                }
              }
            }
          }
        }
      },
      '/api/v1/distance/ceps': {
        post: {
          summary: 'Calcula distância entre dois CEPs',
          tags: ['Distance'],
          description: 'Calcula a distância geodésica entre dois CEPs brasileiros usando a fórmula de Haversine',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['originCep', 'destinationCep'],
                  properties: {
                    originCep: { type: 'string', pattern: '^[0-9]{5}-?[0-9]{3}$', example: '01310-100' },
                    destinationCep: { type: 'string', pattern: '^[0-9]{5}-?[0-9]{3}$', example: '20040-020' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Distância calculada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/DistanceResult' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            '400': {
              description: 'Formato de CEP inválido',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiError' }
                }
              }
            }
          }
        }
      },
      '/api/v1/distance/coordinates': {
        post: {
          summary: 'Calcula distância entre coordenadas geográficas',
          tags: ['Distance'],
          description: 'Calcula a distância geodésica entre dois pontos usando coordenadas de latitude e longitude',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['origin', 'destination'],
                  properties: {
                    origin: { $ref: '#/components/schemas/Coordinates' },
                    destination: { $ref: '#/components/schemas/Coordinates' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Distância calculada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/DistanceResult' }
                        }
                      }
                    ]
                  }
                }
              }
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
      connectSrc: ["'self'"], // Allow fetch to same origin for swagger.json
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins for API access
  methods: ['GET', 'POST', 'OPTIONS'],
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
  res.header('Content-Type', 'application/json; charset=utf-8');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).json(swaggerSpec);
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