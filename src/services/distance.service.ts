import { Coordinates, DistanceResult } from '../types/api.types';
import { calculateDistance, kilometersToMiles, validateCoordinatesOrThrow } from '../utils/haversine.util';
import geocodingService from './geocoding.service';
import winston from 'winston';
import config from '../config';

class DistanceService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: config.logging.level,
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });
  }

  async calculateDistanceBetweenCoordinates(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<DistanceResult> {
    validateCoordinatesOrThrow(origin);
    validateCoordinatesOrThrow(destination);

    const distanceKm = calculateDistance(origin, destination);
    const distanceMiles = kilometersToMiles(distanceKm);

    const result: DistanceResult = {
      distance: {
        kilometers: distanceKm,
        miles: distanceMiles,
      },
      origin,
      destination,
    };

    this.logger.info(`Calculated distance: ${distanceKm} km between coordinates`);
    return result;
  }

  async calculateDistanceBetweenCeps(
    originCep: string,
    destinationCep: string
  ): Promise<DistanceResult> {
    try {
      // Geocode both CEPs
      const [originGeocode, destinationGeocode] = await Promise.all([
        geocodingService.geocodeCep(originCep),
        geocodingService.geocodeCep(destinationCep),
      ]);

      // Calculate distance between the coordinates
      const result = await this.calculateDistanceBetweenCoordinates(
        originGeocode.coordinates,
        destinationGeocode.coordinates
      );

      this.logger.info(`Calculated distance between CEPs: ${originCep} and ${destinationCep}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to calculate distance between CEPs ${originCep} and ${destinationCep}:`, error);
      throw error;
    }
  }
}

export default new DistanceService();