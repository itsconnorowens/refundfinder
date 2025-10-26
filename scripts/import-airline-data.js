/**
 * Airline Data Import Script - JavaScript version
 */

const fs = require('fs');

const AIRLINE_DATA = [
  // Europe
  { code: 'BA', name: 'British Airways', country: 'United Kingdom', region: 'Europe', isActive: true, aliases: ['British Air', 'BAW'] },
  { code: 'FR', name: 'Ryanair', country: 'Ireland', region: 'Europe', isActive: true, aliases: ['Ryan Air'] },
  { code: 'U2', name: 'EasyJet', country: 'United Kingdom', region: 'Europe', isActive: true },
  { code: 'LH', name: 'Lufthansa', country: 'Germany', region: 'Europe', isActive: true, aliases: ['Deutsche Lufthansa'] },
  { code: 'AF', name: 'Air France', country: 'France', region: 'Europe', isActive: true },
  { code: 'KL', name: 'KLM', country: 'Netherlands', region: 'Europe', isActive: true, aliases: ['KLM Royal Dutch Airlines'] },
  { code: 'IB', name: 'Iberia', country: 'Spain', region: 'Europe', isActive: true },
  { code: 'SK', name: 'SAS Scandinavian', country: 'Sweden', region: 'Europe', isActive: true },
  { code: 'TP', name: 'TAP Air Portugal', country: 'Portugal', region: 'Europe', isActive: true },
  { code: 'W6', name: 'Wizz Air', country: 'Hungary', region: 'Europe', isActive: true },
  
  // North America
  { code: 'AA', name: 'American Airlines', country: 'United States', region: 'North America', isActive: true, aliases: ['American', 'AAL'] },
  { code: 'DL', name: 'Delta Air Lines', country: 'United States', region: 'North America', isActive: true, aliases: ['Delta'] },
  { code: 'UA', name: 'United Airlines', country: 'United States', region: 'North America', isActive: true, aliases: ['United'] },
  { code: 'WN', name: 'Southwest Airlines', country: 'United States', region: 'North America', isActive: true, aliases: ['Southwest'] },
  { code: 'AC', name: 'Air Canada', country: 'Canada', region: 'North America', isActive: true },
  { code: 'B6', name: 'JetBlue Airways', country: 'United States', region: 'North America', isActive: true },
  { code: 'AS', name: 'Alaska Airlines', country: 'United States', region: 'North America', isActive: true },
  { code: 'NK', name: 'Spirit Airlines', country: 'United States', region: 'North America', isActive: true },
  { code: 'F9', name: 'Frontier Airlines', country: 'United States', region: 'North America', isActive: true },
  { code: 'HA', name: 'Hawaiian Airlines', country: 'United States', region: 'North America', isActive: true },
  
  // Asia-Pacific
  { code: 'EK', name: 'Emirates', country: 'United Arab Emirates', region: 'Middle East', isActive: true },
  { code: 'QR', name: 'Qatar Airways', country: 'Qatar', region: 'Middle East', isActive: true, aliases: ['Qatar'] },
  { code: 'SQ', name: 'Singapore Airlines', country: 'Singapore', region: 'Asia-Pacific', isActive: true, aliases: ['SIA'] },
  { code: 'NH', name: 'All Nippon Airways', country: 'Japan', region: 'Asia-Pacific', isActive: true, aliases: ['ANA'] },
  { code: 'JL', name: 'Japan Airlines', country: 'Japan', region: 'Asia-Pacific', isActive: true },
  { code: 'KE', name: 'Korean Air', country: 'South Korea', region: 'Asia-Pacific', isActive: true },
  { code: 'CZ', name: 'China Southern Airlines', country: 'China', region: 'Asia-Pacific', isActive: true },
  { code: 'MU', name: 'China Eastern Airlines', country: 'China', region: 'Asia-Pacific', isActive: true },
  { code: 'CA', name: 'Air China', country: 'China', region: 'Asia-Pacific', isActive: true },
  { code: '6E', name: 'IndiGo', country: 'India', region: 'Asia-Pacific', isActive: true },
  { code: 'QF', name: 'Qantas', country: 'Australia', region: 'Asia-Pacific', isActive: true },
];

function generateFile() {
  const timestamp = new Date().toISOString();
  const content = `/**
 * Generated airline database
 * Auto-generated from import script on ${timestamp}
 * Total airlines: ${AIRLINE_DATA.length}
 */

export interface AirlineData {
  code: string;
  icao?: string;
  name: string;
  country: string;
  region: string;
  isActive: boolean;
  aliases?: string[];
  passengerVolume?: number;
}

export const AIRLINE_DATABASE: AirlineData[] = [
${AIRLINE_DATA.map(airline => {
  const aliases = airline.aliases ? `\n    aliases: [${airline.aliases.map(a => `'${a}'`).join(', ')}],` : '';
  return `  {
    code: '${airline.code}',
    name: '${airline.name}',
    country: '${airline.country}',
    region: '${airline.region}',
    isActive: ${airline.isActive},${aliases}
  }`;
}).join(',\n')}
];

export function getAirlineByCode(code: string): AirlineData | undefined {
  return AIRLINE_DATABASE.find(
    (airline) => airline.code.toLowerCase() === code.toLowerCase()
  );
}

export function getAirlineByName(name: string): AirlineData | undefined {
  const lowerName = name.toLowerCase();

  if (
    lowerName.length < 3 ||
    ['airline', 'air', 'airways', 'aviation', 'unknown'].includes(lowerName) ||
    lowerName.includes('unknown')
  ) {
    return undefined;
  }

  return AIRLINE_DATABASE.find((airline) => {
    const airlineName = airline.name.toLowerCase();
    return airlineName.includes(lowerName) && lowerName.length >= 4;
  });
}

export function getAirlinesByRegion(region: string): AirlineData[] {
  return AIRLINE_DATABASE.filter(
    (airline) => airline.region.toLowerCase() === region.toLowerCase()
  );
}

export function getActiveAirlines(): AirlineData[] {
  return AIRLINE_DATABASE.filter((airline) => airline.isActive);
}

export function searchAirlines(query: string): AirlineData[] {
  const lowerQuery = query.toLowerCase();
  return AIRLINE_DATABASE
    .filter(
      (airline) =>
        airline.code.toLowerCase().includes(lowerQuery) ||
        airline.name.toLowerCase().includes(lowerQuery) ||
        airline.country.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 10);
}
`;

  const outputPath = './src/lib/airline-data.ts';
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`✓ Generated ${outputPath} with ${AIRLINE_DATA.length} airlines`);
}

generateFile();
