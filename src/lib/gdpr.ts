/**
 * GDPR Compliance Utilities
 * Handles data subject rights requests and compliance
 */

export interface DataSubjectRequest {
  type:
    | 'access'
    | 'rectification'
    | 'erasure'
    | 'portability'
    | 'objection'
    | 'restriction';
  email: string;
  reason?: string;
  requestedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  responseData?: any;
}

export interface GDPRComplianceConfig {
  dataRetentionDays: number;
  euRepresentativeEmail: string;
  dpoEmail: string;
  privacyEmail: string;
  maxResponseTimeDays: number;
}

export const GDPR_CONFIG: GDPRComplianceConfig = {
  dataRetentionDays: 90,
  euRepresentativeEmail: 'eu-representative@refundfinder.com',
  dpoEmail: 'dpo@refundfinder.com',
  privacyEmail: 'privacy@refundfinder.com',
  maxResponseTimeDays: 30,
};

/**
 * Check if user is in EU/UK for GDPR compliance
 */
export function isEUResident(
  userLocation?: string,
  ipAddress?: string
): boolean {
  // EU countries
  const euCountries = [
    'AT',
    'BE',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',
  ];

  // UK (post-Brexit but still under UK GDPR)
  const ukCountries = ['GB', 'UK'];

  const allGDPRCountries = [...euCountries, ...ukCountries];

  if (userLocation && allGDPRCountries.includes(userLocation.toUpperCase())) {
    return true;
  }

  // Basic IP geolocation check (in production, use a proper service)
  // This is a simplified check - in production, use MaxMind or similar
  if (ipAddress) {
    // This would need proper IP geolocation service
    // For now, we'll assume non-EU unless explicitly set
    return false;
  }

  return false;
}

/**
 * Generate data subject request ID
 */
export function generateRequestId(): string {
  return `gdpr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate data subject request
 */
export function validateDataSubjectRequest(
  request: Partial<DataSubjectRequest>
): string[] {
  const errors: string[] = [];

  if (!request.type) {
    errors.push('Request type is required');
  }

  if (!request.email) {
    errors.push('Email address is required');
  } else if (!isValidEmail(request.email)) {
    errors.push('Valid email address is required');
  }

  if (request.type === 'objection' && !request.reason) {
    errors.push('Reason is required for objection requests');
  }

  return errors;
}

/**
 * Check if email is valid
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get data subject rights information
 */
export function getDataSubjectRightsInfo(): {
  rights: Array<{
    name: string;
    description: string;
    responseTime: string;
  }>;
  contactInfo: {
    email: string;
    responseTime: string;
  };
} {
  return {
    rights: [
      {
        name: 'Right of Access',
        description: 'Request a copy of your personal data',
        responseTime: '30 days',
      },
      {
        name: 'Right of Rectification',
        description: 'Correct inaccurate personal data',
        responseTime: '30 days',
      },
      {
        name: 'Right of Erasure',
        description: 'Request deletion of your personal data',
        responseTime: '30 days',
      },
      {
        name: 'Right of Portability',
        description: 'Receive your data in a structured format',
        responseTime: '30 days',
      },
      {
        name: 'Right to Object',
        description: 'Object to processing of your personal data',
        responseTime: '30 days',
      },
      {
        name: 'Right to Restriction',
        description: 'Request limitation of processing',
        responseTime: '30 days',
      },
    ],
    contactInfo: {
      email: GDPR_CONFIG.privacyEmail,
      responseTime: '30 days',
    },
  };
}

/**
 * Generate data export for portability requests
 */
export function generateDataExport(userData: any): {
  personalData: any;
  processingPurposes: string[];
  dataCategories: string[];
  retentionPeriod: string;
  rights: string[];
} {
  return {
    personalData: {
      personalInfo: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
      },
      flightInfo: {
        flightNumber: userData.flightNumber,
        airline: userData.airline,
        departureDate: userData.departureDate,
        departureAirport: userData.departureAirport,
        arrivalAirport: userData.arrivalAirport,
        delayDuration: userData.delayDuration,
        delayReason: userData.delayReason,
      },
      documents: {
        boardingPass: userData.boardingPassUrl,
        delayProof: userData.delayProofUrl,
        receipts: userData.receiptsUrl,
      },
      claimInfo: {
        claimId: userData.claimId,
        status: userData.status,
        amount: userData.amount,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
    },
    processingPurposes: [
      'Processing compensation claims',
      'Communicating with airlines',
      'Sending status updates',
      'Processing payments',
      'Improving services',
      'Complying with legal obligations',
    ],
    dataCategories: [
      'Personal identification data',
      'Contact information',
      'Flight and travel data',
      'Payment information',
      'Communication data',
      'Documentation',
    ],
    retentionPeriod: `${GDPR_CONFIG.dataRetentionDays} days after claim closure`,
    rights: [
      'Right of access',
      'Right of rectification',
      'Right of erasure',
      'Right of portability',
      'Right to object',
      'Right to restriction',
      'Right to withdraw consent',
    ],
  };
}

/**
 * Check if data can be deleted (erasure request)
 */
export function canDeleteData(userData: any): {
  canDelete: boolean;
  reason?: string;
  alternativeActions?: string[];
} {
  // Check if claim is still active
  if (userData.status === 'active' || userData.status === 'processing') {
    return {
      canDelete: false,
      reason: 'Data cannot be deleted while claim is active',
      alternativeActions: [
        'Request data restriction instead',
        'Wait until claim is completed',
        'Contact support for assistance',
      ],
    };
  }

  // Check if within retention period
  const claimDate = new Date(userData.createdAt);
  const retentionDate = new Date(
    claimDate.getTime() + GDPR_CONFIG.dataRetentionDays * 24 * 60 * 60 * 1000
  );

  if (new Date() < retentionDate) {
    return {
      canDelete: false,
      reason: 'Data is within retention period for legal compliance',
      alternativeActions: [
        'Request data restriction instead',
        'Wait until retention period expires',
        'Contact support for assistance',
      ],
    };
  }

  return {
    canDelete: true,
  };
}

/**
 * Generate GDPR compliance report
 */
export function generateComplianceReport(): {
  dataProcessingBasis: string[];
  dataCategories: string[];
  retentionPeriods: string[];
  securityMeasures: string[];
  contactInformation: {
    dpo: string;
    euRepresentative: string;
    privacy: string;
  };
  rights: string[];
} {
  return {
    dataProcessingBasis: [
      'Contract performance (Art. 6(1)(b) GDPR)',
      'Legitimate interest (Art. 6(1)(f) GDPR)',
      'Legal obligation (Art. 6(1)(c) GDPR)',
    ],
    dataCategories: [
      'Personal identification data',
      'Contact information',
      'Flight and travel data',
      'Payment information',
      'Communication data',
      'Documentation and files',
    ],
    retentionPeriods: [
      'Active claims: Until completion',
      'Completed claims: 90 days',
      'Refunded claims: 14 days',
      'Legal obligations: As required by law',
    ],
    securityMeasures: [
      'Encryption in transit and at rest',
      'Access controls and authentication',
      'Regular security audits',
      'Secure file storage',
      'Limited access on need-to-know basis',
    ],
    contactInformation: {
      dpo: GDPR_CONFIG.dpoEmail,
      euRepresentative: GDPR_CONFIG.euRepresentativeEmail,
      privacy: GDPR_CONFIG.privacyEmail,
    },
    rights: [
      'Right of access',
      'Right of rectification',
      'Right of erasure',
      'Right of portability',
      'Right to object',
      'Right to restriction',
      'Right to withdraw consent',
      'Right to lodge a complaint',
    ],
  };
}
