import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans, Manrope } from 'next/font/google'
import './globals.css'

// IBM Plex Sans for headings
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
})

// Manrope for body text and UI
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Intake Form | ThinkSid',
  description: 'Mobile-first voice-enabled intake form for agricultural consulting',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1C1C60',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${manrope.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
