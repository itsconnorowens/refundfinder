import { NextRequest, NextResponse } from 'next/server';
import {
  validateDataSubjectRequest,
  generateRequestId,
  GDPR_CONFIG,
  DataSubjectRequest,
} from '@/lib/gdpr';
import { queueGDPRConfirmation } from '@/lib/email-queue';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const errors = validateDataSubjectRequest(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const requestId = generateRequestId();
    const dataSubjectRequest: DataSubjectRequest = {
      type: body.type,
      email: body.email,
      reason: body.reason,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };

    // Log the request (in production, store in database)
    logger.info('GDPR Request received', { requestId, dataSubjectRequest, route: '/api/gdpr' });

    // Process based on request type
    let responseData: Record<string, unknown> = {};

    switch (body.type) {
      case 'access':
        responseData = {
          message:
            'Access request received. We will provide a copy of your data within 30 days.',
          requestId,
          nextSteps: [
            'We will review your request',
            'Prepare your data export',
            'Send you a secure link to download your data',
          ],
        };
        break;

      case 'rectification':
        responseData = {
          message:
            'Rectification request received. We will review and update your data within 30 days.',
          requestId,
          nextSteps: [
            'We will review the requested changes',
            'Update your data if valid',
            'Confirm the changes via email',
          ],
        };
        break;

      case 'erasure':
        responseData = {
          message:
            'Erasure request received. We will review your request within 30 days.',
          requestId,
          nextSteps: [
            'We will check if data can be deleted',
            'Process deletion if legally permissible',
            'Confirm deletion via email',
          ],
        };
        break;

      case 'portability':
        responseData = {
          message:
            'Portability request received. We will provide your data in a structured format within 30 days.',
          requestId,
          nextSteps: [
            'We will prepare your data export',
            'Format data in machine-readable format',
            'Send you a secure download link',
          ],
        };
        break;

      case 'objection':
        responseData = {
          message:
            'Objection request received. We will review your objection within 30 days.',
          requestId,
          nextSteps: [
            'We will review your objection',
            'Stop processing if valid',
            'Confirm action taken via email',
          ],
        };
        break;

      case 'restriction':
        responseData = {
          message:
            'Restriction request received. We will limit processing of your data within 30 days.',
          requestId,
          nextSteps: [
            'We will review your restriction request',
            'Limit processing as requested',
            'Confirm restriction via email',
          ],
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid request type' },
          { status: 400 }
        );
    }

    // Send confirmation email (in production, implement email sending)
    logger.info('Sending GDPR confirmation email', {
      email: body.email,
      requestId,
      route: '/api/gdpr'
    });

    // Queue GDPR confirmation email
    try {
      const emailId = await queueGDPRConfirmation(body.email, {
        type: body.type,
        requestId,
        nextSteps: responseData.nextSteps as string[],
      });

      logger.info('GDPR confirmation email queued: ', { emailId: emailId });
    } catch (emailError) {
      logger.error('Error queuing GDPR confirmation email:', emailError);
      // Continue processing even if email queuing fails
    }

    return NextResponse.json({
      success: true,
      requestId,
      message: 'GDPR request received successfully',
      data: responseData,
      contactInfo: {
        email: GDPR_CONFIG.privacyEmail,
        responseTime: '30 days',
        euRepresentative: GDPR_CONFIG.euRepresentativeEmail,
      },
    });
  } catch (error: unknown) {
    logger.error('Error processing GDPR request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'GDPR Data Subject Rights API',
    endpoints: {
      'POST /api/gdpr': 'Submit a data subject rights request',
    },
    supportedRequests: [
      'access - Request a copy of your personal data',
      'rectification - Correct inaccurate personal data',
      'erasure - Request deletion of your personal data',
      'portability - Receive your data in a structured format',
      'objection - Object to processing of your personal data',
      'restriction - Request limitation of processing',
    ],
    contactInfo: {
      privacy: GDPR_CONFIG.privacyEmail,
      dpo: GDPR_CONFIG.dpoEmail,
      euRepresentative: GDPR_CONFIG.euRepresentativeEmail,
    },
  });
}
