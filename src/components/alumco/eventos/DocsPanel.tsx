'use client'

import { useState, useTransition } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import {
  uploadEventDocumentAction,
  deleteEventDocumentAction,
  getDocumentSignedUrlAction,
} from '@/lib/actions/events'
import { Badge, Icono } from '@/components/alumco/ds'
import type { EventDocument, EventDocType } from '@/lib/types/database'

const DOC_TYPE_LABELS: Record<EventDocType, string> = {
  dificultades_alimenticias: 'Dificultades alimenticias',
  general: 'General',
}

export function DocsPanel({ eventId, docs, canManage }: {
  eventId: string
  docs: EventDocument[]
  canManage: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)

  function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    setError(null)
    startTransition(async () => {
      const res = await uploadEventDocumentAction(eventId, formData)
      if (res.error) setError(res.error)
      else form.reset()
    })
  }

  function onDelete(docId: string, title: string) {
    if (!window.confirm(`¿Eliminar el documento "${title}"?`)) return
    setError(null)
    startTransition(async () => {
      const res = await deleteEventDocumentAction(docId)
      if (res.error) setError(res.error)
    })
  }

  function abrir(docId: string) {
    setError(null)
    setOpeningId(docId)
    startTransition(async () => {
      const res = await getDocumentSignedUrlAction(docId)
      if (res.error || !res.url) {
        setError(res.error ?? 'No se pudo abrir el documento')
      } else {
        window.open(res.url, '_blank', 'noopener')
      }
      setOpeningId(null)
    })
  }

  return (
    <section className="card card-pad col entra" style={{ gap: 16 }}>
      <h2 style={{ fontSize: 16.5 }}>Documentos</h2>
      <p className="texto-s silencio">
        La lista de <strong>dificultades alimenticias</strong> es una advertencia — no bloquea la creación
        ni el avance del evento, pero conviene subirla cuanto antes.
      </p>

      <ul className="col" style={{ gap: 8 }}>
        {docs.length === 0 && <li className="silencio texto-s">Sin documentos.</li>}
        {docs.map(d => (
          <li key={d.id} className="fila" style={{ gap: 10 }}>
            <Icono n="doc" s={17} />
            <button
              type="button"
              onClick={() => abrir(d.id)}
              disabled={pending}
              className="crece"
              style={{ textAlign: 'left', textDecoration: 'underline', textUnderlineOffset: 2, background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', color: 'inherit' }}
              aria-busy={pending && openingId === d.id}
            >
              {d.title}
            </button>
            {d.doc_type === 'dificultades_alimenticias' && (
              <Badge tono="aviso" punto={false}>Alimentación</Badge>
            )}
            {canManage && (
              <button
                type="button"
                onClick={() => onDelete(d.id, d.title)}
                disabled={pending}
                className="btn btn-ghost btn-sm btn-icon"
                aria-label={`Eliminar ${d.title}`}
              >
                <Icono n="basura" s={16} />
              </button>
            )}
          </li>
        ))}
      </ul>

      {canManage && (
        <form
          onSubmit={onUpload}
          className="fila"
          style={{ gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--arena-200)', paddingTop: 16 }}
        >
          <input
            type="file"
            name="file"
            required
            disabled={pending}
            accept=".pdf,.xlsx,.docx"
            className="texto-s"
            aria-label="Archivo"
          />
          <select name="doc_type" disabled={pending} className="select" aria-label="Tipo de documento" defaultValue="general">
            <option value="general">{DOC_TYPE_LABELS.general}</option>
            <option value="dificultades_alimenticias">{DOC_TYPE_LABELS.dificultades_alimenticias}</option>
          </select>
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Subir
          </button>
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
