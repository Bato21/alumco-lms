'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Icono, Badge, Progreso } from '@/components/alumco/ds'
import type { EventoResumen } from '@/lib/eventos/proximoEvento'

// Estado visto/cerrado por usuario y por evento (localStorage).
// 'seen'  = cerrado con X / "ver más tarde" / "ver evento" → no auto-abre otra vez.
// 'never' = marcó "No mostrar de nuevo".
// Un evento nuevo usa otra clave (id distinto) → el modal vuelve a mostrarse.
function storageKey(userId: string, eventId: string) {
  return `kimunko:evt-modal:${userId}:${eventId}`
}

export function EventNotificationModal({ evento, userId }: { evento: EventoResumen; userId: string }) {
  const [open, setOpen] = useState(false)
  const [noMostrar, setNoMostrar] = useState(false)

  // Decide en cliente si auto-abrir (evita mismatch de hidratación: SSR no
  // tiene acceso a localStorage, así que arranca cerrado).
  useEffect(() => {
    try {
      const estado = localStorage.getItem(storageKey(userId, evento.id))
      if (!estado) setOpen(true)
    } catch {
      /* localStorage bloqueado: no auto-abrimos */
    }
  }, [userId, evento.id])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, noMostrar])

  function persistir() {
    try {
      localStorage.setItem(storageKey(userId, evento.id), noMostrar ? 'never' : 'seen')
    } catch {
      /* noop */
    }
  }

  function cerrar() {
    persistir()
    setOpen(false)
  }

  if (!open) return null

  const dias = evento.diasRestantes
  const diasTexto = dias > 0 ? `Faltan ${dias} día${dias === 1 ? '' : 's'}` : dias === 0 ? '¡Es hoy!' : 'En curso'
  const progresoPct = evento.tareasTotal > 0 ? Math.round((evento.tareasCompletadas / evento.tareasTotal) * 100) : 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Próximo evento: ${evento.title}`}
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(15,31,77,0.45)', paddingTop: 'max(6vh, 24px)' }}
      onClick={cerrar}
    >
      <div
        className="card col"
        style={{ gap: 0, width: '100%', maxWidth: 460, maxHeight: '92vh', overflowY: 'auto', background: 'var(--blanco)', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Cerrar"
          onClick={cerrar}
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
        >
          <Icono n="cerrar" s={18} />
        </button>

        {/* Portada solo si hay imagen (sin banner de emoji) */}
        {evento.coverImageUrl && (
          <div
            style={{
              height: 132,
              borderTopLeftRadius: 'var(--radio-l)',
              borderTopRightRadius: 'var(--radio-l)',
              overflow: 'hidden',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={evento.coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div className="col card-pad" style={{ gap: 16, paddingTop: evento.coverImageUrl ? undefined : 34 }}>
          {/* Encabezado centrado: fecha · título · categoría · días restantes.
              Centrado para que el título no quede pegado a la izquierda con el
              badge suelto a la derecha (simetría). */}
          <div className="col" style={{ alignItems: 'center', textAlign: 'center', gap: 8 }}>
            <span className="t-eyebrow">◆ {evento.fechaLabel}</span>
            <h2 className="t-display" style={{ fontSize: 22, lineHeight: 1.2 }}>{evento.title}</h2>
            {evento.categoria && (
              <p className="silencio" style={{ fontSize: 14 }}>{evento.categoria}</p>
            )}
            <Badge tono={dias >= 0 && dias <= 7 ? 'aviso' : 'neutro'} punto={false}>{diasTexto}</Badge>
          </div>

          {/* Progreso de preparación */}
          {evento.tareasTotal > 0 && (
            <div className="col" style={{ gap: 6 }}>
              <div className="fila" style={{ justifyContent: 'space-between' }}>
                <span className="texto-s" style={{ fontWeight: 600 }}>Preparación</span>
                <span className="texto-s silencio-3">
                  {evento.tareasCompletadas} de {evento.tareasTotal} tareas completadas
                </span>
              </div>
              <Progreso pct={progresoPct} alto={7} />
            </div>
          )}

          {/* Alerta de alimentación */}
          {evento.faltaAlimentacion && (
            <div
              role="alert"
              className="fila"
              style={{ gap: 10, padding: '10px 12px', borderRadius: 'var(--radio-m)', border: '1px solid var(--aviso)', background: 'var(--aviso-bg)' }}
            >
              <span style={{ color: 'var(--aviso)', flex: 'none' }}><Icono n="alerta" s={18} /></span>
              <span className="texto-s" style={{ color: 'var(--aviso)', fontWeight: 600 }}>
                Falta la lista de dificultades alimenticias
              </span>
            </div>
          )}

          {/* Botones */}
          <div className="fila" style={{ gap: 10, marginTop: 2, flexWrap: 'wrap' }}>
            <Link href={evento.href} className="btn btn-primary crece" onClick={persistir}>
              Ver evento <Icono n="chevR" s={17} />
            </Link>
            <button className="btn btn-ghost" onClick={cerrar}>Ver más tarde</button>
          </div>

          {/* No mostrar de nuevo */}
          <label className="fila texto-s" style={{ gap: 8, cursor: 'pointer', color: 'var(--tinta-3)', justifyContent: 'center' }}>
            <input
              type="checkbox"
              checked={noMostrar}
              onChange={(e) => setNoMostrar(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--ambar)' }}
            />
            No mostrar de nuevo
          </label>
        </div>
      </div>
    </div>
  )
}
