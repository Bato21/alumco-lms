'use client'

import { useState, useTransition } from 'react'
import { toggleTaskStatusAction } from '@/lib/actions/events'
import type { EventTaskStatus } from '@/lib/types/database'

interface ChecklistTask {
  id: string
  title: string
  status: EventTaskStatus
  // Habilitado solo si el usuario es encargado de la sección de esta tarea
  // (o admin) — lo decide el llamador, este componente solo respeta la prop.
  canToggle: boolean
}

export function TaskChecklist({ tasks }: { tasks: ChecklistTask[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onToggle(task: ChecklistTask) {
    const next: EventTaskStatus = task.status === 'completada' ? 'pendiente' : 'completada'
    setError(null)
    startTransition(async () => {
      const res = await toggleTaskStatusAction(task.id, next)
      if (res.error) setError(res.error)
    })
  }

  return (
    <div className="col" style={{ gap: 10 }}>
      <ul className="col" style={{ gap: 10, listStyle: 'none' }}>
        {tasks.map(t => (
          <li key={t.id} className="fila" style={{ gap: 12 }}>
            <input
              type="checkbox"
              checked={t.status === 'completada'}
              disabled={pending || !t.canToggle}
              onChange={() => onToggle(t)}
              aria-label={`Marcar ${t.title}`}
              style={{ width: 18, height: 18, accentColor: 'var(--ambar)', flex: 'none' }}
            />
            <span
              className="texto-s crece"
              style={t.status === 'completada' ? { textDecoration: 'line-through', opacity: 0.5 } : undefined}
            >
              {t.title}
            </span>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="texto-s" style={{ color: 'var(--peligro)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
