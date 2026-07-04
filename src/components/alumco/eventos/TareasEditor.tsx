'use client'

import { useState, useTransition } from 'react'
import { AlertCircle } from 'lucide-react'
import { createTaskAction, toggleTaskAction, deleteTaskAction } from '@/lib/actions/events'
import { Icono, Progreso } from '@/components/alumco/ds'
import { AREAS_TRABAJO, type EventTask } from '@/lib/types/database'

type TaskRow = EventTask & { assigned_name: string | null }
type Worker = { id: string; full_name: string; area_trabajo: string[] }

export function TareasEditor({ eventId, tasks, workers, jefeAreas, isAdmin }: {
  eventId: string
  tasks: TaskRow[]
  workers: Worker[]
  jefeAreas: string[]
  isAdmin: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const areasDisponibles = isAdmin ? AREAS_TRABAJO : AREAS_TRABAJO.filter(a => jefeAreas.includes(a))
  const done = tasks.filter(t => t.is_done).length

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    setError(null)
    startTransition(async () => {
      const res = await createTaskAction(eventId, formData)
      if (res.error) setError(res.error)
      else form.reset()
    })
  }

  function onToggle(taskId: string) {
    setError(null)
    startTransition(async () => {
      const res = await toggleTaskAction(taskId)
      if (res.error) setError(res.error)
    })
  }

  function onDelete(taskId: string) {
    setError(null)
    startTransition(async () => {
      const res = await deleteTaskAction(taskId)
      if (res.error) setError(res.error)
    })
  }

  return (
    <section className="card card-pad col entra" style={{ gap: 16 }}>
      <div className="fila" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 16.5 }}>To-do list</h2>
        {tasks.length > 0 && (
          <span className="texto-s silencio-3">{done} de {tasks.length} listas</span>
        )}
      </div>

      {tasks.length > 0 && (
        <Progreso pct={Math.round((done / tasks.length) * 100)} />
      )}

      {tasks.length === 0 && <p className="silencio texto-s">Sin tareas todavía.</p>}

      <ul className="col" style={{ gap: 8 }}>
        {tasks.map(t => {
          const puedeGestionar = isAdmin || jefeAreas.includes(t.area)
          return (
            <li key={t.id} className="fila" style={{ gap: 10 }}>
              <input
                type="checkbox"
                checked={t.is_done}
                onChange={() => onToggle(t.id)}
                disabled={pending}
                style={{ width: 18, height: 18, accentColor: 'var(--ambar)' }}
                aria-label={`Marcar ${t.title}`}
              />
              <span className={t.is_done ? 'silencio-3' : ''} style={t.is_done ? { textDecoration: 'line-through' } : undefined}>
                {t.title}
              </span>
              <span className="texto-s silencio-3" style={{ marginLeft: 'auto' }}>
                {t.area}{t.assigned_name ? ` · ${t.assigned_name}` : ''}
              </span>
              {puedeGestionar && (
                <button
                  type="button"
                  onClick={() => onDelete(t.id)}
                  disabled={pending}
                  className="btn btn-ghost btn-sm btn-icon"
                  aria-label={`Eliminar ${t.title}`}
                >
                  <Icono n="basura" s={16} />
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {areasDisponibles.length > 0 && (
        <form
          onSubmit={onAdd}
          className="fila"
          style={{ gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--arena-200)', paddingTop: 16 }}
        >
          <input
            name="title"
            required
            minLength={3}
            disabled={pending}
            placeholder="Nueva tarea…"
            className="input crece"
            style={{ minWidth: 200 }}
            aria-label="Título de la tarea"
          />
          <select name="area" required disabled={pending} className="select" aria-label="Área" defaultValue={areasDisponibles[0]}>
            {areasDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select name="assigned_to" disabled={pending} className="select" aria-label="Asignar a" defaultValue="">
            <option value="">Sin asignar</option>
            {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
          </select>
          <button type="submit" disabled={pending} className="btn btn-primary">Agregar</button>
        </form>
      )}

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
    </section>
  )
}
