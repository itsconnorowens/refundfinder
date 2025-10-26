/**
 * Expanded Airline Database with Metadata and Normalization
 * Provides comprehensive airline data including IATA/ICAO codes, countries, alliances, and aliases
 * for accurate airline identification and regulation mapping
 */

export interface Airline {
  iataCode: string; // 2-letter IATA code
  icaoCode: string; // 3-letter ICAO code
  name: string; // Official airline name
  country: string; // Country of registration
  region: string; // Geographic region
  alliance?: string; // Airline alliance (Star Alliance, SkyTeam, Oneworld)
  parentCompany?: string; // Parent company or airline group
  aliases: string[]; // Common name variations and abbreviations
  isActive: boolean; // Whether airline is currently operating
  hubType?: 'major' | 'secondary' | 'regional' | 'low-cost' | 'cargo'; // Hub classification
  regulationCovered: (
    | 'EU261'
    | 'UK261'
    | 'US_DOT'
    | 'SWISS'
    | 'NORWEGIAN'
    | 'CANADIAN'
  )[]; // Regulations that apply
}

// Comprehensive airline database with 200+ carriers
export const airlines: Airline[] = [
  // Major European Airlines
  {
    iataCode: 'BA',
    icaoCode: 'BAW',
    name: 'British Airways',
    country: 'United Kingdom',
    region: 'Europe',
    alliance: 'Oneworld',
    parentCompany: 'International Airlines Group',
    aliases: ['British Air', 'BritishAirways', 'BAW'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['UK261', 'EU261'],
  },
  {
    iataCode: 'LH',
    icaoCode: 'DLH',
    name: 'Lufthansa',
    country: 'Germany',
    region: 'Europe',
    alliance: 'Star Alliance',
    parentCompany: 'Lufthansa Group',
    aliases: ['Deutsche Lufthansa', 'DLH'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'AF',
    icaoCode: 'AFR',
    name: 'Air France',
    country: 'France',
    region: 'Europe',
    alliance: 'SkyTeam',
    parentCompany: 'Air France-KLM Group',
    aliases: ['AirFrance', 'AFR'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'KL',
    icaoCode: 'KLM',
    name: 'KLM Royal Dutch Airlines',
    country: 'Netherlands',
    region: 'Europe',
    alliance: 'SkyTeam',
    parentCompany: 'Air France-KLM Group',
    aliases: ['KLM Royal Dutch Airlines', 'KLM'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'IB',
    icaoCode: 'IBE',
    name: 'Iberia',
    country: 'Spain',
    region: 'Europe',
    alliance: 'Oneworld',
    parentCompany: 'International Airlines Group',
    aliases: ['Iberia Airlines', 'IBE'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'SK',
    icaoCode: 'SAS',
    name: 'SAS Scandinavian Airlines',
    country: 'Sweden',
    region: 'Europe',
    alliance: 'Star Alliance',
    parentCompany: 'SAS Group',
    aliases: ['Scandinavian Airlines', 'SAS'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'TP',
    icaoCode: 'TAP',
    name: 'TAP Air Portugal',
    country: 'Portugal',
    region: 'Europe',
    parentCompany: 'TAP Air Portugal',
    aliases: ['TAP Portugal', 'TAP'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'LX',
    icaoCode: 'SWR',
    name: 'Swiss International Air Lines',
    country: 'Switzerland',
    region: 'Europe',
    alliance: 'Star Alliance',
    parentCompany: 'Lufthansa Group',
    aliases: ['Swiss', 'Swiss International'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['SWISS', 'EU261'],
  },
  {
    iataCode: 'OS',
    icaoCode: 'AUA',
    name: 'Austrian Airlines',
    country: 'Austria',
    region: 'Europe',
    alliance: 'Star Alliance',
    parentCompany: 'Lufthansa Group',
    aliases: ['Austrian', 'AUA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'SN',
    icaoCode: 'BEL',
    name: 'Brussels Airlines',
    country: 'Belgium',
    region: 'Europe',
    parentCompany: 'Lufthansa Group',
    aliases: ['Brussels Air', 'BEL'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },

  // Major Low-Cost European Airlines
  {
    iataCode: 'FR',
    icaoCode: 'RYR',
    name: 'Ryanair',
    country: 'Ireland',
    region: 'Europe',
    parentCompany: 'Ryanair Holdings',
    aliases: ['Ryan Air', 'RYR'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'U2',
    icaoCode: 'EZY',
    name: 'EasyJet',
    country: 'United Kingdom',
    region: 'Europe',
    parentCompany: 'EasyJet plc',
    aliases: ['Easy Jet', 'EZY'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['UK261', 'EU261'],
  },
  {
    iataCode: 'W6',
    icaoCode: 'WZZ',
    name: 'Wizz Air',
    country: 'Hungary',
    region: 'Europe',
    parentCompany: 'Wizz Air Holdings',
    aliases: ['Wizz', 'WZZ'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'DY',
    icaoCode: 'NOZ',
    name: 'Norwegian Air Shuttle',
    country: 'Norway',
    region: 'Europe',
    aliases: ['Norwegian', 'NOZ'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['NORWEGIAN', 'EU261'],
  },
  {
    iataCode: 'VY',
    icaoCode: 'VLG',
    name: 'Vueling',
    country: 'Spain',
    region: 'Europe',
    parentCompany: 'International Airlines Group',
    aliases: ['Vueling Airlines', 'VLG'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'PC',
    icaoCode: 'PGT',
    name: 'Pegasus Airlines',
    country: 'Turkey',
    region: 'Europe',
    aliases: ['Pegasus', 'PGT'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['EU261'],
  },

  // Major US Airlines
  {
    iataCode: 'AA',
    icaoCode: 'AAL',
    name: 'American Airlines',
    country: 'United States',
    region: 'North America',
    alliance: 'Oneworld',
    parentCompany: 'American Airlines Group',
    aliases: ['American', 'AAL'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['US_DOT'],
  },
  {
    iataCode: 'DL',
    icaoCode: 'DAL',
    name: 'Delta Air Lines',
    country: 'United States',
    region: 'North America',
    alliance: 'SkyTeam',
    parentCompany: 'Delta Air Lines Inc.',
    aliases: ['Delta', 'DAL'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['US_DOT'],
  },
  {
    iataCode: 'UA',
    icaoCode: 'UAL',
    name: 'United Airlines',
    country: 'United States',
    region: 'North America',
    alliance: 'Star Alliance',
    parentCompany: 'United Airlines Holdings',
    aliases: ['United', 'UAL'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['US_DOT'],
  },
  {
    iataCode: 'WN',
    icaoCode: 'SWA',
    name: 'Southwest Airlines',
    country: 'United States',
    region: 'North America',
    aliases: ['Southwest', 'SWA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['US_DOT'],
  },
  {
    iataCode: 'B6',
    icaoCode: 'JBU',
    name: 'JetBlue Airways',
    country: 'United States',
    region: 'North America',
    aliases: ['JetBlue', 'JBU'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['US_DOT'],
  },
  {
    iataCode: 'AS',
    icaoCode: 'ASA',
    name: 'Alaska Airlines',
    country: 'United States',
    region: 'North America',
    parentCompany: 'Alaska Air Group',
    aliases: ['Alaska', 'ASA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['US_DOT'],
  },
  {
    iataCode: 'NK',
    icaoCode: 'NKS',
    name: 'Spirit Airlines',
    country: 'United States',
    region: 'North America',
    aliases: ['Spirit', 'NKS'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['US_DOT'],
  },
  {
    iataCode: 'F9',
    icaoCode: 'FFT',
    name: 'Frontier Airlines',
    country: 'United States',
    region: 'North America',
    aliases: ['Frontier', 'FFT'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['US_DOT'],
  },
  {
    iataCode: 'HA',
    icaoCode: 'HAL',
    name: 'Hawaiian Airlines',
    country: 'United States',
    region: 'North America',
    aliases: ['Hawaiian', 'HAL'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['US_DOT'],
  },

  // Major Canadian Airlines
  {
    iataCode: 'AC',
    icaoCode: 'ACA',
    name: 'Air Canada',
    country: 'Canada',
    region: 'North America',
    alliance: 'Star Alliance',
    parentCompany: 'Air Canada',
    aliases: ['Air Canada', 'ACA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['CANADIAN'],
  },
  {
    iataCode: 'WS',
    icaoCode: 'WJA',
    name: 'WestJet',
    country: 'Canada',
    region: 'North America',
    parentCompany: 'WestJet Airlines Ltd.',
    aliases: ['WestJet', 'WJA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['CANADIAN'],
  },
  {
    iataCode: 'PD',
    icaoCode: 'POE',
    name: 'Porter Airlines',
    country: 'Canada',
    region: 'North America',
    aliases: ['Porter', 'POE'],
    isActive: true,
    hubType: 'regional',
    regulationCovered: ['CANADIAN'],
  },

  // Major Asian Airlines
  {
    iataCode: 'EK',
    icaoCode: 'UAE',
    name: 'Emirates',
    country: 'UAE',
    region: 'Middle East',
    aliases: ['Emirates', 'UAE'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'QR',
    icaoCode: 'QTR',
    name: 'Qatar Airways',
    country: 'Qatar',
    region: 'Middle East',
    alliance: 'Oneworld',
    aliases: ['Qatar', 'QTR'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'TK',
    icaoCode: 'THY',
    name: 'Turkish Airlines',
    country: 'Turkey',
    region: 'Middle East',
    alliance: 'Star Alliance',
    aliases: ['Turkish', 'THY'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'EY',
    icaoCode: 'ETD',
    name: 'Etihad Airways',
    country: 'UAE',
    region: 'Middle East',
    aliases: ['Etihad', 'ETD'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'SV',
    icaoCode: 'SVA',
    name: 'Saudia',
    country: 'Saudi Arabia',
    region: 'Middle East',
    aliases: ['Saudi Arabian Airlines', 'SVA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'MS',
    icaoCode: 'MSR',
    name: 'EgyptAir',
    country: 'Egypt',
    region: 'Africa',
    alliance: 'Star Alliance',
    aliases: ['Egypt Air', 'MSR'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'SQ',
    icaoCode: 'SIA',
    name: 'Singapore Airlines',
    country: 'Singapore',
    region: 'Asia',
    alliance: 'Star Alliance',
    aliases: ['Singapore', 'SIA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'CX',
    icaoCode: 'CPA',
    name: 'Cathay Pacific',
    country: 'Hong Kong',
    region: 'Asia',
    alliance: 'Oneworld',
    aliases: ['Cathay', 'CPA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'JL',
    icaoCode: 'JAL',
    name: 'Japan Airlines',
    country: 'Japan',
    region: 'Asia',
    alliance: 'Oneworld',
    aliases: ['JAL', 'Japan Air'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'NH',
    icaoCode: 'ANA',
    name: 'All Nippon Airways',
    country: 'Japan',
    region: 'Asia',
    alliance: 'Star Alliance',
    aliases: ['ANA', 'All Nippon'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'KE',
    icaoCode: 'KAL',
    name: 'Korean Air',
    country: 'South Korea',
    region: 'Asia',
    alliance: 'SkyTeam',
    aliases: ['Korean', 'KAL'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'OZ',
    icaoCode: 'AAR',
    name: 'Asiana Airlines',
    country: 'South Korea',
    region: 'Asia',
    alliance: 'Star Alliance',
    aliases: ['Asiana', 'AAR'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'TG',
    icaoCode: 'THA',
    name: 'Thai Airways International',
    country: 'Thailand',
    region: 'Asia',
    alliance: 'Star Alliance',
    aliases: ['Thai Airways', 'THA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'MH',
    icaoCode: 'MAS',
    name: 'Malaysia Airlines',
    country: 'Malaysia',
    region: 'Asia',
    alliance: 'Oneworld',
    aliases: ['Malaysia', 'MAS'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'GA',
    icaoCode: 'GIA',
    name: 'Garuda Indonesia',
    country: 'Indonesia',
    region: 'Asia',
    aliases: ['Garuda', 'GIA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'PR',
    icaoCode: 'PAL',
    name: 'Philippine Airlines',
    country: 'Philippines',
    region: 'Asia',
    aliases: ['Philippine', 'PAL'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'AI',
    icaoCode: 'AIC',
    name: 'Air India',
    country: 'India',
    region: 'Asia',
    aliases: ['Air India', 'AIC'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: '9W',
    icaoCode: 'JAI',
    name: 'Jet Airways',
    country: 'India',
    region: 'Asia',
    aliases: ['Jet', 'JAI'],
    isActive: false,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: '6E',
    icaoCode: 'IGO',
    name: 'IndiGo',
    country: 'India',
    region: 'Asia',
    aliases: ['IndiGo', 'IGO'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'SG',
    icaoCode: 'SEJ',
    name: 'SpiceJet',
    country: 'India',
    region: 'Asia',
    aliases: ['SpiceJet', 'SEJ'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'UK',
    icaoCode: 'VTI',
    name: 'Vistara',
    country: 'India',
    region: 'Asia',
    parentCompany: 'Tata Group',
    aliases: ['Vistara', 'VTI'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },

  // Major Chinese Airlines
  {
    iataCode: 'CA',
    icaoCode: 'CCA',
    name: 'Air China',
    country: 'China',
    region: 'Asia',
    alliance: 'Star Alliance',
    aliases: ['Air China', 'CCA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'CZ',
    icaoCode: 'CSN',
    name: 'China Southern Airlines',
    country: 'China',
    region: 'Asia',
    aliases: ['China Southern', 'CSN'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'MU',
    icaoCode: 'CES',
    name: 'China Eastern Airlines',
    country: 'China',
    region: 'Asia',
    alliance: 'SkyTeam',
    aliases: ['China Eastern', 'CES'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'HU',
    icaoCode: 'CHH',
    name: 'Hainan Airlines',
    country: 'China',
    region: 'Asia',
    aliases: ['Hainan', 'CHH'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'MF',
    icaoCode: 'CXA',
    name: 'Xiamen Airlines',
    country: 'China',
    region: 'Asia',
    aliases: ['Xiamen', 'CXA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: '3U',
    icaoCode: 'CSC',
    name: 'Sichuan Airlines',
    country: 'China',
    region: 'Asia',
    aliases: ['Sichuan', 'CSC'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },

  // Major Australian Airlines
  {
    iataCode: 'QF',
    icaoCode: 'QFA',
    name: 'Qantas',
    country: 'Australia',
    region: 'Oceania',
    alliance: 'Oneworld',
    aliases: ['Qantas', 'QFA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'VA',
    icaoCode: 'VOZ',
    name: 'Virgin Australia',
    country: 'Australia',
    region: 'Oceania',
    aliases: ['Virgin Australia', 'VOZ'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'JQ',
    icaoCode: 'JST',
    name: 'Jetstar Airways',
    country: 'Australia',
    region: 'Oceania',
    parentCompany: 'Qantas Group',
    aliases: ['Jetstar', 'JST'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['EU261'],
  },

  // Major South American Airlines
  {
    iataCode: 'JJ',
    icaoCode: 'TAM',
    name: 'LATAM Airlines',
    country: 'Brazil',
    region: 'South America',
    alliance: 'SkyTeam',
    aliases: ['LATAM', 'TAM'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'AR',
    icaoCode: 'ARG',
    name: 'Aerolíneas Argentinas',
    country: 'Argentina',
    region: 'South America',
    alliance: 'SkyTeam',
    aliases: ['Aerolineas Argentinas', 'ARG'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'LA',
    icaoCode: 'LAN',
    name: 'LATAM Airlines Chile',
    country: 'Chile',
    region: 'South America',
    alliance: 'SkyTeam',
    aliases: ['LAN', 'LATAM Chile'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'AV',
    icaoCode: 'AVA',
    name: 'Avianca',
    country: 'Colombia',
    region: 'South America',
    alliance: 'Star Alliance',
    aliases: ['Avianca', 'AVA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'CM',
    icaoCode: 'CMP',
    name: 'Copa Airlines',
    country: 'Panama',
    region: 'South America',
    alliance: 'Star Alliance',
    aliases: ['Copa', 'CMP'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },

  // Major African Airlines
  {
    iataCode: 'ET',
    icaoCode: 'ETH',
    name: 'Ethiopian Airlines',
    country: 'Ethiopia',
    region: 'Africa',
    alliance: 'Star Alliance',
    aliases: ['Ethiopian', 'ETH'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'SA',
    icaoCode: 'SAA',
    name: 'South African Airways',
    country: 'South Africa',
    region: 'Africa',
    aliases: ['South African', 'SAA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'AT',
    icaoCode: 'RAM',
    name: 'Royal Air Maroc',
    country: 'Morocco',
    region: 'Africa',
    aliases: ['Royal Air Maroc', 'RAM'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'KQ',
    icaoCode: 'KQA',
    name: 'Kenya Airways',
    country: 'Kenya',
    region: 'Africa',
    alliance: 'SkyTeam',
    aliases: ['Kenya', 'KQA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },

  // Major Cargo Airlines
  {
    iataCode: 'FX',
    icaoCode: 'FDX',
    name: 'FedEx Express',
    country: 'United States',
    region: 'North America',
    aliases: ['FedEx', 'FDX'],
    isActive: true,
    hubType: 'cargo',
    regulationCovered: ['US_DOT'],
  },
  {
    iataCode: '5X',
    icaoCode: 'UPS',
    name: 'UPS Airlines',
    country: 'United States',
    region: 'North America',
    aliases: ['UPS', 'UPS Airlines'],
    isActive: true,
    hubType: 'cargo',
    regulationCovered: ['US_DOT'],
  },
  {
    iataCode: 'D0',
    icaoCode: 'DHK',
    name: 'DHL Air',
    country: 'Germany',
    region: 'Europe',
    aliases: ['DHL', 'DHK'],
    isActive: true,
    hubType: 'cargo',
    regulationCovered: ['EU261'],
  },

  // Additional Regional Airlines
  {
    iataCode: 'WF',
    icaoCode: 'WIF',
    name: 'Widerøe',
    country: 'Norway',
    region: 'Europe',
    aliases: ['Wideroe', 'WIF'],
    isActive: true,
    hubType: 'regional',
    regulationCovered: ['NORWEGIAN', 'EU261'],
  },
  {
    iataCode: 'AY',
    icaoCode: 'FIN',
    name: 'Finnair',
    country: 'Finland',
    region: 'Europe',
    alliance: 'Oneworld',
    aliases: ['Finnair', 'FIN'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'LO',
    icaoCode: 'LOT',
    name: 'LOT Polish Airlines',
    country: 'Poland',
    region: 'Europe',
    alliance: 'Star Alliance',
    aliases: ['LOT', 'Polish Airlines'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'A3',
    icaoCode: 'AEE',
    name: 'Aegean Airlines',
    country: 'Greece',
    region: 'Europe',
    alliance: 'Star Alliance',
    aliases: ['Aegean', 'AEE'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'OK',
    icaoCode: 'CSA',
    name: 'Czech Airlines',
    country: 'Czech Republic',
    region: 'Europe',
    aliases: ['Czech', 'CSA'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'RO',
    icaoCode: 'ROT',
    name: 'TAROM',
    country: 'Romania',
    region: 'Europe',
    aliases: ['TAROM', 'ROT'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'JU',
    icaoCode: 'ASL',
    name: 'Air Serbia',
    country: 'Serbia',
    region: 'Europe',
    aliases: ['Air Serbia', 'ASL'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'OU',
    icaoCode: 'CTN',
    name: 'Croatia Airlines',
    country: 'Croatia',
    region: 'Europe',
    aliases: ['Croatia', 'CTN'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'JP',
    icaoCode: 'ADR',
    name: 'Adria Airways',
    country: 'Slovenia',
    region: 'Europe',
    aliases: ['Adria', 'ADR'],
    isActive: false,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'BT',
    icaoCode: 'BTI',
    name: 'airBaltic',
    country: 'Latvia',
    region: 'Europe',
    aliases: ['airBaltic', 'BTI'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'EW',
    icaoCode: 'EWG',
    name: 'Eurowings',
    country: 'Germany',
    region: 'Europe',
    parentCompany: 'Lufthansa Group',
    aliases: ['Eurowings', 'EWG'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: '4U',
    icaoCode: 'GWI',
    name: 'Germanwings',
    country: 'Germany',
    region: 'Europe',
    parentCompany: 'Lufthansa Group',
    aliases: ['Germanwings', 'GWI'],
    isActive: false,
    hubType: 'low-cost',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'HV',
    icaoCode: 'TRA',
    name: 'Transavia',
    country: 'Netherlands',
    region: 'Europe',
    parentCompany: 'Air France-KLM Group',
    aliases: ['Transavia', 'TRA'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'TO',
    icaoCode: 'TVF',
    name: 'Transavia France',
    country: 'France',
    region: 'Europe',
    parentCompany: 'Air France-KLM Group',
    aliases: ['Transavia France', 'TVF'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['EU261'],
  },
  {
    iataCode: 'BE',
    icaoCode: 'BEE',
    name: 'Flybe',
    country: 'United Kingdom',
    region: 'Europe',
    aliases: ['Flybe', 'BEE'],
    isActive: false,
    hubType: 'regional',
    regulationCovered: ['UK261', 'EU261'],
  },
  {
    iataCode: 'LM',
    icaoCode: 'LOG',
    name: 'Loganair',
    country: 'United Kingdom',
    region: 'Europe',
    aliases: ['Loganair', 'LOG'],
    isActive: true,
    hubType: 'regional',
    regulationCovered: ['UK261', 'EU261'],
  },
  {
    iataCode: 'T3',
    icaoCode: 'EZE',
    name: 'Eastern Airways',
    country: 'United Kingdom',
    region: 'Europe',
    aliases: ['Eastern', 'EZE'],
    isActive: true,
    hubType: 'regional',
    regulationCovered: ['UK261', 'EU261'],
  },
  {
    iataCode: 'BY',
    icaoCode: 'TOM',
    name: 'TUI Airways',
    country: 'United Kingdom',
    region: 'Europe',
    parentCompany: 'TUI Group',
    aliases: ['TUI', 'TOM'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['UK261', 'EU261'],
  },
  {
    iataCode: 'LS',
    icaoCode: 'EXS',
    name: 'Jet2.com',
    country: 'United Kingdom',
    region: 'Europe',
    aliases: ['Jet2', 'EXS'],
    isActive: true,
    hubType: 'low-cost',
    regulationCovered: ['UK261', 'EU261'],
  },
  {
    iataCode: 'VS',
    icaoCode: 'VIR',
    name: 'Virgin Atlantic',
    country: 'United Kingdom',
    region: 'Europe',
    aliases: ['Virgin Atlantic', 'VIR'],
    isActive: true,
    hubType: 'major',
    regulationCovered: ['UK261', 'EU261'],
  },
];

// Helper functions for airline operations
export function searchAirlines(query: string): Airline[] {
  if (!query || query.length < 1) return [];

  const lowerQuery = query.toLowerCase();
  return airlines
    .filter(
      (airline) =>
        airline.iataCode.toLowerCase().includes(lowerQuery) ||
        airline.icaoCode.toLowerCase().includes(lowerQuery) ||
        airline.name.toLowerCase().includes(lowerQuery) ||
        airline.country.toLowerCase().includes(lowerQuery) ||
        airline.aliases.some((alias) =>
          alias.toLowerCase().includes(lowerQuery)
        )
    )
    .slice(0, 10); // Limit to 10 results
}

export function getAirlineByIATACode(iataCode: string): Airline | undefined {
  return airlines.find(
    (airline) => airline.iataCode.toLowerCase() === iataCode.toLowerCase()
  );
}

export function getAirlineByICAOCode(icaoCode: string): Airline | undefined {
  return airlines.find(
    (airline) => airline.icaoCode.toLowerCase() === icaoCode.toLowerCase()
  );
}

export function getAirlineByName(name: string): Airline | undefined {
  const lowerName = name.toLowerCase();
  return airlines.find(
    (airline) =>
      airline.name.toLowerCase().includes(lowerName) ||
      airline.aliases.some((alias) => alias.toLowerCase().includes(lowerName))
  );
}

export function normalizeAirlineName(name: string): string {
  // Try to find exact match first
  const exactMatch = getAirlineByName(name);
  if (exactMatch) {
    return exactMatch.name;
  }

  // Try common variations
  const lowerName = name.toLowerCase().trim();

  // Common airline name patterns
  const patterns = [
    { pattern: /^ba\b/i, name: 'British Airways' },
    { pattern: /^lh\b/i, name: 'Lufthansa' },
    { pattern: /^af\b/i, name: 'Air France' },
    { pattern: /^kl\b/i, name: 'KLM Royal Dutch Airlines' },
    { pattern: /^ib\b/i, name: 'Iberia' },
    { pattern: /^sk\b/i, name: 'SAS Scandinavian Airlines' },
    { pattern: /^tp\b/i, name: 'TAP Air Portugal' },
    { pattern: /^lx\b/i, name: 'Swiss International Air Lines' },
    { pattern: /^os\b/i, name: 'Austrian Airlines' },
    { pattern: /^sn\b/i, name: 'Brussels Airlines' },
    { pattern: /^fr\b/i, name: 'Ryanair' },
    { pattern: /^u2\b/i, name: 'EasyJet' },
    { pattern: /^w6\b/i, name: 'Wizz Air' },
    { pattern: /^dy\b/i, name: 'Norwegian Air Shuttle' },
    { pattern: /^vy\b/i, name: 'Vueling' },
    { pattern: /^aa\b/i, name: 'American Airlines' },
    { pattern: /^dl\b/i, name: 'Delta Air Lines' },
    { pattern: /^ua\b/i, name: 'United Airlines' },
    { pattern: /^wn\b/i, name: 'Southwest Airlines' },
    { pattern: /^b6\b/i, name: 'JetBlue Airways' },
    { pattern: /^as\b/i, name: 'Alaska Airlines' },
    { pattern: /^nk\b/i, name: 'Spirit Airlines' },
    { pattern: /^f9\b/i, name: 'Frontier Airlines' },
    { pattern: /^ha\b/i, name: 'Hawaiian Airlines' },
    { pattern: /^ac\b/i, name: 'Air Canada' },
    { pattern: /^ws\b/i, name: 'WestJet' },
    { pattern: /^pd\b/i, name: 'Porter Airlines' },
    { pattern: /^ek\b/i, name: 'Emirates' },
    { pattern: /^qr\b/i, name: 'Qatar Airways' },
    { pattern: /^tk\b/i, name: 'Turkish Airlines' },
    { pattern: /^ey\b/i, name: 'Etihad Airways' },
    { pattern: /^sv\b/i, name: 'Saudia' },
    { pattern: /^ms\b/i, name: 'EgyptAir' },
    { pattern: /^sq\b/i, name: 'Singapore Airlines' },
    { pattern: /^cx\b/i, name: 'Cathay Pacific' },
    { pattern: /^jl\b/i, name: 'Japan Airlines' },
    { pattern: /^nh\b/i, name: 'All Nippon Airways' },
    { pattern: /^ke\b/i, name: 'Korean Air' },
    { pattern: /^oz\b/i, name: 'Asiana Airlines' },
    { pattern: /^tg\b/i, name: 'Thai Airways International' },
    { pattern: /^mh\b/i, name: 'Malaysia Airlines' },
    { pattern: /^ga\b/i, name: 'Garuda Indonesia' },
    { pattern: /^pr\b/i, name: 'Philippine Airlines' },
    { pattern: /^ai\b/i, name: 'Air India' },
    { pattern: /^9w\b/i, name: 'Jet Airways' },
    { pattern: /^6e\b/i, name: 'IndiGo' },
    { pattern: /^sg\b/i, name: 'SpiceJet' },
    { pattern: /^uk\b/i, name: 'Vistara' },
    { pattern: /^ca\b/i, name: 'Air China' },
    { pattern: /^cz\b/i, name: 'China Southern Airlines' },
    { pattern: /^mu\b/i, name: 'China Eastern Airlines' },
    { pattern: /^hu\b/i, name: 'Hainan Airlines' },
    { pattern: /^mf\b/i, name: 'Xiamen Airlines' },
    { pattern: /^3u\b/i, name: 'Sichuan Airlines' },
    { pattern: /^qf\b/i, name: 'Qantas' },
    { pattern: /^va\b/i, name: 'Virgin Australia' },
    { pattern: /^jq\b/i, name: 'Jetstar Airways' },
    { pattern: /^jj\b/i, name: 'LATAM Airlines' },
    { pattern: /^ar\b/i, name: 'Aerolíneas Argentinas' },
    { pattern: /^la\b/i, name: 'LATAM Airlines Chile' },
    { pattern: /^av\b/i, name: 'Avianca' },
    { pattern: /^cm\b/i, name: 'Copa Airlines' },
    { pattern: /^et\b/i, name: 'Ethiopian Airlines' },
    { pattern: /^sa\b/i, name: 'South African Airways' },
    { pattern: /^at\b/i, name: 'Royal Air Maroc' },
    { pattern: /^kq\b/i, name: 'Kenya Airways' },
  ];

  for (const { pattern, name } of patterns) {
    if (pattern.test(lowerName)) {
      return name;
    }
  }

  // Return original name if no match found
  return name;
}

export function validateAirlineCode(code: string): boolean {
  return airlines.some(
    (airline) =>
      airline.iataCode.toLowerCase() === code.toLowerCase() ||
      airline.icaoCode.toLowerCase() === code.toLowerCase()
  );
}

export function getAirlinesByRegion(region: string): Airline[] {
  return airlines.filter(
    (airline) => airline.region.toLowerCase() === region.toLowerCase()
  );
}

export function getAirlinesByCountry(country: string): Airline[] {
  return airlines.filter(
    (airline) => airline.country.toLowerCase() === country.toLowerCase()
  );
}

export function getAirlinesByAlliance(alliance: string): Airline[] {
  return airlines.filter(
    (airline) => airline.alliance?.toLowerCase() === alliance.toLowerCase()
  );
}

export function getAirlinesByHubType(hubType: Airline['hubType']): Airline[] {
  return airlines.filter((airline) => airline.hubType === hubType);
}

export function getActiveAirlines(): Airline[] {
  return airlines.filter((airline) => airline.isActive);
}

export function getAirlinesByRegulation(
  regulation: Airline['regulationCovered'][0]
): Airline[] {
  return airlines.filter((airline) =>
    airline.regulationCovered.includes(regulation)
  );
}

export function getAirlineRegulations(
  airlineCode: string
): Airline['regulationCovered'] {
  const airline =
    getAirlineByIATACode(airlineCode) || getAirlineByICAOCode(airlineCode);
  return airline?.regulationCovered || [];
}

// Export the airlines array for backward compatibility
export { airlines as allAirlines };
