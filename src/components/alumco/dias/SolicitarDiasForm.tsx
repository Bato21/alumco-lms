'use client'

import { useMemo, useState, useTransition } from 'react'
import { createAdminDayRequest } from '@/lib/actions/admin-days'
import { Icono } from '@/components/alumco/ds'
import {
  ADMIN_DAY_MAX_PER_REQUEST,
  ADMIN_DAY_MIN_ADVANCE_BUSINESS_DAYS,
} from '@/lib/types/database'

interface SolicitarDiasFormProps {
  remainingDays: number
  quota: number
  hasOverdue: boolean
  /** Fecha inicial (YYYY-MM-DD) para prefijar, ej. al abrir desde el calendario. */
  initialStart?: string
  onSuccess?: () => void
  onCancel?: () => void
}

// ── Helpers de días hábiles (espejo del servidor, solo para preview) ───────
function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function isBusinessDay(d: Date) {
  const wd = d.getDay()
  return wd !== 0 && wd !== 6
}
function countBusinessDays(startISO: string, endISO: string): number {
  const start = parseISO(startISO)
  const end = parseISO(endISO)
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    if (isBusinessDay(cur)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}
function businessDaysAdvance(startISO: string): number {
  const start = parseISO(startISO)
  const t = new Date()
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate())
  if (isNaN(start.getTime()) || start <= today) return 0
  let count = 0
  const cur = new Date(today)
  cur.setDate(cur.getDate() + 1)
  while (cur < start) {
    if (isBusinessDay(cur)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export function SolicitarDiasForm({
  remainingDays,
  quota,
  hasOverdue,
  initialStart = '',
  onSuccess,
  onCancel,
}: SolicitarDiasFormProps) {
  const [startDate, setStartDate] = useState(initialStart)
  const [endDate, setEndDate] = useState(initialStart)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const minDate = useMemo(() => {
    const t = new Date()
    t.setDate(t.getDate() + 1)
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  }, [])

  const daysCount = startDate && endDate ? countBusinessDays(startDate, endDate) : 0
  const advance = startDate ? businessDaysAdvance(startDate) : 0

  // Validación de preview (el servidor es la autoridad final).
  const localError = (() => {
    if (hasOverdue) return null
    if (!startDate || !endDate) return null
    if (endDate < startDate) return 'La fecha de término no puede ser anterior a la de inicio.'
    if (daysCount < 1) return 'El rango no incluye días hábiles.'
    if (daysCount > ADMIN_DAY_MAX_PER_REQUEST) return `Máximo ${ADMIN_DAY_MAX_PER_REQUEST} días por solicitud.`
    if (daysCount > remainingDays) return `Solo te quedan ${remainingDays} días de cupo.`
    if (advance < ADMIN_DAY_MIN_ADVANCE_BUSINESS_DAYS) return `Se requieren ${ADMIN_DAY_MIN_ADVANCE_BUSINESS_DAYS} días hábiles de anticipación (llevas ${advance}).`
    return null
  })()

  const canSubmit = !hasOverdue && !!startDate && !!endDate && daysCount >= 1 && !localError && !isPending

  // El error del rango describe a los dos campos de fecha a la vez: se
  // apunta con aria-describedby desde ambos y se marca aria-invalid.
  const mensajeError = error ?? localError
  const describedBy = mensajeError ? 'ad-error' : undefined

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createAdminDayRequest({ startDate, endDate, reason })
      if (result.error) {
        setError(result.error)
      } else {
        setStartDate('')
        setEndDate('')
        setReason('')
        onSuccess?.()
      }
    })
  }

  if (hasOverdue) {
    return (
      <div className="fila card-pad" style={{ gap: 14, background: 'var(--peligro-bg)', borderRadius: 'var(--radio-m)', alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--peligro)', flex: 'none', marginTop: 2 }}><Icono n="alerta" s={22} /></span>
        <div>
          <p style={{ fontWeight: 700, color: 'var(--peligro)' }}>No puedes solicitar días administrativos</p>
          <p className="texto-s" style={{ color: 'var(--peligro)', marginTop: 4 }}>
            Tienes cursos vencidos. Debes completarlos antes de poder pedir días.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 16 }}>
      <div className="fila" style={{ gap: 14, flexWrap: 'wrap' }}>
        <div className="col crece" style={{ gap: 6, minWidth: 160 }}>
          <label htmlFor="ad-start" className="texto-s" style={{ fontWeight: 600 }}>
            Fecha de inicio <span className="silencio">(obligatorio)</span>
          </label>
          <input
            id="ad-start"
            type="date"
            className="input"
            min={minDate}
            value={startDate}
            onChange={e => {
              setStartDate(e.target.value)
              if (!endDate || endDate < e.target.value) setEndDate(e.target.value)
            }}
            required
            aria-invalid={mensajeError ? true : undefined}
            aria-describedby={describedBy}
          />
        </div>
        <div className="col crece" style={{ gap: 6, minWidth: 160 }}>
          <label htmlFor="ad-end" className="texto-s" style={{ fontWeight: 600 }}>
            Fecha de término <span className="silencio">(obligatorio)</span>
          </label>
          <input
            id="ad-end"
            type="date"
            className="input"
            min={startDate || minDate}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            required
            aria-invalid={mensajeError ? true : undefined}
            aria-describedby={describedBy}
          />
        </div>
      </div>

      <div className="col" style={{ gap: 6 }}>
        <label htmlFor="ad-reason" className="texto-s" style={{ fontWeight: 600 }}>Motivo <span className="silencio">(opcional)</span></label>
        <textarea
          id="ad-reason"
          className="textarea"
          rows={2}
          maxLength={300}
          placeholder="Ej. trámites personales"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
      </div>

      {/* El cálculo cambia con cada fecha elegida: se anuncia sin robar foco. */}
      <div aria-live="polite">
        {daysCount > 0 && (
          <div className="fila texto-s" style={{ gap: 8, color: 'var(--tinta-2)' }}>
            <Icono n="calendario" s={17} />
            <span>
              <strong>{daysCount}</strong> {daysCount === 1 ? 'día hábil' : 'días hábiles'} · te quedarán{' '}
              <strong>{Math.max(0, remainingDays - daysCount)}</strong> de {quota}
            </span>
          </div>
        )}
      </div>

      {mensajeError && (
        <p id="ad-error" role="alert" className="texto-s" style={{ fontWeight: 600, color: 'var(--peligro)' }}>
          {mensajeError}
        </p>
      )}

      <div className="fila" style={{ gap: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={!canSubmit} aria-busy={isPending}>
          {isPending ? 'Enviando…' : 'Enviar solicitud'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isPending}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
