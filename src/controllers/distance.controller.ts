import { Request, Response } from 'express';
import distanceService from '../services/distance.service';
import { createSuccessResponse } from '../utils/response.util';
import { DistanceBetweenCepsRequest, DistanceBetweenCoordinatesRequest } from '../types/api.types';

/**
 * @swagger
 * /api/v1/distance/ceps:
 *   post:
 *     summary: Calcula distância entre dois CEPs
 *     tags: [Distance]
 *     description: |
 *       Calcula a distância geodésica entre dois CEPs brasileiros usando a fórmula de Haversine.
 *       Os CEPs são primeiro geocodificados para obter as coordenadas e então a distância é calculada.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originCep
 *               - destinationCep
 *             properties:
 *               originCep:
 *                 type: string
 *                 pattern: '^[0-9]{5}-?[0-9]{3}$'
 *                 example: "01310-100"
 *                 description: CEP de origem (São Paulo)
 *               destinationCep:
 *                 type: string
 *                 pattern: '^[0-9]{5}-?[0-9]{3}$'
 *                 example: "20040-020"
 *                 description: CEP de destino (Rio de Janeiro)
 *           examples:
 *             sp_to_rj:
 *               summary: São Paulo para Rio de Janeiro
 *               value:
 *                 originCep: "01310-100"
 *                 destinationCep: "20040-020"
 *             sp_to_brasilia:
 *               summary: São Paulo para Brasília
 *               value:
 *                 originCep: "01310100"
 *                 destinationCep: "70040010"
 *     responses:
 *       200:
 *         description: Distância calculada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DistanceResult'
 *             examples:
 *               sp_rj_distance:
 *                 summary: Distância SP-RJ
 *                 value:
 *                   success: true
 *                   data:
 *                     distance:
 *                       kilometers: 357.42
 *                       miles: 222.15
 *                     origin:
 *                       latitude: -23.5613
 *                       longitude: -46.6565
 *                     destination:
 *                       latitude: -22.9068
 *                       longitude: -43.1729
 *                   timestamp: "2025-09-12T14:00:00.000Z"
 *       400:
 *         description: Formato de CEP inválido ou erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Um ou ambos os CEPs não foram encontrados
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       429:
 *         description: Rate limit excedido (50 req/min)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function calculateDistanceBetweenCeps(req: Request, res: Response): Promise<void> {
  const { originCep, destinationCep }: DistanceBetweenCepsRequest = req.body;

  const result = await distanceService.calculateDistanceBetweenCeps(originCep, destinationCep);
  res.json(createSuccessResponse(result));
}

/**
 * @swagger
 * /api/v1/distance/coordinates:
 *   post:
 *     summary: Calcula distância entre coordenadas geográficas
 *     tags: [Distance]
 *     description: |
 *       Calcula a distância geodésica entre dois pontos usando coordenadas de latitude e longitude.
 *       Utiliza a fórmula de Haversine para cálculo preciso considerando a curvatura da Terra.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *             properties:
 *               origin:
 *                 $ref: '#/components/schemas/Coordinates'
 *               destination:
 *                 $ref: '#/components/schemas/Coordinates'
 *           examples:
 *             sp_to_rj:
 *               summary: São Paulo para Rio de Janeiro
 *               value:
 *                 origin:
 *                   latitude: -23.5613
 *                   longitude: -46.6565
 *                 destination:
 *                   latitude: -22.9068
 *                   longitude: -43.1729
 *             sp_to_nyc:
 *               summary: São Paulo para Nova York
 *               value:
 *                 origin:
 *                   latitude: -23.5613
 *                   longitude: -46.6565
 *                 destination:
 *                   latitude: 40.7128
 *                   longitude: -74.0060
 *             equator_crossing:
 *               summary: Cruzando o Equador
 *               value:
 *                 origin:
 *                   latitude: -10.0
 *                   longitude: -50.0
 *                 destination:
 *                   latitude: 10.0
 *                   longitude: -50.0
 *     responses:
 *       200:
 *         description: Distância calculada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DistanceResult'
 *             examples:
 *               sp_rj_result:
 *                 summary: Resultado SP-RJ
 *                 value:
 *                   success: true
 *                   data:
 *                     distance:
 *                       kilometers: 357.42
 *                       miles: 222.15
 *                     origin:
 *                       latitude: -23.5613
 *                       longitude: -46.6565
 *                     destination:
 *                       latitude: -22.9068
 *                       longitude: -43.1729
 *                   timestamp: "2025-09-12T14:00:00.000Z"
 *               international_result:
 *                 summary: Distância internacional (SP-NYC)
 *                 value:
 *                   success: true
 *                   data:
 *                     distance:
 *                       kilometers: 7692.31
 *                       miles: 4780.15
 *                     origin:
 *                       latitude: -23.5613
 *                       longitude: -46.6565
 *                     destination:
 *                       latitude: 40.7128
 *                       longitude: -74.0060
 *                   timestamp: "2025-09-12T14:00:00.000Z"
 *       400:
 *         description: Coordenadas inválidas ou erro de validação
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               invalid_latitude:
 *                 summary: Latitude inválida
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION_ERROR"
 *                     message: "Validation failed"
 *                     details: "Latitude must be between -90 and 90"
 *                   timestamp: "2025-09-12T14:00:00.000Z"
 *               invalid_longitude:
 *                 summary: Longitude inválida
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION_ERROR"
 *                     message: "Validation failed"
 *                     details: "Longitude must be between -180 and 180"
 *                   timestamp: "2025-09-12T14:00:00.000Z"
 *       429:
 *         description: Rate limit excedido (50 req/min)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function calculateDistanceBetweenCoordinates(req: Request, res: Response): Promise<void> {
  const { origin, destination }: DistanceBetweenCoordinatesRequest = req.body;

  const result = await distanceService.calculateDistanceBetweenCoordinates(origin, destination);
  res.json(createSuccessResponse(result));
}