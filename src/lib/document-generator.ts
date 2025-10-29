/**
 * Document Generation System
 * Generates airline-specific documents, forms, and submission materials
 */

import { ClaimRecord } from './airtable';
import { AirlineConfig } from './airline-config';

export interface DocumentSubmission {
  type: 'email' | 'web_form' | 'postal';
  subject?: string;
  body: string;
  attachments: string[];
  instructions?: string;
  formData?: Record<string, string>;
  to?: string; // For email submissions
  url?: string; // For web form submissions
  address?: string; // For postal submissions
}

export interface GeneratedDocument {
  type: string; // Document type (cover_letter, passenger_details, document_checklist, etc.)
  filename: string;
  content: string;
  mimeType: string;
  size: number;
}

/**
 * Generate document submission for a claim
 */
export async function generateDocumentSubmission(
  claim: ClaimRecord,
  airlineConfig: AirlineConfig
): Promise<DocumentSubmission> {
  const { submissionMethod } = airlineConfig;

  switch (submissionMethod) {
    case 'email':
      return generateEmailSubmission(claim, airlineConfig);
    case 'web_form':
      return generateWebFormSubmission(claim, airlineConfig);
    case 'postal':
      return generatePostalSubmission(claim, airlineConfig);
    default:
      throw new Error(`Unsupported submission method: ${submissionMethod}`);
  }
}

/**
 * Generate email submission
 */
function generateEmailSubmission(
  claim: ClaimRecord,
  airlineConfig: AirlineConfig
): DocumentSubmission {
  const subject = `EU261 Compensation Claim - Flight ${claim.flightNumber} - ${claim.departureDate}`;

  const body = `
Dear ${airlineConfig.airlineName} Customer Service,

I am writing to submit a compensation claim under EU261 regulations for the following flight:

Flight Details:
- Flight Number: ${claim.flightNumber}
- Departure Date: ${claim.departureDate}
- Route: ${claim.departureAirport} to ${claim.arrivalAirport}
- Delay Duration: ${claim.delayDuration}
- Delay Reason: ${claim.delayReason || 'Not specified'}

Passenger Details:
- Name: ${claim.firstName} ${claim.lastName}
- Email: ${claim.email}
- Booking Reference: ${claim.bookingReference || 'Not provided'}

Delay Information:
- Delay Duration: ${claim.delayDuration}
- Delay Reason: ${claim.delayReason || 'Not specified'}
- Impact: Flight delay exceeding 3-hour threshold for EU261 compensation

COMPENSATION CLAIM:
Under EU261 regulations, I am entitled to compensation for this flight delay. The delay duration of ${claim.delayDuration} exceeds the 3-hour threshold for compensation eligibility.

Please process this claim and provide compensation as required under EU261 regulations.

ATTACHED DOCUMENTS:
- Boarding pass
- Delay proof/documentation
- Passenger details

FOLLOW-UP SCHEDULE:
${airlineConfig.followUpSchedule.map((schedule) => `- ${schedule}`).join('\n')}

I look forward to your prompt response.

Best regards,
${claim.firstName} ${claim.lastName}
${claim.email}

---
This claim is being processed by Flghtly on behalf of the passenger.
For any questions, please contact: support@refundfinder.com
`;

  return {
    type: 'email',
    subject,
    body,
    attachments: airlineConfig.requiredDocuments,
    instructions: airlineConfig.specialInstructions,
    to: airlineConfig.claimEmail,
  };
}

/**
 * Generate web form submission
 */
function generateWebFormSubmission(
  claim: ClaimRecord,
  airlineConfig: AirlineConfig
): DocumentSubmission {
  const instructions = `
WEB FORM SUBMISSION INSTRUCTIONS

Airline: ${airlineConfig.airlineName}
Form URL: ${airlineConfig.claimFormUrl}

REQUIRED INFORMATION TO ENTER:
- Passenger Name: ${claim.firstName} ${claim.lastName}
- Flight Number: ${claim.flightNumber}
- Departure Date: ${claim.departureDate}
- Route: ${claim.departureAirport} to ${claim.arrivalAirport}
- Delay Duration: ${claim.delayDuration}
- Delay Reason: ${claim.delayReason || 'Not specified'}
- Booking Reference: ${claim.bookingReference || 'Not provided'}
- Email: ${claim.email}

DOCUMENTS TO UPLOAD:
- Boarding pass
- Delay proof/documentation
- Any additional supporting documents

SPECIAL INSTRUCTIONS:
${airlineConfig.specialInstructions}

REGULATION: ${(airlineConfig as any).regulationCovered || (airlineConfig as any).regulation || 'EU261'}

EXPECTED RESPONSE TIME: ${airlineConfig.expectedResponseTime}

FOLLOW-UP SCHEDULE:
${airlineConfig.followUpSchedule.map((schedule) => `- ${schedule}`).join('\n')}
`;

  const formData: Record<string, string> = {};
  if (airlineConfig.claimFormFields) {
    Object.entries(airlineConfig.claimFormFields).forEach(([key, label]) => {
      const value = getClaimFieldValue(claim, key);
      if (value) {
        formData[label] = value;
      }
    });
  }

  return {
    type: 'web_form',
    body: instructions,
    attachments: airlineConfig.requiredDocuments,
    instructions: airlineConfig.specialInstructions,
    formData,
    url: airlineConfig.claimFormUrl,
  };
}

/**
 * Generate postal submission
 */
function generatePostalSubmission(
  claim: ClaimRecord,
  airlineConfig: AirlineConfig
): DocumentSubmission {
  const instructions = `
POSTAL SUBMISSION INSTRUCTIONS

Airline: ${airlineConfig.airlineName}
Address: ${airlineConfig.postalAddress}

REQUIRED DOCUMENTS TO SEND:
- Printed claim form (if available)
- Boarding pass copy
- Delay proof/documentation
- Passenger details form

CLAIM INFORMATION:
- Passenger Name: ${claim.firstName} ${claim.lastName}
- Flight Number: ${claim.flightNumber}
- Departure Date: ${claim.departureDate}
- Route: ${claim.departureAirport} to ${claim.arrivalAirport}
- Delay Duration: ${claim.delayDuration}
- Delay Reason: ${claim.delayReason || 'Not specified'}
- Booking Reference: ${claim.bookingReference || 'Not provided'}
- Email: ${claim.email}

SPECIAL INSTRUCTIONS:
${airlineConfig.specialInstructions}

EXPECTED RESPONSE TIME: ${airlineConfig.expectedResponseTime}

FOLLOW-UP SCHEDULE:
${airlineConfig.followUpSchedule.map((schedule) => `- ${schedule}`).join('\n')}
`;

  return {
    type: 'postal',
    body: instructions,
    attachments: airlineConfig.requiredDocuments,
    instructions: airlineConfig.specialInstructions,
    address: airlineConfig.postalAddress,
  };
}

/**
 * Generate cover letter for postal submissions
 */
export function generateCoverLetter(
  claim: ClaimRecord,
  airlineConfig: AirlineConfig
): GeneratedDocument {
  const content = `
${airlineConfig.airlineName}
Customer Service Department
${airlineConfig.postalAddress || 'Please check airline website for current address'}

Date: ${new Date().toLocaleDateString()}

Subject: EU261 Compensation Claim - Flight ${claim.flightNumber}

Dear ${airlineConfig.airlineName} Customer Service,

I am writing to submit a compensation claim under EU261 regulations for the following flight:

Flight Details:
- Flight Number: ${claim.flightNumber}
- Departure Date: ${claim.departureDate}
- Route: ${claim.departureAirport} to ${claim.arrivalAirport}
- Delay Duration: ${claim.delayDuration}
- Delay Reason: ${claim.delayReason || 'Not specified'}

Passenger Details:
- Name: ${claim.firstName} ${claim.lastName}
- Email: ${claim.email}
- Booking Reference: ${claim.bookingReference || 'Not provided'}

Delay Information:
- Delay Duration: ${claim.delayDuration}
- Delay Reason: ${claim.delayReason || 'Not specified'}
- Impact: Flight delay exceeding 3-hour threshold for EU261 compensation

COMPENSATION CLAIM:
Under EU261 regulations, I am entitled to compensation for this flight delay. The delay duration of ${claim.delayDuration} exceeds the 3-hour threshold for compensation eligibility.

Please process this claim and provide compensation as required under EU261 regulations.

Supporting Documents:
- Boarding pass
- Delay proof/documentation
- Passenger details form

I look forward to your prompt response.

Best regards,
${claim.firstName} ${claim.lastName}
${claim.email}

---
This claim is being processed by Flghtly on behalf of the passenger.
For any questions, please contact: support@refundfinder.com
`;

  return {
    type: 'cover_letter',
    filename: `cover-letter-${airlineConfig.airlineName.toLowerCase().replace(/\s+/g, '-')}-${claim.claimId.toLowerCase()}.txt`,
    content: content.trim(),
    mimeType: 'text/plain',
    size: content.length,
  };
}

/**
 * Generate passenger details form
 */
export function generatePassengerDetailsForm(
  claim: ClaimRecord
): GeneratedDocument {
  const content = `
PASSENGER DETAILS FORM

Claim ID: ${claim.claimId}
Date: ${new Date().toLocaleDateString()}

PERSONAL INFORMATION:
- Full Name: ${claim.firstName} ${claim.lastName}
- Email: ${claim.email}

FLIGHT INFORMATION:
- Flight Number: ${claim.flightNumber}
- Airline: ${claim.airline}
- Departure Date: ${claim.departureDate}
- Departure Airport: ${claim.departureAirport}
- Arrival Airport: ${claim.arrivalAirport}
- Delay Duration: ${claim.delayDuration}
- Delay Reason: ${claim.delayReason || 'Not specified'}

COMPENSATION INFORMATION:
- Estimated Compensation: ${claim.estimatedCompensation || 'To be determined'}
- Regulation: EU261/UK261

DOCUMENTS PROVIDED:
- Boarding Pass: ${claim.boardingPassUrl ? 'Yes' : 'No'}
- Delay Proof: ${claim.delayProofUrl ? 'Yes' : 'No'}

SIGNATURE:
I confirm that the information provided is accurate and complete.

Signature: _________________________
Date: _________________________

${claim.firstName} ${claim.lastName}
`;

  return {
    type: 'passenger_details',
    filename: `passenger-details-${claim.claimId.toLowerCase()}.txt`,
    content: content.trim(),
    mimeType: 'text/plain',
    size: content.length,
  };
}

/**
 * Generate document checklist
 */
export function generateDocumentChecklist(
  claim: ClaimRecord,
  airlineConfig: AirlineConfig
): GeneratedDocument {
  const content = `
DOCUMENT CHECKLIST - ${airlineConfig.airlineName}

Claim ID: ${claim.claimId}
Passenger: ${claim.firstName} ${claim.lastName}
Flight: ${claim.flightNumber} - ${claim.departureDate}

REQUIRED DOCUMENTS:
${airlineConfig.requiredDocuments.map((doc) => `☐ ${doc}`).join('\n')}

DOCUMENTS PROVIDED:
☐ Boarding Pass: ${claim.boardingPassUrl ? '✓ Provided' : '✗ Missing'}
☐ Delay Proof: ${claim.delayProofUrl ? '✓ Provided' : '✗ Missing'}
☐ Passenger Details Form: ✓ Generated

SUBMISSION METHOD: ${airlineConfig.submissionMethod.toUpperCase()}
${airlineConfig.submissionMethod === 'email' ? `Email: ${airlineConfig.claimEmail}` : ''}
${airlineConfig.submissionMethod === 'web_form' ? `Form URL: ${airlineConfig.claimFormUrl}` : ''}
${airlineConfig.submissionMethod === 'postal' ? `Address: ${airlineConfig.postalAddress}` : ''}

EXPECTED RESPONSE TIME: ${airlineConfig.expectedResponseTime}

FOLLOW-UP SCHEDULE:
${airlineConfig.followUpSchedule.map((schedule) => `- ${schedule}`).join('\n')}

SPECIAL INSTRUCTIONS:
${airlineConfig.specialInstructions}

Generated on: ${new Date().toLocaleString()}
Generated by: Flghtly System
`;

  return {
    type: 'document_checklist',
    filename: `document-checklist-${airlineConfig.airlineName.toLowerCase().replace(/\s+/g, '-')}-${claim.claimId.toLowerCase()}.txt`,
    content: content.trim(),
    mimeType: 'text/plain',
    size: content.length,
  };
}

/**
 * Generate all documents for a claim
 */
export function generateAllDocuments(
  claim: ClaimRecord,
  airlineConfig: AirlineConfig
): GeneratedDocument[] {
  const documents: GeneratedDocument[] = [];

  // Always generate passenger details form
  documents.push(generatePassengerDetailsForm(claim));

  // Always generate document checklist
  documents.push(generateDocumentChecklist(claim, airlineConfig));

  // Always generate cover letter
  documents.push(generateCoverLetter(claim, airlineConfig));

  return documents;
}

/**
 * Get claim field value by key
 */
function getClaimFieldValue(
  claim: ClaimRecord,
  key: string
): string | undefined {
  switch (key) {
    case 'passenger_name':
      return `${claim.firstName} ${claim.lastName}`;
    case 'flight_number':
      return claim.flightNumber;
    case 'departure_date':
      return claim.departureDate;
    case 'delay_duration':
      return claim.delayDuration;
    case 'delay_reason':
      return claim.delayReason || '';
    case 'booking_reference':
      return claim.bookingReference || '';
    case 'departure_airport':
      return claim.departureAirport;
    case 'arrival_airport':
      return claim.arrivalAirport;
    case 'email':
      return claim.email;
    default:
      return undefined;
  }
}

/**
 * Generate HTML email template for admin notifications
 */
export function generateAdminNotificationEmail(
  claim: ClaimRecord,
  airlineConfig: AirlineConfig,
  notificationType: 'ready_to_file' | 'overdue' | 'follow_up_needed'
): GeneratedDocument {
  let subject = '';
  let content = '';

  switch (notificationType) {
    case 'ready_to_file':
      subject = `Claim Ready to File - ${claim.claimId}`;
      content = `
        <h2>CLAIM READY TO FILE</h2>
        <p>A new claim is ready for filing with ${airlineConfig.airlineName}.</p>
        
        <h3>Claim Details:</h3>
        <ul>
          <li><strong>Claim ID:</strong> ${claim.claimId}</li>
          <li><strong>Passenger:</strong> ${claim.firstName} ${claim.lastName}</li>
          <li><strong>Flight:</strong> ${claim.flightNumber} - ${claim.departureDate}</li>
          <li><strong>Route:</strong> ${claim.departureAirport} to ${claim.arrivalAirport}</li>
          <li><strong>Delay:</strong> ${claim.delayDuration}</li>
          <li><strong>Submission Method:</strong> ${airlineConfig.submissionMethod}</li>
        </ul>
        
        <h3>Next Steps:</h3>
        <ol>
          <li>Review the generated submission materials</li>
          <li>Submit to ${airlineConfig.airlineName} using ${airlineConfig.submissionMethod}</li>
          <li>Update claim status to "filed" with airline reference</li>
        </ol>
        
        <h3>Airline Information:</h3>
        <ul>
          <li><strong>Claim Email:</strong> ${airlineConfig.claimEmail}</li>
          <li><strong>Expected Response Time:</strong> ${airlineConfig.expectedResponseTime}</li>
          <li><strong>Follow-up Schedule:</strong> ${airlineConfig.followUpSchedule.join(', ')}</li>
          <li><strong>Special Instructions:</strong> ${airlineConfig.specialInstructions}</li>
        </ul>
        
        <p><a href="/admin/claims/${claim.claimId}">View Claim Details</a></p>
      `;
      break;

    case 'overdue':
      subject = `Overdue Claim Alert - ${claim.claimId}`;
      content = `
        <h2>OVERDUE CLAIM ALERT</h2>
        <p>This claim is past the 48-hour filing deadline.</p>
        
        <h3>Claim Details:</h3>
        <ul>
          <li><strong>Claim ID:</strong> ${claim.claimId}</li>
          <li><strong>Passenger:</strong> ${claim.firstName} ${claim.lastName}</li>
          <li><strong>Flight:</strong> ${claim.flightNumber} - ${claim.departureDate}</li>
          <li><strong>Route:</strong> ${claim.departureAirport} to ${claim.arrivalAirport}</li>
          <li><strong>Delay:</strong> ${claim.delayDuration}</li>
          <li><strong>Submitted:</strong> ${claim.submittedAt}</li>
          <li><strong>Current Status:</strong> ${claim.status}</li>
        </ul>
        
        <p><strong>URGENT ACTION REQUIRED:</strong> Please file this claim immediately to meet our 48-hour promise.</p>
        
        <p><a href="/admin/claims/${claim.claimId}">View Claim Details</a></p>
      `;
      break;

    case 'follow_up_needed':
      subject = `Follow-up Needed - ${claim.claimId}`;
      content = `
        <h2>FOLLOW-UP REQUIRED</h2>
        <p>This claim needs follow-up with ${airlineConfig.airlineName}.</p>
        
        <h3>Claim Details:</h3>
        <ul>
          <li><strong>Claim ID:</strong> ${claim.claimId}</li>
          <li><strong>Passenger:</strong> ${claim.firstName} ${claim.lastName}</li>
          <li><strong>Flight:</strong> ${claim.flightNumber} - ${claim.departureDate}</li>
          <li><strong>Route:</strong> ${claim.departureAirport} to ${claim.arrivalAirport}</li>
          <li><strong>Delay:</strong> ${claim.delayDuration}</li>
          <li><strong>Current Status:</strong> ${claim.status}</li>
          <li><strong>Next Follow-up:</strong> ${claim.nextFollowUpDate}</li>
        </ul>
        
        <h3>Follow-up Schedule:</h3>
        <ul>
          ${airlineConfig.followUpSchedule.map((schedule) => `<li>${schedule}</li>`).join('')}
        </ul>
        
        <p><a href="/admin/claims/${claim.claimId}">View Claim Details</a></p>
      `;
      break;
  }

  return {
    type: 'admin_notification',
    filename: `admin-notification-${notificationType.replace(/_/g, '-')}-${claim.claimId.toLowerCase()}.html`,
    content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          h2 { color: #00D9B5; }
          ul, ol { margin: 10px 0; }
          li { margin: 5px 0; }
          a { color: #00D9B5; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        ${content}
        <hr>
        <p style="font-size: 12px; color: #666;">
          Flghtly Admin Dashboard<br>
          Generated: ${new Date().toLocaleString()}
        </p>
      </body>
      </html>
    `,
    mimeType: 'text/html',
    size: content.length,
  };
}
