import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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
}

export const runtime = 'edge';
