'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SolicitarDiasForm } from './SolicitarDiasForm'
import { Icono } from '@/components/alumco/ds'

interface SolicitarDiasModalProps {
  remainingDays: number
  quota: number
  hasOverdue: boolean
  /** Texto/estilo del botón que dispara el modal. */
  triggerClassName?: string
  triggerLabel?: string
  /** Fecha prefijada al abrir (YYYY-MM-DD), ej. clic en un día del calendario. */
  initialStart?: string
}

export function SolicitarDiasModal({
  remainingDays,
  quota,
  hasOverdue,
  triggerClassName = 'btn btn-secondary btn-sm',
  triggerLabel = 'Solicitar días',
  initialStart,
}: SolicitarDiasModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setOpen(true)}>
        <Icono n="mas" s={16} /> {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Telón decorativo. El cierre por teclado es Escape (useEffect
              arriba) y el botón «Cerrar»; el clic fuera es sólo para ratón. */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'rgba(15,31,77,0.45)' }}
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Solicitar días administrativos"
            className="card card-pad col relative"
            style={{ gap: 16, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', background: 'var(--blanco)' }}
          >
            <div className="fila" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 18 }}>Solicitar días administrativos</h2>
              <button className="btn btn-ghost btn-icon btn-sm" aria-label="Cerrar" onClick={() => setOpen(false)}>
                <Icono n="cerrar" s={18} />
              </button>
            </div>

            <p className="texto-s silencio">
              Te quedan <strong>{remainingDays}</strong> de {quota} días. Entre 1 y 5 por solicitud, con 5 días
              hábiles de anticipación.
            </p>

            {remainingDays === 0 && !hasOverdue ? (
              <p className="texto-s silencio">Ya no te quedan días disponibles en este período.</p>
            ) : (
              <SolicitarDiasForm
                remainingDays={remainingDays}
                quota={quota}
                hasOverdue={hasOverdue}
                initialStart={initialStart}
                onSuccess={() => { setOpen(false); router.refresh() }}
                onCancel={() => setOpen(false)}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
