import { Request, Response } from 'express';
import distanceService from '../services/distance.service';
import { createSuccessResponse } from '../utils/response.util';
import { DistanceBetweenCepsRequest, DistanceBetweenCoordinatesRequest } from '../types/api.types';

/**
 * @swagger
 * /api/v1/distance/ceps:
 *   post:
 *     summary: Calculate distance between two CEPs
 *     tags: [Distance]
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
 *                 description: Origin CEP
 *               destinationCep:
 *                 type: string
 *                 pattern: '^[0-9]{5}-?[0-9]{3}$'
 *                 example: "20040-020"
 *                 description: Destination CEP
 *     responses:
 *       200:
 *         description: Successful distance calculation
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
 *                     distance:
 *                       type: object
 *                       properties:
 *                         kilometers:
 *                           type: number
 *                           example: 357.42
 *                         miles:
 *                           type: number
 *                           example: 222.15
 *                     origin:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *                     destination:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                         longitude:
 *                           type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid CEP format or validation error
 *       404:
 *         description: One or both CEPs not found
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
 *     summary: Calculate distance between two coordinate points
 *     tags: [Distance]
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
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     minimum: -90
 *                     maximum: 90
 *                     example: -23.5613
 *                   longitude:
 *                     type: number
 *                     minimum: -180
 *                     maximum: 180
 *                     example: -46.6565
 *               destination:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     minimum: -90
 *                     maximum: 90
 *                     example: -22.9068
 *                   longitude:
 *                     type: number
 *                     minimum: -180
 *                     maximum: 180
 *                     example: -43.1729
 *     responses:
 *       200:
 *         description: Successful distance calculation
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
 *                     distance:
 *                       type: object
 *                       properties:
 *                         kilometers:
 *                           type: number
 *                           example: 357.42
 *                         miles:
 *                           type: number
 *                           example: 222.15
 *                     origin:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                           example: -23.5613
 *                         longitude:
 *                           type: number
 *                           example: -46.6565
 *                     destination:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                           example: -22.9068
 *                         longitude:
 *                           type: number
 *                           example: -43.1729
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid coordinates or validation error
 */
export async function calculateDistanceBetweenCoordinates(req: Request, res: Response): Promise<void> {
  const { origin, destination }: DistanceBetweenCoordinatesRequest = req.body;

  const result = await distanceService.calculateDistanceBetweenCoordinates(origin, destination);
  res.json(createSuccessResponse(result));
}