/**
 * Airline Alias System
 * Handles airline name normalization, aliases, and fuzzy matching
 */

import {
  AirlineData,
  getAirlineByCode,
  getAirlineByName,
} from './airline-data';

export interface AirlineAlias {
  primaryCode: string;
  aliases: string[];
  icaoCode?: string;
  parentCompany?: string;
  commonNames: string[];
}

// Comprehensive alias mappings for major airlines
export const AIRLINE_ALIASES: Record<string, AirlineAlias> = {
  // Major European Airlines
  BA: {
    primaryCode: 'BA',
    aliases: ['British Air', 'BritishAirways', 'BAW'],
    icaoCode: 'BAW',
    parentCompany: 'International Airlines Group',
    commonNames: ['British Airways', 'BA', 'British Air'],
  },
  FR: {
    primaryCode: 'FR',
    aliases: ['Ryan Air', 'RYR'],
    icaoCode: 'RYR',
    parentCompany: 'Ryanair Holdings',
    commonNames: ['Ryanair', 'Ryan Air', 'FR'],
  },
  U2: {
    primaryCode: 'U2',
    aliases: ['Easy Jet', 'EZY'],
    icaoCode: 'EZY',
    parentCompany: 'EasyJet plc',
    commonNames: ['EasyJet', 'Easy Jet', 'U2'],
  },
  LH: {
    primaryCode: 'LH',
    aliases: ['Deutsche Lufthansa', 'DLH'],
    icaoCode: 'DLH',
    parentCompany: 'Lufthansa Group',
    commonNames: ['Lufthansa', 'Deutsche Lufthansa', 'LH'],
  },
  AF: {
    primaryCode: 'AF',
    aliases: ['AirFrance', 'AFR'],
    icaoCode: 'AFR',
    parentCompany: 'Air France-KLM Group',
    commonNames: ['Air France', 'AirFrance', 'AF'],
  },
  KL: {
    primaryCode: 'KL',
    aliases: ['KLM Royal Dutch Airlines', 'KLM'],
    icaoCode: 'KLM',
    parentCompany: 'Air France-KLM Group',
    commonNames: ['KLM', 'KLM Royal Dutch Airlines', 'KL'],
  },

  // Major North American Airlines
  AA: {
    primaryCode: 'AA',
    aliases: ['American', 'AAL'],
    icaoCode: 'AAL',
    parentCompany: 'American Airlines Group',
    commonNames: ['American Airlines', 'American', 'AA'],
  },
  DL: {
    primaryCode: 'DL',
    aliases: ['Delta', 'DAL'],
    icaoCode: 'DAL',
    parentCompany: 'Delta Air Lines',
    commonNames: ['Delta Air Lines', 'Delta', 'DL'],
  },
  UA: {
    primaryCode: 'UA',
    aliases: ['United', 'UAL'],
    icaoCode: 'UAL',
    parentCompany: 'United Airlines Holdings',
    commonNames: ['United Airlines', 'United', 'UA'],
  },
  WN: {
    primaryCode: 'WN',
    aliases: ['Southwest', 'SWA'],
    icaoCode: 'SWA',
    parentCompany: 'Southwest Airlines',
    commonNames: ['Southwest Airlines', 'Southwest', 'WN'],
  },

  // Major Asian Airlines
  EK: {
    primaryCode: 'EK',
    aliases: ['Emirates', 'UAE'],
    icaoCode: 'UAE',
    parentCompany: 'Emirates Group',
    commonNames: ['Emirates', 'EK'],
  },
  QR: {
    primaryCode: 'QR',
    aliases: ['Qatar', 'QTR'],
    icaoCode: 'QTR',
    parentCompany: 'Qatar Airways Group',
    commonNames: ['Qatar Airways', 'Qatar', 'QR'],
  },
  SQ: {
    primaryCode: 'SQ',
    aliases: ['Singapore Airlines', 'SIA'],
    icaoCode: 'SIA',
    parentCompany: 'Singapore Airlines Limited',
    commonNames: ['Singapore Airlines', 'SIA', 'SQ'],
  },

  // Legacy/Defunct Airlines
  AZ: {
    primaryCode: 'AZ',
    aliases: ['Alitalia Linee Aeree Italiane', 'AZA'],
    icaoCode: 'AZA',
    parentCompany: 'Alitalia S.p.A.',
    commonNames: ['Alitalia', 'Alitalia Linee Aeree Italiane', 'AZ'],
    // Note: Alitalia ceased operations, replaced by ITA Airways
  },
  IT: {
    primaryCode: 'IT',
    aliases: ['ITA Airways', 'ITY'],
    icaoCode: 'ITY',
    parentCompany: 'ITA Airways',
    commonNames: ['ITA Airways', 'IT'],
  },
};

// Common airline name variations and abbreviations
export const COMMON_ABBREVIATIONS: Record<string, string[]> = {
  airlines: ['air', 'airline', 'airways', 'aviation'],
  international: ['intl', 'int', 'international'],
  airways: ['air', 'airline', 'airlines', 'aviation'],
  aviation: ['air', 'airline', 'airlines', 'airways'],
  group: ['grp', 'group', 'holdings'],
  holdings: ['grp', 'group', 'holdings'],
  limited: ['ltd', 'limited', 'inc', 'incorporated'],
  incorporated: ['inc', 'incorporated', 'ltd', 'limited'],
  corporation: ['corp', 'corporation', 'inc', 'incorporated'],
  company: ['co', 'company', 'corp', 'corporation'],
};

// Parent company mappings
export const PARENT_COMPANIES: Record<string, string[]> = {
  'International Airlines Group': ['BA', 'IB', 'VY'],
  'Lufthansa Group': ['LH', 'LX', 'OS', 'SN', 'EW'],
  'Air France-KLM Group': ['AF', 'KL'],
  'American Airlines Group': ['AA'],
  'Delta Air Lines': ['DL'],
  'United Airlines Holdings': ['UA'],
  'Southwest Airlines': ['WN'],
  'Emirates Group': ['EK'],
  'Qatar Airways Group': ['QR'],
  'Singapore Airlines Limited': ['SQ'],
};

/**
 * Normalize airline name by removing common variations and standardizing format
 */
export function normalizeAirlineName(name: string): string {
  if (!name) return '';

  let normalized = name.toLowerCase().trim();

  // Remove common suffixes and prefixes
  const suffixes = [
    'airlines',
    'airline',
    'airways',
    'air',
    'aviation',
    'group',
    'holdings',
    'limited',
    'ltd',
    'incorporated',
    'inc',
    'corporation',
    'corp',
    'company',
    'co',
  ];
  const prefixes = ['air', 'aviation'];

  // Remove suffixes
  for (const suffix of suffixes) {
    if (normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length).trim();
      break;
    }
  }

  // Remove prefixes
  for (const prefix of prefixes) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length).trim();
      break;
    }
  }

  // Handle common abbreviations
  for (const [full, abbreviations] of Object.entries(COMMON_ABBREVIATIONS)) {
    for (const abbr of abbreviations) {
      if (normalized.includes(abbr)) {
        normalized = normalized.replace(abbr, full);
      }
    }
  }

  return normalized.trim();
}

/**
 * Find airline by fuzzy matching against aliases and common names
 */
export function findAirlineByAlias(query: string): AirlineData | undefined {
  if (!query) return undefined;

  const normalizedQuery = normalizeAirlineName(query);
  const upperQuery = query.toUpperCase();

  // First try exact code match
  const exactMatch = getAirlineByCode(upperQuery);
  if (exactMatch) return exactMatch;

  // Try ICAO code match
  for (const alias of Object.values(AIRLINE_ALIASES)) {
    if (alias.icaoCode === upperQuery) {
      return getAirlineByCode(alias.primaryCode);
    }
  }

  // Try alias matching
  for (const [code, alias] of Object.entries(AIRLINE_ALIASES)) {
    // Check aliases array
    for (const aliasName of alias.aliases) {
      if (
        aliasName.toLowerCase() === normalizedQuery ||
        aliasName.toUpperCase() === upperQuery
      ) {
        return getAirlineByCode(code);
      }
    }

    // Check common names
    for (const commonName of alias.commonNames) {
      if (
        normalizeAirlineName(commonName) === normalizedQuery ||
        commonName.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(normalizeAirlineName(commonName))
      ) {
        return getAirlineByCode(code);
      }
    }
  }

  // Try fuzzy matching against airline names
  return getAirlineByName(query);
}

/**
 * Get all aliases for a given airline code
 */
export function getAirlineAliases(code: string): string[] {
  const alias = AIRLINE_ALIASES[code.toUpperCase()];
  if (!alias) return [];

  return [...alias.aliases, ...alias.commonNames];
}

/**
 * Check if two airline codes refer to the same airline (including parent company relationships)
 */
export function areSameAirline(code1: string, code2: string): boolean {
  if (code1.toUpperCase() === code2.toUpperCase()) return true;

  // Check if they're aliases of the same primary airline
  const alias1 = AIRLINE_ALIASES[code1.toUpperCase()];
  const alias2 = AIRLINE_ALIASES[code2.toUpperCase()];

  if (alias1 && alias2) {
    return alias1.primaryCode === alias2.primaryCode;
  }

  // Check parent company relationships
  for (const [_parent, airlines] of Object.entries(PARENT_COMPANIES)) {
    if (
      airlines.includes(code1.toUpperCase()) &&
      airlines.includes(code2.toUpperCase())
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Get airlines in the same parent company group
 */
export function getSisterAirlines(code: string): string[] {
  const upperCode = code.toUpperCase();

  for (const [_parent, airlines] of Object.entries(PARENT_COMPANIES)) {
    if (airlines.includes(upperCode)) {
      return airlines.filter((airline) => airline !== upperCode);
    }
  }

  return [];
}

/**
 * Validate if an airline code is valid and active
 */
export function validateAirlineCode(code: string): {
  valid: boolean;
  active: boolean;
  airline?: AirlineData;
} {
  const airline = getAirlineByCode(code);

  if (!airline) {
    return { valid: false, active: false };
  }

  return {
    valid: true,
    active: airline.isActive,
    airline,
  };
}
