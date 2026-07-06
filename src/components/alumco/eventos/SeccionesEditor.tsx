'use client'

import { useState, useTransition } from 'react'
import { AlertCircle } from 'lucide-react'
import {
  addSectionAction,
  removeSectionAction,
  addMemberAction,
  removeMemberAction,
} from '@/lib/actions/events'
import { Badge, Icono } from '@/components/alumco/ds'
import type { EventSectionMemberRole } from '@/lib/types/database'

interface MemberRow {
  user_id: string
  member_role: EventSectionMemberRole
  full_name: string
}

interface SectionRow {
  id: string
  name: string
  description: string | null
  members: MemberRow[]
}

interface Worker {
  id: string
  full_name: string
}

export function SeccionesEditor({ eventId, sections, workers }: {
  eventId: string
  sections: SectionRow[]
  workers: Worker[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // Secciones colapsables: parten cerradas (el header resume el equipo) y
  // se abre solo la que se está editando. Con una sola sección, abierta.
  const [abiertas, setAbiertas] = useState<Set<string>>(
    () => new Set(sections.length === 1 ? [sections[0].id] : [])
  )

  function toggleSeccion(id: string) {
    setAbiertas(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function onAddSection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    setError(null)
    startTransition(async () => {
      const res = await addSectionAction(eventId, formData)
      if (res.error) setError(res.error)
      else form.reset()
    })
  }

  function onRemoveSection(sectionId: string, name: string) {
    if (!window.confirm(`¿Quitar la sección "${name}"? También se eliminan sus miembros y tareas.`)) return
    setError(null)
    startTransition(async () => {
      const res = await removeSectionAction(sectionId)
      if (res.error) setError(res.error)
    })
  }

  function onAddMember(sectionId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    setError(null)
    startTransition(async () => {
      const res = await addMemberAction(sectionId, formData)
      if (res.error) setError(res.error)
      else form.reset()
    })
  }

  function onRemoveMember(sectionId: string, userId: string) {
    setError(null)
    startTransition(async () => {
      const res = await removeMemberAction(sectionId, userId)
      if (res.error) setError(res.error)
    })
  }

  return (
    <section className="card card-pad col entra" style={{ gap: 20 }}>
      <h2 style={{ fontSize: 16.5 }}>Secciones y equipos</h2>

      {/* Crear sección arriba: siempre a mano, sin buscar el final de la lista */}
      <form
        onSubmit={onAddSection}
        className="fila"
        style={{ gap: 10, flexWrap: 'wrap', borderBottom: '1px solid var(--arena-200)', paddingBottom: 16 }}
      >
        <input
          name="name"
          required
          minLength={2}
          disabled={pending}
          placeholder="Nombre de la sección…"
          className="input crece"
          style={{ minWidth: 180 }}
          aria-label="Nombre de la sección"
        />
        <input
          name="description"
          disabled={pending}
          placeholder="Descripción (opcional)…"
          className="input crece"
          style={{ minWidth: 180 }}
          aria-label="Descripción de la sección"
        />
        <button type="submit" disabled={pending} className="btn btn-primary">
          <Icono n="mas" s={16} /> Agregar sección
        </button>
      </form>

      {sections.length === 0 && <p className="silencio texto-s">Aún no hay secciones creadas.</p>}

      <ul className="col" style={{ gap: 16 }}>
        {sections.map(s => {
          const disponibles = workers.filter(w => !s.members.some(m => m.user_id === w.id))
          const abierta = abiertas.has(s.id)
          const encargados = s.members.filter(m => m.member_role === 'encargado').length
          return (
            <li
              key={s.id}
              className="col"
              style={{ gap: 10, border: '1px solid var(--arena-200)', borderRadius: 'var(--radio-m)', padding: 14 }}
            >
              <div className="fila" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => toggleSeccion(s.id)}
                  aria-expanded={abierta}
                  className="fila crece"
                  style={{ gap: 8, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit', alignItems: 'flex-start' }}
                >
                  <Icono n={abierta ? 'chevD' : 'chevR'} s={16} />
                  <span className="crece">
                    <span style={{ fontWeight: 600, display: 'block' }}>{s.name}</span>
                    {abierta && s.description && <span className="texto-s silencio-3">{s.description}</span>}
                    {!abierta && (
                      <span className="texto-s silencio-3">
                        {s.members.length === 0
                          ? 'sin equipo todavía'
                          : `${s.members.length} miembro${s.members.length === 1 ? '' : 's'} · ${encargados} encargado${encargados === 1 ? '' : 's'}`}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveSection(s.id, s.name)}
                  disabled={pending}
                  className="btn btn-ghost btn-sm btn-icon"
                  aria-label={`Quitar sección ${s.name}`}
                >
                  <Icono n="basura" s={16} />
                </button>
              </div>

              {abierta && s.members.length > 0 && (
                <ul className="col" style={{ gap: 6 }}>
                  {s.members.map(m => (
                    <li key={m.user_id} className="fila" style={{ justifyContent: 'space-between' }}>
                      <span className="fila" style={{ gap: 8 }}>
                        {m.full_name}
                        <Badge tono={m.member_role === 'encargado' ? 'aviso' : 'neutro'} punto={false}>
                          {m.member_role === 'encargado' ? 'Encargado' : 'Colaborador'}
                        </Badge>
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveMember(s.id, m.user_id)}
                        disabled={pending}
                        className="btn btn-ghost btn-sm btn-icon"
                        aria-label={`Quitar a ${m.full_name}`}
                      >
                        <Icono n="cerrar" s={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {abierta && disponibles.length > 0 && (
                <form
                  onSubmit={e => onAddMember(s.id, e)}
                  className="fila"
                  style={{ gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--arena-200)', paddingTop: 12 }}
                >
                  <select
                    name="user_id"
                    required
                    disabled={pending}
                    className="select crece"
                    style={{ minWidth: 180 }}
                    aria-label={`Trabajador para ${s.name}`}
                    defaultValue=""
                  >
                    <option value="" disabled>Trabajador…</option>
                    {disponibles.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                  </select>
                  <select
                    name="member_role"
                    required
                    disabled={pending}
                    className="select"
                    aria-label={`Rol en ${s.name}`}
                    defaultValue="colaborador"
                  >
                    <option value="encargado">Encargado</option>
                    <option value="colaborador">Colaborador</option>
                  </select>
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
