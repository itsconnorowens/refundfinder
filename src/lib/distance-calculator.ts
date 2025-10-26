/**
 * Haversine Distance Calculator
 * Calculates great circle distances between airports using the Haversine formula
 * Handles edge cases like polar routes and international date line crossing
 */

import { Airport, getAirportByCode } from './airports';

export interface DistanceResult {
  distanceKm: number;
  distanceMiles: number;
  isValid: boolean;
  error?: string;
}

/**
 * Calculate the great circle distance between two points using the Haversine formula
 * @param lat1 Latitude of first point in decimal degrees
 * @param lon1 Longitude of first point in decimal degrees
 * @param lat2 Latitude of second point in decimal degrees
 * @param lon2 Longitude of second point in decimal degrees
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Earth's radius in kilometers
  const R = 6371;

  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate flight distance between two airports
 * @param fromAirportCode IATA code of departure airport
 * @param toAirportCode IATA code of arrival airport
 * @returns DistanceResult with distance in km and miles
 */
export function calculateFlightDistance(
  fromAirportCode: string,
  toAirportCode: string
): DistanceResult {
  // Validate input
  if (!fromAirportCode || !toAirportCode) {
    return {
      distanceKm: 0,
      distanceMiles: 0,
      isValid: false,
      error: 'Airport codes are required',
    };
  }

  // Get airport data
  const fromAirport = getAirportByCode(fromAirportCode);
  const toAirport = getAirportByCode(toAirportCode);

  if (!fromAirport) {
    return {
      distanceKm: 0,
      distanceMiles: 0,
      isValid: false,
      error: `Airport ${fromAirportCode} not found`,
    };
  }

  if (!toAirport) {
    return {
      distanceKm: 0,
      distanceMiles: 0,
      isValid: false,
      error: `Airport ${toAirportCode} not found`,
    };
  }

  // Same airport
  if (fromAirportCode.toUpperCase() === toAirportCode.toUpperCase()) {
    return {
      distanceKm: 0,
      distanceMiles: 0,
      isValid: true,
    };
  }

  // Calculate distance using Haversine formula
  const distanceKm = calculateHaversineDistance(
    fromAirport.latitude,
    fromAirport.longitude,
    toAirport.latitude,
    toAirport.longitude
  );

  // Convert to miles (1 km = 0.621371 miles)
  const distanceMiles = distanceKm * 0.621371;

  return {
    distanceKm: Math.round(distanceKm),
    distanceMiles: Math.round(distanceMiles * 100) / 100, // Round to 2 decimal places
    isValid: true,
  };
}

/**
 * Calculate flight distance using Airport objects directly
 * @param fromAirport Departure airport object
 * @param toAirport Arrival airport object
 * @returns DistanceResult with distance in km and miles
 */
export function calculateFlightDistanceFromAirports(
  fromAirport: Airport,
  toAirport: Airport
): DistanceResult {
  return calculateFlightDistance(fromAirport.code, toAirport.code);
}

/**
 * Get distance category for compensation calculation
 * Used by EU261 and UK CAA regulations
 * @param distanceKm Distance in kilometers
 * @returns Distance category
 */
export function getDistanceCategory(
  distanceKm: number
): 'short' | 'medium' | 'long' {
  if (distanceKm <= 1500) {
    return 'short';
  } else if (distanceKm <= 3500) {
    return 'medium';
  } else {
    return 'long';
  }
}

/**
 * Get compensation amount based on distance category (EU261)
 * @param distanceKm Distance in kilometers
 * @returns Compensation amount in EUR
 */
export function getEU261Compensation(distanceKm: number): number {
  const category = getDistanceCategory(distanceKm);

  switch (category) {
    case 'short':
      return 250;
    case 'medium':
      return 400;
    case 'long':
      return 600;
    default:
      return 0;
  }
}

/**
 * Get compensation amount based on distance category (UK CAA)
 * @param distanceKm Distance in kilometers
 * @returns Compensation amount in GBP
 */
export function getUKCAACompensation(distanceKm: number): number {
  const category = getDistanceCategory(distanceKm);

  switch (category) {
    case 'short':
      return 220;
    case 'medium':
      return 350;
    case 'long':
      return 520;
    default:
      return 0;
  }
}

/**
 * Validate if a route is realistic (not too short or too long)
 * @param distanceKm Distance in kilometers
 * @returns true if route is realistic
 */
export function isRealisticRoute(distanceKm: number): boolean {
  // Minimum realistic distance: 50km (very short domestic flights)
  // Maximum realistic distance: 20,000km (longest possible commercial routes)
  return distanceKm >= 50 && distanceKm <= 20000;
}

/**
 * Get route type classification
 * @param distanceKm Distance in kilometers
 * @returns Route type
 */
export function getRouteType(
  distanceKm: number
): 'domestic' | 'regional' | 'continental' | 'intercontinental' {
  if (distanceKm < 500) {
    return 'domestic';
  } else if (distanceKm < 2000) {
    return 'regional';
  } else if (distanceKm < 5000) {
    return 'continental';
  } else {
    return 'intercontinental';
  }
}

/**
 * Check if route crosses international date line
 * @param fromAirport Departure airport
 * @param toAirport Arrival airport
 * @returns true if route crosses date line
 */
export function crossesDateLine(
  fromAirport: Airport,
  toAirport: Airport
): boolean {
  const fromLon = fromAirport.longitude;
  const toLon = toAirport.longitude;

  // Check if longitudes are on opposite sides of the date line
  // Date line is at 180°/-180°
  return (
    (fromLon > 0 && toLon < 0 && Math.abs(fromLon - toLon) > 180) ||
    (fromLon < 0 && toLon > 0 && Math.abs(fromLon - toLon) > 180)
  );
}

/**
 * Check if route crosses equator
 * @param fromAirport Departure airport
 * @param toAirport Arrival airport
 * @returns true if route crosses equator
 */
export function crossesEquator(
  fromAirport: Airport,
  toAirport: Airport
): boolean {
  const fromLat = fromAirport.latitude;
  const toLat = toAirport.latitude;

  // Check if latitudes are on opposite sides of equator (0°)
  return (fromLat > 0 && toLat < 0) || (fromLat < 0 && toLat > 0);
}

/**
 * Get flight time estimate based on distance
 * Assumes average commercial aircraft speed of 800 km/h
 * @param distanceKm Distance in kilometers
 * @returns Estimated flight time in hours
 */
export function getEstimatedFlightTime(distanceKm: number): number {
  const averageSpeedKmh = 800; // Commercial aircraft average speed
  return distanceKm / averageSpeedKmh;
}

/**
 * Cache for distance calculations to improve performance
 */
const distanceCache = new Map<string, DistanceResult>();

/**
 * Calculate flight distance with caching
 * @param fromAirportCode IATA code of departure airport
 * @param toAirportCode IATA code of arrival airport
 * @returns DistanceResult with distance in km and miles
 */
export function calculateFlightDistanceCached(
  fromAirportCode: string,
  toAirportCode: string
): DistanceResult {
  const cacheKey = `${fromAirportCode.toUpperCase()}-${toAirportCode.toUpperCase()}`;

  // Check cache first
  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey)!;
  }

  // Calculate distance
  const result = calculateFlightDistance(fromAirportCode, toAirportCode);

  // Cache the result
  if (result.isValid) {
    distanceCache.set(cacheKey, result);
  }

  return result;
}

/**
 * Clear the distance cache
 */
export function clearDistanceCache(): void {
  distanceCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: distanceCache.size,
    keys: Array.from(distanceCache.keys()),
  };
}
