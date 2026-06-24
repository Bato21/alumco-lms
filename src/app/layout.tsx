// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Geist, Fraunces, Archivo, Playfair_Display } from 'next/font/google'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})

// Serif Didone alto-contraste para el hero de la landing (look estilo Giga).
const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif-display',
})

// Serif display para titulares grandes (login, heros "agua"). Cuerpo sigue en Geist.
const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
})

// Display del tema DIDASKO: Archivo (mayúsculas, peso alto).
const archivo = Archivo({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['500', '600', '700', '800', '900'],
  variable: '--font-archivo',
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
      <body
        data-tema="didasko"
        className={`${geist.variable} ${fraunces.variable} ${archivo.variable} ${playfair.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  )
}