// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: {
    default: 'Alumco LMS',
    template: '%s | Alumco LMS',
  },
  description: 'Plataforma de capacitación continua para trabajadores ELEAM',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a56a4',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geist.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}