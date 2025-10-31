/**
 * Follow-up Service
 * Handles automated follow-ups with airlines based on response timelines
 */

import { ClaimRecord, updateClaim, getClaimsNeedingFollowUp } from './airtable';
import { getAirlineConfig } from './airline-config';
import { emailService } from './email-service';
import { sendStatusUpdateNotification } from './email-service';
import { logger } from '@/lib/logger';

export interface FollowUpSchedule {
  claimId: string;
  airline: string;
  followUpType: 'initial' | 'reminder' | 'escalation' | 'final';
  scheduledDate: string;
  status: 'pending' | 'sent' | 'failed';
  messageId?: string;
  notes?: string;
}

export interface FollowUpResult {
  success: boolean;
  followUpId: string;
  messageId?: string;
  error?: string;
}

/**
 * Generate follow-up email content for airlines
 */
function generateFollowUpEmail(
  claim: ClaimRecord,
  airlineConfig: any,
  followUpType: FollowUpSchedule['followUpType']
): { subject: string; body: string } {
  const claimId = claim.claimId;
  const flightNumber = claim.flightNumber;
  const airline = claim.airline;
  const departureDate = claim.departureDate;
  const airlineReference = claim.airlineReference || 'Not provided';

  const baseSubject = `Follow-up: EU261 Compensation Claim - Flight ${flightNumber}`;
  const baseInfo = `
Claim Details:
- Claim ID: ${claimId}
- Flight: ${flightNumber}
- Departure Date: ${departureDate}
- Airline Reference: ${airlineReference}
- Passenger: ${claim.firstName} ${claim.lastName}
- Email: ${claim.email}
`;

  switch (followUpType) {
    case 'initial':
      return {
        subject: `${baseSubject} - Initial Follow-up`,
        body: `
Dear ${airline} Customer Service,

I am following up on the EU261 compensation claim submitted on behalf of our client.

${baseInfo}

This claim was submitted ${getDaysSinceSubmission(claim)} days ago and we have not yet received a response.

Under EU261 regulations, airlines are required to respond to compensation claims within a reasonable timeframe. We would appreciate an update on the status of this claim.

Please provide:
1. Confirmation of receipt
2. Expected timeline for processing
3. Any additional information required

We look forward to your prompt response.

Best regards,
Flghtly Support Team
claims@flghtly.com

---
This follow-up is being sent on behalf of the passenger as part of our compensation assistance service.
        `,
      };

    case 'reminder':
      return {
        subject: `${baseSubject} - Reminder`,
        body: `
Dear ${airline} Customer Service,

This is a reminder regarding the EU261 compensation claim for our client.

${baseInfo}

This claim was submitted ${getDaysSinceSubmission(claim)} days ago. We have not received a response to our previous follow-up.

We understand that processing times may vary, but we would appreciate an update on the status of this claim.

Please provide:
1. Current status of the claim
2. Expected timeline for completion
3. Any issues preventing processing

We appreciate your attention to this matter.

Best regards,
Flghtly Support Team
claims@flghtly.com

---
This reminder is being sent on behalf of the passenger as part of our compensation assistance service.
        `,
      };

    case 'escalation':
      return {
        subject: `${baseSubject} - Escalation Required`,
        body: `
Dear ${airline} Customer Service,

We are escalating this EU261 compensation claim due to lack of response.

${baseInfo}

This claim was submitted ${getDaysSinceSubmission(claim)} days ago and we have not received any response despite multiple follow-ups.

Under EU261 regulations, airlines are legally obligated to:
1. Acknowledge receipt of compensation claims
2. Process claims within reasonable timeframes
3. Provide clear communication about claim status

We are considering escalating this matter to the relevant national enforcement body if we do not receive a response within 7 days.

Please provide immediate:
1. Confirmation of receipt
2. Detailed status update
3. Expected resolution timeline

We hope to resolve this matter amicably and look forward to your urgent response.

Best regards,
Flghtly Support Team
claims@flghtly.com

---
This escalation notice is being sent on behalf of the passenger as part of our compensation assistance service.
        `,
      };

    case 'final':
      return {
        subject: `${baseSubject} - Final Notice`,
        body: `
Dear ${airline} Customer Service,

This is our final notice regarding the EU261 compensation claim for our client.

${baseInfo}

This claim was submitted ${getDaysSinceSubmission(claim)} days ago. Despite multiple follow-ups and escalation notices, we have not received any response.

This lack of response constitutes a breach of EU261 regulations. We are now proceeding with:

1. Filing a complaint with the relevant national enforcement body
2. Documenting this case for regulatory reporting
3. Advising our client of their rights to pursue legal action

If you wish to resolve this matter before regulatory action, please respond within 48 hours with:
1. Immediate acknowledgment of the claim
2. Detailed status update
3. Confirmed resolution timeline

This is our final attempt to resolve this matter directly.

Best regards,
Flghtly Support Team
claims@flghtly.com

---
This final notice is being sent on behalf of the passenger as part of our compensation assistance service.
        `,
      };

    default:
      throw new Error(`Unknown follow-up type: ${followUpType}`);
  }
}

/**
 * Send follow-up email to airline
 */
async function sendFollowUpEmail(
  claim: ClaimRecord,
  airlineConfig: any,
  followUpType: FollowUpSchedule['followUpType']
): Promise<FollowUpResult> {
  try {
    const emailContent = generateFollowUpEmail(
      claim,
      airlineConfig,
      followUpType
    );

    const emailResult = await emailService.sendEmail({
      to: airlineConfig.claimEmail,
      template: {
        subject: emailContent.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Follow-up: EU261 Compensation Claim</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${emailContent.body.replace(/\n/g, '<br>')}
            </div>
          </div>
        `,
        text: emailContent.body,
      },
      variables: {},
    });

    if (emailResult.success) {
      return {
        success: true,
        followUpId: `followup-${Date.now()}`,
        messageId: emailResult.messageId,
      };
    } else {
      return {
        success: false,
        followUpId: `followup-${Date.now()}`,
        error: emailResult.error || 'Failed to send follow-up email',
      };
    }
  } catch (error: unknown) {
    logger.error('Error sending follow-up email:', error);
    return {
      success: false,
      followUpId: `followup-${Date.now()}`,
      error: 'Failed to send follow-up email',
    };
  }
}

/**
 * Process automated follow-ups for claims
 */
export async function processAutomatedFollowUps(): Promise<
  Array<{
    claimId: string;
    followUpType: FollowUpSchedule['followUpType'];
    success: boolean;
    error?: string;
  }>
> {
  try {
    const claimsNeedingFollowUp = await getClaimsNeedingFollowUp();
    const results: Array<{
      claimId: string;
      followUpType: FollowUpSchedule['followUpType'];
      success: boolean;
      error?: string;
    }> = [];

    for (const claim of claimsNeedingFollowUp) {
      try {
        const airlineConfig = getAirlineConfig(claim.airline);
        if (!airlineConfig || !airlineConfig.claimEmail) {
          console.log(
            `No email config for ${claim.airline}, skipping follow-up`
          );
          results.push({
            claimId: claim.claimId,
            followUpType: 'reminder',
            success: false,
            error: 'No email configuration for airline',
          });
          continue;
        }

        // Determine follow-up type based on days since filing
        const daysSinceFiling = getDaysSinceFiling(claim);
        let followUpType: FollowUpSchedule['followUpType'] = 'reminder';

        if (daysSinceFiling >= 35) {
          followUpType = 'final';
        } else if (daysSinceFiling >= 28) {
          followUpType = 'escalation';
        } else if (daysSinceFiling >= 14) {
          followUpType = 'initial';
        }

        // Send follow-up email
        const followUpResult = await sendFollowUpEmail(
          claim,
          airlineConfig,
          followUpType
        );

        if (followUpResult.success) {
          // Update claim with follow-up information
          await updateClaim(claim.id!, {
            nextFollowUpDate: calculateNextFollowUpDate(
              airlineConfig,
              followUpType
            ),
            internalNotes:
              `${claim.internalNotes || ''}\n[${new Date().toISOString()}] Follow-up sent: ${followUpType} - ${followUpResult.messageId}`.trim(),
          });

          // Send customer notification
          try {
            await sendStatusUpdateNotification(claim.user_email, {
              claimId: claim.claimId,
              firstName: claim.user_first_name,
              flightNumber: claim.flight_number,
              airline: claim.airline,
              newStatus: 'follow_up_sent',
              previousStatus: claim.status,
              updateDate: new Date().toLocaleDateString(),
              updateMessage: `We've sent a ${followUpType} follow-up to ${claim.airline} regarding your claim.`,
              nextSteps: [
                'We will continue monitoring for a response',
                'You will be notified when the airline responds',
                'If no response is received, we may escalate the matter',
              ],
            });
          } catch (emailError) {
            logger.error('Error sending customer notification:', emailError);
            // Don't fail the follow-up if customer email fails
          }
        }

        results.push({
          claimId: claim.claimId,
          followUpType,
          success: followUpResult.success,
          error: followUpResult.error,
        });

        // Add delay between follow-ups to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error: unknown) {
        console.error(
          `Error processing follow-up for claim ${claim.claimId}:`,
          error
        );
        results.push({
          claimId: claim.claimId,
          followUpType: 'reminder',
          success: false,
          error: 'Processing failed',
        });
      }
    }

    return results;
  } catch (error: unknown) {
    logger.error('Error processing automated follow-ups:', error);
    return [];
  }
}

/**
 * Calculate next follow-up date based on airline config and follow-up type
 */
function calculateNextFollowUpDate(
  airlineConfig: any,
  currentFollowUpType: FollowUpSchedule['followUpType']
): string {
  const now = new Date();

  switch (currentFollowUpType) {
    case 'initial':
      // Next follow-up in 7 days
      now.setDate(now.getDate() + 7);
      break;
    case 'reminder':
      // Next follow-up in 7 days
      now.setDate(now.getDate() + 7);
      break;
    case 'escalation':
      // Final follow-up in 7 days
      now.setDate(now.getDate() + 7);
      break;
    case 'final':
      // No more follow-ups
      now.setDate(now.getDate() + 30); // Set far in future
      break;
    default:
      now.setDate(now.getDate() + 7);
  }

  return now.toISOString();
}

/**
 * Get days since claim was filed
 */
function getDaysSinceFiling(claim: ClaimRecord): number {
  if (!claim.filedAt) return 0;

  const filedDate = new Date(claim.filedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - filedDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get days since claim was submitted
 */
function getDaysSinceSubmission(claim: ClaimRecord): number {
  if (!claim.submittedAt) return 0;

  const submittedDate = new Date(claim.submittedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - submittedDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get follow-up statistics
 */
export async function getFollowUpStats(): Promise<{
  totalFollowUps: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  followUpsByType: Record<string, number>;
}> {
  try {
    const claimsNeedingFollowUp = await getClaimsNeedingFollowUp();

    const stats = {
      totalFollowUps: claimsNeedingFollowUp.length,
      pendingFollowUps: 0,
      overdueFollowUps: 0,
      followUpsByType: {
        initial: 0,
        reminder: 0,
        escalation: 0,
        final: 0,
      },
    };

    claimsNeedingFollowUp.forEach((claim) => {
      const daysSinceFiling = getDaysSinceFiling(claim);

      if (daysSinceFiling >= 35) {
        stats.followUpsByType.final++;
        stats.overdueFollowUps++;
      } else if (daysSinceFiling >= 28) {
        stats.followUpsByType.escalation++;
        stats.overdueFollowUps++;
      } else if (daysSinceFiling >= 14) {
        stats.followUpsByType.initial++;
        stats.pendingFollowUps++;
      } else {
        stats.followUpsByType.reminder++;
        stats.pendingFollowUps++;
      }
    });

    return stats;
  } catch (error: unknown) {
    logger.error('Error getting follow-up stats:', error);
    return {
      totalFollowUps: 0,
      pendingFollowUps: 0,
      overdueFollowUps: 0,
      followUpsByType: {
        initial: 0,
        reminder: 0,
        escalation: 0,
        final: 0,
      },
    };
  }
}
