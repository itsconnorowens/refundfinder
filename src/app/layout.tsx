import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RefundFinder - Flight Delay Compensation',
  description: 'Get compensation for flight delays and cancellations under EU Regulation 261/2004. We handle the entire process for you.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
