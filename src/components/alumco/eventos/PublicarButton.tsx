'use client'

import { useState, useTransition } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { publishEventAction, finalizeEventAction } from '@/lib/actions/events'
import type { EventStatus } from '@/lib/types/database'

export function PublicarButton({ eventId, status, hasDocAlimentacion }: {
  eventId: string
  status: EventStatus
  hasDocAlimentacion: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (status === 'finalizado') return null

  const publicar = status === 'planificacion'
  const disabled = pending || (publicar && !hasDocAlimentacion)

  function onClick() {
    setError(null)
    startTransition(async () => {
      const res = publicar ? await publishEventAction(eventId) : await finalizeEventAction(eventId)
      if (res.error) setError(res.error)
    })
  }

  return (
    <div className="col" style={{ alignItems: 'flex-end', gap: 6 }}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="btn btn-primary btn-lg"
        aria-busy={pending}
        title={publicar && !hasDocAlimentacion ? 'Falta el documento de dificultades alimenticias' : undefined}
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Guardando…
          </>
        ) : publicar ? 'Publicar evento' : 'Finalizar evento'}
      </button>
      {publicar && !hasDocAlimentacion && (
        <p className="texto-s" style={{ color: 'var(--aviso)', maxWidth: 260, textAlign: 'right' }}>
          Sube el documento de dificultades alimenticias para publicar
        </p>
      )}
      {error && (
        <p role="alert" className="texto-s fila" style={{ color: 'var(--peligro)', gap: 6 }}>
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}
