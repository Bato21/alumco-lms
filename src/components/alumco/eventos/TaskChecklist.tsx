'use client'

import { useState, useTransition } from 'react'
import { toggleTaskAction } from '@/lib/actions/events'

type Task = { id: string; title: string; area: string; is_done: boolean }

export function TaskChecklist({ tasks }: { tasks: Task[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="col" style={{ gap: 10 }}>
      <ul className="col" style={{ gap: 10, listStyle: 'none' }}>
        {tasks.map(t => (
          <li key={t.id} className="fila" style={{ gap: 12 }}>
            <input
              type="checkbox"
              checked={t.is_done}
              disabled={pending}
              onChange={() => {
                setError(null)
                startTransition(async () => {
                  const res = await toggleTaskAction(t.id)
                  if (res.error) setError(res.error)
                })
              }}
              aria-label={`Marcar ${t.title}`}
              style={{ width: 18, height: 18, accentColor: 'var(--ambar)', flex: 'none' }}
            />
            <span
              className="texto-s crece"
              style={t.is_done ? { textDecoration: 'line-through', opacity: 0.5 } : undefined}
            >
              {t.title}
            </span>
            <span className="texto-s silencio-3">{t.area}</span>
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
