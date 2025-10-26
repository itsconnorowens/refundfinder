// Import the expanded airport data
import airportsData from './airports-data.json';

// Expanded airport database with coordinates and timezone data
export interface Airport {
  code: string; // IATA code
  name: string; // Airport name
  city: string; // City name
  country: string; // Country name
  region: string; // Geographic region
  latitude: number; // Decimal degrees (4 decimal places)
  longitude: number; // Decimal degrees (4 decimal places)
  timezone: string; // IANA timezone (e.g., "America/New_York")
}

export const airports: Airport[] = airportsData as Airport[];

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
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get the distance between two airports by their IATA codes
 * @param code1 IATA code of departure airport
 * @param code2 IATA code of arrival airport
 * @returns Distance in kilometers, or null if either airport is not found
 */
export function getDistanceBetweenAirports(
  code1: string,
  code2: string
): number | null {
  const airport1 = getAirportByCode(code1);
  const airport2 = getAirportByCode(code2);

  if (!airport1 || !airport2) {
    return null;
  }

  // Same airport
  if (code1.toUpperCase() === code2.toUpperCase()) {
    return 0;
  }

  return calculateHaversineDistance(
    airport1.latitude,
    airport1.longitude,
    airport2.latitude,
    airport2.longitude
  );
}

/**
 * Normalize airport code by trimming whitespace and converting to uppercase
 */
export function normalizeAirportCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Normalize airport name by handling common variations
 */
export function normalizeAirportName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .toLowerCase();
}

/**
 * Get timezone for an airport by its IATA code
 */
export function getAirportTimezone(code: string): string | null {
  const airport = getAirportByCode(code);
  return airport?.timezone || null;
}

/**
 * Get airport by code with timezone information
 */
export function getAirportByCodeWithTimezone(
  code: string
): (Airport & { timezone: string }) | null {
  const airport = getAirportByCode(code);
  if (!airport) return null;

  return {
    ...airport,
    timezone: airport.timezone || 'UTC',
  };
}

// Helper functions
export function searchAirports(query: string): Airport[] {
  if (!query || query.length < 1) return [];

  const normalizedQuery = normalizeAirportName(query);
  const upperQuery = query.toUpperCase();

  return airports
    .filter(
      (airport) =>
        airport.code.includes(upperQuery) ||
        normalizeAirportName(airport.name).includes(normalizedQuery) ||
        normalizeAirportName(airport.city).includes(normalizedQuery) ||
        normalizeAirportName(airport.country).includes(normalizedQuery)
    )
    .slice(0, 10); // Limit to 10 results
}

export function getAirportByCode(code: string): Airport | undefined {
  return airports.find(
    (airport) => airport.code.toLowerCase() === code.toLowerCase()
  );
}

export function validateAirportCode(code: string): boolean {
  const normalizedCode = normalizeAirportCode(code);
  return airports.some((airport) => airport.code === normalizedCode);
}
