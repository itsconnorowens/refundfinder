# Claude API Integration - Setup Complete ✅

The Claude (Anthropic) API integration has been successfully added to your Next.js project!

## 📋 What's Included

### Core Functionality

1. **Server-side Utility Function** (`src/lib/parse-flight-email.ts`)
   - Accepts raw email strings as input
   - Uses Claude 3.5 Sonnet (latest model) for high-accuracy parsing
   - Extracts structured flight details: flight_number, airline, date, airports, times
   - Handles errors gracefully (returns `null` on failure)
   - Never exposes API key to browser (server-side only)

2. **API Endpoints**
   - `POST /api/parse-flight-email` - Parse flight emails
   - `GET /api/parse-flight-email` - Check API configuration status
   - `POST /api/test-parse` - Test with custom emails
   - `GET /api/test-parse` - Run automated tests with sample emails

3. **Type Safety**
   - Full TypeScript support with `FlightDetails` interface
   - Input validation and error handling

4. **Testing Suite** (`src/lib/test-parse-email.ts`)
   - Sample emails from United, Delta, and American Airlines
   - Performance metrics (response time)
   - Success rate tracking

## 🚀 Quick Start

### 1. Set up your API Key

Create a `.env.local` file (if you haven't already):

```bash
cp .env.example .env.local
```

Add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Get your API key:** https://console.anthropic.com/settings/keys

### 2. Start the Development Server

```bash
npm run dev
```

### 3. Test the Integration

**Option A: Run automated tests (recommended)**

Visit in your browser or use curl:
```bash
curl http://localhost:3000/api/test-parse
```

This will test the parser with 3 sample emails and return success rates.

**Option B: Test with your own email**

```bash
curl -X POST http://localhost:3000/api/parse-flight-email \
  -H "Content-Type: application/json" \
  -d '{
    "emailText": "Your flight UA1234 on United Airlines departing SFO at 8:00 AM on March 15, 2024..."
  }'
```

**Option C: Check API configuration**

```bash
curl http://localhost:3000/api/parse-flight-email
```

## 💻 Usage Examples

### From an API Route

```typescript
import { parseFlightEmail } from '@/lib/parse-flight-email';

export async function POST(request: Request) {
  const { emailText } = await request.json();
  
  // Parse the email
  const data = await parseFlightEmail(emailText);
  
  if (data) {
    // Success! Use the structured data
    console.log(`Flight ${data.flight_number} on ${data.airline}`);
    console.log(`${data.departure_airport} → ${data.arrival_airport}`);
    console.log(`Date: ${data.date}`);
  } else {
    // Parsing failed, fallback to manual entry
    console.log('Could not parse email - use manual input');
  }
}
```

### From Your Claim Submission Form

See `src/app/api/create-claim/INTEGRATION_EXAMPLE.md` for detailed examples of:
- Pre-filling forms with parsed data
- Accepting both email text and manual entry
- Handling parsing failures gracefully

## 📊 Response Format

The `parseFlightEmail` function returns:

```typescript
interface FlightDetails {
  flight_number: string;      // e.g., "UA1234"
  airline: string;             // e.g., "United Airlines"
  date: string;                // e.g., "2024-03-15"
  departure_airport: string;   // e.g., "SFO"
  arrival_airport: string;     // e.g., "JFK"
  scheduled_departure: string; // e.g., "08:00 PST"
  scheduled_arrival: string;   // e.g., "16:30 EST"
}
```

Or `null` if parsing fails.

## 🔒 Security Features

✅ API key stored in environment variables (never exposed to client)  
✅ Server-side only (`'use server-only'` directive)  
✅ Input validation and sanitization  
✅ Error logging without exposing sensitive data  
✅ Graceful failure handling  

## 💰 Cost Information

Using **Claude 3.5 Sonnet (latest)**:
- Input: ~$3 per million tokens
- Output: ~$15 per million tokens
- Typical email: ~500 tokens input + ~100 tokens output
- **Cost per parse: ~$0.003** (less than half a cent)

For high-volume applications:
- Consider caching results
- Implement rate limiting
- Switch to Claude Haiku for lower costs

## 🧪 Testing

### Run Automated Tests

```bash
# In your browser
http://localhost:3000/api/test-parse

# Expected response:
{
  "success": true,
  "summary": {
    "successCount": 3,
    "totalCount": 3,
    "successRate": 100,
    "avgDuration": 1250
  },
  "results": { ... }
}
```

### Test Individual Emails

```bash
curl -X POST http://localhost:3000/api/test-parse \
  -H "Content-Type: application/json" \
  -d '{"emailText": "Your email here..."}'
```

## 📚 Documentation

- **Integration Guide:** `src/lib/CLAUDE_INTEGRATION.md` - Comprehensive usage guide
- **Integration Examples:** `src/app/api/create-claim/INTEGRATION_EXAMPLE.md` - Real-world examples
- **Test Samples:** `src/lib/test-parse-email.ts` - Sample emails for testing

## 🐛 Troubleshooting

### "ANTHROPIC_API_KEY is not set"

**Solution:** 
1. Create `.env.local` file in project root
2. Add: `ANTHROPIC_API_KEY=your_key_here`
3. Restart the dev server: `npm run dev`

### Parsing Always Returns Null

**Check:**
1. Is your API key valid? Test at https://console.anthropic.com
2. Does your email contain flight information?
3. Do you have available credits in your Anthropic account?
4. Check server console logs for detailed error messages

### API Returns 503 Service Unavailable

**Solution:** The API key is not configured. Follow the setup steps above.

## 🎯 Next Steps

1. ✅ **Test the integration** - Visit `/api/test-parse` to verify everything works
2. ✅ **Integrate with your forms** - Add email parsing to your claim submission flow
3. ✅ **Deploy to Vercel** - The integration works seamlessly in production (add env var)
4. ⚠️ **Add rate limiting** - Protect your API from abuse in production
5. ⚠️ **Monitor usage** - Track parsing success rates and API costs

## 🔗 Resources

- **Anthropic Console:** https://console.anthropic.com
- **Claude API Docs:** https://docs.anthropic.com
- **Model Pricing:** https://www.anthropic.com/pricing
- **Next.js Environment Variables:** https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

## ✨ Features

- ✅ High-accuracy parsing using Claude 3.5 Sonnet
- ✅ Handles various email formats (United, Delta, American Airlines, etc.)
- ✅ Extracts all required flight details
- ✅ Graceful error handling with fallback to manual entry
- ✅ Server-side only (API key never exposed to browser)
- ✅ Full TypeScript support
- ✅ Comprehensive testing suite
- ✅ Production-ready

---

**Need Help?** Check the detailed documentation in:
- `src/lib/CLAUDE_INTEGRATION.md`
- `src/app/api/create-claim/INTEGRATION_EXAMPLE.md`

Happy coding! 🚀

