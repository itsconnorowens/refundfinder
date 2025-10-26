# Airtable AI Agent Setup Prompt

Copy and paste this prompt to the Airtable AI agent:

---

I need to set up a complete database structure for a flight delay refund service called "Refund Finder". Please create the following tables with the exact field names and types specified:

## Table 1: Claims (already exists - please verify/update fields)

Please ensure the Claims table has these exact fields with snake_case naming:

**Primary Field:**
- claim_id (Single line text)

**Personal Information:**
- user_first_name (Single line text)
- user_last_name (Single line text) 
- user_email (Email)
- user_phone (Phone number) - optional

**Flight Details:**
- flight_number (Single line text)
- airline (Single line text)
- departure_date (Date - Date only)
- departure_airport (Single line text)
- arrival_airport (Single line text)
- delay_duration (Single line text)
- delay_reason (Long text) - optional

**Documents:**
- boarding_pass_filename (Single line text) - optional
- delay_proof_filename (Single line text) - optional

**Status and Processing:**
- status (Single select) - Options: submitted, processing, filed, approved, rejected, refunded, completed
- estimated_compensation (Single line text) - optional
- actual_compensation (Currency - USD format) - optional
- payment_id (Single line text) - optional

**Timestamps:**
- submitted_at (Date - Include time)
- filed_at (Date - Include time) - optional
- completed_at (Date - Include time) - optional

**Internal Notes:**
- internal_notes (Long text) - optional
- rejection_reason (Long text) - optional

## Table 2: Payments (create new table)

**Primary Field:**
- payment_id (Single line text)

**Stripe Integration:**
- stripe_payment_intent_id (Single line text)
- stripe_customer_id (Single line text) - optional

**Payment Details:**
- amount (Number - Integer format, no decimals)
- currency (Single line text)
- status (Single select) - Options: pending, succeeded, failed, refunded, partially_refunded

**Customer Information:**
- user_email (Email)
- card_brand (Single line text) - optional
- card_last_4 (Single line text) - optional

**Relationships:**
- claim_id (Single line text) - optional

**Timestamps:**
- created_at (Date - Include time)
- succeeded_at (Date - Include time) - optional
- refunded_at (Date - Include time) - optional

**Refund Information:**
- refund_amount (Number - Integer format) - optional
- refund_reason (Long text) - optional
- refund_processed_by (Single line text) - optional

## Table 3: Refunds (create new table)

**Primary Field:**
- refund_id (Single line text)

**References:**
- payment_id (Single line text)
- claim_id (Single line text)
- stripe_refund_id (Single line text)

**Refund Details:**
- amount (Number - Integer format, no decimals)
- reason (Single line text)
- status (Single select) - Options: pending, succeeded, failed

**Processing Information:**
- processed_by (Single select) - Options: automatic, manual
- processed_by_user (Single line text) - optional

**Timestamps:**
- created_at (Date - Include time)
- succeeded_at (Date - Include time) - optional

**Notes:**
- internal_notes (Long text) - optional

## Important Notes:

1. **Field Naming**: Use snake_case for all field names (e.g., claim_id, user_email, not "Claim ID" or "User Email")
2. **Primary Fields**: The first field in each table should be the ID field and marked as primary
3. **Required vs Optional**: Fields marked as "optional" can be left empty, others should be required
4. **Currency Format**: Use USD format for currency fields
5. **Date Format**: Use "Include time" for timestamp fields, "Date only" for date fields
6. **Number Format**: Use Integer format (no decimals) for amount fields

Please create these tables exactly as specified, maintaining the snake_case naming convention throughout. If any fields already exist with different names, please rename them to match this specification.

---

## After Setup, Please Also:

1. **Create Views for Claims table:**
   - "All Claims" (default) - Sort by submitted_at (newest first)
   - "Pending Claims" - Filter: status = "submitted", Sort by submitted_at (oldest first)
   - "Need Refund" - Filter: status = "rejected" OR (status = "submitted" AND submitted_at older than 10 days)
   - "Completed Claims" - Filter: status = "completed" OR status = "refunded"

2. **Create Views for Payments table:**
   - "All Payments" (default) - Sort by created_at (newest first)
   - "Successful Payments" - Filter: status = "succeeded"
   - "Pending Refunds" - Filter: status = "succeeded" AND needs refund
   - "Refunded" - Filter: status = "refunded" OR status = "partially_refunded"

3. **Set up a simple dashboard** showing:
   - Total claims count
   - Claims by status (pie chart)
   - Recent claims (last 10)
   - Revenue from successful payments
