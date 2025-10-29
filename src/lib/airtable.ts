import Airtable from 'airtable';

// Initialize Airtable
const apiKey = process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.warn(
    'Airtable credentials not configured. Some features may not work.'
  );
}

const base = apiKey && baseId ? new Airtable({ apiKey }).base(baseId) : null;

// Table names
export const TABLES = {
  CLAIMS: 'Claims',
  PAYMENTS: 'Payments',
  REFUNDS: 'Refunds',
  ELIGIBILITY_CHECKS: 'Eligibility_Checks',
} as const;

// Claim status types - Enhanced for detailed workflow tracking
export type ClaimStatus =
  | 'submitted' // Initial submission, payment received
  | 'validated' // Documents and eligibility verified
  | 'documents_prepared' // Airline-specific documents generated
  | 'ready_to_file' // Ready for admin to send to airline
  | 'filed' // Submitted to airline
  | 'airline_acknowledged' // Airline confirmed receipt
  | 'monitoring' // Waiting for airline response
  | 'airline_responded' // Airline provided update
  | 'approved' // Airline approved compensation
  | 'rejected' // Airline rejected claim
  | 'completed' // Process finished
  | 'refunded'; // Refund processed (legacy status)

// Payment status types
export type PaymentStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

// Claim record structure - Enhanced for detailed tracking
export interface ClaimRecord {
  id?: string;
  claimId: string;

  // Personal info
  firstName: string;
  lastName: string;
  email: string;

  // Flight details
  flightNumber: string;
  airline: string;
  departureDate: string;
  departureAirport: string;
  arrivalAirport: string;
  delayDuration: string;
  delayReason?: string;
  bookingReference?: string;

  // Disruption type
  disruptionType?: 'delay' | 'cancellation' | 'denied_boarding' | 'downgrade';

  // Cancellation-specific fields
  noticeGiven?: string;
  alternativeOffered?: boolean;
  alternativeTiming?: string;
  cancellationReason?: string;

  // Denied boarding-specific fields
  deniedBoardingType?: 'voluntary' | 'involuntary';
  deniedBoardingReason?: string;
  compensationOfferedByAirline?: number;
  passengerCount?: number;

  // Downgrade-specific fields
  bookedClass?: string;
  actualClass?: string;
  ticketPrice?: number;
  fareDifference?: number;
  downgradeReason?: string;

  // Documents
  boardingPassUrl?: string;
  delayProofUrl?: string;
  boardingPassFilename?: string;
  delayProofFilename?: string;

  // Status and tracking
  status: ClaimStatus;
  amount?: number; // Payment amount in cents
  estimatedCompensation?: string;
  actualCompensation?: string;

  // Payment reference
  paymentId?: string;

  // Timestamps
  submittedAt: string;
  validatedAt?: string;
  documentsPreparedAt?: string;
  readyToFileAt?: string;
  filedAt?: string;
  airlineAcknowledgedAt?: string;
  airlineRespondedAt?: string;
  completedAt?: string;

  // Filing details
  filingMethod?: 'email' | 'web_form' | 'postal';
  airlineReference?: string;
  filedBy?: string;
  nextFollowUpDate?: string;
  airlineResponse?: string;
  validationNotes?: string;
  generatedSubmission?: string;

  // Processing notes
  internalNotes?: string;
  rejectionReason?: string;
}

// Payment record structure
export interface PaymentRecord {
  id?: string;
  paymentId: string;

  // Stripe references
  stripePaymentIntentId: string;
  stripeCustomerId?: string;

  // Payment details
  amount: number; // in cents
  currency: string;
  status: PaymentStatus;

  // Customer info
  email: string;
  cardBrand?: string;
  cardLast4?: string;

  // Related claim
  claimId?: string;

  // Timestamps
  createdAt: string;
  succeededAt?: string;
  refundedAt?: string;

  // Refund info
  refundAmount?: number;
  refundReason?: string;
  refundProcessedBy?: string;
}

// Refund record structure
export interface RefundRecord {
  id?: string;
  refundId: string;

  // References
  paymentId: string;
  claimId: string;
  stripeRefundId: string;

  // Refund details
  amount: number; // in cents
  reason: string;
  status: 'pending' | 'succeeded' | 'failed';

  // Processing info
  processedBy?: 'automatic' | 'manual';
  processedByUser?: string;

  // Timestamps
  createdAt: string;
  succeededAt?: string;

  // Notes
  internalNotes?: string;
}

// Eligibility check record structure
export interface EligibilityCheckRecord {
  id?: string;
  checkId: string;

  // Flight details
  flightNumber: string;
  airline: string;
  departureDate: string;
  departureAirport: string;
  arrivalAirport: string;
  delayDuration: string;
  delayReason?: string;

  // Eligibility result
  eligible: boolean;
  amount: string;
  confidence: number;
  message: string;
  regulation: string;
  reason?: string;

  // Request info
  ipAddress: string;
  userAgent?: string;

  // Timestamps
  createdAt: string;
}

/**
 * Create a new claim in Airtable
 */
export async function createClaim(claim: ClaimRecord): Promise<string> {
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    // Build fields object, removing undefined/null values
    const fields: Record<string, any> = {
      claim_id: claim.claimId,
      user_first_name: claim.firstName,
      user_last_name: claim.lastName,
      user_email: claim.email,
      flight_number: claim.flightNumber,
      airline: claim.airline,
      departure_date: claim.departureDate,
      departure_airport: claim.departureAirport,
      arrival_airport: claim.arrivalAirport,
      delay_reason: claim.delayReason || '',
      status: claim.status,
    };

    // Add optional fields only if they exist in Airtable schema
    if (claim.estimatedCompensation) fields.estimated_compensation = claim.estimatedCompensation;
    if (claim.paymentId) fields.payment_id = claim.paymentId;
    if (claim.boardingPassUrl) fields.boarding_pass_url = claim.boardingPassUrl;
    if (claim.delayProofUrl) fields.delay_proof_url = claim.delayProofUrl;
    if (claim.internalNotes) fields.internal_notes = claim.internalNotes;

    // Add delay_duration if it exists (optional for backward compatibility)
    if (claim.delayDuration) {
      fields.delay_duration = claim.delayDuration;
    }

    // Note: submitted_at is a computed field in Airtable - do not set it manually

    // Add disruption type
    if (claim.disruptionType) {
      fields.disruption_type = claim.disruptionType;
    }

    // Add cancellation-specific fields
    if (claim.noticeGiven) {
      fields.notice_given = claim.noticeGiven;
    }
    if (claim.alternativeOffered !== undefined) {
      fields.alternative_flight_offered = claim.alternativeOffered;
    }
    if (claim.alternativeTiming) {
      fields.alternative_timing = claim.alternativeTiming;
    }
    if (claim.cancellationReason) {
      fields.cancellation_reason = claim.cancellationReason;
    }

    // Add denied boarding-specific fields
    if (claim.deniedBoardingType) {
      fields.denied_boarding_type = claim.deniedBoardingType;
    }
    if (claim.deniedBoardingReason) {
      fields.denied_boarding_reason = claim.deniedBoardingReason;
    }
    if (claim.compensationOfferedByAirline !== undefined) {
      // Convert to boolean for checkbox field - if a number was provided, check if > 0
      fields.compensation_offered_by_airline = typeof claim.compensationOfferedByAirline === 'number'
        ? claim.compensationOfferedByAirline > 0
        : Boolean(claim.compensationOfferedByAirline);
    }
    if (claim.passengerCount !== undefined) {
      fields.passenger_count = claim.passengerCount;
    }

    // Add downgrade-specific fields
    if (claim.bookedClass) {
      fields.booked_class = claim.bookedClass;
    }
    if (claim.actualClass) {
      fields.actual_class = claim.actualClass;
    }
    if (claim.ticketPrice !== undefined) {
      fields.ticket_price = claim.ticketPrice;
    }
    if (claim.fareDifference !== undefined) {
      fields.fare_difference = claim.fareDifference;
    }
    if (claim.downgradeReason) {
      fields.downgrade_reason = claim.downgradeReason;
    }

    const record = await base(TABLES.CLAIMS).create(fields);

    return record.id;
  } catch (error) {
    console.error('Error creating claim in Airtable:', error);
    throw error;
  }
}

/**
 * Update a claim in Airtable
 */
export async function updateClaim(
  recordId: string,
  updates: Partial<ClaimRecord>
): Promise<void> {
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    const fields: Record<string, any> = {};

    // Status updates
    if (updates.status) fields['status'] = updates.status;

    // Timestamp updates
    if (updates.validatedAt) fields['validated_at'] = updates.validatedAt;
    if (updates.documentsPreparedAt)
      fields['documents_prepared_at'] = updates.documentsPreparedAt;
    if (updates.readyToFileAt)
      fields['ready_to_file_at'] = updates.readyToFileAt;
    if (updates.filedAt) fields['filed_at'] = updates.filedAt;
    if (updates.airlineAcknowledgedAt)
      fields['airline_acknowledged_at'] = updates.airlineAcknowledgedAt;
    if (updates.airlineRespondedAt)
      fields['airline_responded_at'] = updates.airlineRespondedAt;
    if (updates.completedAt) fields['completed_at'] = updates.completedAt;

    // Filing details
    if (updates.filingMethod) fields['filing_method'] = updates.filingMethod;
    if (updates.airlineReference)
      fields['airline_reference'] = updates.airlineReference;
    if (updates.filedBy) fields['filed_by'] = updates.filedBy;
    if (updates.nextFollowUpDate)
      fields['next_follow_up_date'] = updates.nextFollowUpDate;
    if (updates.airlineResponse)
      fields['airline_response'] = updates.airlineResponse;
    if (updates.validationNotes)
      fields['validation_notes'] = updates.validationNotes;
    if (updates.generatedSubmission)
      fields['generated_submission'] = updates.generatedSubmission;

    // Compensation and notes
    if (updates.actualCompensation)
      fields['actual_compensation'] = updates.actualCompensation;
    if (updates.internalNotes) fields['internal_notes'] = updates.internalNotes;
    if (updates.rejectionReason)
      fields['rejection_reason'] = updates.rejectionReason;

    await base(TABLES.CLAIMS).update(recordId, fields);
  } catch (error) {
    console.error('Error updating claim in Airtable:', error);
    throw error;
  }
}

/**
 * Get a claim by claim ID
 */
export async function getClaimByClaimId(claimId: string): Promise<any> {
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    const records = await base(TABLES.CLAIMS)
      .select({
        filterByFormula: `{claim_id} = '${claimId}'`,
        maxRecords: 1,
      })
      .firstPage();

    return records[0] || null;
  } catch (error) {
    console.error('Error fetching claim from Airtable:', error);
    throw error;
  }
}

/**
 * Create a payment record in Airtable
 */
export async function createPayment(payment: PaymentRecord): Promise<string> {
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    const record = await base(TABLES.PAYMENTS).create({
      payment_id: payment.paymentId,
      stripe_payment_intent_id: payment.stripePaymentIntentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      user_email: payment.email,
      card_brand: payment.cardBrand || '',
      card_last_4: payment.cardLast4 || '',
      claim_id: payment.claimId || '',
      created_at: payment.createdAt,
      stripe_customer_id: payment.stripeCustomerId || '',
    });

    return record.id;
  } catch (error) {
    console.error('Error creating payment in Airtable:', error);
    throw error;
  }
}

/**
 * Update a payment in Airtable
 */
export async function updatePayment(
  recordId: string,
  updates: Partial<PaymentRecord>
): Promise<void> {
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    const fields: Record<string, any> = {};

    if (updates.status) fields['status'] = updates.status;
    if (updates.succeededAt) fields['succeeded_at'] = updates.succeededAt;
    if (updates.refundedAt) fields['refunded_at'] = updates.refundedAt;
    if (updates.refundAmount !== undefined)
      fields['refund_amount'] = updates.refundAmount;
    if (updates.refundReason) fields['refund_reason'] = updates.refundReason;
    if (updates.claimId) fields['claim_id'] = updates.claimId;
    if (updates.cardBrand) fields['card_brand'] = updates.cardBrand;
    if (updates.cardLast4) fields['card_last_4'] = updates.cardLast4;

    await base(TABLES.PAYMENTS).update(recordId, fields);
  } catch (error) {
    console.error('Error updating payment in Airtable:', error);
    throw error;
  }
}

/**
 * Get a payment by Stripe Payment Intent ID
 */
export async function getPaymentByIntentId(intentId: string): Promise<any> {
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    const records = await base(TABLES.PAYMENTS)
      .select({
        filterByFormula: `{stripe_payment_intent_id} = '${intentId}'`,
        maxRecords: 1,
      })
      .firstPage();

    return records[0] || null;
  } catch (error) {
    console.error('Error fetching payment from Airtable:', error);
    throw error;
  }
}

/**
 * Get a payment by payment ID
 */
export async function getPaymentByPaymentId(paymentId: string): Promise<any> {
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    const records = await base(TABLES.PAYMENTS)
      .select({
        filterByFormula: `{payment_id} = '${paymentId}'`,
        maxRecords: 1,
      })
      .firstPage();

    return records[0] || null;
  } catch (error) {
    console.error('Error fetching payment from Airtable:', error);
    throw error;
  }
}

/**
 * Create a refund record in Airtable
 */
export async function createRefund(refund: RefundRecord): Promise<string> {
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    const record = await base(TABLES.REFUNDS).create({
      refund_id: refund.refundId,
      payment_id: refund.paymentId,
      claim_id: refund.claimId,
      stripe_refund_id: refund.stripeRefundId,
      amount: refund.amount,
      reason: refund.reason,
      status: refund.status,
      processed_by: refund.processedBy || '',
      processed_by_user: refund.processedByUser || '',
      created_at: refund.createdAt,
      internal_notes: refund.internalNotes || '',
    });

    return record.id;
  } catch (error) {
    console.error('Error creating refund in Airtable:', error);
    throw error;
  }
}

/**
 * Update a refund in Airtable
 */
export async function updateRefund(
  recordId: string,
  updates: Partial<RefundRecord>
): Promise<void> {
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    const fields: Record<string, any> = {};

    if (updates.status) fields['status'] = updates.status;
    if (updates.succeededAt) fields['succeeded_at'] = updates.succeededAt;
    if (updates.internalNotes) fields['internal_notes'] = updates.internalNotes;

    await base(TABLES.REFUNDS).update(recordId, fields);
  } catch (error) {
    console.error('Error updating refund in Airtable:', error);
    throw error;
  }
}

/**
 * Get claims by status
 */
export async function getClaimsByStatus(
  status: ClaimStatus
): Promise<readonly any[]> {
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    const records = await base(TABLES.CLAIMS)
      .select({
        filterByFormula: `{status} = '${status}'`,
        sort: [{ field: 'submitted_at', direction: 'desc' }],
      })
      .all();

    return records;
  } catch (error) {
    console.error(
      `Error fetching claims with status ${status} from Airtable:`,
      error
    );
    throw error;
  }
}

/**
 * Get claims that are past the processing deadline
 */
export async function getOverdueClaims(
  deadlineDays: number
): Promise<readonly any[]> {
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() - deadlineDays);
    const deadlineDateStr = deadlineDate.toISOString().split('T')[0];

    const records = await base(TABLES.CLAIMS)
      .select({
        filterByFormula: `AND(
          OR({status} = 'submitted', {status} = 'validated', {status} = 'documents_prepared', {status} = 'ready_to_file'),
          IS_BEFORE({submitted_at}, '${deadlineDateStr}')
        )`,
      })
      .all();

    return records;
  } catch (error) {
    console.error('Error fetching overdue claims from Airtable:', error);
    throw error;
  }
}

/**
 * Get claims ready to file (status: ready_to_file)
 */
export async function getClaimsReadyToFile(): Promise<readonly any[]> {
  return getClaimsByStatus('ready_to_file');
}

/**
 * Get claims needing follow-up
 */
export async function getClaimsNeedingFollowUp(): Promise<readonly any[]> {
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    const records = await base(TABLES.CLAIMS)
      .select({
        filterByFormula: `AND(
          OR({status} = 'filed', {status} = 'airline_acknowledged', {status} = 'monitoring'),
          NOT({next_follow_up_date} = ''),
          IS_BEFORE({next_follow_up_date}, '${today}')
        )`,
      })
      .all();

    return records;
  } catch (error) {
    console.error(
      'Error fetching claims needing follow-up from Airtable:',
      error
    );
    throw error;
  }
}

/**
 * Get all claims that need refunds (rejected or overdue)
 */
export async function getClaimsNeedingRefund(): Promise<readonly any[]> {
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    const records = await base(TABLES.CLAIMS)
      .select({
        filterByFormula: `OR(
          {status} = 'rejected',
          AND({status} = 'submitted', NOT({payment_id} = ''))
        )`,
      })
      .all();

    return records;
  } catch (error) {
    console.error('Error fetching claims needing refund from Airtable:', error);
    throw error;
  }
}

/**
 * Create a new eligibility check in Airtable
 */
export async function createEligibilityCheck(
  check: EligibilityCheckRecord
): Promise<string> {
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    const record = await base(TABLES.ELIGIBILITY_CHECKS).create({
      'Check ID': check.checkId,
      'Flight Number': check.flightNumber,
      Airline: check.airline,
      'Departure Date': check.departureDate,
      'Departure Airport': check.departureAirport,
      'Arrival Airport': check.arrivalAirport,
      'Delay Duration': check.delayDuration,
      'Delay Reason': check.delayReason || '',
      Eligible: check.eligible,
      Amount: check.amount,
      Confidence: check.confidence,
      Message: check.message,
      Regulation: check.regulation,
      Reason: check.reason || '',
      'IP Address': check.ipAddress,
      'User Agent': check.userAgent || '',
      'Created At': check.createdAt,
    });

    return record.id;
  } catch (error) {
    console.error('Error creating eligibility check in Airtable:', error);
    throw error;
  }
}
