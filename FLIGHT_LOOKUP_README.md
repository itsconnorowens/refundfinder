# Flight Lookup and Validation System

This document explains how the dual API flight lookup system works in your refund finder application.

## Overview

The system uses both **AviationStack** and **FlightLabs** APIs in conjunction to provide reliable flight data lookup and validation. This approach offers several advantages:

- **Improved Reliability**: If one API fails, the other can still provide data
- **Data Validation**: Cross-referencing between APIs helps identify inconsistencies
- **Cost Efficiency**: Both APIs offer free tiers, reducing operational costs
- **Better Coverage**: Different APIs may have different data sources and coverage

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   AviationStack │    │   FlightLabs    │
│      API        │    │      API        │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
            ┌────────▼────────┐
            │ FlightLookupService │
            │  (Dual API)     │
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │ FlightValidation │
            │    Service      │
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │ Eligibility     │
            │   Engine       │
            └─────────────────┘
```

## API Integration

### AviationStack API
- **Free Tier**: 1,000 requests/month
- **Data Quality**: High reliability, comprehensive coverage
- **Response Time**: Fast
- **Confidence Score**: 0.8

### FlightLabs API
- **Free Tier**: 100 requests/month
- **Data Quality**: Good, slightly less reliable than AviationStack
- **Response Time**: Moderate
- **Confidence Score**: 0.7

## Data Flow

1. **Parallel API Calls**: Both APIs are called simultaneously
2. **Data Parsing**: Each API response is parsed into a standardized format
3. **Consistency Check**: Critical fields are compared between APIs
4. **Data Combination**: Best data is selected or combined based on confidence scores
5. **Validation**: Flight details are validated against user input
6. **Eligibility Check**: Compensation eligibility is determined based on regulations

## Key Features

### Dual API Strategy
- **Fallback Support**: If one API fails, the other provides data
- **Data Validation**: Cross-referencing helps identify data quality issues
- **Confidence Scoring**: Combined data gets higher confidence scores
- **Error Handling**: Comprehensive error reporting from both APIs

### Flight Validation
- **Input Validation**: Flight numbers, dates, and airport codes
- **Data Consistency**: Cross-validation between API sources
- **Historical Data**: Support for past flight lookups
- **Error Detection**: Identifies data inconsistencies and quality issues

### Eligibility Engine
- **EU Regulation 261/2004**: Full implementation for European flights
- **US Regulations**: Basic support for US flight compensation
- **Multi-jurisdiction**: Extensible for other regions
- **Compensation Calculation**: Automatic calculation based on flight distance and delay duration

## Usage Examples

### Direct Flight Lookup
```typescript
const result = await flightLookupService.lookupFlight('AA123', '2024-01-15');
if (result.success) {
  console.log('Flight found:', result.data);
  console.log('Sources used:', result.sources);
} else {
  console.log('Errors:', result.errors);
}
```

### Email Parsing
```typescript
const parseResult = await parseFlightEmail(emailContent);
if (parseResult.success) {
  const flightData = parseResult.data;
  // Process extracted flight information
}
```

### Eligibility Check
```typescript
const eligibility = await flightValidationService.validateFlightEligibility(
  'AA123',
  '2024-01-15',
  'JFK',
  'LAX',
  'user@example.com'
);
```

## API Endpoints

### POST /api/check-eligibility

**Request Body:**
```json
{
  "flightNumber": "AA123",
  "departureDate": "2024-01-15",
  "departureAirport": "JFK",
  "arrivalAirport": "LAX",
  "passengerEmail": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "flightData": {
      "flightNumber": "AA123",
      "airline": "American Airlines",
      "delayMinutes": 180,
      "isCancelled": false,
      "source": "combined",
      "confidence": 0.9
    },
    "eligibility": {
      "isEligible": true,
      "compensationAmount": 600,
      "currency": "EUR",
      "reason": "Flight was delayed by 180 minutes (3 hours)",
      "regulations": ["EU Regulation 261/2004"]
    }
  },
  "method": "flight_lookup"
}
```

## Configuration

### Environment Variables
```bash
# Required
AVIATIONSTACK_API_KEY=your_aviationstack_key
FLIGHTLABS_API_KEY=your_flightlabs_key
ANTHROPIC_API_KEY=your_anthropic_key

# Optional
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=your_airtable_base_id
```

### API Keys Setup
1. **AviationStack**: Sign up at https://aviationstack.com/
2. **FlightLabs**: Sign up at https://flightlabs.co/
3. **Anthropic**: Get API key from https://console.anthropic.com/

## Error Handling

The system provides comprehensive error handling:

- **API Failures**: Graceful degradation when APIs are unavailable
- **Data Inconsistencies**: Detection and reporting of conflicting data
- **Validation Errors**: Clear error messages for invalid inputs
- **Rate Limiting**: Proper handling of API rate limits

## Testing

Run the test suite:
```bash
npm run test
```

The test suite includes:
- Unit tests for individual components
- Integration tests for API calls
- Mock tests for error scenarios
- Data consistency validation tests

## Performance Considerations

- **Parallel API Calls**: Both APIs are called simultaneously for speed
- **Caching**: Consider implementing caching for frequently accessed flights
- **Rate Limiting**: Monitor API usage to stay within free tier limits
- **Error Recovery**: Automatic retry logic for transient failures

## Future Enhancements

1. **Additional APIs**: Integrate more flight data sources
2. **Caching Layer**: Implement Redis caching for better performance
3. **Machine Learning**: Use ML to improve data quality assessment
4. **Real-time Updates**: WebSocket support for live flight status
5. **Mobile App**: Native mobile app integration

## Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure all environment variables are set correctly
2. **Rate Limiting**: Check API usage and implement proper rate limiting
3. **Data Inconsistencies**: Review confidence scores and data validation
4. **Network Issues**: Implement proper retry logic and error handling

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=flight-lookup:*
```

This will provide detailed logs of API calls, data processing, and validation steps.

## Support

For issues or questions:
1. Check the test suite for examples
2. Review the API documentation
3. Check environment variable configuration
4. Review error logs for specific issues
