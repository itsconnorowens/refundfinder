/**
 * Airline Configuration Template System
 * Makes adding new airlines a 15-minute process
 */

import { AirlineConfig } from './airline-config';

export interface AirlineTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | 'major_eu'
    | 'low_cost'
    | 'major_us'
    | 'major_asia'
    | 'regional'
    | 'charter';
  template: Partial<AirlineConfig>;
  requiredFields: string[];
  optionalFields: string[];
  estimatedSetupTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AirlineSetupWizard {
  step: number;
  totalSteps: number;
  currentStep: string;
  completedSteps: string[];
  airlineData: Partial<AirlineConfig>;
  validationErrors: Record<string, string>;
}

// Pre-built templates for common airline types
export const AIRLINE_TEMPLATES: Record<string, AirlineTemplate> = {
  major_eu_template: {
    id: 'major_eu_template',
    name: 'Major EU Airline Template',
    description:
      'Template for major European airlines (Lufthansa, Air France, KLM, etc.)',
    category: 'major_eu',
    template: {
      submissionMethod: 'email',
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
      regulationCovered: ['EU261'],
      region: 'Europe',
      isActive: true,
    },
    requiredFields: ['airlineName', 'airlineCode', 'claimEmail'],
    optionalFields: ['contactPhone', 'website', 'specialInstructions'],
    estimatedSetupTime: '10 minutes',
    difficulty: 'easy',
  },

  low_cost_template: {
    id: 'low_cost_template',
    name: 'Low-Cost Airline Template',
    description:
      'Template for low-cost carriers (Ryanair, EasyJet, Wizz Air, etc.)',
    category: 'low_cost',
    template: {
      submissionMethod: 'web_form',
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
      regulationCovered: ['EU261'],
      region: 'Europe',
      isActive: true,
    },
    requiredFields: ['airlineName', 'airlineCode', 'claimFormUrl'],
    optionalFields: ['contactPhone', 'website', 'specialInstructions'],
    estimatedSetupTime: '15 minutes',
    difficulty: 'medium',
  },

  major_us_template: {
    id: 'major_us_template',
    name: 'Major US Airline Template',
    description:
      'Template for major US airlines (American, Delta, United, etc.)',
    category: 'major_us',
    template: {
      submissionMethod: 'web_form',
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
      regulationCovered: ['US_DOT'],
      region: 'North America',
      isActive: true,
    },
    requiredFields: ['airlineName', 'airlineCode', 'claimFormUrl'],
    optionalFields: ['contactPhone', 'website', 'specialInstructions'],
    estimatedSetupTime: '12 minutes',
    difficulty: 'easy',
  },

  major_asia_template: {
    id: 'major_asia_template',
    name: 'Major Asian Airline Template',
    description:
      'Template for major Asian airlines (Singapore, Emirates, Qatar, etc.)',
    category: 'major_asia',
    template: {
      submissionMethod: 'web_form',
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
      regulationCovered: ['EU261'],
      region: 'Asia-Pacific',
      isActive: true,
    },
    requiredFields: ['airlineName', 'airlineCode', 'claimFormUrl'],
    optionalFields: ['contactPhone', 'website', 'specialInstructions'],
    estimatedSetupTime: '15 minutes',
    difficulty: 'medium',
  },
};

/**
 * Validate airline configuration
 */
export function validateAirlineConfig(
  config: Partial<AirlineConfig>
): Record<string, string> {
  const errors: Record<string, string> = {};

  // Required fields validation
  if (!config.airlineName) {
    errors.airlineName = 'Airline name is required';
  }

  if (!config.airlineCode) {
    errors.airlineCode = 'Airline code is required';
  } else if (config.airlineCode.length < 2 || config.airlineCode.length > 3) {
    errors.airlineCode = 'Airline code must be 2-3 characters';
  }

  if (!config.submissionMethod) {
    errors.submissionMethod = 'Submission method is required';
  }

  // Method-specific validation
  if (config.submissionMethod === 'email' && !config.claimEmail) {
    errors.claimEmail = 'Email address is required for email submission method';
  }

  if (config.submissionMethod === 'web_form' && !config.claimFormUrl) {
    errors.claimFormUrl = 'Form URL is required for web form submission method';
  }

  if (config.submissionMethod === 'postal' && !config.postalAddress) {
    errors.postalAddress =
      'Postal address is required for postal submission method';
  }

  // Email validation
  if (config.claimEmail && !isValidEmail(config.claimEmail)) {
    errors.claimEmail = 'Invalid email address format';
  }

  // URL validation
  if (config.claimFormUrl && !isValidUrl(config.claimFormUrl)) {
    errors.claimFormUrl = 'Invalid URL format';
  }

  // Response time validation
  if (!config.expectedResponseTime) {
    errors.expectedResponseTime = 'Expected response time is required';
  }

  return errors;
}

/**
 * Generate airline configuration from template
 */
export function generateAirlineConfigFromTemplate(
  template: AirlineTemplate,
  userInput: Record<string, any>
): Partial<AirlineConfig> {
  const config: Partial<AirlineConfig> = {
    ...template.template,
    ...userInput,
  };

  // Set default values
  if (!config.aliases) {
    config.aliases = [config.airlineName || 'Unknown Airline'];
  }

  if (!config.passengerVolume) {
    config.passengerVolume = 1000000; // Default estimate
  }

  return config;
}

/**
 * Get setup wizard steps
 */
export function getSetupWizardSteps(): Array<{
  id: string;
  title: string;
  description: string;
  fields: string[];
}> {
  return [
    {
      id: 'basic_info',
      title: 'Basic Information',
      description: 'Enter the airline name and basic details',
      fields: ['airlineName', 'airlineCode', 'region', 'parentCompany'],
    },
    {
      id: 'submission_method',
      title: 'Submission Method',
      description: 'Configure how claims will be submitted to this airline',
      fields: [
        'submissionMethod',
        'claimEmail',
        'claimFormUrl',
        'postalAddress',
      ],
    },
    {
      id: 'requirements',
      title: 'Requirements',
      description: 'Define what documents and information are required',
      fields: ['requiredDocuments', 'requiredFields', 'claimFormFields'],
    },
    {
      id: 'timelines',
      title: 'Timelines & Follow-ups',
      description: 'Set response times and follow-up schedules',
      fields: ['expectedResponseTime', 'followUpSchedule'],
    },
    {
      id: 'additional_info',
      title: 'Additional Information',
      description: 'Add contact details and special instructions',
      fields: ['contactPhone', 'website', 'specialInstructions', 'aliases'],
    },
    {
      id: 'review',
      title: 'Review & Test',
      description: 'Review configuration and test submission',
      fields: [],
    },
  ];
}

/**
 * Get testing checklist for new airline
 */
export function getTestingChecklist(airlineConfig: AirlineConfig): Array<{
  id: string;
  description: string;
  completed: boolean;
  critical: boolean;
}> {
  return [
    {
      id: 'email_validation',
      description: 'Test email address is valid and accessible',
      completed: false,
      critical: airlineConfig.submissionMethod === 'email',
    },
    {
      id: 'form_url_validation',
      description: 'Verify form URL is accessible and functional',
      completed: false,
      critical: airlineConfig.submissionMethod === 'web_form',
    },
    {
      id: 'test_submission',
      description: 'Send test claim submission to airline',
      completed: false,
      critical: true,
    },
    {
      id: 'document_requirements',
      description: 'Verify all required documents are properly configured',
      completed: false,
      critical: true,
    },
    {
      id: 'follow_up_schedule',
      description: 'Test follow-up scheduling works correctly',
      completed: false,
      critical: false,
    },
    {
      id: 'response_time_validation',
      description: 'Validate response time expectations are realistic',
      completed: false,
      critical: false,
    },
  ];
}

/**
 * Generate airline configuration documentation
 */
export function generateAirlineDocumentation(
  airlineConfig: AirlineConfig
): string {
  return `
# ${airlineConfig.airlineName} Configuration

## Basic Information
- **Airline Code:** ${airlineConfig.airlineCode}
- **Region:** ${airlineConfig.region}
- **Parent Company:** ${airlineConfig.parentCompany || 'N/A'}
- **Status:** ${airlineConfig.isActive ? 'Active' : 'Inactive'}

## Submission Configuration
- **Method:** ${airlineConfig.submissionMethod}
${airlineConfig.submissionMethod === 'email' ? `- **Email:** ${airlineConfig.claimEmail}` : ''}
${airlineConfig.submissionMethod === 'web_form' ? `- **Form URL:** ${airlineConfig.claimFormUrl}` : ''}
${airlineConfig.submissionMethod === 'postal' ? `- **Address:** ${airlineConfig.postalAddress}` : ''}

## Requirements
- **Required Documents:** ${airlineConfig.requiredDocuments.join(', ')}
- **Required Fields:** ${airlineConfig.requiredFields.join(', ')}
- **Regulations:** ${airlineConfig.regulationCovered.join(', ')}

## Timelines
- **Expected Response Time:** ${airlineConfig.expectedResponseTime}
- **Follow-up Schedule:** ${airlineConfig.followUpSchedule.join(', ')}

## Contact Information
- **Phone:** ${airlineConfig.contactPhone || 'N/A'}
- **Website:** ${airlineConfig.website || 'N/A'}

## Special Instructions
${airlineConfig.specialInstructions || 'None'}

## Aliases
${airlineConfig.aliases?.join(', ') || 'None'}

---
*Generated on ${new Date().toLocaleString()}*
  `.trim();
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get template by category
 */
export function getTemplatesByCategory(category: string): AirlineTemplate[] {
  return Object.values(AIRLINE_TEMPLATES).filter(
    (template) => template.category === category
  );
}

/**
 * Get all templates
 */
export function getAllTemplates(): AirlineTemplate[] {
  return Object.values(AIRLINE_TEMPLATES);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): AirlineTemplate | undefined {
  return AIRLINE_TEMPLATES[id];
}
