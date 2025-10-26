# Airtable Setup Guide for Refund Finder

## Overview

This guide walks you through setting up your Airtable base for the Refund Finder application. The base will store claims, payments, and refund records.

## Step 1: Create Airtable Base

1. Go to https://airtable.com
2. Click "Add a base" → "Start from scratch"
3. Name it: "Refund Finder"

## Step 2: Create Tables

You'll need 3 tables: Claims, Payments, and Refunds.

### Table 1: Claims

1. Rename "Table 1" to "Claims"
2. Delete default fields and add these fields:

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Claim ID | Single line text | Primary field |
| First Name | Single line text | |
| Last Name | Single line text | |
| Email | Email | |
| Flight Number | Single line text | |
| Airline | Single line text | |
| Departure Date | Date | Date only |
| Departure Airport | Single line text | |
| Arrival Airport | Single line text | |
| Delay Duration | Single line text | |
| Delay Reason | Long text | |
| Status | Single select | Options: submitted, processing, filed, approved, rejected, refunded, completed |
| Estimated Compensation | Single line text | |
| Actual Compensation | Currency | Format: USD |
| Payment ID | Single line text | |
| Submitted At | Date | Include time |
| Filed At | Date | Include time |
| Completed At | Date | Include time |
| Boarding Pass Filename | Single line text | |
| Delay Proof Filename | Single line text | |
| Internal Notes | Long text | |
| Rejection Reason | Long text | |

### Table 2: Payments

1. Click "+" to add a new table
2. Name it: "Payments"
3. Add these fields:

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Payment ID | Single line text | Primary field |
| Stripe Payment Intent ID | Single line text | |
| Stripe Customer ID | Single line text | |
| Amount | Number | Precision: 0, Format: Integer |
| Currency | Single line text | |
| Status | Single select | Options: pending, succeeded, failed, refunded, partially_refunded |
| Email | Email | |
| Card Brand | Single line text | |
| Card Last 4 | Single line text | |
| Claim ID | Single line text | |
| Created At | Date | Include time |
| Succeeded At | Date | Include time |
| Refunded At | Date | Include time |
| Refund Amount | Number | Precision: 0, Format: Integer |
| Refund Reason | Long text | |
| Refund Processed By | Single line text | |

### Table 3: Refunds

1. Click "+" to add another table
2. Name it: "Refunds"
3. Add these fields:

| Field Name | Field Type | Options/Notes |
|------------|------------|---------------|
| Refund ID | Single line text | Primary field |
| Payment ID | Single line text | |
| Claim ID | Single line text | |
| Stripe Refund ID | Single line text | |
| Amount | Number | Precision: 0, Format: Integer |
| Reason | Single line text | |
| Status | Single select | Options: pending, succeeded, failed |
| Processed By | Single select | Options: automatic, manual |
| Processed By User | Single line text | |
| Created At | Date | Include time |
| Succeeded At | Date | Include time |
| Internal Notes | Long text | |

## Step 3: Get API Credentials

### Get Personal Access Token

1. Go to https://airtable.com/create/tokens
2. Click "Create new token"
3. Name: "Refund Finder API"
4. Add scopes:
   - `data.records:read`
   - `data.records:write`
5. Add access to "Refund Finder" base
6. Click "Create token"
7. Copy the token (starts with `pat...`)

### Get Base ID

1. Go to https://airtable.com/api
2. Click on your "Refund Finder" base
3. Look at the URL or the "Base ID" section
4. Copy the Base ID (starts with `app...`)

## Step 4: Configure Environment Variables

Add to your `.env.local` file:

```bash
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

## Step 5: Test Connection

Create a test script to verify the connection:

```typescript
// test-airtable.ts
import { createClaim } from '@/lib/airtable';

async function test() {
  try {
    const result = await createClaim({
      claimId: 'test-claim-001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      flightNumber: 'AA123',
      airline: 'American Airlines',
      departureDate: '2024-01-15',
      departureAirport: 'JFK',
      arrivalAirport: 'LAX',
      delayDuration: '4 hours',
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    });
    console.log('✅ Test claim created:', result);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

test();
```

Run the test:
```bash
npx ts-node test-airtable.ts
```

## Step 6: Create Views (Optional but Recommended)

### Claims Table Views

1. **All Claims** (default view)
   - Show all records
   - Sort by Submitted At (newest first)

2. **Pending Claims**
   - Filter: Status = "submitted"
   - Sort by Submitted At (oldest first)

3. **Need Refund**
   - Filter: Status = "rejected" OR Status = "submitted" (older than 10 days)
   - Sort by Submitted At

4. **Completed Claims**
   - Filter: Status = "completed" OR Status = "refunded"
   - Sort by Completed At (newest first)

### Payments Table Views

1. **All Payments** (default view)
   - Sort by Created At (newest first)

2. **Successful Payments**
   - Filter: Status = "succeeded"
   - Sort by Succeeded At (newest first)

3. **Pending Refunds**
   - Filter: Status = "succeeded" and associated claim needs refund

4. **Refunded**
   - Filter: Status = "refunded" OR Status = "partially_refunded"
   - Sort by Refunded At (newest first)

## Step 7: Set Up Automations (Optional)

### Automation 1: Send Email on New Claim

1. Go to Automations tab
2. Create new automation
3. Trigger: "When record created" in Claims table
4. Action: "Send email"
   - To: {Email}
   - Subject: "Your claim has been submitted"
   - Body: Include claim ID and next steps

### Automation 2: Flag Overdue Claims

1. Create new automation
2. Trigger: "When record matches conditions"
   - Status = "submitted"
   - Submitted At is before 10 days ago
3. Action: "Update record"
   - Add to Internal Notes: "OVERDUE: Needs review for refund"

## Step 8: Create Dashboard

1. Create a new base interface or dashboard
2. Add these elements:
   - **Total Claims**: Count of all records
   - **Success Rate**: Percentage of approved claims
   - **Revenue**: Sum of successful payments
   - **Refund Rate**: Percentage of refunded claims
   - **Chart**: Claims by status (pie chart)
   - **Chart**: Claims over time (line chart)
   - **Table**: Recent claims (last 10)

## Field Mapping Reference

This table shows how the code maps to Airtable fields:

| Code Variable | Airtable Field Name |
|---------------|---------------------|
| claimId | Claim ID |
| firstName | First Name |
| lastName | Last Name |
| email | Email |
| flightNumber | Flight Number |
| airline | Airline |
| departureDate | Departure Date |
| departureAirport | Departure Airport |
| arrivalAirport | Arrival Airport |
| delayDuration | Delay Duration |
| delayReason | Delay Reason |
| status | Status |
| estimatedCompensation | Estimated Compensation |
| paymentId | Payment ID |
| submittedAt | Submitted At |
| boardingPassFilename | Boarding Pass Filename |
| delayProofFilename | Delay Proof Filename |

## Troubleshooting

### "Airtable not configured" error

**Solution**: 
- Verify `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` are in `.env.local`
- Restart your development server

### "Table not found" error

**Solution**:
- Check table names match exactly: "Claims", "Payments", "Refunds"
- Verify base ID is correct

### "Field not found" error

**Solution**:
- Check field names match exactly (case-sensitive)
- Ensure all required fields are created

### "Permission denied" error

**Solution**:
- Verify Personal Access Token has correct scopes
- Ensure token has access to the specific base

## Data Migration

If you have existing data to import:

1. Prepare CSV with correct column names
2. Go to Claims table
3. Click "..." → "Import data" → "CSV"
4. Map columns to fields
5. Import

## Backup Strategy

Recommended backup approach:

1. **Automated Backups**
   - Create a script to export data daily
   - Store backups in secure location

2. **Manual Backups**
   - Use Airtable's "Download CSV" feature
   - Keep backups before major changes

Example backup script:

```typescript
// backup-airtable.ts
import Airtable from 'airtable';
import fs from 'fs';

async function backup() {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID!);
  
  const claims = await base('Claims').select().all();
  const payments = await base('Payments').select().all();
  
  fs.writeFileSync(
    `backup-${Date.now()}.json`,
    JSON.stringify({ claims, payments }, null, 2)
  );
  
  console.log('✅ Backup complete');
}

backup();
```

## Next Steps

After Airtable is set up:

1. Test creating a claim through the application
2. Verify data appears in Airtable
3. Test payment record creation
4. Test refund workflow
5. Set up monitoring for failed writes
6. Create admin views for managing claims

## Resources

- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [Airtable JavaScript SDK](https://github.com/Airtable/airtable.js)
- [Personal Access Tokens](https://airtable.com/developers/web/guides/personal-access-tokens)

