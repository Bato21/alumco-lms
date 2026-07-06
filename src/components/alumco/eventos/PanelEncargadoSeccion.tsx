'use client'

// Controles para el ENCARGADO de una sección en la vista colaborador: crear
// tareas de su sección y sumar colaboradores (nunca encargados — eso es del
// admin). El server valida ambos permisos; esto solo aparece si es encargado.

import { useState, useTransition } from 'react'
import { upsertTaskAction, addColaboradorAction } from '@/lib/actions/events'
import { Icono } from '@/components/alumco/ds'

interface Worker {
  id: string
  full_name: string
}

export function PanelEncargadoSeccion({ sectionId, sectionName, eventDate, disponibles }: {
  sectionId: string
  sectionName: string
  eventDate: string
  disponibles: Worker[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onAddTask(e: React.FormEvent<HTMLFormElement>) {
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

  function onAddColab(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    setError(null)
    startTransition(async () => {
      const res = await addColaboradorAction(sectionId, formData)
      if (res.error) setError(res.error)
      else form.reset()
    })
  }

  return (
    <div className="col" style={{ gap: 14, borderTop: '1px solid var(--arena-200)', paddingTop: 14 }}>
      <form onSubmit={onAddTask} className="fila" style={{ gap: 10, flexWrap: 'wrap' }}>
        <input
          name="title"
          required
          minLength={3}
          disabled={pending}
          placeholder="Nueva tarea…"
          className="input crece"
          style={{ minWidth: 160, flexBasis: '100%' }}
          aria-label={`Título de la tarea para ${sectionName}`}
        />
        <label className="col" style={{ gap: 3 }}>
          <span className="texto-s silencio-3">Fecha (opcional)</span>
          <input type="date" name="due_date" defaultValue={eventDate} disabled={pending} className="input" aria-label="Fecha límite" />
        </label>
        <label className="col" style={{ gap: 3 }}>
          <span className="texto-s silencio-3">Hora (opcional)</span>
          <input type="time" name="due_time" disabled={pending} className="input" aria-label="Hora límite" />
        </label>
        <button type="submit" disabled={pending} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}>
          <Icono n="mas" s={16} /> Tarea
        </button>
      </form>

      {disponibles.length > 0 && (
        <form onSubmit={onAddColab} className="fila" style={{ gap: 10, flexWrap: 'wrap' }}>
          <select name="user_id" required disabled={pending} className="select crece" style={{ minWidth: 180 }} aria-label={`Sumar colaborador a ${sectionName}`} defaultValue="">
            <option value="" disabled>Sumar colaborador…</option>
            {disponibles.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
          </select>
          <button type="submit" disabled={pending} className="btn btn-primary btn-sm">
            <Icono n="mas" s={16} /> Sumar
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="texto-s" style={{ color: 'var(--peligro)', fontWeight: 600 }}>{error}</p>
      )}
    </div>
  )
}
