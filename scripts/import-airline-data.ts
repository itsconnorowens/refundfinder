/**
 * Airline Data Import Script
 *
 * This script fetches airline data from public sources and generates the airline database
 * Used to populate src/lib/airline-data.ts with comprehensive airline information
 */

import fs from 'fs';
import path from 'path';

interface AirlineData {
  code: string; // IATA code
  icao?: string; // ICAO code
  name: string;
  country: string;
  region: string;
  isActive: boolean;
  aliases?: string[];
  passengerVolume?: number; // Annual passenger volume in millions
}

interface DataSource {
  name: string;
  url: string;
  format: 'json' | 'csv' | 'xml';
}

// Public data sources for airline information
const DATA_SOURCES: DataSource[] = [
  {
    name: 'OpenFlights',
    url: 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat',
    format: 'csv',
  },
  {
    name: 'IATA Airport Codes',
    url: 'https://github.com/datasets/airport-codes',
    format: 'json',
  },
  {
    name: 'Aviation Edge',
    url: 'https://aviation-edge.com/v2/public/airlineDatabase',
    format: 'json',
  },
];

/**
 * Parse OpenFlights CSV format
 * Format: ID,Name,Alias,IATA,ICAO,Callsign,Country,Active
 */
function parseOpenFlightsCSV(csvContent: string): AirlineData[] {
  const lines = csvContent.trim().split('\n');
  const airlines: AirlineData[] = [];

  for (const line of lines) {
    const parts = line.split(',').map((p) => p.replace(/"/g, ''));

    if (parts.length < 8) continue;

    const [id, name, alias, iata, icao, callsign, country, active] = parts;

    if (!iata || iata === '\\N') continue;

    // Skip inactive airlines
    const isActive = active && active.toLowerCase() === 'y';

    // Map country to region
    const region = mapCountryToRegion(country);

    // Extract aliases
    const aliases: string[] = [];
    if (alias && alias !== '\\N') aliases.push(alias);
    if (callsign && callsign !== '\\N') aliases.push(callsign);

    airlines.push({
      code: iata,
      icao: icao && icao !== '\\N' ? icao : undefined,
      name,
      country,
      region,
      isActive: isActive || true, // Default to true for now
      aliases: aliases.length > 0 ? aliases : undefined,
    });
  }

  return airlines;
}

/**
 * Map country to region
 */
function mapCountryToRegion(country: string): string {
  const regionMap: Record<string, string> = {
    // Europe
    'United Kingdom': 'Europe',
    Ireland: 'Europe',
    Germany: 'Europe',
    France: 'Europe',
    Netherlands: 'Europe',
    Spain: 'Europe',
    Italy: 'Europe',
    Sweden: 'Europe',
    Portugal: 'Europe',
    Hungary: 'Europe',
    Norway: 'Europe',
    Greece: 'Europe',
    Turkey: 'Europe',
    Switzerland: 'Europe',
    Austria: 'Europe',
    Poland: 'Europe',
    Finland: 'Europe',
    Belgium: 'Europe',
    Denmark: 'Europe',

    // North America
    'United States': 'North America',
    Canada: 'North America',
    Mexico: 'North America',
    Panama: 'North America',
    Colombia: 'Latin America',
    Chile: 'Latin America',

    // Asia-Pacific
    China: 'Asia-Pacific',
    India: 'Asia-Pacific',
    Japan: 'Asia-Pacific',
    'South Korea': 'Asia-Pacific',
    Singapore: 'Asia-Pacific',
    Thailand: 'Asia-Pacific',
    Malaysia: 'Asia-Pacific',
    Australia: 'Asia-Pacific',
    'New Zealand': 'Asia-Pacific',
    Philippines: 'Asia-Pacific',
    Indonesia: 'Asia-Pacific',
    'Sri Lanka': 'Asia-Pacific',

    // Middle East
    'United Arab Emirates': 'Middle East',
    Qatar: 'Middle East',
    'Saudi Arabia': 'Middle East',
    Bahrain: 'Middle East',
    Jordan: 'Middle East',
    Kuwait: 'Middle East',
    Oman: 'Middle East',
    Egypt: 'Middle East',
    Israel: 'Middle East',

    // Africa
    Ethiopia: 'Africa',
    'South Africa': 'Africa',
    Kenya: 'Africa',
    Morocco: 'Africa',
    Algeria: 'Africa',
    Tunisia: 'Africa',
    Rwanda: 'Africa',
    Tanzania: 'Africa',
    Mauritius: 'Africa',
    Nigeria: 'Africa',

    // South America
    Brazil: 'Latin America',
    Argentina: 'Latin America',
    Peru: 'Latin America',
    Bolivia: 'Latin America',
  };

  return regionMap[country] || 'Other';
}

/**
 * Fetch data from multiple sources and merge results
 */
async function fetchAndParseAirlineData(): Promise<AirlineData[]> {
  const airlines: Map<string, AirlineData> = new Map();

  // Try to fetch from OpenFlights (free and reliable)
  try {
    console.log('Fetching data from OpenFlights...');
    const response = await fetch(
      'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat'
    );

    if (response.ok) {
      const csvContent = await response.text();
      const openFlightsData = parseOpenFlightsCSV(csvContent);

      console.log(`Parsed ${openFlightsData.length} airlines from OpenFlights`);

      for (const airline of openFlightsData) {
        airlines.set(airline.code, airline);
      }
    }
  } catch (error) {
    console.error('Failed to fetch from OpenFlights:', error);
  }

  // Add manual entries for major airlines that might be missing
  const manualEntries: AirlineData[] = [
    // European carriers
    {
      code: 'BA',
      name: 'British Airways',
      country: 'United Kingdom',
      region: 'Europe',
      isActive: true,
      aliases: ['British Air', 'BAW'],
    },
    {
      code: 'FR',
      name: 'Ryanair',
      country: 'Ireland',
      region: 'Europe',
      isActive: true,
      aliases: ['Ryan Air'],
    },
    {
      code: 'U2',
      name: 'EasyJet',
      country: 'United Kingdom',
      region: 'Europe',
      isActive: true,
    },
    {
      code: 'LH',
      name: 'Lufthansa',
      country: 'Germany',
      region: 'Europe',
      isActive: true,
      aliases: ['Deutsche Lufthansa'],
    },
    {
      code: 'AF',
      name: 'Air France',
      country: 'France',
      region: 'Europe',
      isActive: true,
    },
    {
      code: 'KL',
      name: 'KLM',
      country: 'Netherlands',
      region: 'Europe',
      isActive: true,
      aliases: ['KLM Royal Dutch Airlines'],
    },
    {
      code: 'IB',
      name: 'Iberia',
      country: 'Spain',
      region: 'Europe',
      isActive: true,
    },
    {
      code: 'SK',
      name: 'SAS Scandinavian',
      country: 'Sweden',
      region: 'Europe',
      isActive: true,
    },
    {
      code: 'TP',
      name: 'TAP Air Portugal',
      country: 'Portugal',
      region: 'Europe',
      isActive: true,
    },
    {
      code: 'W6',
      name: 'Wizz Air',
      country: 'Hungary',
      region: 'Europe',
      isActive: true,
    },

    // North American carriers
    {
      code: 'AA',
      name: 'American Airlines',
      country: 'United States',
      region: 'North America',
      isActive: true,
      aliases: ['American', 'AAL'],
    },
    {
      code: 'DL',
      name: 'Delta Air Lines',
      country: 'United States',
      region: 'North America',
      isActive: true,
      aliases: ['Delta'],
    },
    {
      code: 'UA',
      name: 'United Airlines',
      country: 'United States',
      region: 'North America',
      isActive: true,
      aliases: ['United'],
    },
    {
      code: 'WN',
      name: 'Southwest Airlines',
      country: 'United States',
      region: 'North America',
      isActive: true,
      aliases: ['Southwest'],
    },
    {
      code: 'AC',
      name: 'Air Canada',
      country: 'Canada',
      region: 'North America',
      isActive: true,
    },

    // Asian carriers
    {
      code: 'EK',
      name: 'Emirates',
      country: 'United Arab Emirates',
      region: 'Middle East',
      isActive: true,
    },
    {
      code: 'QR',
      name: 'Qatar Airways',
      country: 'Qatar',
      region: 'Middle East',
      isActive: true,
      aliases: ['Qatar'],
    },
    {
      code: 'SQ',
      name: 'Singapore Airlines',
      country: 'Singapore',
      region: 'Asia-Pacific',
      isActive: true,
      aliases: ['SIA'],
    },
    {
      code: 'NH',
      name: 'All Nippon Airways',
      country: 'Japan',
      region: 'Asia-Pacific',
      isActive: true,
      aliases: ['ANA'],
    },
    {
      code: 'JL',
      name: 'Japan Airlines',
      country: 'Japan',
      region: 'Asia-Pacific',
      isActive: true,
    },
    {
      code: 'KE',
      name: 'Korean Air',
      country: 'South Korea',
      region: 'Asia-Pacific',
      isActive: true,
    },
    {
      code: 'CZ',
      name: 'China Southern Airlines',
      country: 'China',
      region: 'Asia-Pacific',
      isActive: true,
    },
    {
      code: 'MU',
      name: 'China Eastern Airlines',
      country: 'China',
      region: 'Asia-Pacific',
      isActive: true,
    },
    {
      code: 'CA',
      name: 'Air China',
      country: 'China',
      region: 'Asia-Pacific',
      isActive: true,
    },
    {
      code: '6E',
      name: 'IndiGo',
      country: 'India',
      region: 'Asia-Pacific',
      isActive: true,
    },
    {
      code: 'QF',
      name: 'Qantas',
      country: 'Australia',
      region: 'Asia-Pacific',
      isActive: true,
    },
  ];

  // Add manual entries to the map
  for (const airline of manualEntries) {
    if (!airlines.has(airline.code)) {
      airlines.set(airline.code, airline);
    }
  }

  // Sort by code
  const sortedAirlines = Array.from(airlines.values()).sort((a, b) =>
    a.code.localeCompare(b.code)
  );

  console.log(`Total airlines in database: ${sortedAirlines.length}`);

  return sortedAirlines;
}

/**
 * Generate TypeScript file with airline data
 */
function generateAirlineDataFile(airlines: AirlineData[]): string {
  const imports = `import { AirlineData } from '../airline-data';`;

  const airlineEntries = airlines
    .map((airline) => {
      const aliasesStr = airline.aliases
        ? `aliases: [${airline.aliases.map((a) => `'${a}'`).join(', ')}]`
        : '';

      const volumeStr = airline.passengerVolume
        ? `passengerVolume: ${airline.passengerVolume}`
        : '';

      return `  {
    code: '${airline.code}',
    ${airline.icao ? `icao: '${airline.icao}',` : ''}
    name: '${airline.name.replace(/'/g, "\\'")}',
    country: '${airline.country.replace(/'/g, "\\'")}',
    region: '${airline.region}',
    isActive: ${airline.isActive},
    ${aliasesStr ? aliasesStr + ',' : ''}
    ${volumeStr}
  }`;
    })
    .join(',\n');

  return `${imports}

/**
 * Generated airline database
 * Auto-generated from import script on ${new Date().toISOString()}
 * Total airlines: ${airlines.length}
 */

export const AIRLINE_DATABASE: AirlineData[] = [
${airlineEntries}
];
`;
}

/**
 * Main execution
 */
async function main() {
  console.log('Starting airline data import...');

  try {
    // Fetch and parse data
    const airlines = await fetchAndParseAirlineData();

    // Generate TypeScript file
    const outputContent = generateAirlineDataFile(airlines);

    // Write to file
    const outputPath = path.join(
      __dirname,
      '..',
      'src',
      'lib',
      'airline-data.ts'
    );
    fs.writeFileSync(outputPath, outputContent, 'utf-8');

    console.log(`✓ Successfully generated airline database at ${outputPath}`);
    console.log(`✓ Total airlines: ${airlines.length}`);

    // Generate statistics
    const byRegion = new Map<string, number>();
    for (const airline of airlines) {
      byRegion.set(airline.region, (byRegion.get(airline.region) || 0) + 1);
    }

    console.log('\nAirlines by region:');
    for (const [region, count] of Array.from(byRegion.entries()).sort(
      (a, b) => b[1] - a[1]
    )) {
      console.log(`  ${region}: ${count}`);
    }
  } catch (error) {
    console.error('Failed to import airline data:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { parseOpenFlightsCSV, mapCountryToRegion, fetchAndParseAirlineData };
