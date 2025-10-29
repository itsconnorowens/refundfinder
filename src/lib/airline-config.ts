/**
 * Airline Configuration System for EU Airlines
 * Stores airline-specific claim submission requirements and methods
 */

import { findAirlineByAlias } from './airline-aliases';

export interface AirlineConfig {
  airlineCode: string;
  airlineName: string;
  submissionMethod: 'email' | 'web_form' | 'postal';
  claimEmail?: string;
  claimFormUrl?: string;
  postalAddress?: string;
  requiredDocuments: string[];
  requiredFields: string[];
  expectedResponseTime: string;
  followUpSchedule: string[];
  specialInstructions: string;
  regulationCovered: (
    | 'EU261'
    | 'UK261'
    | 'US_DOT'
    | 'SWISS'
    | 'NORWEGIAN'
    | 'CANADIAN'
  )[];
  contactPhone?: string;
  website?: string;
  claimFormFields?: Record<string, string>; // Field mappings for forms
  // New fields for enhanced airline database
  aliases?: string[]; // Common name variations and abbreviations
  parentCompany?: string; // Parent company or airline group
  region: string; // Geographic region (Europe, North America, Asia-Pacific, etc.)
  isActive: boolean; // Whether airline is currently operating
  passengerVolume?: number; // Annual passenger volume for prioritization
}

export interface ClaimSubmissionTemplate {
  type: 'email' | 'web_form' | 'postal';
  subject: string;
  body: string;
  attachments: string[];
  ccEmails?: string[];
  to?: string;
  url?: string;
  address?: string;
}

// Top 10 EU Airlines Configuration
export const AIRLINE_CONFIGS: Record<string, AirlineConfig> = {
  BA: {
    airlineCode: 'BA',
    airlineName: 'British Airways',
    submissionMethod: 'web_form',
    claimFormUrl:
      'https://www.britishairways.com/en-gb/information/legal/eu261',
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'delay_reason',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online EU261 form. Include all supporting documents. Follow up if no response after 4 weeks.',
    regulationCovered: ['UK261'],
    contactPhone: '+44 20 8738 5100',
    website: 'https://www.britishairways.com',
    claimFormFields: {
      passenger_name: 'Full Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      delay_reason: 'Reason for Delay',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['British Air', 'BritishAirways', 'BAW'],
    parentCompany: 'International Airlines Group',
    region: 'Europe',
    isActive: true,
    passengerVolume: 45000000,
  },

  FR: {
    airlineCode: 'FR',
    airlineName: 'Ryanair',
    submissionMethod: 'email',
    claimEmail: 'eu261@ryanair.com',
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Email claims to eu261@ryanair.com. Include booking reference and all documents. They may request additional information.',
    regulationCovered: ['EU261'],
    contactPhone: '+353 1 945 1212',
    website: 'https://www.ryanair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Ryan Air', 'RYR'],
    parentCompany: 'Ryanair Holdings',
    region: 'Europe',
    isActive: true,
    passengerVolume: 150000000,
  },

  U2: {
    airlineCode: 'U2',
    airlineName: 'EasyJet',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.easyjet.com/en/help/contact/compensation-claims',
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online compensation form. EasyJet has a streamlined process but may require additional documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+44 330 365 5000',
    website: 'https://www.easyjet.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Easy Jet', 'EZY'],
    parentCompany: 'EasyJet plc',
    region: 'Europe',
    isActive: true,
    passengerVolume: 96000000,
  },

  LH: {
    airlineCode: 'LH',
    airlineName: 'Lufthansa',
    submissionMethod: 'email',
    claimEmail: 'eu261@lufthansa.com',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-6 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Email to eu261@lufthansa.com. Include booking confirmation. Lufthansa typically responds within 2-4 weeks.',
    regulationCovered: ['EU261'],
    contactPhone: '+49 69 86 799 799',
    website: 'https://www.lufthansa.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Deutsche Lufthansa', 'DLH'],
    parentCompany: 'Lufthansa Group',
    region: 'Europe',
    isActive: true,
    passengerVolume: 109000000,
  },

  AF: {
    airlineCode: 'AF',
    airlineName: 'Air France',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.airfrance.com/contact/compensation-claim',
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '3-5 weeks',
    followUpSchedule: ['3 weeks', '5 weeks', '8 weeks'],
    specialInstructions:
      'Use online compensation form. Air France has a comprehensive system but may require additional verification.',
    regulationCovered: ['EU261'],
    contactPhone: '+33 1 41 56 78 00',
    website: 'https://www.airfrance.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['AirFrance', 'AFR'],
    parentCompany: 'Air France-KLM Group',
    region: 'Europe',
    isActive: true,
    passengerVolume: 87000000,
  },

  KL: {
    airlineCode: 'KL',
    airlineName: 'KLM',
    submissionMethod: 'web_form',
    claimFormUrl:
      'https://www.klm.com/customer-service/contact/compensation-claim',
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online compensation form. KLM has an efficient process and typically responds quickly.',
    regulationCovered: ['EU261'],
    contactPhone: '+31 20 649 9123',
    website: 'https://www.klm.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['KLM Royal Dutch Airlines', 'KLM'],
    parentCompany: 'Air France-KLM Group',
    region: 'Europe',
    isActive: true,
    passengerVolume: 34000000,
  },

  IB: {
    airlineCode: 'IB',
    airlineName: 'Iberia',
    submissionMethod: 'email',
    claimEmail: 'eu261@iberia.com',
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Email to eu261@iberia.com. Include all supporting documents. Iberia may take longer to respond.',
    regulationCovered: ['EU261'],
    contactPhone: '+34 91 400 84 00',
    website: 'https://www.iberia.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Iberia Airlines', 'IBE'],
    parentCompany: 'International Airlines Group',
    region: 'Europe',
    isActive: true,
    passengerVolume: 25000000,
  },

  AZ: {
    airlineCode: 'AZ',
    airlineName: 'Alitalia',
    submissionMethod: 'email',
    claimEmail: 'eu261@alitalia.com',
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '4-8 weeks',
    followUpSchedule: ['4 weeks', '8 weeks', '12 weeks'],
    specialInstructions:
      'Email to eu261@alitalia.com. Alitalia may take longer to process claims due to restructuring.',
    regulationCovered: ['EU261'],
    contactPhone: '+39 06 65649',
    website: 'https://www.alitalia.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Alitalia Linee Aeree Italiane', 'AZA'],
    parentCompany: 'Alitalia S.p.A.',
    region: 'Europe',
    isActive: false,
    passengerVolume: 0,
  },

  SK: {
    airlineCode: 'SK',
    airlineName: 'SAS Scandinavian',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.sas.se/en/contact-us/compensation-claim/',
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online compensation form. SAS has a streamlined process and good customer service.',
    regulationCovered: ['EU261'],
    contactPhone: '+46 8 797 40 00',
    website: 'https://www.sas.se',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Scandinavian Airlines', 'SAS'],
    parentCompany: 'SAS Group',
    region: 'Europe',
    isActive: true,
    passengerVolume: 30000000,
  },

  TP: {
    airlineCode: 'TP',
    airlineName: 'TAP Air Portugal',
    submissionMethod: 'email',
    claimEmail: 'eu261@tap.pt',
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Email to eu261@tap.pt. Include all supporting documents. TAP may require additional verification.',
    regulationCovered: ['EU261'],
    contactPhone: '+351 21 294 20 00',
    website: 'https://www.flytap.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['TAP Portugal', 'TAP'],
    parentCompany: 'TAP Air Portugal',
    region: 'Europe',
    isActive: true,
    passengerVolume: 15000000,
  },

  // Top 20 Airlines by Passenger Volume - Major North American Airlines
  AA: {
    airlineCode: 'AA',
    airlineName: 'American Airlines',
    submissionMethod: 'web_form',
    claimFormUrl:
      'https://www.aa.com/i18n/customer-service/feedback/complaint.jsp',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online complaint form. American Airlines has a comprehensive system for handling compensation claims. Include all supporting documentation.',
    regulationCovered: ['US_DOT'],
    contactPhone: '+1 800 433 7300',
    website: 'https://www.aa.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['American', 'AAL'],
    parentCompany: 'American Airlines Group',
    region: 'North America',
    isActive: true,
    passengerVolume: 200000000,
  },

  DL: {
    airlineCode: 'DL',
    airlineName: 'Delta Air Lines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.delta.com/contactus/popup/feedback',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online feedback form. Delta typically responds quickly to compensation claims. Include detailed information about the delay.',
    regulationCovered: ['US_DOT'],
    contactPhone: '+1 800 221 1212',
    website: 'https://www.delta.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Delta', 'DAL'],
    parentCompany: 'Delta Air Lines',
    region: 'North America',
    isActive: true,
    passengerVolume: 200000000,
  },

  UA: {
    airlineCode: 'UA',
    airlineName: 'United Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.united.com/ual/en/us/fly/contact/feedback.html',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online feedback form. United Airlines has a streamlined process for compensation claims. Provide detailed delay information.',
    regulationCovered: ['US_DOT'],
    contactPhone: '+1 800 864 8331',
    website: 'https://www.united.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['United', 'UAL'],
    parentCompany: 'United Airlines Holdings',
    region: 'North America',
    isActive: true,
    passengerVolume: 180000000,
  },

  WN: {
    airlineCode: 'WN',
    airlineName: 'Southwest Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.southwest.com/contact-us/feedback/',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '1-3 weeks',
    followUpSchedule: ['1 week', '3 weeks', '6 weeks'],
    specialInstructions:
      'Use online feedback form. Southwest Airlines is known for excellent customer service and quick response times for compensation claims.',
    regulationCovered: ['US_DOT'],
    contactPhone: '+1 800 435 9792',
    website: 'https://www.southwest.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Southwest', 'SWA'],
    parentCompany: 'Southwest Airlines',
    region: 'North America',
    isActive: true,
    passengerVolume: 150000000,
  },

  // Major Asian Airlines
  EK: {
    airlineCode: 'EK',
    airlineName: 'Emirates',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.emirates.com/english/help/contact-us/',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Emirates has a comprehensive compensation system. Include all supporting documentation and detailed delay information.',
    regulationCovered: ['EU261'],
    contactPhone: '+971 4 294 4444',
    website: 'https://www.emirates.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Emirates', 'UAE'],
    parentCompany: 'Emirates Group',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 60000000,
  },

  QR: {
    airlineCode: 'QR',
    airlineName: 'Qatar Airways',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.qatarairways.com/en/help/contact-us.html',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Qatar Airways typically responds promptly to compensation claims. Include detailed delay information and supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+974 4023 0000',
    website: 'https://www.qatarairways.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Qatar', 'QTR'],
    parentCompany: 'Qatar Airways Group',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 30000000,
  },

  SQ: {
    airlineCode: 'SQ',
    airlineName: 'Singapore Airlines',
    submissionMethod: 'web_form',
    claimFormUrl:
      'https://www.singaporeair.com/en_UK/us/help-and-support/contact-us/',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Singapore Airlines has excellent customer service and typically responds quickly to compensation claims.',
    regulationCovered: ['EU261'],
    contactPhone: '+65 6223 8888',
    website: 'https://www.singaporeair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Singapore Airlines', 'SIA'],
    parentCompany: 'Singapore Airlines Limited',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 20000000,
  },

  NH: {
    airlineCode: 'NH',
    airlineName: 'All Nippon Airways',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.ana.co.jp/en/us/help/contact/',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. ANA has a comprehensive system for handling compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+81 3 6741 1120',
    website: 'https://www.ana.co.jp',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['ANA', 'All Nippon'],
    parentCompany: 'ANA Holdings',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 50000000,
  },

  JL: {
    airlineCode: 'JL',
    airlineName: 'Japan Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.jal.co.jp/en/contact/',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Japan Airlines has a streamlined process for compensation claims. Provide detailed delay information.',
    regulationCovered: ['EU261'],
    contactPhone: '+81 3 5460 0522',
    website: 'https://www.jal.co.jp',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['JAL', 'Japan Air'],
    parentCompany: 'Japan Airlines',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 40000000,
  },

  KE: {
    airlineCode: 'KE',
    airlineName: 'Korean Air',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.koreanair.com/us/en/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Korean Air typically responds promptly to compensation claims. Include detailed delay information and supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+82 2 2669 8000',
    website: 'https://www.koreanair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Korean Air', 'KAL'],
    parentCompany: 'Korean Air',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 25000000,
  },

  // Major Chinese Airlines
  CZ: {
    airlineCode: 'CZ',
    airlineName: 'China Southern Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.csair.com/en/contact/',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. China Southern Airlines may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+86 20 8612 8888',
    website: 'https://www.csair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['China Southern', 'CSN'],
    parentCompany: 'China Southern Airlines',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 150000000,
  },

  MU: {
    airlineCode: 'MU',
    airlineName: 'China Eastern Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.ceair.com/en/contact/',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. China Eastern Airlines may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+86 21 95530',
    website: 'https://www.ceair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['China Eastern', 'CES'],
    parentCompany: 'China Eastern Airlines',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 120000000,
  },

  CA: {
    airlineCode: 'CA',
    airlineName: 'Air China',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.airchina.com/en/contact/',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. Air China may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+86 10 95583',
    website: 'https://www.airchina.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Air China', 'CCA'],
    parentCompany: 'Air China',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 100000000,
  },

  // Major Indian Airlines
  '6E': {
    airlineCode: '6E',
    airlineName: 'IndiGo',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.goindigo.in/contact-us.html',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. IndiGo typically responds quickly to compensation claims. Include detailed delay information.',
    regulationCovered: ['EU261'],
    contactPhone: '+91 80 4648 4648',
    website: 'https://www.goindigo.in',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['IndiGo', 'IGO'],
    parentCompany: 'InterGlobe Aviation',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 80000000,
  },

  // Major Australian Airlines
  QF: {
    airlineCode: 'QF',
    airlineName: 'Qantas',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.qantas.com/us/en/support/contact-us.html',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Qantas has a comprehensive system for handling compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+61 13 13 13',
    website: 'https://www.qantas.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Qantas', 'QFA'],
    parentCompany: 'Qantas Airways',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 50000000,
  },

  // Major Canadian Airlines
  AC: {
    airlineCode: 'AC',
    airlineName: 'Air Canada',
    submissionMethod: 'web_form',
    claimFormUrl:
      'https://www.aircanada.com/us/en/aco/home/help/contact-us.html',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Air Canada typically responds promptly to compensation claims. Include detailed delay information.',
    regulationCovered: ['CANADIAN'],
    contactPhone: '+1 888 247 2262',
    website: 'https://www.aircanada.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Air Canada', 'ACA'],
    parentCompany: 'Air Canada',
    region: 'North America',
    isActive: true,
    passengerVolume: 50000000,
  },

  // Major European Airlines (additional)
  W6: {
    airlineCode: 'W6',
    airlineName: 'Wizz Air',
    submissionMethod: 'web_form',
    claimFormUrl:
      'https://wizzair.com/en-gb/information-and-services/help/contact-us',
    requiredDocuments: ['boarding_pass', 'delay_proof', 'passenger_details'],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Wizz Air has a streamlined process for compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+44 330 977 0444',
    website: 'https://wizzair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Wizz Air', 'WZZ'],
    parentCompany: 'Wizz Air Holdings',
    region: 'Europe',
    isActive: true,
    passengerVolume: 40000000,
  },

  TK: {
    airlineCode: 'TK',
    airlineName: 'Turkish Airlines',
    submissionMethod: 'web_form',
    claimFormUrl:
      'https://www.turkishairlines.com/en-int/any-questions/contact-us/',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Turkish Airlines typically responds promptly to compensation claims. Include detailed delay information.',
    regulationCovered: ['EU261'],
    contactPhone: '+90 212 444 0849',
    website: 'https://www.turkishairlines.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Turkish Airlines', 'THY'],
    parentCompany: 'Turkish Airlines',
    region: 'Europe',
    isActive: true,
    passengerVolume: 75000000,
  },

  // Additional North American Airlines
  B6: {
    airlineCode: 'B6',
    airlineName: 'JetBlue Airways',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.jetblue.com/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. JetBlue Airways typically responds promptly to compensation claims. Include detailed delay information.',
    regulationCovered: ['US_DOT'],
    contactPhone: '+1 800 538 2583',
    website: 'https://www.jetblue.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['JetBlue', 'JBU'],
    parentCompany: 'JetBlue Airways',
    region: 'North America',
    isActive: true,
    passengerVolume: 40000000,
  },

  AS: {
    airlineCode: 'AS',
    airlineName: 'Alaska Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.alaskaair.com/content/contact-us/customer-care',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online customer care form. Alaska Airlines typically responds quickly to compensation claims. Include detailed delay information.',
    regulationCovered: ['US_DOT'],
    contactPhone: '+1 800 252 7522',
    website: 'https://www.alaskaair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Alaska Air', 'ASA'],
    parentCompany: 'Alaska Air Group',
    region: 'North America',
    isActive: true,
    passengerVolume: 45000000,
  },

  NK: {
    airlineCode: 'NK',
    airlineName: 'Spirit Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.spirit.com/modify-and-cancel/complaints',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online complaint form. Spirit Airlines may take longer to respond. Include all supporting documentation.',
    regulationCovered: ['US_DOT'],
    contactPhone: '+1 855 728 3555',
    website: 'https://www.spirit.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Spirit', 'NKS'],
    parentCompany: 'Spirit Airlines',
    region: 'North America',
    isActive: true,
    passengerVolume: 30000000,
  },

  F9: {
    airlineCode: 'F9',
    airlineName: 'Frontier Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.flyfrontier.com/help/complaints',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online complaint form. Frontier Airlines may take longer to respond. Include all supporting documentation.',
    regulationCovered: ['US_DOT'],
    contactPhone: '+1 801 401 9000',
    website: 'https://www.flyfrontier.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Frontier', 'FFT'],
    parentCompany: 'Frontier Airlines',
    region: 'North America',
    isActive: true,
    passengerVolume: 20000000,
  },

  HA: {
    airlineCode: 'HA',
    airlineName: 'Hawaiian Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.hawaiianairlines.com/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Hawaiian Airlines typically responds promptly to compensation claims. Include detailed delay information.',
    regulationCovered: ['US_DOT'],
    contactPhone: '+1 800 367 5320',
    website: 'https://www.hawaiianairlines.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Hawaiian', 'HAL'],
    parentCompany: 'Hawaiian Airlines',
    region: 'North America',
    isActive: true,
    passengerVolume: 12000000,
  },

  WS: {
    airlineCode: 'WS',
    airlineName: 'WestJet',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.westjet.com/en-ca/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. WestJet typically responds promptly to compensation claims. Include detailed delay information.',
    regulationCovered: ['CANADIAN'],
    contactPhone: '+1 888 937 8538',
    website: 'https://www.westjet.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['WestJet', 'WJA'],
    parentCompany: 'WestJet',
    region: 'North America',
    isActive: true,
    passengerVolume: 25000000,
  },

  // Additional Asian Airlines
  CX: {
    airlineCode: 'CX',
    airlineName: 'Cathay Pacific',
    submissionMethod: 'web_form',
    claimFormUrl:
      'https://www.cathaypacific.com/cx/en_GB/forms-and-requests/complaints.html',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online complaint form. Cathay Pacific has excellent customer service and typically responds quickly to compensation claims.',
    regulationCovered: ['EU261'],
    contactPhone: '+852 2747 1888',
    website: 'https://www.cathaypacific.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Cathay Pacific Airways', 'CPA'],
    parentCompany: 'Swire Pacific',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 15000000,
  },

  TG: {
    airlineCode: 'TG',
    airlineName: 'Thai Airways',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.thaiairways.com/en/contact_us.page',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. Thai Airways may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+66 2 356 1111',
    website: 'https://www.thaiairways.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Thai Airways International', 'THA'],
    parentCompany: 'Thai Airways International',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 20000000,
  },

  MH: {
    airlineCode: 'MH',
    airlineName: 'Malaysia Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.malaysiaairlines.com/contact-us.html',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. Malaysia Airlines may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+60 3 7843 3000',
    website: 'https://www.malaysiaairlines.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Malaysia Airlines', 'MAS'],
    parentCompany: 'Malaysia Airlines',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 15000000,
  },

  VA: {
    airlineCode: 'VA',
    airlineName: 'Virgin Australia',
    submissionMethod: 'web_form',
    claimFormUrl:
      'https://help.virginaustralia.com/support-and-contact/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Virgin Australia typically responds promptly to compensation claims. Include detailed delay information.',
    regulationCovered: ['EU261'],
    contactPhone: '+61 13 67 89',
    website: 'https://www.virginaustralia.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Virgin Australia', 'VOZ'],
    parentCompany: 'Virgin Australia Group',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 20000000,
  },

  NZ: {
    airlineCode: 'NZ',
    airlineName: 'Air New Zealand',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.airnewzealand.com/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Air New Zealand has a comprehensive system for handling compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+64 9 357 3000',
    website: 'https://www.airnewzealand.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Air New Zealand', 'ANZ'],
    parentCompany: 'Air New Zealand',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 15000000,
  },

  // Additional Middle East Airlines
  EY: {
    airlineCode: 'EY',
    airlineName: 'Etihad Airways',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.etihad.com/en-us/help/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Etihad Airways has a comprehensive compensation system. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+971 600 555 666',
    website: 'https://www.etihad.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Etihad', 'ETD'],
    parentCompany: 'Etihad Aviation Group',
    region: 'Middle East',
    isActive: true,
    passengerVolume: 20000000,
  },

  SV: {
    airlineCode: 'SV',
    airlineName: 'Saudia',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.saudia.com/en/help-and-contact',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. Saudia may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+966 92000 4400',
    website: 'https://www.saudia.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Saudi Arabian Airlines', 'SVA'],
    parentCompany: 'Saudi Arabian Airlines',
    region: 'Middle East',
    isActive: true,
    passengerVolume: 30000000,
  },

  GF: {
    airlineCode: 'GF',
    airlineName: 'Gulf Air',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.gulfair.com/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. Gulf Air may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+973 17373737',
    website: 'https://www.gulfair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Gulf Air', 'GFA'],
    parentCompany: 'Gulf Air',
    region: 'Middle East',
    isActive: true,
    passengerVolume: 8000000,
  },

  RJ: {
    airlineCode: 'RJ',
    airlineName: 'Royal Jordanian',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.rj.com/en/help-and-contact',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. Royal Jordanian may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+962 6 510 0000',
    website: 'https://www.rj.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Royal Jordanian', 'RJA'],
    parentCompany: 'Royal Jordanian Airlines',
    region: 'Middle East',
    isActive: true,
    passengerVolume: 5000000,
  },

  KU: {
    airlineCode: 'KU',
    airlineName: 'Kuwait Airways',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.kuwaitairways.com/en/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. Kuwait Airways may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+965 184 4444',
    website: 'https://www.kuwaitairways.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Kuwait Airways', 'KAC'],
    parentCompany: 'Kuwait Airways',
    region: 'Middle East',
    isActive: true,
    passengerVolume: 4000000,
  },

  // Lufthansa Group Airlines
  LX: {
    airlineCode: 'LX',
    airlineName: 'Swiss International Air Lines',
    submissionMethod: 'email',
    claimEmail: 'eu261@swiss.com',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Email to eu261@swiss.com. Swiss International Air Lines typically responds within 2-4 weeks.',
    regulationCovered: ['SWISS'],
    contactPhone: '+41 848 700 700',
    website: 'https://www.swiss.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Swiss', 'SWR'],
    parentCompany: 'Lufthansa Group',
    region: 'Europe',
    isActive: true,
    passengerVolume: 20000000,
  },

  OS: {
    airlineCode: 'OS',
    airlineName: 'Austrian Airlines',
    submissionMethod: 'email',
    claimEmail: 'eu261@austrian.com',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Email to eu261@austrian.com. Austrian Airlines typically responds within 2-4 weeks.',
    regulationCovered: ['EU261'],
    contactPhone: '+43 5 1766 1000',
    website: 'https://www.austrian.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Austrian', 'AUA'],
    parentCompany: 'Lufthansa Group',
    region: 'Europe',
    isActive: true,
    passengerVolume: 12000000,
  },

  SN: {
    airlineCode: 'SN',
    airlineName: 'Brussels Airlines',
    submissionMethod: 'email',
    claimEmail: 'eu261@brusselsairlines.com',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Email to eu261@brusselsairlines.com. Brussels Airlines typically responds within 2-4 weeks.',
    regulationCovered: ['EU261'],
    contactPhone: '+32 2 777 00 11',
    website: 'https://www.brusselsairlines.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Brussels', 'BEL'],
    parentCompany: 'Lufthansa Group',
    region: 'Europe',
    isActive: true,
    passengerVolume: 8000000,
  },

  // Additional European Airlines
  DY: {
    airlineCode: 'DY',
    airlineName: 'Norwegian Air Shuttle',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.norwegian.com/about/contact',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Norwegian typically responds within 2-4 weeks. Follow up if no response after 4 weeks.',
    regulationCovered: ['NORWEGIAN'],
    contactPhone: '+47 23 00 48 00',
    website: 'https://www.norwegian.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Norwegian', 'NAX'],
    parentCompany: 'Norwegian Air Shuttle',
    region: 'Europe',
    isActive: true,
    passengerVolume: 20000000,
  },

  VY: {
    airlineCode: 'VY',
    airlineName: 'Vueling',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.vueling.com/en/help/contact',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Vueling typically responds within 2-4 weeks. Include all supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+34 932 85 10 11',
    website: 'https://www.vueling.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Vueling Airlines', 'VLG'],
    parentCompany: 'International Airlines Group',
    region: 'Europe',
    isActive: true,
    passengerVolume: 35000000,
  },

  A3: {
    airlineCode: 'A3',
    airlineName: 'Aegean Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://en.aegeanair.com/help-and-contact/contact',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Aegean Airlines typically responds within 2-4 weeks. Include all supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+30 210 6261000',
    website: 'https://en.aegeanair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Aegean', 'AEE'],
    parentCompany: 'Aegean Airlines',
    region: 'Europe',
    isActive: true,
    passengerVolume: 15000000,
  },

  AY: {
    airlineCode: 'AY',
    airlineName: 'Finnair',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.finnair.com/gb/us/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Finnair typically responds within 2-4 weeks. Include all supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+358 600 140 140',
    website: 'https://www.finnair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Finnair', 'FIN'],
    parentCompany: 'Finnair',
    region: 'Europe',
    isActive: true,
    passengerVolume: 12000000,
  },

  EI: {
    airlineCode: 'EI',
    airlineName: 'Aer Lingus',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.aerlingus.com/help/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Aer Lingus typically responds within 2-4 weeks. Include all supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+353 1 886 8844',
    website: 'https://www.aerlingus.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Aer Lingus', 'EIN'],
    parentCompany: 'International Airlines Group',
    region: 'Europe',
    isActive: true,
    passengerVolume: 15000000,
  },

  LO: {
    airlineCode: 'LO',
    airlineName: 'LOT Polish Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.lot.com/en/help-and-contact',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. LOT Polish Airlines typically responds within 2-4 weeks. Include all supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+48 22 577 7777',
    website: 'https://www.lot.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['LOT', 'LOT Polish'],
    parentCompany: 'LOT Polish Airlines',
    region: 'Europe',
    isActive: true,
    passengerVolume: 10000000,
  },

  UX: {
    airlineCode: 'UX',
    airlineName: 'Air Europa',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.aireuropa.com/en/help/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Air Europa typically responds within 2-4 weeks. Include all supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+34 902 40 15 01',
    website: 'https://www.aireuropa.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Air Europa', 'AEA'],
    parentCompany: 'Globalia',
    region: 'Europe',
    isActive: true,
    passengerVolume: 12000000,
  },

  LS: {
    airlineCode: 'LS',
    airlineName: 'Jet2',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.jet2.com/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Jet2 typically responds within 2-4 weeks. Include all supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+44 330 365 5000',
    website: 'https://www.jet2.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Jet2', 'EXS'],
    parentCompany: 'Jet2',
    region: 'Europe',
    isActive: true,
    passengerVolume: 15000000,
  },

  // Additional North American Budget Airlines
  G4: {
    airlineCode: 'G4',
    airlineName: 'Allegiant Air',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.allegiantair.com/contact',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Allegiant Air may take longer to respond. Include all supporting documentation.',
    regulationCovered: ['US_DOT'],
    contactPhone: '+1 702 505 8888',
    website: 'https://www.allegiantair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Allegiant', 'AGY'],
    parentCompany: 'Allegiant Air',
    region: 'North America',
    isActive: true,
    passengerVolume: 15000000,
  },

  SY: {
    airlineCode: 'SY',
    airlineName: 'Sun Country Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.suncountry.com/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Sun Country Airlines typically responds within 2-4 weeks.',
    regulationCovered: ['US_DOT'],
    contactPhone: '+1 651 905 2737',
    website: 'https://www.suncountry.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Sun Country', 'SCX'],
    parentCompany: 'Sun Country Airlines',
    region: 'North America',
    isActive: true,
    passengerVolume: 5000000,
  },

  // Additional Latin American Airlines
  AM: {
    airlineCode: 'AM',
    airlineName: 'Aeromexico',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.aeromexico.com/en-us/help/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. Aeromexico may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+52 55 5133 4000',
    website: 'https://www.aeromexico.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Aeromexico', 'AMX'],
    parentCompany: 'Grupo Aeromexico',
    region: 'Latin America',
    isActive: true,
    passengerVolume: 20000000,
  },

  Y4: {
    airlineCode: 'Y4',
    airlineName: 'Volaris',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.volaris.com/en/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. Volaris may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+52 55 1102 8000',
    website: 'https://www.volaris.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Volaris', 'VOI'],
    parentCompany: 'Volaris',
    region: 'Latin America',
    isActive: true,
    passengerVolume: 15000000,
  },

  LA: {
    airlineCode: 'LA',
    airlineName: 'LATAM Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.latam.com/en/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. LATAM Airlines may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+56 2 3200 3200',
    website: 'https://www.latam.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['LATAM', 'LAN'],
    parentCompany: 'LATAM Airlines Group',
    region: 'Latin America',
    isActive: true,
    passengerVolume: 60000000,
  },

  AV: {
    airlineCode: 'AV',
    airlineName: 'Avianca',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.avianca.com/us/en/customer-support/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. Avianca may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+1 855 300 95 42',
    website: 'https://www.avianca.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Avianca', 'AVA'],
    parentCompany: 'Avianca Holdings',
    region: 'Latin America',
    isActive: true,
    passengerVolume: 30000000,
  },

  G3: {
    airlineCode: 'G3',
    airlineName: 'Gol',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.voegol.com.br/en/sac',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. Gol may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+55 11 2128 4500',
    website: 'https://www.voegol.com.br',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Gol', 'GLO'],
    parentCompany: 'Gol Linhas Aereas',
    region: 'Latin America',
    isActive: true,
    passengerVolume: 35000000,
  },

  // Additional Asian Airlines
  '5J': {
    airlineCode: '5J',
    airlineName: 'Cebu Pacific',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.cebupacificair.com/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Cebu Pacific typically responds within 2-4 weeks. Include all supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+63 2 8802 7000',
    website: 'https://www.cebupacificair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Cebu Pacific', 'CEB'],
    parentCompany: 'Cebu Air',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 20000000,
  },

  SG: {
    airlineCode: 'SG',
    airlineName: 'SpiceJet',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.spicejet.com/ContactUs',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. SpiceJet typically responds within 2-4 weeks. Include all supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+91 24 2526 0407',
    website: 'https://www.spicejet.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['SpiceJet', 'SEJ'],
    parentCompany: 'SpiceJet',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 25000000,
  },

  AK: {
    airlineCode: 'AK',
    airlineName: 'AirAsia',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.airasia.com/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. AirAsia typically responds within 2-4 weeks. Include all supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+60 3 2116 1133',
    website: 'https://www.airasia.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['AirAsia', 'AXM'],
    parentCompany: 'AirAsia Group',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 40000000,
  },

  OZ: {
    airlineCode: 'OZ',
    airlineName: 'Asiana Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://flyasiana.com/en/contact/us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Asiana Airlines has a comprehensive system for handling compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+82 2 2669 8000',
    website: 'https://flyasiana.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Asiana', 'AAR'],
    parentCompany: 'Asiana Airlines',
    region: 'Asia-Pacific',
    isActive: true,
    passengerVolume: 15000000,
  },

  // Additional Middle East Airlines
  FZ: {
    airlineCode: 'FZ',
    airlineName: 'flydubai',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.flydubai.com/en/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. flydubai typically responds within 2-4 weeks. Include all supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+971 600 54 44 45',
    website: 'https://www.flydubai.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['flydubai', 'FDB'],
    parentCompany: 'flydubai',
    region: 'Middle East',
    isActive: true,
    passengerVolume: 10000000,
  },

  G9: {
    airlineCode: 'G9',
    airlineName: 'Air Arabia',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.airarabia.com/en/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Air Arabia typically responds within 2-4 weeks. Include all supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+971 6 558 0000',
    website: 'https://www.airarabia.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Air Arabia', 'ABY'],
    parentCompany: 'Air Arabia',
    region: 'Middle East',
    isActive: true,
    passengerVolume: 8000000,
  },

  WY: {
    airlineCode: 'WY',
    airlineName: 'Oman Air',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.omanair.com/en/help-and-support/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Oman Air typically responds within 2-4 weeks. Include all supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+968 24 531 111',
    website: 'https://www.omanair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Oman Air', 'OMA'],
    parentCompany: 'Oman Air',
    region: 'Middle East',
    isActive: true,
    passengerVolume: 5000000,
  },

  // Additional European Airlines
  EW: {
    airlineCode: 'EW',
    airlineName: 'Eurowings',
    submissionMethod: 'web_form',
    claimFormUrl:
      'https://www.eurowings.com/en/help-and-contact/contact-us.html',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Eurowings typically responds within 2-4 weeks. Include all supporting documents.',
    regulationCovered: ['EU261'],
    contactPhone: '+49 221 599 88115',
    website: 'https://www.eurowings.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Eurowings', 'EWG'],
    parentCompany: 'Lufthansa Group',
    region: 'Europe',
    isActive: true,
    passengerVolume: 35000000,
  },

  VS: {
    airlineCode: 'VS',
    airlineName: 'Virgin Atlantic',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://help.virginatlantic.com/gb/en/support/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Virgin Atlantic has excellent customer service and typically responds quickly to compensation claims.',
    regulationCovered: ['EU261'],
    contactPhone: '+44 344 209 7777',
    website: 'https://www.virginatlantic.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Virgin Atlantic', 'VIR'],
    parentCompany: 'Virgin Atlantic',
    region: 'Europe',
    isActive: true,
    passengerVolume: 5000000,
  },

  BE: {
    airlineCode: 'BE',
    airlineName: 'Flybe',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.flybe.com/contact',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
    ],
    expectedResponseTime: '2-4 weeks',
    followUpSchedule: ['2 weeks', '4 weeks', '8 weeks'],
    specialInstructions:
      'Use online contact form. Note: Flybe ceased operations in 2020, check website for current status.',
    regulationCovered: ['EU261'],
    contactPhone: '+44 1392 366189',
    website: 'https://www.flybe.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Flybe', 'BEE'],
    parentCompany: 'Connect Airways',
    region: 'Europe',
    isActive: false,
    passengerVolume: 0,
  },

  // Additional African Airlines
  ET: {
    airlineCode: 'ET',
    airlineName: 'Ethiopian Airlines',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.ethiopianairlines.com/en/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. Ethiopian Airlines may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+251 11 665 6666',
    website: 'https://www.ethiopianairlines.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Ethiopian', 'ETH'],
    parentCompany: 'Ethiopian Airlines',
    region: 'Africa',
    isActive: true,
    passengerVolume: 12000000,
  },

  SA: {
    airlineCode: 'SA',
    airlineName: 'South African Airways',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.flysaa.com/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. South African Airways may take longer to process compensation claims. Note: SAA has undergone restructuring.',
    regulationCovered: ['EU261'],
    contactPhone: '+27 11 978 5311',
    website: 'https://www.flysaa.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['South African Airways', 'SAA'],
    parentCompany: 'South African Airways',
    region: 'Africa',
    isActive: false,
    passengerVolume: 0,
  },

  KQ: {
    airlineCode: 'KQ',
    airlineName: 'Kenya Airways',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.kenya-airways.com/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. Kenya Airways may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+254 20 327 4100',
    website: 'https://www.kenya-airways.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Kenya Airways', 'KQA'],
    parentCompany: 'Kenya Airways',
    region: 'Africa',
    isActive: true,
    passengerVolume: 4000000,
  },

  MS: {
    airlineCode: 'MS',
    airlineName: 'EgyptAir',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.egyptair.com/en/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. EgyptAir may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+20 2 2267 8500',
    website: 'https://www.egyptair.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['EgyptAir', 'MSR'],
    parentCompany: 'EgyptAir',
    region: 'Africa',
    isActive: true,
    passengerVolume: 7000000,
  },

  AT: {
    airlineCode: 'AT',
    airlineName: 'Royal Air Maroc',
    submissionMethod: 'web_form',
    claimFormUrl: 'https://www.royalairmaroc.com/en-us/contact-us',
    requiredDocuments: [
      'boarding_pass',
      'delay_proof',
      'passenger_details',
      'booking_confirmation',
    ],
    requiredFields: [
      'passenger_name',
      'flight_number',
      'departure_date',
      'delay_duration',
      'booking_reference',
      'departure_airport',
      'arrival_airport',
    ],
    expectedResponseTime: '3-6 weeks',
    followUpSchedule: ['3 weeks', '6 weeks', '10 weeks'],
    specialInstructions:
      'Use online contact form. Royal Air Maroc may take longer to process compensation claims. Include all supporting documentation.',
    regulationCovered: ['EU261'],
    contactPhone: '+212 522 48 60 60',
    website: 'https://www.royalairmaroc.com',
    claimFormFields: {
      passenger_name: 'Passenger Name',
      flight_number: 'Flight Number',
      departure_date: 'Departure Date',
      delay_duration: 'Delay Duration',
      booking_reference: 'Booking Reference',
      departure_airport: 'Departure Airport',
      arrival_airport: 'Arrival Airport',
    },
    aliases: ['Royal Air Maroc', 'RAM'],
    parentCompany: 'Royal Air Maroc',
    region: 'Africa',
    isActive: true,
    passengerVolume: 8000000,
  },
};

/**
 * Get airline configuration by airline code or name with enhanced fuzzy matching
 */
export function getAirlineConfig(airline: string): AirlineConfig | undefined {
  if (!airline) return undefined;

  // First try exact code match
  const codeMatch = AIRLINE_CONFIGS[airline.toUpperCase()];
  if (codeMatch) return codeMatch;

  // Try fuzzy matching with aliases
  const airlineData = findAirlineByAlias(airline);
  if (airlineData) {
    const configMatch = AIRLINE_CONFIGS[airlineData.code];
    if (configMatch) return configMatch;
  }

  // Then try name match with enhanced fuzzy matching (more precise)
  const normalizedQuery = airline.toLowerCase().trim();
  const nameMatch = Object.values(AIRLINE_CONFIGS).find((config) => {
    const configName = config.airlineName.toLowerCase();
    const configAliases = config.aliases || [];

    // Skip if query is too generic (like "airline", "air", etc.)
    if (
      normalizedQuery.length < 3 ||
      ['airline', 'air', 'airways', 'aviation'].includes(normalizedQuery)
    ) {
      return false;
    }

    // Direct name match (more precise)
    if (
      configName === normalizedQuery ||
      (configName.includes(normalizedQuery) && normalizedQuery.length >= 4)
    ) {
      return true;
    }

    // Alias match (more precise)
    for (const alias of configAliases) {
      const aliasLower = alias.toLowerCase();
      if (
        aliasLower === normalizedQuery ||
        (aliasLower.includes(normalizedQuery) && normalizedQuery.length >= 3)
      ) {
        return true;
      }
    }

    return false;
  });

  return nameMatch || undefined;
}

/**
 * Get all airline configurations
 */
export function getAllAirlineConfigs(): AirlineConfig[] {
  return Object.values(AIRLINE_CONFIGS);
}

/**
 * Get airlines by submission method
 */
export function getAirlinesBySubmissionMethod(
  method: 'email' | 'web_form' | 'postal'
): AirlineConfig[] {
  return Object.values(AIRLINE_CONFIGS).filter(
    (config) => config.submissionMethod === method
  );
}

/**
 * Generate submission template for an airline
 */
export function generateSubmissionTemplate(
  airlineConfig: AirlineConfig,
  claimData: any
): ClaimSubmissionTemplate {
  const {
    submissionMethod,
    airlineName,
    claimEmail,
    claimFormUrl,
    postalAddress,
  } = airlineConfig;

  if (submissionMethod === 'email') {
    return {
      type: 'email',
      to: claimEmail,
      subject: `EU261 Compensation Claim - Flight ${claimData.flightNumber} - ${claimData.departureDate}`,
      body: generateEmailBody(airlineConfig, claimData),
      attachments: airlineConfig.requiredDocuments,
      ccEmails: [],
    };
  } else if (submissionMethod === 'web_form') {
    return {
      type: 'web_form',
      url: claimFormUrl,
      subject: `Web Form Submission Required - ${airlineName}`,
      body: generateWebFormInstructions(airlineConfig, claimData),
      attachments: airlineConfig.requiredDocuments,
      ccEmails: [],
    };
  } else {
    return {
      type: 'postal',
      address: postalAddress,
      subject: `Postal Submission Required - ${airlineName}`,
      body: generatePostalInstructions(airlineConfig, claimData),
      attachments: airlineConfig.requiredDocuments,
      ccEmails: [],
    };
  }
}

/**
 * Generate email body for email submissions
 */
function generateEmailBody(
  airlineConfig: AirlineConfig,
  claimData: any
): string {
  return `
Dear ${airlineConfig.airlineName} Customer Service,

I am writing to submit a compensation claim under EU261 regulations for the following flight:

Flight Details:
- Flight Number: ${claimData.flightNumber}
- Departure Date: ${claimData.departureDate}
- Route: ${claimData.departureAirport} to ${claimData.arrivalAirport}
- Delay Duration: ${claimData.delayDuration}
- Delay Reason: ${claimData.delayReason || 'Not specified'}

Passenger Details:
- Name: ${claimData.firstName} ${claimData.lastName}
- Email: ${claimData.email}
- Booking Reference: ${claimData.bookingReference || 'Not provided'}

Compensation Claim:
Under EU261 regulations, I am entitled to compensation for this flight delay. The delay duration of ${claimData.delayDuration} exceeds the 3-hour threshold for compensation eligibility.

Please process this claim and provide compensation as required under EU261 regulations.

Attached documents:
- Boarding pass
- Delay proof/documentation
- Passenger details

I look forward to your prompt response.

Best regards,
${claimData.firstName} ${claimData.lastName}
${claimData.email}

---
This claim is being processed by Flghtly on behalf of the passenger.
For any questions, please contact: claims@flghtly.com
`;
}

/**
 * Generate web form instructions
 */
function generateWebFormInstructions(
  airlineConfig: AirlineConfig,
  claimData: any
): string {
  return `
WEB FORM SUBMISSION INSTRUCTIONS

Airline: ${airlineConfig.airlineName}
Form URL: ${airlineConfig.claimFormUrl}

Required Information to Enter:
- Passenger Name: ${claimData.firstName} ${claimData.lastName}
- Flight Number: ${claimData.flightNumber}
- Departure Date: ${claimData.departureDate}
- Route: ${claimData.departureAirport} to ${claimData.arrivalAirport}
- Delay Duration: ${claimData.delayDuration}
- Delay Reason: ${claimData.delayReason || 'Not specified'}
- Booking Reference: ${claimData.bookingReference || 'Not provided'}
- Email: ${claimData.email}

Documents to Upload:
- Boarding pass
- Delay proof/documentation
- Any additional supporting documents

Special Instructions:
${airlineConfig.specialInstructions}

Expected Response Time: ${airlineConfig.expectedResponseTime}

Follow-up Schedule:
${airlineConfig.followUpSchedule.map((schedule) => `- ${schedule}`).join('\n')}
`;
}

/**
 * Generate postal submission instructions
 */
function generatePostalInstructions(
  airlineConfig: AirlineConfig,
  claimData: any
): string {
  return `
POSTAL SUBMISSION INSTRUCTIONS

Airline: ${airlineConfig.airlineName}
Address: ${airlineConfig.postalAddress}

Required Documents to Send:
- Printed claim form (if available)
- Boarding pass copy
- Delay proof/documentation
- Passenger details form

Claim Information:
- Passenger Name: ${claimData.firstName} ${claimData.lastName}
- Flight Number: ${claimData.flightNumber}
- Departure Date: ${claimData.departureDate}
- Route: ${claimData.departureAirport} to ${claimData.arrivalAirport}
- Delay Duration: ${claimData.delayDuration}
- Delay Reason: ${claimData.delayReason || 'Not specified'}
- Booking Reference: ${claimData.bookingReference || 'Not provided'}
- Email: ${claimData.email}

Special Instructions:
${airlineConfig.specialInstructions}

Expected Response Time: ${airlineConfig.expectedResponseTime}

Follow-up Schedule:
${airlineConfig.followUpSchedule.map((schedule) => `- ${schedule}`).join('\n')}
`;
}

/**
 * Get airline configuration by airline code with enhanced lookup
 */
export function getAirlineConfigByCode(
  code: string
): AirlineConfig | undefined {
  return AIRLINE_CONFIGS[code.toUpperCase()];
}

/**
 * Get airline configuration by airline name with fuzzy matching
 */
export function getAirlineConfigByName(
  name: string
): AirlineConfig | undefined {
  const airlineData = findAirlineByAlias(name);

  if (airlineData) {
    return AIRLINE_CONFIGS[airlineData.code];
  }

  // Fallback to direct name matching (more precise)
  const normalizedQuery = name.toLowerCase().trim();
  return Object.values(AIRLINE_CONFIGS).find((config) => {
    const configName = config.airlineName.toLowerCase();
    const configAliases = config.aliases || [];

    // Skip if query is too generic
    if (
      normalizedQuery.length < 3 ||
      ['airline', 'air', 'airways', 'aviation'].includes(normalizedQuery)
    ) {
      return false;
    }

    // Direct name match (more precise)
    if (
      configName === normalizedQuery ||
      (configName.includes(normalizedQuery) && normalizedQuery.length >= 4)
    ) {
      return true;
    }

    // Alias match (more precise)
    for (const alias of configAliases) {
      const aliasLower = alias.toLowerCase();
      if (
        aliasLower === normalizedQuery ||
        (aliasLower.includes(normalizedQuery) && normalizedQuery.length >= 3)
      ) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Get airline configurations by region
 */
export function getAirlineConfigsByRegion(region: string): AirlineConfig[] {
  return Object.values(AIRLINE_CONFIGS).filter(
    (config) => config.region.toLowerCase() === region.toLowerCase()
  );
}

/**
 * Get airline configurations by parent company
 */
export function getAirlineConfigsByParentCompany(
  parentCompany: string
): AirlineConfig[] {
  return Object.values(AIRLINE_CONFIGS).filter(
    (config) =>
      config.parentCompany?.toLowerCase() === parentCompany.toLowerCase()
  );
}

/**
 * Get active airline configurations only
 */
export function getActiveAirlineConfigs(): AirlineConfig[] {
  return Object.values(AIRLINE_CONFIGS).filter((config) => config.isActive);
}

/**
 * Search airline configurations with fuzzy matching
 */
export function searchAirlineConfigs(query: string): AirlineConfig[] {
  if (!query || query.length < 1) return [];

  const normalizedQuery = query.toLowerCase().trim();

  const results: AirlineConfig[] = [];

  // Try to find exact matches first
  const airlineData = findAirlineByAlias(query);
  if (airlineData) {
    const config = AIRLINE_CONFIGS[airlineData.code];
    if (config) {
      results.push(config);
    }
  }

  // Search through all configurations
  for (const config of Object.values(AIRLINE_CONFIGS)) {
    const configName = config.airlineName.toLowerCase();
    const configCode = config.airlineCode.toLowerCase();
    const configAliases = config.aliases || [];
    const configParent = config.parentCompany?.toLowerCase() || '';

    // Check if already added
    if (results.some((r) => r.airlineCode === config.airlineCode)) {
      continue;
    }

    // Match against name, code, aliases, or parent company
    if (
      configName.includes(normalizedQuery) ||
      configCode.includes(normalizedQuery) ||
      configParent.includes(normalizedQuery) ||
      configAliases.some((alias) =>
        alias.toLowerCase().includes(normalizedQuery)
      )
    ) {
      results.push(config);
    }
  }

  return results.slice(0, 10); // Limit to 10 results
}

/**
 * Get airline configurations sorted by passenger volume
 */
export function getAirlineConfigsByVolume(): AirlineConfig[] {
  return Object.values(AIRLINE_CONFIGS)
    .filter((config) => config.passengerVolume && config.passengerVolume > 0)
    .sort((a, b) => (b.passengerVolume || 0) - (a.passengerVolume || 0));
}

/**
 * Get top airlines by passenger volume
 */
export function getTopAirlinesByVolume(limit: number = 10): AirlineConfig[] {
  return getAirlineConfigsByVolume().slice(0, limit);
}
