import { Coordinates } from '../types/api.types';

/**
 * Converts degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculates the great circle distance between two points on Earth
 * using the Haversine formula
 * @param origin - Origin coordinates
 * @param destination - Destination coordinates
 * @returns Distance in kilometers
 */
export function calculateDistance(
  origin: Coordinates,
  destination: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers

  const lat1Rad = toRadians(origin.latitude);
  const lat2Rad = toRadians(destination.latitude);
  const deltaLatRad = toRadians(destination.latitude - origin.latitude);
  const deltaLngRad = toRadians(destination.longitude - origin.longitude);

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) *
      Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  // Round to 2 decimal places
  return Math.round(distance * 100) / 100;
}

/**
 * Converts distance from kilometers to miles
 * @param kilometers - Distance in kilometers
 * @returns Distance in miles
 */
export function kilometersToMiles(kilometers: number): number {
  return Math.round(kilometers * 0.621371 * 100) / 100;
}

/**
 * Validates if coordinates are within valid ranges
 * @param coordinates - Coordinates to validate
 * @returns boolean indicating if coordinates are valid
 */
export function areValidCoordinates(coordinates: Coordinates): boolean {
  const { latitude, longitude } = coordinates;

  // Latitude must be between -90 and 90
  if (latitude < -90 || latitude > 90) return false;

  // Longitude must be between -180 and 180
  if (longitude < -180 || longitude > 180) return false;

  return true;
}

/**
 * Validates coordinates and throws error if invalid
 * @param coordinates - Coordinates to validate
 * @throws Error if coordinates are invalid
 */
export function validateCoordinatesOrThrow(coordinates: Coordinates): void {
  if (!coordinates) {
    throw new Error('Coordinates are required');
  }

  if (typeof coordinates.latitude !== 'number' || typeof coordinates.longitude !== 'number') {
    throw new Error('Latitude and longitude must be numbers');
  }

  if (!areValidCoordinates(coordinates)) {
    throw new Error(
      'Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180'
    );
  }
}