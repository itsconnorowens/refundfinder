# Production Test Data for Refund Finder

This document provides realistic test data to simulate what real users would experience in your refund finder application. Use this data to test the complete user journey from eligibility check to claim submission.

## 🎯 Test Scenarios Overview

### Scenario 1: EU Flight - Eligible for €400 Compensation
**User Profile:** Business traveler from London to Frankfurt
**Flight:** Lufthansa LH441, delayed 4.5 hours due to technical issues
**Expected Result:** Eligible for €400 compensation under EU261

### Scenario 2: UK Flight - Eligible for £400 Compensation  
**User Profile:** Family vacation traveler
**Flight:** British Airways BA123, delayed 5 hours due to crew scheduling
**Expected Result:** Eligible for £400 compensation under UK CAA

### Scenario 3: US Domestic Flight - Limited Compensation
**User Profile:** Frequent flyer
**Flight:** American Airlines AA1234, delayed 4 hours due to weather
**Expected Result:** Limited compensation (varies by airline policy)

### Scenario 4: Short Delay - Not Eligible
**User Profile:** Weekend traveler
**Flight:** EasyJet EZY456, delayed 2 hours due to air traffic control
**Expected Result:** Not eligible (delay under 3 hours)

### Scenario 5: Extraordinary Circumstances - Not Eligible
**User Profile:** International traveler
**Flight:** KLM KL1234, delayed 6 hours due to severe weather
**Expected Result:** Not eligible (extraordinary circumstances)

---

## 📧 Sample Flight Confirmation Emails

### Email 1: Lufthansa Delay (EU261 Eligible)

```
Subject: Flight LH441 - Important Update: Delay Information

Dear Mr. Schmidt,

We regret to inform you that your flight LH441 from London Heathrow (LHR) to Frankfurt (FRA) scheduled for departure on December 15, 2024 at 14:30 has been delayed.

NEW DEPARTURE TIME: 19:00 (5.5 hours delay)

Flight Details:
- Flight Number: LH441
- Route: LHR → FRA  
- Scheduled Departure: 14:30
- Actual Departure: 19:00
- Delay Duration: 5 hours 30 minutes
- Delay Reason: Technical issues with the aircraft

We apologize for any inconvenience this may cause. Please arrive at the gate 30 minutes before the new departure time.

For compensation claims, please visit our website or contact customer service.

Best regards,
Lufthansa Customer Service
```

### Email 2: British Airways Delay (UK CAA Eligible)

```
Subject: Your British Airways flight BA123 has been delayed

Dear Sarah Johnson,

We're writing to inform you about a delay to your upcoming flight.

Flight Information:
- Flight: BA123
- Route: London Heathrow (LHR) to New York JFK (JFK)
- Date: December 20, 2024
- Original Departure: 10:30
- New Departure: 15:30
- Delay: 5 hours

Reason for delay: Crew scheduling issues

We understand this is frustrating and we're working to minimize the impact. Please check in online and arrive at the gate 45 minutes before departure.

If you're entitled to compensation under UK CAA regulations, you can claim online at ba.com/compensation.

Thank you for your patience,
British Airways Customer Relations
```

### Email 3: American Airlines Delay (US DOT - Limited)

```
Subject: Flight AA1234 Delay Notification

Dear Michael Chen,

Your American Airlines flight has been delayed due to weather conditions.

Flight Details:
- Flight: AA1234
- Route: New York JFK (JFK) to Los Angeles LAX (LAX)
- Date: December 18, 2024
- Scheduled Departure: 08:00
- Estimated Departure: 12:00
- Delay: 4 hours

Weather conditions at JFK are causing delays across all airlines. We're monitoring the situation and will provide updates every 30 minutes.

You may be eligible for compensation or assistance. Please visit aa.com/delays for more information.

We apologize for the inconvenience,
American Airlines Customer Service
```

### Email 4: EasyJet Short Delay (Not Eligible)

```
Subject: Flight EZY456 - Minor Delay

Dear Emma Wilson,

Your EasyJet flight EZY456 from London Gatwick (LGW) to Barcelona (BCN) on December 22, 2024 has been delayed by 2 hours.

New departure time: 16:30 (originally 14:30)

Delay reason: Air traffic control restrictions

We apologize for any inconvenience. Please arrive at the gate 30 minutes before departure.

EasyJet Customer Service
```

### Email 5: KLM Weather Delay (Extraordinary Circumstances)

```
Subject: Flight KL1234 - Severe Weather Delay

Dear Robert Anderson,

Due to severe weather conditions affecting Amsterdam Schiphol Airport, your flight KL1234 from Amsterdam (AMS) to London Heathrow (LHR) has been significantly delayed.

Flight Information:
- Flight: KL1234
- Route: AMS → LHR
- Date: December 25, 2024
- Original Departure: 09:00
- Estimated Departure: 15:00
- Delay: 6 hours

The delay is due to severe winter weather conditions including heavy snow and ice, which are considered extraordinary circumstances beyond our control.

We're doing everything possible to minimize the delay and will provide regular updates.

KLM Royal Dutch Airlines
```

---

## 📝 Manual Form Test Data

### Test Case 1: EU Flight (Eligible)
```json
{
  "flightNumber": "LH441",
  "airline": "Lufthansa",
  "departureDate": "2024-12-15",
  "departureAirport": "LHR",
  "arrivalAirport": "FRA",
  "delayDuration": "5 hours 30 minutes",
  "delayReason": "Technical issues with aircraft"
}
```

### Test Case 2: UK Flight (Eligible)
```json
{
  "flightNumber": "BA123",
  "airline": "British Airways",
  "departureDate": "2024-12-20",
  "departureAirport": "LHR",
  "arrivalAirport": "JFK",
  "delayDuration": "5 hours",
  "delayReason": "Crew scheduling issues"
}
```

### Test Case 3: US Flight (Limited)
```json
{
  "flightNumber": "AA1234",
  "airline": "American Airlines",
  "departureDate": "2024-12-18",
  "departureAirport": "JFK",
  "arrivalAirport": "LAX",
  "delayDuration": "4 hours",
  "delayReason": "Weather conditions"
}
```

### Test Case 4: Short Delay (Not Eligible)
```json
{
  "flightNumber": "EZY456",
  "airline": "EasyJet",
  "departureDate": "2024-12-22",
  "departureAirport": "LGW",
  "arrivalAirport": "BCN",
  "delayDuration": "2 hours",
  "delayReason": "Air traffic control restrictions"
}
```

### Test Case 5: Weather Delay (Not Eligible)
```json
{
  "flightNumber": "KL1234",
  "airline": "KLM",
  "departureDate": "2024-12-25",
  "departureAirport": "AMS",
  "arrivalAirport": "LHR",
  "delayDuration": "6 hours",
  "delayReason": "Severe weather conditions"
}
```

---

## 👤 User Profile Test Data

### User 1: Business Traveler (EU Flight)
```json
{
  "firstName": "Hans",
  "lastName": "Schmidt",
  "email": "hans.schmidt@business.com",
  "phone": "+49 30 12345678"
}
```

### User 2: Family Traveler (UK Flight)
```json
{
  "firstName": "Sarah",
  "lastName": "Johnson",
  "email": "sarah.johnson@family.com",
  "phone": "+44 20 1234 5678"
}
```

### User 3: Frequent Flyer (US Flight)
```json
{
  "firstName": "Michael",
  "lastName": "Chen",
  "email": "michael.chen@frequentflyer.com",
  "phone": "+1 555 123 4567"
}
```

### User 4: Weekend Traveler (Short Delay)
```json
{
  "firstName": "Emma",
  "lastName": "Wilson",
  "email": "emma.wilson@weekend.com",
  "phone": "+44 20 8765 4321"
}
```

### User 5: International Traveler (Weather Delay)
```json
{
  "firstName": "Robert",
  "lastName": "Anderson",
  "email": "robert.anderson@international.com",
  "phone": "+1 555 987 6543"
}
```

---

## 📄 Sample Document Names

### Boarding Pass Files
- `boarding_pass_lh441_20241215.pdf`
- `ba123_boarding_pass_20241220.jpg`
- `aa1234_boarding_pass_20241218.png`
- `ezy456_boarding_pass_20241222.pdf`
- `kl1234_boarding_pass_20241225.jpg`

### Delay Proof Files
- `lh441_delay_notification_20241215.pdf`
- `ba123_delay_email_20241220.jpg`
- `aa1234_weather_delay_20241218.png`
- `ezy456_atc_delay_20241222.pdf`
- `kl1234_weather_delay_20241225.jpg`

---

## 🧪 Testing Workflow

### Step 1: Eligibility Check
1. Use the email parsing feature with the sample emails above
2. Or manually enter the flight details from the test cases
3. Verify the eligibility results match expectations

### Step 2: Claim Submission
1. Use the user profile data to fill out personal information
2. Upload sample documents (create dummy PDFs/images)
3. Complete the payment process with test Stripe cards
4. Verify the claim is created in Airtable

### Step 3: End-to-End Testing
1. Test the complete flow from eligibility check to claim submission
2. Verify email notifications are sent
3. Check that data is properly stored in Airtable
4. Test the admin dashboard functionality

---

## 💳 Test Payment Data

### Stripe Test Cards
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Insufficient Funds:** `4000 0000 0000 9995`
- **Expired Card:** `4000 0000 0000 0069`

### Test Details
- **Expiry:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any valid ZIP code (e.g., 10001)

---

## 📊 Expected Results Summary

| Test Case | Flight | Delay | Expected Eligibility | Expected Amount | Regulation |
|-----------|--------|-------|---------------------|-----------------|------------|
| 1 | LH441 | 5.5h | ✅ Eligible | €400 | EU261 |
| 2 | BA123 | 5h | ✅ Eligible | £400 | UK CAA |
| 3 | AA1234 | 4h | ⚠️ Limited | Varies | US DOT |
| 4 | EZY456 | 2h | ❌ Not Eligible | €0 | EU261 |
| 5 | KL1234 | 6h | ❌ Not Eligible | €0 | EU261 |

---

## 🔧 Testing Tips

1. **Start with Email Parsing:** Test the AI-powered email parsing with the sample emails
2. **Test Edge Cases:** Try invalid flight numbers, future dates, and unusual delay reasons
3. **File Upload Testing:** Test with different file types and sizes
4. **Payment Testing:** Use Stripe test cards to avoid real charges
5. **Mobile Testing:** Test the responsive design on different screen sizes
6. **Error Handling:** Test what happens with network failures and invalid data

---

## 📱 Mobile Test Scenarios

Test these scenarios on mobile devices:

1. **Email Paste:** Copy-paste email content on mobile
2. **Manual Entry:** Fill out forms using mobile keyboard
3. **File Upload:** Upload photos taken with mobile camera
4. **Payment:** Complete Stripe payment on mobile
5. **Navigation:** Test the multi-step form navigation

---

This test data covers the most common real-world scenarios your users will encounter. Use it to validate that your application handles different types of flights, delays, and user profiles correctly.
