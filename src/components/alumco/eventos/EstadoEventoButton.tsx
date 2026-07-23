'use client'

import { useState, useTransition } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { updateEventAction } from '@/lib/actions/events'
import type { EventStatus } from '@/lib/types/database'

// Solo dos transiciones hacia adelante están permitidas por el guard del
// server action (updateEventAction): planificacion→activo y activo→
// finalizado. 'finalizado' no tiene siguiente estado — el botón desaparece.
const NEXT_STATUS: Partial<Record<EventStatus, EventStatus>> = {
  planificacion: 'activo',
  activo: 'finalizado',
}

const LABEL: Partial<Record<EventStatus, string>> = {
  planificacion: 'Activar evento',
  activo: 'Finalizar evento',
}

const CONFIRM_MESSAGE: Partial<Record<EventStatus, string>> = {
  planificacion: '¿Activar este evento? No podrás volver a "En planificación".',
  activo: '¿Finalizar este evento? Esta acción no se puede deshacer.',
}

export function EstadoEventoButton({ eventId, status }: {
  eventId: string
  status: EventStatus
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const next = NEXT_STATUS[status]
  if (!next) return null

  function onClick() {
    if (!window.confirm(CONFIRM_MESSAGE[status] ?? '¿Confirmas el cambio de estado del evento?')) return
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('status', next as EventStatus)
      const res = await updateEventAction(eventId, formData)
      if (res.error) setError(res.error)
    })
  }

  return (
    <div className="col" style={{ alignItems: 'flex-end', gap: 6 }}>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="btn btn-primary btn-lg"
        aria-busy={pending}
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Guardando…
          </>
        ) : LABEL[status]}
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
