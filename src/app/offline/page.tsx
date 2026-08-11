import type { Metadata } from 'next'
import { Gota } from '@/components/alumco/ds'

export const metadata: Metadata = { title: 'Sin conexión' }

// Pantalla que el service worker sirve cuando una navegación falla por falta
// de red. Es estática y sin datos de usuario a propósito: es lo único de HTML
// que se cachea, porque el resto depende de auth y RLS.
export default function OfflinePage() {
  return (
    <main id="contenido-principal" tabIndex={-1} className="paleta-azul min-h-screen flex items-center justify-center px-6">
      <div className="col" style={{ gap: 18, maxWidth: 420, textAlign: 'center', alignItems: 'center' }}>
        <Gota s={44} />

        <h1 className="t-display" style={{ fontSize: 27 }}>Sin conexión</h1>

        <p className="silencio" style={{ fontSize: 16, lineHeight: 1.5 }}>
          No pudimos cargar esta página porque el teléfono no tiene internet.
          Tus cursos siguen guardados: vuelve a intentarlo cuando tengas señal.
        </p>

        <a href="/inicio" className="btn btn-primary btn-lg" style={{ marginTop: 4 }}>
          Reintentar
        </a>
      </div>
    </main>
  )
}
