import { NextRequest, NextResponse } from 'next/server';
import { withErrorTracking } from '@/lib/error-tracking';

export const GET = withErrorTracking(async (request: NextRequest) => {
  // Vercel provides geo information in headers
  // Type assertion for the geo property which is added by Vercel Edge runtime
  const req = request as NextRequest & { geo?: { country?: string; city?: string; region?: string } };

  const country = req.geo?.country || request.headers.get('x-vercel-ip-country') || null;
  const city = req.geo?.city || request.headers.get('x-vercel-ip-city') || null;
  const region = req.geo?.region || request.headers.get('x-vercel-ip-country-region') || null;

  return NextResponse.json({
    country,
    city,
    region,
  });
}, {
  route: '/api/geo',
  tags: { service: 'geolocation', operation: 'get_location' }
});

export const runtime = 'edge';
