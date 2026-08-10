'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { duplicateCourseAction } from '@/lib/actions/courses'
import { Icono } from '@/components/alumco/ds'

/**
 * Duplica un curso completo pidiendo antes el título del clon.
 *
 * Se pregunta el título en vez de asumir "(copia)" porque el caso real es
 * "Manejo de caídas 2026" a partir de "Manejo de caídas 2025": el nombre es
 * justamente lo que cambia.
 */
export function DuplicateCourseButton({
  courseId,
  courseTitle,
}: {
  courseId: string
  courseTitle: string
}) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [pendiente, startTransition] = useTransition()

  function abrir() {
    setTitulo(`${courseTitle} (copia)`)
    setAbierto(true)
  }

  function duplicar() {
    startTransition(async () => {
      const res = await duplicateCourseAction(courseId, titulo)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Curso duplicado. El clon queda como borrador.')
      setAbierto(false)
      if (res.id) router.push(`/admin/cursos/${res.id}/editar`)
      else router.refresh()
    })
  }

  if (!abierto) {
    return (
      <button type="button" className="btn btn-secondary btn-sm" onClick={abrir}>
        <Icono n="copiar" s={16} /> Duplicar
      </button>
    )
  }

  return (
    <div
      className="col"
      style={{
        gap: 8,
        width: '100%',
        padding: 12,
        borderRadius: 12,
        background: 'var(--crema)',
        border: '1px solid var(--borde-suave)',
      }}
    >
      <label htmlFor={`dup-${courseId}`} style={{ fontSize: 13, fontWeight: 600 }}>
        Título del curso nuevo
      </label>
      <input
        id={`dup-${courseId}`}
        type="text"
        value={titulo}
        autoFocus
        maxLength={200}
        disabled={pendiente}
        onChange={(e) => setTitulo(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') duplicar()
          if (e.key === 'Escape') setAbierto(false)
        }}
      />
      <p className="texto-s silencio-3" style={{ lineHeight: 1.4 }}>
        Se copian módulos, evaluaciones y preguntas. El plazo no se copia y el curso
        nuevo queda en borrador.
      </p>
      <div className="fila" style={{ gap: 8 }}>
        <button
          type="button"
          className="btn btn-primary btn-sm crece"
          onClick={duplicar}
          disabled={pendiente || titulo.trim().length < 2}
        >
          {pendiente ? 'Duplicando…' : 'Duplicar'}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setAbierto(false)}
          disabled={pendiente}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
