'use client'

import { useState, useTransition } from 'react'
import { AlertCircle } from 'lucide-react'
import { setEventRoleAction, removeEventRoleAction } from '@/lib/actions/events'
import { Badge, Icono } from '@/components/alumco/ds'
import { AREAS_TRABAJO, type EventRole } from '@/lib/types/database'

type RoleRow = EventRole & { full_name: string }
type Worker = { id: string; full_name: string; area_trabajo: string[] }

export function RolesEditor({ eventId, roles, workers }: {
  eventId: string
  roles: RoleRow[]
  workers: Worker[]
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    setError(null)
    startTransition(async () => {
      const res = await setEventRoleAction(eventId, formData)
      if (res.error) setError(res.error)
      else form.reset()
    })
  }

  function onRemove(roleId: string) {
    setError(null)
    startTransition(async () => {
      const res = await removeEventRoleAction(roleId)
      if (res.error) setError(res.error)
    })
  }

  const porArea = new Map<string, RoleRow[]>()
  for (const r of roles) porArea.set(r.area, [...(porArea.get(r.area) ?? []), r])

  return (
    <section className="card card-pad col entra" style={{ gap: 16 }}>
      <h2 style={{ fontSize: 16.5 }}>Jefes y delegados por área</h2>

      {porArea.size === 0 && <p className="silencio texto-s">Aún no hay responsables asignados.</p>}

      {[...porArea.entries()].map(([area, rows]) => (
        <div key={area} className="col" style={{ gap: 6 }}>
          <h3 className="texto-s silencio-3" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {area}
          </h3>
          <ul className="col" style={{ gap: 6 }}>
            {[...rows].sort((a, b) => (a.role === 'jefe' ? -1 : b.role === 'jefe' ? 1 : 0)).map(r => (
              <li key={r.id} className="fila" style={{ justifyContent: 'space-between' }}>
                <span className="fila" style={{ gap: 8 }}>
                  {r.full_name}
                  <Badge tono={r.role === 'jefe' ? 'aviso' : 'neutro'} punto={false}>
                    {r.role === 'jefe' ? 'Jefe' : 'Delegado'}
                  </Badge>
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(r.id)}
                  disabled={pending}
                  className="btn btn-ghost btn-sm btn-icon"
                  aria-label={`Quitar a ${r.full_name}`}
                >
                  <Icono n="cerrar" s={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <form
        onSubmit={onAdd}
        className="fila"
        style={{ gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--arena-200)', paddingTop: 16 }}
      >
        <select name="user_id" required disabled={pending} className="select crece" style={{ minWidth: 200 }} aria-label="Trabajador" defaultValue="">
          <option value="" disabled>Trabajador…</option>
          {workers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
        </select>
        <select name="area" required disabled={pending} className="select" aria-label="Área" defaultValue="">
          <option value="" disabled>Área…</option>
          {AREAS_TRABAJO.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select name="role" required disabled={pending} className="select" aria-label="Rol" defaultValue="jefe">
          <option value="jefe">Jefe</option>
          <option value="delegado">Delegado</option>
        </select>
        <button type="submit" disabled={pending} className="btn btn-primary">Asignar</button>
      </form>

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
