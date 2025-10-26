import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RefundFinder',
    short_name: 'Refund',
    description: 'Get flight delay compensation instantly',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#00D9B5',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['travel', 'finance', 'utilities'],
    orientation: 'portrait-primary',
    prefer_related_applications: false,
    scope: '/',
    shortcuts: [
      {
        name: 'Submit Claim',
        short_name: 'Claim',
        description: 'Submit a new compensation claim',
        url: '/claim?shortcut=true',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }],
      },
    ],
  };
}
