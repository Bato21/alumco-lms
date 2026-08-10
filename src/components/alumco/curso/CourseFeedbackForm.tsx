'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { submitCourseFeedbackAction } from '@/lib/actions/feedback'
import { Icono } from '@/components/alumco/ds'

const ETIQUETAS: Record<number, string> = {
  1: 'Muy malo',
  2: 'Malo',
  3: 'Regular',
  4: 'Bueno',
  5: 'Excelente',
}

/**
 * Valoración del curso al terminarlo.
 *
 * Las estrellas son un radiogroup real, no divs con onClick: se recorre con
 * Tab y flechas, y cada opción dice su nota en palabras. Para un equipo con
 * cuidadores de todas las edades, "4 · Bueno" comunica más que cuatro íconos.
 */
export function CourseFeedbackForm({
  courseId,
  initial,
}: {
  courseId: string
  initial: { rating: number; comment: string | null } | null
}) {
  const router = useRouter()
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState(initial?.comment ?? '')
  const [editando, setEditando] = useState(initial === null)
  const [pendiente, startTransition] = useTransition()

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) {
      toast.error('Elige cuántas estrellas le das al curso.')
      return
    }
    startTransition(async () => {
      const res = await submitCourseFeedbackAction({ courseId, rating, comment })
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('¡Gracias! Tu valoración quedó registrada.')
      setEditando(false)
      router.refresh()
    })
  }

  if (!editando) {
    return (
      <div className="col" style={{ gap: 10 }}>
        <div className="fila" style={{ gap: 8 }}>
          <Estrellas valor={rating} />
          <strong style={{ fontSize: 14.5 }}>{ETIQUETAS[rating]}</strong>
        </div>
        {comment.trim().length > 0 && (
          <p className="texto-s silencio" style={{ lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            «{comment}»
          </p>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ alignSelf: 'flex-start', marginLeft: -10 }}
          onClick={() => setEditando(true)}
        >
          <Icono n="editar" s={15} /> Cambiar mi valoración
        </button>
      </div>
    )
  }

  const mostrado = hover || rating

  return (
    <form onSubmit={enviar} className="col" style={{ gap: 14 }}>
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          ¿Qué te pareció este curso?
        </legend>
        <div
          className="fila"
          style={{ gap: 4 }}
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              onMouseEnter={() => setHover(n)}
              title={`${n} · ${ETIQUETAS[n]}`}
              style={{
                cursor: 'pointer',
                display: 'inline-flex',
                padding: 4,
                color: n <= mostrado ? 'var(--ambar)' : 'var(--arena-200)',
              }}
            >
              <input
                type="radio"
                name={`rating-${courseId}`}
                value={n}
                checked={rating === n}
                disabled={pendiente}
                onChange={() => setRating(n)}
                className="sr-only"
              />
              <span aria-hidden="true"><Icono n="estrella" s={30} sw={1.4} /></span>
              <span className="sr-only">{n} de 5 · {ETIQUETAS[n]}</span>
            </label>
          ))}
          <span
            className="fila"
            style={{ marginLeft: 10, fontSize: 14.5, fontWeight: 600, color: 'var(--tinta-2)' }}
          >
            {mostrado > 0 ? ETIQUETAS[mostrado] : 'Sin valorar'}
          </span>
        </div>
      </fieldset>

      <div className="campo col" style={{ gap: 6 }}>
        <label htmlFor={`comentario-${courseId}`}>Comentario (opcional)</label>
        <textarea
          id={`comentario-${courseId}`}
          rows={3}
          value={comment}
          maxLength={1000}
          disabled={pendiente}
          placeholder="¿Qué te sirvió más? ¿Qué le falta?"
          onChange={(e) => setComment(e.target.value)}
        />
        <span className="ayuda">
          Quien dicta el curso verá tu comentario junto a tu nombre.
        </span>
      </div>

      <div className="fila" style={{ gap: 10 }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pendiente || rating < 1}>
          {pendiente ? 'Guardando…' : 'Enviar valoración'}
        </button>
        {initial && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={pendiente}
            onClick={() => {
              setRating(initial.rating)
              setComment(initial.comment ?? '')
              setEditando(false)
            }}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

/** Estrellas de solo lectura. */
export function Estrellas({ valor, s = 18 }: { valor: number; s?: number }) {
  return (
    <span className="fila" style={{ gap: 2 }} role="img" aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          aria-hidden="true"
          style={{ color: n <= valor ? 'var(--ambar)' : 'var(--arena-200)', display: 'inline-flex' }}
        >
          <Icono n="estrella" s={s} sw={1.4} />
        </span>
      ))}
    </span>
  )
}
