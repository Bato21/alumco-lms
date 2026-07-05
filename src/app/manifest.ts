import type { MetadataRoute } from 'next'

// PWA: permite instalar la plataforma en el teléfono (ícono en pantalla de
// inicio, abre standalone sin barra del navegador). Next lo sirve en
// /manifest.webmanifest y lo enlaza solo.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alumco LMS',
    short_name: 'Alumco',
    description: 'Plataforma de capacitación continua para trabajadores ELEAM',
    start_url: '/inicio',
    display: 'standalone',
    background_color: '#FCFAF6',
    theme_color: '#FCFAF6',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
