'use client'

import { useState, useTransition } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { getDocumentSignedUrlAction } from '@/lib/actions/events'

// Botón chico y autónomo: firma el documento (60 s) y lo abre en una
// pestaña nueva. Vive en su propio archivo porque necesita 'use client'
// (hooks) mientras el componente que lo usa (EventoDashboardCard) es un
// server component async.
export function AbrirDocumentoBoton({ docId, label }: { docId: string; label: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    setError(null)
    startTransition(async () => {
      const res = await getDocumentSignedUrlAction(docId)
      if (res.error || !res.url) {
        setError(res.error ?? 'No se pudo abrir el documento')
      } else {
        window.open(res.url, '_blank', 'noopener')
      }
    })
  }

  return (
    <div className="col" style={{ gap: 6, alignItems: 'flex-start' }}>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="btn btn-secondary btn-sm"
        aria-busy={pending}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {label}
      </button>
      {error && (
        <p role="alert" className="texto-s fila" style={{ color: 'var(--peligro)', gap: 6 }}>
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
