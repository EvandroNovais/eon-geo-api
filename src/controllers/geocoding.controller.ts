import { Request, Response } from 'express';
import geocodingService from '../services/geocoding.service';
import { createSuccessResponse } from '../utils/response.util';
import { formatCep } from '../utils/cep.util';

/**
 * @swagger
 * /api/v1/geocoding/cep/{cep}:
 *   get:
 *     summary: Geocodifica um CEP brasileiro
 *     tags: [Geocoding]
 *     description: Converte um CEP (Código de Endereçamento Postal) brasileiro em coordenadas geográficas (latitude/longitude) e retorna o endereço completo
 *     parameters:
 *       - in: path
 *         name: cep
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9]{5}-?[0-9]{3}$'
 *         description: CEP brasileiro no formato 12345-678 ou 12345678
 *         examples:
 *           paulista:
 *             value: "01310-100"
 *             summary: "Avenida Paulista, São Paulo"
 *           copacabana:
 *             value: "22070-900"
 *             summary: "Copacabana, Rio de Janeiro"
 *           brasilia:
 *             value: "70040010"
 *             summary: "Brasília (sem hífen)"
 *     responses:
 *       200:
 *         description: Geocodificação realizada com sucesso
 *         headers:
 *           X-Response-Time:
 *             description: Tempo de resposta em milissegundos
 *             schema:
 *               type: string
 *               example: "125ms"
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GeocodingResult'
 *             examples:
 *               sao_paulo:
 *                 summary: Exemplo São Paulo
 *                 value:
 *                   success: true
 *                   data:
 *                     coordinates:
 *                       latitude: -23.5613
 *                       longitude: -46.6565
 *                     address:
 *                       cep: "01310-100"
 *                       logradouro: "Avenida Paulista"
 *                       bairro: "Bela Vista"
 *                       localidade: "São Paulo"
 *                       uf: "SP"
 *                   timestamp: "2025-09-12T14:00:00.000Z"
 *       400:
 *         description: Formato de CEP inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               invalid_format:
 *                 summary: CEP com formato inválido
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION_ERROR"
 *                     message: "Validation failed"
 *                     details: "CEP must be in format 12345-678 or 12345678"
 *                   timestamp: "2025-09-12T14:00:00.000Z"
 *       404:
 *         description: CEP não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               not_found:
 *                 summary: CEP inexistente
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "CEP_NOT_FOUND"
 *                     message: "CEP not found"
 *                   timestamp: "2025-09-12T14:00:00.000Z"
 *       429:
 *         description: Rate limit excedido (30 req/min)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       503:
 *         description: Serviço externo temporariamente indisponível
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
export async function geocodeCep(req: Request, res: Response): Promise<void> {
  const { cep } = req.params;
  const cleanCep = formatCep(cep);

  const result = await geocodingService.geocodeCep(cleanCep);
  res.json(createSuccessResponse(result));
}