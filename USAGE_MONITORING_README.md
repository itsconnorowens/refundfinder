# API Usage Monitoring System

A comprehensive monitoring system to track API usage and enforce free tier limits for AviationStack and Anthropic APIs.

## 🚀 Features

### Core Monitoring
- **Real-time Usage Tracking**: Monitor API requests in real-time
- **Free Tier Limits**: Enforce AviationStack (100 requests/month) and Anthropic ($5 credit/month) limits
- **Automatic Blocking**: Cut off API access when limits are exceeded
- **Monthly Reset**: Automatic usage reset at the beginning of each month
- **Alert System**: Configurable alerts at 75%, 90%, and 100% usage thresholds

### Dashboard & Management
- **Usage Dashboard**: Visual dashboard at `/usage` showing current usage, limits, and alerts
- **API Endpoints**: RESTful API for usage monitoring and management
- **Real-time Updates**: Dashboard refreshes every 30 seconds
- **Usage Controls**: Reset usage, clear alerts, and update configuration

## 📊 Usage Limits

### AviationStack API
- **Free Tier**: 100 requests per month
- **Alert Thresholds**: 75%, 90%, 100%
- **Blocking**: Automatic when limit exceeded

### Anthropic API
- **Free Tier**: $5 credit per month (estimated)
- **Cost per Request**: ~$0.01 (estimated)
- **Alert Thresholds**: 75%, 90%, 100%
- **Blocking**: Automatic when limit exceeded

## 🛠️ Implementation

### Core Components

#### 1. Usage Monitor Service (`src/lib/usage-monitor.ts`)
```typescript
import { usageMonitor } from './usage-monitor';

// Record API usage
const result = await usageMonitor.recordUsage('aviationstack', 1);

// Get usage information
const usage = usageMonitor.getUsage('aviationstack');
const allUsage = usageMonitor.getAllUsage();

// Get usage summary
const summary = usageMonitor.getUsageSummary();
```

#### 2. Usage Middleware (`src/lib/usage-middleware.ts`)
```typescript
import { usageMiddleware } from './usage-middleware';

// Check usage before API call
const usageCheck = await usageMiddleware.checkUsage({
  apiName: 'aviationstack',
  requestCount: 1,
  blockOnLimit: true,
  logUsage: true,
});

if (!usageCheck.allowed) {
  // Handle blocked request
  return { error: 'API usage limit exceeded' };
}
```

#### 3. API Integration
Both flight lookup and email parsing services automatically check usage limits before making API calls:

```typescript
// In flight-apis.ts
const usageCheck = await usageMiddleware.checkUsage({
  apiName: 'aviationstack',
  requestCount: 1,
  blockOnLimit: true,
  logUsage: true,
});

// In parse-flight-email.ts
const usageCheck = await usageMiddleware.checkUsage({
  apiName: 'anthropic',
  requestCount: 1,
  blockOnLimit: true,
  logUsage: true,
});
```

## 📡 API Endpoints

### GET `/api/usage`
Get current usage information.

**Query Parameters:**
- `api` (optional): Specific API name (aviationstack, anthropic)
- `alerts` (optional): Include recent alerts (true/false)
- `hours` (optional): Hours of alerts to include (default: 24)

**Response:**
```json
{
  "success": true,
  "usage": [
    {
      "apiName": "aviationstack",
      "requests": 45,
      "month": "2025-10",
      "lastReset": "2025-10-01T00:00:00.000Z",
      "limit": 100,
      "isBlocked": false
    }
  ],
  "summary": {
    "totalRequests": 45,
    "totalLimit": 105,
    "overallPercentage": 43,
    "blockedAPIs": [],
    "recentAlerts": []
  }
}
```

### POST `/api/usage`
Manage usage monitoring.

**Actions:**
- `reset`: Reset usage for specific API
- `updateConfig`: Update configuration
- `clearAlerts`: Clear all alerts

**Examples:**
```bash
# Reset AviationStack usage
curl -X POST /api/usage \
  -H "Content-Type: application/json" \
  -d '{"action": "reset", "apiName": "aviationstack"}'

# Update configuration
curl -X POST /api/usage \
  -H "Content-Type: application/json" \
  -d '{"action": "updateConfig", "config": {"aviationStack": {"freeTierLimit": 150}}}'

# Clear alerts
curl -X POST /api/usage \
  -H "Content-Type: application/json" \
  -d '{"action": "clearAlerts"}'
```

## 🎛️ Dashboard

Access the usage dashboard at `http://localhost:3000/usage` to:

- View real-time usage statistics
- Monitor API limits and percentages
- See blocked APIs and alerts
- Reset usage and clear alerts
- Update configuration

### Dashboard Features
- **Summary Cards**: Total requests, usage percentage, blocked APIs
- **Usage Table**: Detailed breakdown by API
- **Progress Bars**: Visual representation of usage
- **Alert Management**: View and clear recent alerts
- **Auto-refresh**: Updates every 30 seconds

## ⚙️ Configuration

### Environment Variables
```bash
# Required API keys
AVIATIONSTACK_API_KEY=your_aviationstack_key
ANTHROPIC_API_KEY=your_anthropic_key

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Usage Configuration
```typescript
const config = {
  aviationStack: {
    freeTierLimit: 100,        // Requests per month
    alertThresholds: [75, 90, 100]  // Alert percentages
  },
  anthropic: {
    freeTierLimit: 5,          // $5 credit per month
    alertThresholds: [75, 90, 100],  // Alert percentages
    costPerRequest: 0.01       // Estimated cost per request
  }
};
```

## 🔧 Customization

### Adding New APIs
1. Add API configuration to `UsageConfig` interface
2. Initialize usage tracking in `UsageMonitorService`
3. Add usage checks to API calls
4. Update dashboard if needed

### Changing Alert Behavior
Currently set to **block on limit exceeded**. To change to **alert only**:

```typescript
// In usage-middleware.ts
const usageCheck = await usageMiddleware.checkUsage({
  apiName: 'aviationstack',
  requestCount: 1,
  blockOnLimit: false,  // Change to false
  logUsage: true,
});
```

### Custom Alert Callbacks
```typescript
import { usageMiddleware } from './usage-middleware';

// Add custom alert handler
usageMiddleware.addAlertCallback((alert) => {
  console.log(`Alert: ${alert.message}`);
  // Send email, Slack notification, etc.
});
```

## 📈 Monitoring Best Practices

1. **Regular Monitoring**: Check usage dashboard regularly
2. **Set Alerts**: Configure appropriate alert thresholds
3. **Monitor Trends**: Watch for unusual usage patterns
4. **Plan Upgrades**: Consider paid plans before hitting limits
5. **Cache Responses**: Implement caching to reduce API calls
6. **Batch Requests**: Combine multiple requests when possible

## 🚨 Troubleshooting

### Common Issues

**API Blocked Despite Low Usage**
- Check if usage was reset recently
- Verify configuration limits
- Check for multiple instances running

**Usage Not Updating**
- Ensure middleware is properly integrated
- Check for errors in API calls
- Verify usage service is initialized

**Dashboard Not Loading**
- Check if server is running
- Verify API endpoints are accessible
- Check browser console for errors

### Debug Commands
```bash
# Check usage via API
curl http://localhost:3000/api/usage

# Test specific API
curl http://localhost:3000/api/usage?api=aviationstack

# Reset usage
curl -X POST http://localhost:3000/api/usage \
  -H "Content-Type: application/json" \
  -d '{"action": "reset", "apiName": "aviationstack"}'
```

## 🔮 Future Enhancements

- **Database Persistence**: Store usage data in database
- **Advanced Analytics**: Usage trends and predictions
- **Email Notifications**: Send alerts via email
- **Slack Integration**: Send alerts to Slack channels
- **Usage Reports**: Generate monthly usage reports
- **Cost Tracking**: More accurate cost estimation
- **Rate Limiting**: Implement per-minute/hour limits
- **Usage Quotas**: Set custom quotas per user/tenant

## 📝 License

This usage monitoring system is part of the RefundFinder application and follows the same license terms.
