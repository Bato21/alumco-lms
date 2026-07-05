'use client'

import { useState, useTransition } from 'react'
import { AlertCircle } from 'lucide-react'
import { upsertTaskAction, toggleTaskStatusAction, deleteTaskAction } from '@/lib/actions/events'
import { Icono, Progreso } from '@/components/alumco/ds'
import type { EventTask } from '@/lib/types/database'

interface SectionTasks {
  id: string
  name: string
  tasks: EventTask[]
}

// Tareas agrupadas por sección. El status real tiene 3 valores
// ('pendiente'|'en_progreso'|'completada') pero la UI v2 usa un checkbox
// binario: marcar = 'completada', desmarcar = 'pendiente' (nunca vuelve a
// 'en_progreso' desde acá). Editar título inline queda fuera de alcance
// (YAGNI) — solo crear, marcar y eliminar.
export function TareasEditor({ sections, isAdmin }: {
  sections: SectionTasks[]
  isAdmin: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onAdd(sectionId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    setError(null)
    startTransition(async () => {
      const res = await upsertTaskAction(sectionId, formData)
      if (res.error) setError(res.error)
      else form.reset()
    })
  }

  function onToggle(taskId: string, currentStatus: EventTask['status']) {
    const next = currentStatus === 'completada' ? 'pendiente' : 'completada'
    setError(null)
    startTransition(async () => {
      const res = await toggleTaskStatusAction(taskId, next)
      if (res.error) setError(res.error)
    })
  }

  function onDelete(taskId: string, title: string) {
    if (!window.confirm(`¿Eliminar la tarea "${title}"?`)) return
    setError(null)
    startTransition(async () => {
      const res = await deleteTaskAction(taskId)
      if (res.error) setError(res.error)
    })
  }

  const totalTareas = sections.reduce((acc, s) => acc + s.tasks.length, 0)

  return (
    <section className="card card-pad col entra" style={{ gap: 20 }}>
      <h2 style={{ fontSize: 16.5 }}>Tareas por sección</h2>

      {sections.length === 0 && <p className="silencio texto-s">Aún no hay secciones para asignar tareas.</p>}
      {sections.length > 0 && totalTareas === 0 && <p className="silencio texto-s">Sin tareas todavía.</p>}

      <ul className="col" style={{ gap: 18 }}>
        {sections.map(s => {
          const done = s.tasks.filter(t => t.status === 'completada').length
          return (
            <li
              key={s.id}
              className="col"
              style={{ gap: 10, border: '1px solid var(--arena-200)', borderRadius: 'var(--radio-m)', padding: 14 }}
            >
              <div className="fila" style={{ justifyContent: 'space-between' }}>
                <p style={{ fontWeight: 600 }}>{s.name}</p>
                {s.tasks.length > 0 && (
                  <span className="texto-s silencio-3">{done}/{s.tasks.length}</span>
                )}
              </div>

              {s.tasks.length > 0 && <Progreso pct={Math.round((done / s.tasks.length) * 100)} alto={6} />}

              {s.tasks.length === 0 ? (
                <p className="texto-s silencio-3">Sin tareas en esta sección.</p>
              ) : (
                <ul className="col" style={{ gap: 8 }}>
                  {s.tasks.map(t => (
                    <li key={t.id} className="fila" style={{ gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={t.status === 'completada'}
                        onChange={() => onToggle(t.id, t.status)}
                        disabled={pending || !isAdmin}
                        style={{ width: 18, height: 18, accentColor: 'var(--ambar)' }}
                        aria-label={`Marcar ${t.title}`}
                      />
                      <span
                        className={'crece' + (t.status === 'completada' ? ' silencio-3' : '')}
                        style={t.status === 'completada' ? { textDecoration: 'line-through' } : undefined}
                      >
                        {t.title}
                      </span>
                      {t.due_date && (
                        <span className="texto-s silencio-3">
                          {new Date(t.due_date + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onDelete(t.id, t.title)}
                          disabled={pending}
                          className="btn btn-ghost btn-sm btn-icon"
                          aria-label={`Eliminar ${t.title}`}
                        >
                          <Icono n="basura" s={16} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {isAdmin && (
                <form
                  onSubmit={e => onAdd(s.id, e)}
                  className="fila"
                  style={{ gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--arena-200)', paddingTop: 12 }}
                >
                  <input
                    name="title"
                    required
                    minLength={3}
                    disabled={pending}
                    placeholder="Nueva tarea…"
                    className="input crece"
                    style={{ minWidth: 160 }}
                    aria-label={`Título de la tarea para ${s.name}`}
                  />
                  <input
                    type="date"
                    name="due_date"
                    disabled={pending}
                    className="input"
                    aria-label={`Fecha límite para tarea de ${s.name}`}
                  />
                  <button type="submit" disabled={pending} className="btn btn-primary btn-sm">Agregar</button>
                </form>
              )}
            </li>
          )
        })}
      </ul>

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
