'use client'

// Controles de administración del evento, en dos piezas:
// - EditarEventoControl: botón "Editar datos" junto a "Activar evento" en el
//   encabezado; abre un modal con el form. La sede no se edita: las secciones
//   ya tienen equipos de esa sede — si cambia la residencia, se crea otro evento.
// - EliminarEventoZona: zona de peligro al final de la página (patrón común),
//   confirmación en dos pasos.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateEventAction, deleteEventAction } from '@/lib/actions/events'
import { EVENT_TYPE_LABELS, EVENT_TYPE_EMOJI, type EventRecord, type EventType } from '@/lib/types/database'

export function EditarEventoControl({ event }: { event: EventRecord }) {
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [pending, startTransition] = useTransition()

  function onGuardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    setGuardado(false)
    startTransition(async () => {
      const res = await updateEventAction(event.id, formData)
      if (res.error) setError(res.error)
      else setGuardado(true)
    })
  }

  return (
    <>
      <button type="button" className="btn btn-ghost" onClick={() => { setAbierto(true); setGuardado(false); setError(null) }}>
        Editar datos
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Telón decorativo; el cierre accesible es el botón «Cerrar». */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { if (!pending) setAbierto(false) }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Editar evento"
            className="card card-pad col relative"
            style={{ gap: 14, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="fila" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16.5 }}>Editar evento</h2>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAbierto(false)} disabled={pending}>
                Cerrar
              </button>
            </div>

            <form onSubmit={onGuardar} className="col" style={{ gap: 14 }}>
              <div className="campo">
                <label htmlFor="edit-title">Título</label>
                <input id="edit-title" name="title" required minLength={3} defaultValue={event.title} className="input" disabled={pending} />
              </div>

              <div className="fila" style={{ gap: 14, flexWrap: 'wrap' }}>
                <div className="campo" style={{ flex: 1, minWidth: 160 }}>
                  <label htmlFor="edit-type">Celebración</label>
                  <select id="edit-type" name="event_type" defaultValue={event.event_type} className="select" disabled={pending}>
                    {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map(t => (
                      <option key={t} value={t}>{EVENT_TYPE_EMOJI[t]} {EVENT_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div className="campo" style={{ flex: 1, minWidth: 160 }}>
                  <label htmlFor="edit-date">Fecha</label>
                  <input id="edit-date" name="event_date" type="date" required defaultValue={event.event_date} className="input" disabled={pending} />
                </div>
              </div>

              <div className="campo">
                <label htmlFor="edit-desc">Descripción</label>
                <textarea id="edit-desc" name="description" rows={3} defaultValue={event.description} className="textarea" disabled={pending} />
              </div>

              <div className="fila" style={{ gap: 10, flexWrap: 'wrap' }}>
                <button type="submit" disabled={pending} className="btn btn-primary">
                  {pending ? 'Guardando…' : 'Guardar cambios'}
                </button>
                {guardado && <span className="badge badge-info">Cambios guardados</span>}
              </div>

              {error && (
                <p role="alert" className="texto-s" style={{ color: 'var(--peligro)', fontWeight: 600 }}>{error}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export function EliminarEventoZona({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onEliminar() {
    setError(null)
    startTransition(async () => {
      const res = await deleteEventAction(eventId)
      if (res.error) {
        setError(res.error)
        setConfirmando(false)
        return
      }
      router.push('/admin/eventos')
    })
  }

  return (
    <section
      className="card card-pad col entra"
      style={{ gap: 12, border: '1px solid var(--peligro)', borderStyle: 'dashed' }}
    >
      <h2 style={{ fontSize: 15, color: 'var(--peligro)' }}>Zona de peligro</h2>

      <div className="fila" style={{ gap: 10, flexWrap: 'wrap' }}>
        {!confirmando ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--peligro)' }}
            onClick={() => setConfirmando(true)}
            disabled={pending}
          >
            Eliminar evento…
          </button>
        ) : (
          <>
            <span className="texto-s" style={{ color: 'var(--peligro)', fontWeight: 700 }}>
              Se borra el evento con sus secciones, tareas, documentos y fotos. No se puede deshacer.
            </span>
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: 'var(--peligro)', color: '#fff' }}
              onClick={onEliminar}
              disabled={pending}
            >
              {pending ? 'Eliminando…' : 'Sí, eliminar definitivamente'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmando(false)} disabled={pending}>
              Cancelar
            </button>
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="texto-s" style={{ color: 'var(--peligro)', fontWeight: 600 }}>{error}</p>
      )}
    </section>
  )
}
