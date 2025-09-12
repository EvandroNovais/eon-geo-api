import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { createErrorResponse, createApiError } from '../utils/response.util';
import { ErrorCodes } from '../types/api.types';

// CEP validation schema
export const cepSchema = Joi.string()
  .pattern(/^\d{5}-?\d{3}$/)
  .required()
  .messages({
    'string.pattern.base': 'CEP must be in format 12345-678 or 12345678',
    'any.required': 'CEP is required',
  });

// Coordinates validation schema
export const coordinatesSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required().messages({
    'number.min': 'Latitude must be between -90 and 90',
    'number.max': 'Latitude must be between -90 and 90',
    'any.required': 'Latitude is required',
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    'number.min': 'Longitude must be between -180 and 180',
    'number.max': 'Longitude must be between -180 and 180',
    'any.required': 'Longitude is required',
  }),
});

// Distance between CEPs request schema
export const distanceBetweenCepsSchema = Joi.object({
  originCep: cepSchema,
  destinationCep: cepSchema,
});

// Distance between coordinates request schema
export const distanceBetweenCoordinatesSchema = Joi.object({
  origin: coordinatesSchema,
  destination: coordinatesSchema,
});

/**
 * Generic validation middleware factory
 * @param schema - Joi schema to validate against
 * @param property - Request property to validate ('body', 'params', 'query')
 */
export function validate(schema: Joi.Schema, property: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req[property], { abortEarly: false });

    if (error) {
      const details = error.details.map((detail) => detail.message).join(', ');
      const apiError = createApiError(
        ErrorCodes.VALIDATION_ERROR,
        'Validation failed',
        details
      );
      
      res.status(400).json(createErrorResponse(apiError));
      return;
    }

    next();
  };
}

/**
 * CEP parameter validation middleware
 */
export const validateCepParam = validate(
  Joi.object({ cep: cepSchema }),
  'params'
);

/**
 * Distance between CEPs body validation middleware
 */
export const validateDistanceBetweenCeps = validate(distanceBetweenCepsSchema, 'body');

/**
 * Distance between coordinates body validation middleware
 */
export const validateDistanceBetweenCoordinates = validate(
  distanceBetweenCoordinatesSchema,
  'body'
);