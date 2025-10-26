/**
 * Claim Filing Service
 * Core service for validating, generating, and managing claim submissions to airlines
 */

import {
  ClaimRecord,
  ClaimStatus,
  getClaimByClaimId,
  updateClaim,
  getClaimsByStatus as getClaimsByStatusFromAirtable,
  getClaimsReadyToFile,
  getClaimsNeedingFollowUp as getClaimsNeedingFollowUpFromAirtable,
  getOverdueClaims,
} from './airtable';
import {
  getAirlineConfig,
  generateSubmissionTemplate,
  AirlineConfig,
} from './airline-config';
import { generateDocumentSubmission } from './document-generator';
import {
  sendClaimFiledNotification,
  sendStatusUpdateNotification,
} from './email-service';

export interface ClaimValidationResult {
  success: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingDocuments: string[];
  missingFields: string[];
  airlineConfig?: AirlineConfig;
  error?: string;
}

export interface ClaimFilingResult {
  success: boolean;
  submissionTemplate?: any;
  airlineConfig?: AirlineConfig;
  error?: string;
}

export interface FollowUpSchedule {
  claimId: string;
  nextFollowUpDate: string;
  followUpType: 'initial' | 'reminder' | 'escalation';
  notes?: string;
}

/**
 * Validate if a claim is ready for filing
 */
export async function validateClaimForFiling(
  claimId: string
): Promise<ClaimValidationResult> {
  try {
    const claim = await getClaimByClaimId(claimId);
    if (!claim) {
      return {
        success: false,
        isValid: false,
        errors: ['Claim not found'],
        warnings: [],
        missingDocuments: [],
        missingFields: [],
        error: 'Claim not found',
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const missingDocuments: string[] = [];
    const missingFields: string[] = [];

    // Check payment status
    if (!claim.fields.paymentId) {
      errors.push('Payment not confirmed');
    }

    // Check required documents
    if (!claim.fields.boardingPassUrl) {
      missingDocuments.push('boarding_pass');
      errors.push('Boarding pass is required');
    }

    if (!claim.fields.delayProofUrl) {
      missingDocuments.push('delay_proof');
      errors.push('Delay proof is required');
    }

    // Check required fields
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'flightNumber',
      'airline',
      'departureDate',
      'departureAirport',
      'arrivalAirport',
      'delayDuration',
    ];

    requiredFields.forEach((field) => {
      if (!claim.fields[field as keyof ClaimRecord]) {
        missingFields.push(field);
        errors.push(`${field} is required`);
      }
    });

    // Check airline configuration
    const airlineConfig = getAirlineConfig(claim.fields.airline);
    if (!airlineConfig) {
      errors.push('Airline configuration not found');
    }

    // Check delay duration (should be at least 3 hours for EU261)
    const delayHours = parseDelayHours(claim.fields.delayDuration);
    if (delayHours < 3) {
      warnings.push(
        'Delay duration is less than 3 hours - may not be eligible for compensation'
      );
    }

    const isValid = errors.length === 0;
    const success = isValid;

    return {
      success,
      isValid,
      errors,
      warnings,
      missingDocuments,
      missingFields,
      airlineConfig,
      error: errors.length > 0 ? errors[0] : undefined,
    };
  } catch (error) {
    console.error('Error validating claim for filing:', error);
    return {
      success: false,
      isValid: false,
      errors: ['Validation failed due to system error'],
      warnings: [],
      missingDocuments: [],
      missingFields: [],
      error: 'Validation failed due to system error',
    };
  }
}

/**
 * Generate airline submission materials for a claim
 */
export async function generateAirlineSubmission(
  claimId: string
): Promise<ClaimFilingResult> {
  try {
    const claim = await getClaimByClaimId(claimId);
    if (!claim) {
      return {
        success: false,
        error: 'Claim not found',
      };
    }

    // Validate claim first
    const validation = await validateClaimForFiling(claimId);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Claim validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Get airline configuration
    const airlineConfig = getAirlineConfig(claim.fields.airline);
    if (!airlineConfig) {
      return {
        success: false,
        error: `No airline configuration found for ${claim.fields.airline}`,
      };
    }

    // Generate submission template
    const submissionTemplate = generateSubmissionTemplate(
      airlineConfig,
      claim.fields
    );

    // Generate document submission
    const documentSubmission = await generateDocumentSubmission(
      claim.fields,
      airlineConfig
    );

    // Update claim with generated submission
    await updateClaim(claim.id!, {
      status: 'documents_prepared',
      documentsPreparedAt: new Date().toISOString(),
      generatedSubmission: JSON.stringify({
        template: submissionTemplate,
        documentSubmission,
        airlineConfig: airlineConfig.airlineCode,
      }),
      validationNotes: JSON.stringify(validation),
    });

    return {
      success: true,
      submissionTemplate: {
        ...submissionTemplate,
        documentSubmission,
      },
      airlineConfig,
    };
  } catch (error) {
    console.error('Error generating airline submission:', error);
    return {
      success: false,
      error: 'Failed to generate submission materials',
    };
  }
}

/**
 * Mark a claim as filed with airline reference
 */
export async function markClaimAsFiled(
  claimId: string,
  airlineReference: string,
  filedBy: string,
  filingMethod: 'email' | 'web_form' | 'postal'
): Promise<boolean> {
  try {
    const claim = await getClaimByClaimId(claimId);
    if (!claim) {
      throw new Error('Claim not found');
    }

    await updateClaim(claim.id!, {
      status: 'filed',
      filedAt: new Date().toISOString(),
      airlineReference,
      filedBy,
      filingMethod,
      nextFollowUpDate: calculateNextFollowUpDate(claim.fields.airline),
    });

    // Send notification email
    try {
      await sendClaimFiledNotification(claim.fields.email, {
        claimId: claim.fields.claimId,
        airline: claim.fields.airline,
        airlineReference,
        filingMethod,
      });
    } catch (emailError) {
      console.error('Error sending claim filed notification:', emailError);
      // Don't fail the function if email fails
    }

    return true;
  } catch (error) {
    console.error('Error marking claim as filed:', error);
    return false;
  }
}

/**
 * Update claim status
 */
export async function updateClaimStatus(
  claimId: string,
  status: ClaimStatus,
  notes?: string
): Promise<boolean> {
  try {
    const claim = await getClaimByClaimId(claimId);
    if (!claim) {
      throw new Error('Claim not found');
    }

    const updates: Partial<ClaimRecord> = { status };

    // Set appropriate timestamp based on status
    const now = new Date().toISOString();
    switch (status) {
      case 'validated':
        updates.validatedAt = now;
        break;
      case 'documents_prepared':
        updates.documentsPreparedAt = now;
        break;
      case 'ready_to_file':
        updates.readyToFileAt = now;
        break;
      case 'filed':
        updates.filedAt = now;
        break;
      case 'airline_acknowledged':
        updates.airlineAcknowledgedAt = now;
        break;
      case 'airline_responded':
        updates.airlineRespondedAt = now;
        break;
      case 'completed':
        updates.completedAt = now;
        break;
    }

    if (notes) {
      updates.internalNotes = notes;
    }

    await updateClaim(claim.id!, updates);

    // Send notification email
    try {
      await sendStatusUpdateNotification(claim.fields.email, {
        claimId: claim.fields.claimId,
        status,
        notes,
      });
    } catch (emailError) {
      console.error('Error sending status update notification:', emailError);
      // Don't fail the function if email fails
    }

    return true;
  } catch (error) {
    console.error('Error updating claim status:', error);
    return false;
  }
}

/**
 * Get claims by status
 */
export async function getClaimsByStatus(status: ClaimStatus): Promise<any[]> {
  try {
    const records = await getClaimsByStatusFromAirtable(status);
    return records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));
  } catch (error) {
    console.error(`Error fetching claims with status ${status}:`, error);
    return [];
  }
}

/**
 * Get all claims ready to file
 */
export async function getAllClaimsReadyToFile(): Promise<any[]> {
  try {
    const records = await getClaimsReadyToFile();
    return records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));
  } catch (error) {
    console.error('Error fetching claims ready to file:', error);
    return [];
  }
}

/**
 * Get claims needing follow-up
 */
export async function getClaimsNeedingFollowUp(): Promise<any[]> {
  try {
    const records = await getClaimsNeedingFollowUpFromAirtable();
    return records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));
  } catch (error) {
    console.error('Error fetching claims needing follow-up:', error);
    return [];
  }
}

/**
 * Schedule follow-up for a claim
 */
export async function scheduleFollowUp(
  claimId: string,
  followUpDate: string,
  followUpType: 'initial' | 'reminder' | 'escalation' = 'reminder',
  notes?: string
): Promise<boolean> {
  try {
    const claim = await getClaimByClaimId(claimId);
    if (!claim) {
      throw new Error('Claim not found');
    }

    await updateClaim(claim.id!, {
      nextFollowUpDate: followUpDate,
      internalNotes: notes
        ? `${claim.internalNotes || ''}\n[${new Date().toISOString()}] Follow-up scheduled: ${followUpType} - ${notes}`.trim()
        : claim.internalNotes,
    });

    return true;
  } catch (error) {
    console.error('Error scheduling follow-up:', error);
    return false;
  }
}

/**
 * Process automatic claim validation and preparation
 */
export async function processAutomaticClaimPreparation(
  claimId: string
): Promise<boolean> {
  try {
    // Validate claim
    const validation = await validateClaimForFiling(claimId);

    if (!validation.isValid) {
      console.log(`Claim ${claimId} validation failed:`, validation.errors);
      return false;
    }

    // Generate submission materials
    const result = await generateAirlineSubmission(claimId);

    if (!result.success) {
      console.log(
        `Failed to generate submission for claim ${claimId}:`,
        result.error
      );
      return false;
    }

    // Mark as ready to file
    await updateClaimStatus(
      claimId,
      'ready_to_file',
      'Automatically prepared for filing'
    );

    console.log(`Claim ${claimId} automatically prepared for filing`);
    return true;
  } catch (error) {
    console.error(
      `Error processing automatic claim preparation for ${claimId}:`,
      error
    );
    return false;
  }
}

/**
 * Calculate next follow-up date based on airline
 */
function calculateNextFollowUpDate(airline: string): string {
  const airlineConfig = getAirlineConfig(airline);
  if (!airlineConfig || airlineConfig.followUpSchedule.length === 0) {
    // Default to 2 weeks
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  }

  // Use first follow-up schedule item
  const firstFollowUp = airlineConfig.followUpSchedule[0];
  const weeks = parseInt(firstFollowUp.replace(/\D/g, ''));

  const date = new Date();
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().split('T')[0];
}

/**
 * Parse delay duration from string to hours
 */
function parseDelayHours(delayDuration: string | undefined): number {
  if (!delayDuration) return 0;

  const match = delayDuration.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;

  const value = parseFloat(match[1]);

  // If it mentions minutes, convert to hours
  if (delayDuration.toLowerCase().includes('minute')) {
    return value / 60;
  }

  return value;
}

/**
 * Get claim filing statistics
 */
export async function getClaimFilingStats(): Promise<{
  total: number;
  byStatus: Record<ClaimStatus, number>;
  readyToFile: number;
  overdue: number;
  needingFollowUp: number;
}> {
  try {
    const allStatuses: ClaimStatus[] = [
      'submitted',
      'validated',
      'documents_prepared',
      'ready_to_file',
      'filed',
      'airline_acknowledged',
      'monitoring',
      'airline_responded',
      'approved',
      'rejected',
      'completed',
      'refunded',
    ];

    const byStatus: Record<ClaimStatus, number> = {} as Record<
      ClaimStatus,
      number
    >;
    let total = 0;

    for (const status of allStatuses) {
      const claims = await getClaimsByStatus(status);
      byStatus[status] = claims.length;
      total += claims.length;
    }

    const readyToFile = await getAllClaimsReadyToFile();
    const needingFollowUp = await getClaimsNeedingFollowUp();
    const overdue = await getOverdueClaims(2); // Claims overdue by 2 days

    return {
      total,
      byStatus,
      readyToFile: readyToFile.length,
      overdue: overdue.length,
      needingFollowUp: needingFollowUp.length,
    };
  } catch (error) {
    console.error('Error getting claim filing stats:', error);
    return {
      total: 0,
      byStatus: {} as Record<ClaimStatus, number>,
      readyToFile: 0,
      overdue: 0,
      needingFollowUp: 0,
    };
  }
}
