'use client'

// Edición de datos del evento + eliminación (solo admin). La sede no se
// edita: las secciones ya tienen miembros de esa sede — mover el evento de
// residencia dejaría equipos inconsistentes. Si se necesita, se crea otro.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateEventAction, deleteEventAction } from '@/lib/actions/events'
import { EVENT_TYPE_LABELS, EVENT_TYPE_EMOJI, type EventRecord, type EventType } from '@/lib/types/database'

export function EditarEventoPanel({ event }: { event: EventRecord }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false)
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

  function onEliminar() {
    setError(null)
    startTransition(async () => {
      const res = await deleteEventAction(event.id)
      if (res.error) {
        setError(res.error)
        setConfirmandoBorrado(false)
        return
      }
      router.push('/admin/eventos')
    })
  }

  return (
    <section className="card card-pad col entra" style={{ gap: 14 }}>
      <div className="fila" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: 16.5 }}>Editar evento</h2>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => { setAbierto(a => !a); setGuardado(false); setError(null) }}
        >
          {abierto ? 'Cerrar' : 'Editar datos'}
        </button>
      </div>

      {abierto && (
        <form onSubmit={onGuardar} className="col" style={{ gap: 14 }}>
          <div className="campo">
            <label htmlFor="edit-title">Título</label>
            <input id="edit-title" name="title" required minLength={3} defaultValue={event.title} className="input" disabled={pending} />
          </div>

          <div className="fila" style={{ gap: 14, flexWrap: 'wrap' }}>
            <div className="campo" style={{ flex: 1, minWidth: 180 }}>
              <label htmlFor="edit-type">Celebración</label>
              <select id="edit-type" name="event_type" defaultValue={event.event_type} className="select" disabled={pending}>
                {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map(t => (
                  <option key={t} value={t}>{EVENT_TYPE_EMOJI[t]} {EVENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="campo" style={{ flex: 1, minWidth: 180 }}>
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
        </form>
      )}

      {/* Zona de peligro: borrar elimina secciones, tareas, documentos y
          fotos del evento (cascade). Confirmación en dos pasos. */}
      <div className="fila" style={{ gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--arena-200)', paddingTop: 14 }}>
        {!confirmandoBorrado ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--peligro)' }}
            onClick={() => setConfirmandoBorrado(true)}
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
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmandoBorrado(false)} disabled={pending}>
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
