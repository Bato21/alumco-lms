// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Geist, Fraunces, Archivo, Playfair_Display } from 'next/font/google'
import Script from 'next/script'
import { ServiceWorkerRegistrar } from '@/components/alumco/shared/ServiceWorkerRegistrar'
import { getUserPreferences } from '@/lib/actions/preferences'
import './globals.css'

// Google Analytics (gtag.js)
const GA_ID = 'G-D6ZQY4GK0W'

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
  appleWebApp: {
    capable: true,
    title: 'Alumco',
    statusBarStyle: 'default',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Debe coincidir con manifest.ts (background_color/theme_color): instalada,
  // la barra de estado se pinta con esto y el azul cortaba con la cabecera
  // crema de la plataforma.
  themeColor: '#FCFAF6',
  // Sin cover, iOS reporta env(safe-area-inset-*) = 0 y la barra inferior
  // del PWA queda pegada al home indicator del iPhone.
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Preferencias de accesibilidad en el servidor, no en el cliente: aplicarlas
  // tras la hidratación haría parpadear la página con el tamaño equivocado,
  // justo para quien necesita el tamaño grande. Sin sesión no hay consulta.
  const prefs = await getUserPreferences()

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        data-tema="didasko"
        data-escala={prefs.font_scale}
        data-contraste={prefs.high_contrast ? 'alto' : undefined}
        // null = respetar prefers-reduced-motion del sistema (lo maneja el CSS).
        data-movimiento={
          prefs.reduced_motion === null ? undefined : prefs.reduced_motion ? 'reducido' : 'completo'
        }
        className={`${geist.variable} ${fraunces.variable} ${archivo.variable} ${playfair.variable} font-sans antialiased`}
      >
        {children}
        <ServiceWorkerRegistrar />

        {/* Google Analytics (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  )
}
