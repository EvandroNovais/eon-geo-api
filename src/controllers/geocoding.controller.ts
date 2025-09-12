import { Request, Response } from 'express';
import geocodingService from '../services/geocoding.service';
import { createSuccessResponse } from '../utils/response.util';
import { formatCep } from '../utils/cep.util';

/**
 * @swagger
 * /api/v1/geocoding/cep/{cep}:
 *   get:
 *     summary: Get coordinates for a Brazilian CEP
 *     tags: [Geocoding]
 *     parameters:
 *       - in: path
 *         name: cep
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9]{5}-?[0-9]{3}$'
 *         description: Brazilian CEP (with or without hyphen)
 *         example: "01310-100"
 *     responses:
 *       200:
 *         description: Successful geocoding
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
 *                     coordinates:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                           example: -23.5613
 *                         longitude:
 *                           type: number
 *                           example: -46.6565
 *                     address:
 *                       type: object
 *                       properties:
 *                         cep:
 *                           type: string
 *                           example: "01310-100"
 *                         logradouro:
 *                           type: string
 *                           example: "Avenida Paulista"
 *                         bairro:
 *                           type: string
 *                           example: "Bela Vista"
 *                         localidade:
 *                           type: string
 *                           example: "São Paulo"
 *                         uf:
 *                           type: string
 *                           example: "SP"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid CEP format
 *       404:
 *         description: CEP not found
 *       503:
 *         description: External service unavailable
 */
export async function geocodeCep(req: Request, res: Response): Promise<void> {
  const { cep } = req.params;
  const cleanCep = formatCep(cep);

  const result = await geocodingService.geocodeCep(cleanCep);
  res.json(createSuccessResponse(result));
}