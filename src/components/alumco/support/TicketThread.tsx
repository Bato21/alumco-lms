'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { addTicketMessageAction } from '@/lib/actions/support'
import { Avatar, Icono } from '@/components/alumco/ds'
import type { SupportTicketMessage } from '@/lib/types/database'

/**
 * Hilo de conversación de un ticket.
 *
 * Las notas internas solo llegan acá cuando el lector es staff — el filtrado
 * ocurre en el servidor, así que este componente puede confiar en lo que recibe.
 */
export function TicketThread({
  ticketId,
  messages,
  authors,
  canManage,
  currentUserId,
  cerrado,
}: {
  ticketId: string
  messages: SupportTicketMessage[]
  authors: Record<string, string>
  canManage: boolean
  currentUserId: string
  cerrado: boolean
}) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [pendiente, startTransition] = useTransition()

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (body.trim().length === 0) return

    startTransition(async () => {
      const res = await addTicketMessageAction(ticketId, { body, isInternal })
      if (res.error) {
        toast.error(res.error)
        return
      }
      setBody('')
      setIsInternal(false)
      router.refresh()
    })
  }

  return (
    <div className="col" style={{ gap: 18 }}>
      {messages.length === 0 ? (
        <p className="silencio texto-s">Todavía no hay respuestas en este ticket.</p>
      ) : (
        <ul className="col" style={{ gap: 14, listStyle: 'none', margin: 0, padding: 0 }}>
          {messages.map((m) => {
            const nombre = m.author_id ? authors[m.author_id] ?? 'Usuario' : 'Sistema'
            const propio = m.author_id === currentUserId
            return (
              <li
                key={m.id}
                className="fila"
                style={{ gap: 12, alignItems: 'flex-start' }}
              >
                <Avatar nombre={nombre} s={34} tono={propio ? 'ambar' : undefined} />
                <div
                  className="crece col"
                  style={{
                    gap: 5,
                    minWidth: 0,
                    padding: '11px 14px',
                    borderRadius: 12,
                    background: m.is_internal ? 'var(--ambar-50)' : 'var(--crema)',
                    border: `1px solid ${m.is_internal ? 'var(--ambar-100)' : 'var(--borde-suave)'}`,
                  }}
                >
                  <div className="fila" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: 13.5 }}>{nombre}</strong>
                    {m.is_internal && (
                      <span className="badge badge-aviso">Nota interna</span>
                    )}
                    <span className="crece" />
                    <span className="texto-s silencio-3">{fechaCorta(m.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 14.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {m.body}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={enviar} className="col" style={{ gap: 10 }}>
        <label htmlFor="ticket-respuesta" className="sr-only">Escribir una respuesta</label>
        <textarea
          id="ticket-respuesta"
          rows={3}
          value={body}
          maxLength={5000}
          disabled={pendiente}
          placeholder={
            cerrado && !canManage
              ? 'Este ticket está cerrado. Si sigue pasando, escribe acá y lo reabrimos.'
              : 'Escribe tu respuesta…'
          }
          onChange={(e) => setBody(e.target.value)}
        />

        <div className="fila" style={{ gap: 12, flexWrap: 'wrap' }}>
          {canManage && (
            <label className="fila" style={{ gap: 7, fontSize: 13.5, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isInternal}
                disabled={pendiente}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              Nota interna (no la ve quien reportó)
            </label>
          )}
          <span className="crece" />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={pendiente || body.trim().length === 0}
          >
            <Icono n="check" s={16} /> {pendiente ? 'Enviando…' : 'Responder'}
          </button>
        </div>
      </form>
    </div>
  )
}

function fechaCorta(iso: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
