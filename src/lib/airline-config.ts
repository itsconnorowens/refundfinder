/**
 * Airline Configuration System for EU Airlines
 * Stores airline-specific claim submission requirements and methods
 */

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
  regulationCovered: 'EU261' | 'UK261';
  contactPhone?: string;
  website?: string;
  claimFormFields?: Record<string, string>; // Field mappings for forms
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
    regulationCovered: 'UK261',
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
    regulationCovered: 'EU261',
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
    regulationCovered: 'EU261',
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
    regulationCovered: 'EU261',
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
    regulationCovered: 'EU261',
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
    regulationCovered: 'EU261',
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
    regulationCovered: 'EU261',
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
    regulationCovered: 'EU261',
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
    regulationCovered: 'EU261',
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
    regulationCovered: 'EU261',
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
  },
};

/**
 * Get airline configuration by airline code or name
 */
export function getAirlineConfig(airline: string): AirlineConfig | undefined {
  // First try exact code match
  const codeMatch = AIRLINE_CONFIGS[airline.toUpperCase()];
  if (codeMatch) return codeMatch;

  // Then try name match
  const nameMatch = Object.values(AIRLINE_CONFIGS).find(
    (config) =>
      config.airlineName.toLowerCase().includes(airline.toLowerCase()) ||
      airline.toLowerCase().includes(config.airlineName.toLowerCase())
  );

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
This claim is being processed by RefundFinder on behalf of the passenger.
For any questions, please contact: support@refundfinder.com
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
