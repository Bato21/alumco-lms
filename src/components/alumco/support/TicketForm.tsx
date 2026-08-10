'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSupportTicketAction } from '@/lib/actions/support'
import { SUPPORT_CATEGORY_LABELS, type SupportCategory } from '@/lib/types/database'
import { Icono } from '@/components/alumco/ds'

const CATEGORIAS = Object.keys(SUPPORT_CATEGORY_LABELS) as SupportCategory[]

/**
 * Formulario de creación de ticket.
 *
 * El contexto técnico (URL, navegador, tamaño de pantalla) se captura solo
 * al enviar: es lo que evita el ida y vuelta de "¿en qué página estabas?" con
 * alguien que está trabajando en una residencia y no va a responder rápido.
 */
export function TicketForm({ onCancel }: { onCancel?: () => void }) {
  const router = useRouter()
  const [pendiente, startTransition] = useTransition()
  const [category, setCategory] = useState<SupportCategory>('error_tecnico')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  function enviar(e: React.FormEvent) {
    e.preventDefault()

    const context = {
      // `referrer` y no `location`: el usuario abrió esta página para reportar,
      // el problema estaba en la anterior.
      url: document.referrer || window.location.pathname,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
    }

    startTransition(async () => {
      const res = await createSupportTicketAction({ category, subject, description, context })
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Ticket enviado. Te avisaremos cuando haya respuesta.')
      setSubject('')
      setDescription('')
      if (res.ticketId) router.push(`/soporte/${res.ticketId}`)
      else router.refresh()
    })
  }

  return (
    <form onSubmit={enviar} className="col" style={{ gap: 16 }}>
      <div className="campo col" style={{ gap: 6 }}>
        <label htmlFor="ticket-categoria">¿De qué se trata?</label>
        <select
          id="ticket-categoria"
          value={category}
          disabled={pendiente}
          onChange={(e) => setCategory(e.target.value as SupportCategory)}
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{SUPPORT_CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      <div className="campo col" style={{ gap: 6 }}>
        <label htmlFor="ticket-asunto">Asunto</label>
        <input
          id="ticket-asunto"
          type="text"
          value={subject}
          maxLength={160}
          required
          disabled={pendiente}
          placeholder="Ej: No puedo descargar mi certificado"
          onChange={(e) => setSubject(e.target.value)}
        />
        <span className="ayuda">{subject.trim().length}/160 · mínimo 6 caracteres</span>
      </div>

      <div className="campo col" style={{ gap: 6 }}>
        <label htmlFor="ticket-descripcion">¿Qué pasó?</label>
        <textarea
          id="ticket-descripcion"
          rows={5}
          value={description}
          maxLength={5000}
          required
          disabled={pendiente}
          placeholder="Cuéntanos qué estabas haciendo y qué esperabas que pasara."
          onChange={(e) => setDescription(e.target.value)}
        />
        <span className="ayuda">Mientras más detalle, más rápido lo resolvemos.</span>
      </div>

      <p className="texto-s silencio-3" style={{ lineHeight: 1.45 }}>
        Junto con tu mensaje enviamos datos técnicos de tu sesión (página, navegador y
        tamaño de pantalla) para poder reproducir el problema.
      </p>

      <div className="fila" style={{ gap: 10, flexWrap: 'wrap' }}>
        <button type="submit" className="btn btn-primary" disabled={pendiente}>
          <Icono n="check" s={17} /> {pendiente ? 'Enviando…' : 'Enviar ticket'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={pendiente}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
