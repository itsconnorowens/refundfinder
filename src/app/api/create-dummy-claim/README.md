# Create Dummy Claim API

This API endpoint creates a new claim record in your Airtable "Claims" table.

## Endpoints

### Create Claim
```
POST /api/create-dummy-claim
```

### Get All Claims
```
GET /api/create-dummy-claim
```

## Environment Variables

Before using this API, set up your Airtable credentials in `.env.local`:

```bash
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
AIRTABLE_CLAIMS_TABLE_NAME=Claims
```

### Getting Your Airtable Credentials

1. **API Key**: Visit [https://airtable.com/account](https://airtable.com/account) and generate a personal access token
2. **Base ID**: Go to [https://airtable.com/api](https://airtable.com/api), select your base, and find the Base ID in the introduction section

## Request Body

```json
{
  "user_name": "John Doe",
  "user_email": "john.doe@example.com",
  "flight_number": "AA123",
  "flight_date": "2024-01-15",
  "airline": "American Airlines",
  "delay_minutes": 180,
  "status": "pending"
}
```

### Required Fields

- `user_name` (string): Full name of the user
- `flight_number` (string): Flight number
- `flight_date` (string): Date of the flight (ISO format: YYYY-MM-DD)
- `airline` (string): Airline name
- `delay_minutes` (number): Number of minutes the flight was delayed
- `status` (string): Status of the claim. **Must be one of:** `pending`, `paid`, `filed`, or `archived`

### Optional Fields

- `user_email` (string): Email address of the user
- `claim_id` (string): Custom claim identifier if you want to track your own IDs (otherwise Airtable record ID is used)

## Response

### Success (201)

```json
{
  "success": true,
  "claim_id": "recXXXXXXXXXXXXXX"
}
```

**Note:** `claim_id` is the Airtable record ID - this is the primary identifier for the claim.

### Error (400 or 500)

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Example Usage

### Using fetch (JavaScript)

```javascript
const response = await fetch('/api/create-dummy-claim', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    user_name: 'John Doe',
    user_email: 'john.doe@example.com',
    flight_number: 'DL456',
    flight_date: '2024-01-15',
    airline: 'Delta Airlines',
    delay_minutes: 240,
    status: 'pending',
  }),
});

const data = await response.json();
console.log(data); // { success: true, claim_id: "recXXXXXXXXXXXXXX" }
```

### Using curl (POST - Create Claim)

```bash
curl -X POST http://localhost:3000/api/create-dummy-claim \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "John Doe",
    "user_email": "john.doe@example.com",
    "flight_number": "DL456",
    "flight_date": "2024-01-15",
    "airline": "Delta Airlines",
    "delay_minutes": 240,
    "status": "pending"
  }'
```

### Using curl (GET - Read All Claims)

```bash
curl -X GET http://localhost:3000/api/create-dummy-claim
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "claims": [
    {
      "id": "recXXXXXXXXXXXXXX",
      "fields": {
        "user_name": "John Doe",
        "user_email": "user@example.com",
        "flight_number": "AA123",
        "flight_date": "2024-01-15",
        "airline": "American Airlines",
        "delay_minutes": 180,
        "status": "pending"
      },
      "created_time": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

## Airtable Table Structure

Make sure your Airtable "Claims" table has the following fields:

### Required Fields:
- `user_name` (Single line text) - Full name of the user
- `user_email` (Single line text or Email) - Email address (optional)
- `claim_id` (Single line text) - Custom claim identifier (optional - Airtable record ID is used by default)
- `flight_number` (Single line text) - Flight number
- `flight_date` (Date) - Date of the flight
- `airline` (Single line text) - Airline name
- `delay_minutes` (Number) - Minutes of delay
- `status` (Single select) - Must have these four options pre-defined: `pending`, `paid`, `filed`, `archived`

### Recommended Fields:
- `created_at` (Created time) - Airtable's built-in "Created time" field type that auto-populates

**Important:** 
- The `status` field must be a "Single select" field type in Airtable with the four options (`pending`, `paid`, `filed`, `archived`) pre-configured.
- The `flight_date` should be a "Date" field type.
- The `created_at` should be Airtable's "Created time" field type (auto-populates, not sent via API).

## Error Handling

All errors are logged to the console with detailed information. Check your server logs if you encounter issues.

