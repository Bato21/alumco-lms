'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { markModuleCompleteAction } from '@/lib/actions/progress'
import { Icono } from '@/components/alumco/ds'

/**
 * Lector de un módulo de texto.
 *
 * El HTML llega ya saneado en el servidor (ver src/lib/sanitizeHtml.ts). Se usa
 * dangerouslySetInnerHTML porque es contenido enriquecido creado por el equipo
 * de Alumco, no entrada de usuario final — pero la garantía la da el saneado
 * del servidor, no esa distinción.
 *
 * El botón de completar se habilita al llegar al final: marcar "leído" sin
 * haber bajado la página es la forma más fácil de que un curso obligatorio
 * quede aprobado sin haberse leído.
 */
export function TextoModulo({
  html,
  moduleId,
  courseId,
  isCompleted,
}: {
  html: string
  moduleId: string
  courseId: string
  isCompleted: boolean
}) {
  const router = useRouter()
  const finRef = useRef<HTMLDivElement>(null)
  const [leido, setLeido] = useState(isCompleted)
  const [pendiente, startTransition] = useTransition()

  useEffect(() => {
    if (leido) return
    const fin = finRef.current
    if (!fin) return

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setLeido(true) },
      { rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(fin)
    return () => observer.disconnect()
  }, [leido])

  function completar() {
    startTransition(async () => {
      const res = await markModuleCompleteAction(moduleId, courseId)
      if (!res.success) {
        toast.error(res.error ?? 'No se pudo marcar el módulo como completado.')
        return
      }
      toast.success('Módulo completado.')
      router.refresh()
    })
  }

  return (
    <div className="col" style={{ gap: 18 }}>
      <div
        className="contenido-modulo"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Centinela de "llegó al final" */}
      <div ref={finRef} aria-hidden="true" style={{ height: 1 }} />

      {isCompleted ? (
        <p className="fila texto-s" style={{ gap: 8, color: 'var(--ok)', fontWeight: 600 }}>
          <Icono n="check" s={18} /> Ya completaste este módulo
        </p>
      ) : (
        <div className="col" style={{ gap: 8 }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start' }}
            onClick={completar}
            disabled={!leido || pendiente}
          >
            <Icono n="check" s={18} />
            {pendiente ? 'Guardando…' : 'Marcar como completado'}
          </button>
          {!leido && (
            <p className="texto-s silencio-3">
              Baja hasta el final de la lectura para poder marcarla como completada.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
