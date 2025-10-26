# Email Notification System

This document describes the email notification system implemented using SendGrid.

## Setup

1. **Create SendGrid Account**: Sign up at [sendgrid.com](https://sendgrid.com)
2. **Get API Key**: 
   - Go to Settings → API Keys
   - Create a new API key with "Full Access" permissions
   - Copy the API key
3. **Configure Environment**:
   ```bash
   # Add to .env.local
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   ```

## Email Types

### 1. Payment Confirmation Email
- **Triggered**: When Stripe webhook confirms successful payment
- **Recipients**: Customer who submitted the claim
- **Content**: 
  - Payment confirmation
  - Claim details (flight info, delay duration)
  - Next steps timeline
  - Contact information

### 2. Status Update Email
- **Triggered**: When claim status changes (processing → filed → approved/rejected)
- **Recipients**: Customer
- **Content**:
  - Current status
  - Update message
  - Next steps (if applicable)

## API Endpoints

### Test Email Sending
```bash
# Test payment confirmation email
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment-confirmation",
    "testData": {
      "customerEmail": "your-email@example.com",
      "customerName": "John Doe",
      "claimId": "test-claim-123"
    }
  }'

# Test status update email
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "status-update",
    "testData": {
      "customerEmail": "your-email@example.com",
      "customerName": "John Doe",
      "claimId": "test-claim-123",
      "status": "processing"
    }
  }'
```

## Email Templates

### Payment Confirmation Template
- **Subject**: "Payment Confirmed - Claim {claimId}"
- **Design**: Professional, branded with RefundFinder colors
- **Sections**:
  - Success confirmation
  - Claim details table
  - Timeline of next steps
  - Contact information

### Status Update Template
- **Subject**: "Claim {claimId} - {status message}"
- **Design**: Clean, informative
- **Sections**:
  - Status update
  - Claim details
  - Next steps (if applicable)
  - Contact information

## Integration Points

### Stripe Webhook Integration
- **File**: `src/app/api/webhooks/stripe/route.ts`
- **Trigger**: `payment_intent.succeeded` event
- **Action**: Sends payment confirmation email automatically

### Manual Status Updates
- **Function**: `sendStatusUpdate()` in `src/lib/email.ts`
- **Usage**: Call when claim status changes in Airtable
- **Example**:
  ```typescript
  await sendStatusUpdate({
    claimId: 'claim-123',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    status: 'filed',
    message: 'Your claim has been filed with the airline.',
    nextSteps: 'We will follow up with the airline and keep you updated.'
  });
  ```

## SendGrid Configuration

### Free Tier Limits
- **Emails per day**: 100
- **Emails per month**: ~3,000
- **Cost**: $0

### Upgrade Triggers
- When you exceed 100 emails/day
- When you need advanced features (analytics, templates, etc.)

### Domain Authentication (Recommended)
1. **Add Domain**: In SendGrid dashboard → Settings → Sender Authentication
2. **DNS Records**: Add SPF, DKIM, and DMARC records
3. **Benefits**: Better deliverability, professional appearance

## Monitoring

### SendGrid Dashboard
- **Activity Feed**: View sent emails
- **Statistics**: Open rates, click rates, bounces
- **Suppressions**: Unsubscribes and bounces

### Application Logs
- **Success**: "Email sent successfully to {email}"
- **Errors**: "Error sending email: {error}"
- **Webhook**: "Payment confirmation email sent for claim {claimId}"

## Error Handling

### Graceful Degradation
- If SendGrid is not configured, emails are logged but not sent
- Webhook continues processing even if email fails
- No user-facing errors for email failures

### Retry Logic
- SendGrid handles retries automatically
- Failed emails are logged for manual review
- Consider implementing retry queue for critical emails

## Testing

### Local Testing
1. Set up SendGrid API key in `.env.local`
2. Use test endpoint: `POST /api/test-email`
3. Check SendGrid dashboard for delivery status

### Production Testing
1. Test with real email addresses
2. Verify email formatting across different clients
3. Test webhook integration with Stripe test events

## Future Enhancements

### Phase 2 (Post-Launch)
- **Email Analytics**: Track open rates, click rates
- **A/B Testing**: Test different email templates
- **Segmentation**: Different emails for different claim types
- **Automation**: Drip campaigns for follow-ups

### Phase 3 (Scale)
- **Advanced Templates**: Dynamic content based on airline/route
- **Multi-language**: Support for different languages
- **SMS Integration**: Text notifications for urgent updates
- **Customer Portal**: Self-service claim status checking
