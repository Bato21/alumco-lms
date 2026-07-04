'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { createEventAction } from '@/lib/actions/events'
import { EVENT_TYPE_LABELS, type EventType } from '@/lib/types/database'

export function CrearEventoForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const res = await createEventAction(formData)
      if (res.error) {
        setError(res.error)
        return
      }
      router.push(`/admin/eventos/${res.eventId}`)
    })
  }

  return (
    <form onSubmit={onSubmit} className="card card-pad col entra" style={{ gap: 16 }}>
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="fila"
          style={{ gap: 10, padding: '12px 14px', borderRadius: 'var(--radio-m)', background: 'var(--peligro-bg)', color: 'var(--peligro)', border: '2px solid var(--peligro)', boxShadow: '3px 3px 0 var(--peligro)', fontSize: 14.5, fontWeight: 600 }}
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="campo">
        <label htmlFor="title">Título</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          minLength={3}
          disabled={pending}
          placeholder="Fiestas Patrias 2026"
          className="input"
        />
      </div>

      <div className="campo">
        <label htmlFor="event_type">Celebración</label>
        <select id="event_type" name="event_type" required disabled={pending} className="select" defaultValue="">
          <option value="" disabled>Selecciona una celebración…</option>
          {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="event_date">Fecha del evento</label>
        <input id="event_date" name="event_date" type="date" required disabled={pending} className="input" />
      </div>

      <div className="campo">
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          name="description"
          required
          minLength={10}
          rows={4}
          disabled={pending}
          placeholder="Qué se celebra, dónde, consideraciones generales…"
          className="textarea"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary btn-lg"
        style={{ width: '100%' }}
        aria-busy={pending}
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Creando…
          </>
        ) : (
          'Crear evento (borrador)'
        )}
      </button>
    </form>
  )
}
