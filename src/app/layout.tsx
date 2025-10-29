import type { Metadata } from 'next'
import './globals.css'
import { PWAInstaller } from '@/components/PWAInstaller'

export const metadata: Metadata = {
  title: 'Flghtly - Flight Delay Compensation',
  description: 'Get compensation for flight delays and cancellations under EU Regulation 261/2004. We handle the entire process for you.',
  manifest: '/manifest.json',
  themeColor: '#00D9B5',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Flghtly',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Flghtly" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        {children}
        <PWAInstaller />
      </body>
    </html>
  )
}
