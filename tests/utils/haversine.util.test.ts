import { 
  calculateDistance, 
  kilometersToMiles, 
  areValidCoordinates, 
  validateCoordinatesOrThrow 
} from '../../src/utils/haversine.util';
import { Coordinates } from '../../src/types/api.types';

describe('Haversine Utilities', () => {
  const sampleCoordinates: Coordinates = { latitude: -23.5613, longitude: -46.6565 }; // São Paulo
  const sampleCoordinates2: Coordinates = { latitude: -22.9068, longitude: -43.1729 }; // Rio de Janeiro

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      const distance = calculateDistance(sampleCoordinates, sampleCoordinates2);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeGreaterThan(350); // Distance should be around 360km
      expect(distance).toBeLessThan(370);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(sampleCoordinates, sampleCoordinates);
      expect(distance).toBe(0);
    });

    it('should handle coordinates across international date line', () => {
      const coord1: Coordinates = { latitude: 0, longitude: -179 };
      const coord2: Coordinates = { latitude: 0, longitude: 179 };
      const distance = calculateDistance(coord1, coord2);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('kilometersToMiles', () => {
    it('should convert kilometers to miles correctly', () => {
      expect(kilometersToMiles(100)).toBeCloseTo(62.14, 1);
      expect(kilometersToMiles(0)).toBe(0);
      expect(kilometersToMiles(1)).toBeCloseTo(0.62, 1);
    });
  });

  describe('areValidCoordinates', () => {
    it('should return true for valid coordinates', () => {
      expect(areValidCoordinates({ latitude: 0, longitude: 0 })).toBe(true);
      expect(areValidCoordinates({ latitude: -90, longitude: -180 })).toBe(true);
      expect(areValidCoordinates({ latitude: 90, longitude: 180 })).toBe(true);
      expect(areValidCoordinates(sampleCoordinates)).toBe(true);
    });

    it('should return false for invalid coordinates', () => {
      expect(areValidCoordinates({ latitude: -91, longitude: 0 })).toBe(false);
      expect(areValidCoordinates({ latitude: 91, longitude: 0 })).toBe(false);
      expect(areValidCoordinates({ latitude: 0, longitude: -181 })).toBe(false);
      expect(areValidCoordinates({ latitude: 0, longitude: 181 })).toBe(false);
    });
  });

  describe('validateCoordinatesOrThrow', () => {
    it('should not throw for valid coordinates', () => {
      expect(() => validateCoordinatesOrThrow(sampleCoordinates)).not.toThrow();
      expect(() => validateCoordinatesOrThrow({ latitude: 0, longitude: 0 })).not.toThrow();
    });

    it('should throw for invalid coordinates', () => {
      expect(() => validateCoordinatesOrThrow({ latitude: -91, longitude: 0 }))
        .toThrow('Invalid coordinates');
      expect(() => validateCoordinatesOrThrow({ latitude: 0, longitude: 181 }))
        .toThrow('Invalid coordinates');
    });

    it('should throw for non-numeric coordinates', () => {
      expect(() => validateCoordinatesOrThrow({ latitude: 'invalid' as any, longitude: 0 }))
        .toThrow('Latitude and longitude must be numbers');
    });

    it('should throw for null coordinates', () => {
      expect(() => validateCoordinatesOrThrow(null as any))
        .toThrow('Coordinates are required');
    });
  });
});