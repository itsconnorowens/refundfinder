# Quick Test Data for Manual Entry

Use this data to test the eligibility check without email parsing:

## Test Case 1: EU Flight (Should be Eligible)
- **Flight Number:** BA456
- **Airline:** British Airways  
- **Departure Date:** 2025-01-15
- **Departure Airport:** LHR
- **Arrival Airport:** CDG
- **Delay Duration:** 4 hours 45 minutes
- **Delay Reason:** Technical issues

## Test Case 2: US Flight (Limited Compensation)
- **Flight Number:** AA1234
- **Airline:** American Airlines
- **Departure Date:** 2025-01-18  
- **Departure Airport:** JFK
- **Arrival Airport:** LAX
- **Delay Duration:** 4 hours
- **Delay Reason:** Weather conditions

## Test Case 3: Short Delay (Not Eligible)
- **Flight Number:** EZY456
- **Airline:** EasyJet
- **Departure Date:** 2025-01-22
- **Departure Airport:** LGW
- **Arrival Airport:** BCN
- **Delay Duration:** 2 hours
- **Delay Reason:** Air traffic control

---

**Instructions:**
1. Go to your eligibility form
2. Click "Enter Manually" tab
3. Fill in the fields with Test Case 1 data above
4. Click "Check My Eligibility"
5. Check the Console tab for debugging logs

This will help us see if the issue is with email parsing or the manual form submission.
