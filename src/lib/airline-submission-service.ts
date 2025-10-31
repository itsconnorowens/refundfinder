/**
 * Airline Submission Service
 * Handles automated submission of claims to airlines via email
 */

import { ClaimRecord, updateClaim, getClaimByClaimId } from './airtable';
import { getAirlineConfig, AirlineConfig } from './airline-config';
import { generateDocumentSubmission } from './document-generator';
import { emailService, EmailResult } from './email-service';
import { sendClaimFiledNotification } from './email-service';
import { logger } from '@/lib/logger';

export interface AirlineSubmissionResult {
  success: boolean;
  submissionId?: string;
  airlineReference?: string;
  error?: string;
  method: 'email' | 'web_form' | 'postal';
  emailTracking?: {
    messageId: string;
    sentAt: string;
    status: 'sent' | 'delivered' | 'bounced' | 'opened' | 'failed';
    lastUpdated: string;
  };
}

export interface EmailSubmissionData {
  to: string;
  subject: string;
  body: string;
  attachments: Array<{
    filename: string;
    url: string;
    type: string;
  }>;
}

/**
 * Submit a claim to an airline automatically
 */
export async function submitClaimToAirline(
  claimId: string
): Promise<AirlineSubmissionResult> {
  try {
    // Get claim details
    const claim = await getClaimByClaimId(claimId);
    if (!claim) {
      return {
        success: false,
        error: 'Claim not found',
        method: 'email',
      };
    }

    // Get airline configuration
    const airlineConfig = getAirlineConfig(claim.fields.airline);
    if (!airlineConfig) {
      return {
        success: false,
        error: `No configuration found for airline: ${claim.fields.airline}`,
        method: 'email',
      };
    }

    // Generate submission materials
    const submission = await generateDocumentSubmission(
      claim.fields,
      airlineConfig
    );

    let result: AirlineSubmissionResult;

    switch (airlineConfig.submissionMethod) {
      case 'email':
        result = await submitViaEmail(claim.fields, airlineConfig, submission);
        break;
      case 'web_form':
        result = await submitViaWebForm(
          claim.fields,
          airlineConfig,
          submission
        );
        break;
      case 'postal':
        result = await submitViaPostal(claim.fields, airlineConfig, submission);
        break;
      default:
        return {
          success: false,
          error: `Unsupported submission method: ${airlineConfig.submissionMethod}`,
          method: 'email',
        };
    }

    if (result.success) {
      // Update claim status
      await updateClaim(claim.id!, {
        status: 'filed',
        filedAt: new Date().toISOString(),
        filingMethod: airlineConfig.submissionMethod,
        airlineReference: result.airlineReference,
        generatedSubmission: JSON.stringify(submission),
        nextFollowUpDate: calculateFollowUpDate(airlineConfig),
      });

      // Send customer notification
      try {
        await sendClaimFiledNotification(claim.fields.user_email, {
          firstName: claim.fields.user_first_name,
          claimId: claim.fields.claim_id,
          flightNumber: claim.fields.flight_number,
          airline: claim.fields.airline,
          departureDate: claim.fields.departure_date,
          departureAirport: claim.fields.departure_airport,
          arrivalAirport: claim.fields.arrival_airport,
          delayDuration: claim.fields.delay_duration,
          airlineReference: result.airlineReference,
          filingMethod: airlineConfig.submissionMethod,
          expectedResponseTime: airlineConfig.expectedResponseTime,
        });
      } catch (emailError) {
        logger.error('Error sending claim filed notification:', emailError);
        // Don't fail the submission if email fails
      }

      console.log(
        `Claim ${claimId} successfully submitted to ${claim.fields.airline}`
      );
    }

    return result;
  } catch (error) {
    logger.error('Error submitting claim to airline:', error);
    return {
      success: false,
      error: 'Failed to submit claim to airline',
      method: 'email',
    };
  }
}

/**
 * Submit claim via email to airline
 */
async function submitViaEmail(
  claim: ClaimRecord,
  airlineConfig: AirlineConfig,
  submission: any
): Promise<AirlineSubmissionResult> {
  try {
    if (!airlineConfig.claimEmail) {
      return {
        success: false,
        error: 'No email address configured for airline',
        method: 'email',
      };
    }

    // Prepare email data
    const emailData: EmailSubmissionData = {
      to: airlineConfig.claimEmail,
      subject:
        submission.subject ||
        `EU261 Compensation Claim - Flight ${claim.flightNumber}`,
      body: submission.body,
      attachments: [],
    };

    // Add document attachments
    if (claim.boardingPassUrl) {
      emailData.attachments.push({
        filename: `boarding_pass_${claim.claimId}.pdf`,
        url: claim.boardingPassUrl,
        type: 'application/pdf',
      });
    }

    if (claim.delayProofUrl) {
      emailData.attachments.push({
        filename: `delay_proof_${claim.claimId}.pdf`,
        url: claim.delayProofUrl,
        type: 'application/pdf',
      });
    }

    // Send email using the enhanced email service
    const emailResult = await sendAirlineClaimEmail(emailData);

    if (emailResult.success) {
      return {
        success: true,
        submissionId: emailResult.messageId,
        airlineReference: `EMAIL-${Date.now()}`,
        method: 'email',
        emailTracking: {
          messageId: emailResult.messageId || `email-${Date.now()}`,
          sentAt: new Date().toISOString(),
          status: 'sent',
          lastUpdated: new Date().toISOString(),
        },
      };
    } else {
      return {
        success: false,
        error: emailResult.error || 'Failed to send email',
        method: 'email',
        emailTracking: {
          messageId: `failed-${Date.now()}`,
          sentAt: new Date().toISOString(),
          status: 'failed',
          lastUpdated: new Date().toISOString(),
        },
      };
    }
  } catch (error) {
    logger.error('Error submitting via email:', error);
    return {
      success: false,
      error: 'Email submission failed',
      method: 'email',
    };
  }
}

/**
 * Submit claim via web form (generate instructions)
 */
async function submitViaWebForm(
  claim: ClaimRecord,
  airlineConfig: AirlineConfig,
  submission: any
): Promise<AirlineSubmissionResult> {
  try {
    // For web forms, we generate detailed instructions
    // In the future, this could be automated with Playwright/Puppeteer

    const instructions =
      submission.instructions || 'Manual web form submission required';

    // Store instructions in claim for admin to follow
    await updateClaim(claim.id!, {
      generatedSubmission: JSON.stringify({
        ...submission,
        instructions,
        formData: submission.formData,
        url: airlineConfig.claimFormUrl,
      }),
    });

    return {
      success: true,
      submissionId: `WEBFORM-${Date.now()}`,
      airlineReference: `WEBFORM-${Date.now()}`,
      method: 'web_form',
    };
  } catch (error) {
    logger.error('Error preparing web form submission:', error);
    return {
      success: false,
      error: 'Web form preparation failed',
      method: 'web_form',
    };
  }
}

/**
 * Submit claim via postal mail (generate materials)
 */
async function submitViaPostal(
  claim: ClaimRecord,
  airlineConfig: AirlineConfig,
  submission: any
): Promise<AirlineSubmissionResult> {
  try {
    // Generate postal submission materials
    const postalData = {
      address: airlineConfig.postalAddress,
      documents: submission.documents || [],
      coverLetter: submission.body,
      instructions: submission.instructions,
    };

    // Store postal data for admin to process
    await updateClaim(claim.id!, {
      generatedSubmission: JSON.stringify({
        ...submission,
        postalData,
      }),
    });

    return {
      success: true,
      submissionId: `POSTAL-${Date.now()}`,
      airlineReference: `POSTAL-${Date.now()}`,
      method: 'postal',
    };
  } catch (error) {
    logger.error('Error preparing postal submission:', error);
    return {
      success: false,
      error: 'Postal submission preparation failed',
      method: 'postal',
    };
  }
}

/**
 * Send email to airline with attachments
 */
async function sendAirlineClaimEmail(
  emailData: EmailSubmissionData
): Promise<EmailResult> {
  try {
    // Create email template for airline submission
    const template = {
      subject: emailData.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>EU261 Compensation Claim</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${emailData.body.replace(/\n/g, '<br>')}
          </div>
          <p><strong>Note:</strong> This claim is being processed by Flghtly on behalf of the passenger.</p>
          <p>For any questions, please contact: claims@flghtly.com</p>
        </div>
      `,
      text: emailData.body,
    };

    // For now, we'll send without attachments due to SendGrid limitations
    // In production, you'd need to download files and attach them
    const result = await emailService.sendEmail({
      to: emailData.to,
      template,
      variables: {},
    });

    return result;
  } catch (error) {
    logger.error('Error sending airline claim email:', error);
    return {
      success: false,
      error: 'Failed to send email to airline',
      provider: 'none',
    };
  }
}

/**
 * Calculate follow-up date based on airline configuration
 */
function calculateFollowUpDate(airlineConfig: AirlineConfig): string {
  const followUpDays =
    parseInt(airlineConfig.expectedResponseTime.replace(/[^\d]/g, '')) || 14;
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + followUpDays);
  return followUpDate.toISOString();
}

/**
 * Process multiple claims for filing
 */
export async function processClaimsForFiling(
  claimIds: string[]
): Promise<Array<{ claimId: string; result: AirlineSubmissionResult }>> {
  const results = [];

  for (const claimId of claimIds) {
    try {
      const result = await submitClaimToAirline(claimId);
      results.push({ claimId, result });

      // Add small delay between submissions to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing claim ${claimId}:`, error);
      results.push({
        claimId,
        result: {
          success: false,
          error: 'Processing failed',
          method: 'email' as const,
        },
      });
    }
  }

  return results;
}

/**
 * Get claims ready for automated filing
 */
export async function getClaimsReadyForFiling(): Promise<string[]> {
  try {
    // This would typically query Airtable for claims with status 'ready_to_file'
    // For now, return empty array - this will be implemented when we enhance the cron job
    return [];
  } catch (error) {
    logger.error('Error getting claims ready for filing:', error);
    return [];
  }
}
