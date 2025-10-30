import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Vercel provides geo information in headers
  const country = request.geo?.country || request.headers.get('x-vercel-ip-country') || null;
  const city = request.geo?.city || request.headers.get('x-vercel-ip-city') || null;
  const region = request.geo?.region || request.headers.get('x-vercel-ip-country-region') || null;

  return NextResponse.json({
    country,
    city,
    region,
  });
}

export const runtime = 'edge';
