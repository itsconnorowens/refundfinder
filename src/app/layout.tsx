import type { Metadata } from 'next'
import './globals.css'
import { PWAInstaller } from '@/components/PWAInstaller'
import { PostHogProvider, PostHogPageView } from '@/components/PostHogProvider'
import { Suspense } from 'react'
import { Toaster } from 'sonner'

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
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          {children}
          <PWAInstaller />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
              },
              className: 'sonner-toast',
              duration: 4000,
            }}
            richColors
          />
        </PostHogProvider>
      </body>
    </html>
  )
}
