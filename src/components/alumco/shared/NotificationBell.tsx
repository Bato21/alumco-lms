'use client'

import { useState, useRef, useEffect } from 'react'
import { NotificationItem } from './NotificationItem'

interface AlertItem {
  courseId: string
  courseTitle: string
  deadline: string
  daysLeft: number
  urgency: 'overdue' | 'critical' | 'warning'
  pendingWorkers?: number
  totalWorkers?: number
  completionPct?: number
}

// Evento institucional próximo, para mostrarlo también en la campana.
export interface EventoBellItem {
  id: string
  title: string
  categoria: string | null
  diasRestantes: number
  href: string
}

interface NotificationBellProps {
  initialAlerts: {
    count: number
    alerts: AlertItem[]
  }
  role: 'admin' | 'profesor' | 'trabajador'
  evento?: EventoBellItem | null
}

const urgencyConfig = {
  overdue: {
    dot: 'bg-[var(--peligro)]',
    labelStyle: 'text-[var(--peligro)]',
  },
  critical: {
    dot: 'bg-[#F5A623]',
    labelStyle: 'text-[var(--ambar-700)]',
  },
  warning: {
    dot: 'bg-[#2B4FA0]',
    labelStyle: 'text-[#2B4FA0]',
  },
}

export function NotificationBell({ initialAlerts, role, evento }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [seen, setSeen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const botonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 2.1.1 · Cerrar con el ratón fuera del panel es una comodidad, no una vía
  // accesible: sin esto el desplegable no se podía cerrar con teclado. Al cerrar,
  // el foco vuelve a la campana (2.4.3).
  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setIsOpen(false)
      botonRef.current?.focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  const totalCount = initialAlerts.count + (evento ? 1 : 0)
  const hasUnseen = totalCount > 0 && !seen

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Botón campana */}
      <button
        ref={botonRef}
        type="button"
        onClick={() => { setIsOpen(!isOpen); setSeen(true) }}
        className="relative p-2 text-slate-500 hover:text-[#2B4FA0] transition-colors"
        // 4.1.2 · El conteo va en el nombre accesible: sin esto la campana suena
        // igual con 0 alertas que con 9.
        aria-label={
          totalCount > 0
            ? `Notificaciones: ${totalCount} alerta${totalCount === 1 ? '' : 's'} pendiente${totalCount === 1 ? '' : 's'}`
            : 'Notificaciones: sin alertas'
        }
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls="panel-notificaciones"
      >
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {hasUnseen && (
          // 1.4.1 · El punto rojo de 8 px era el único indicador de que hay avisos.
          // La insignia numérica añade el canal no cromático; el nombre accesible
          // del botón ya lleva el conteo, así que aquí es decoración.
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full
              bg-[var(--peligro)] text-white text-[11px] font-bold leading-[18px]
              text-center ring-2 ring-white"
          >
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          id="panel-notificaciones"
          role="dialog"
          aria-labelledby="titulo-notificaciones"
          className="fixed right-4 top-[66px] sm:absolute sm:right-0 sm:top-full sm:mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm min-w-[280px] sm:min-w-[320px] bg-white rounded-2xl
          shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-slate-100 z-[60]
          overflow-hidden"
        >

          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 id="titulo-notificaciones" className="font-bold text-[#1A1A2E] text-sm">Alertas</h3>
              {totalCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full
                  bg-[#FAECE7] text-[var(--peligro)]">
                  {totalCount}
                </span>
              )}
            </div>
            {role === 'admin' && (
              <a
                href="/admin/reportes"
                className="text-xs text-[#2B4FA0] font-semibold hover:underline"
              >
                Ver reporte <span aria-hidden="true">→</span>
              </a>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-72 overflow-y-auto">
            {totalCount === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-[#6B7280]">Sin alertas pendientes</p>
                {/* 1.4.3 · `text-slate-400` daba 2.56:1 sobre blanco */}
                <p className="text-xs text-[var(--tinta-3)] mt-1">
                  {role === 'admin' ? 'Todo tu equipo está al día' : 'Estás al día con tus cursos'}
                </p>
              </div>
            ) : (
              // `role="list"` explícito: con `list-style: none`, Safari/VoiceOver
              // pierde la semántica de lista.
              <ul role="list" aria-label={`${totalCount} alerta${totalCount === 1 ? '' : 's'}`}>
                {/* Evento próximo (arriba del todo) */}
                {evento && (
                  <NotificationItem
                    href={evento.href}
                    dotClass="bg-[#F5A623]"
                    title={evento.title}
                    label={
                      evento.diasRestantes > 0
                        ? `Faltan ${evento.diasRestantes} día${evento.diasRestantes === 1 ? '' : 's'}`
                        : evento.diasRestantes === 0 ? '¡Es hoy!' : 'En curso'
                    }
                    labelClass="text-[var(--ambar-700)]"
                    extra={evento.categoria ?? undefined}
                  />
                )}

                {initialAlerts.alerts.map(alert => {
                  const config = urgencyConfig[alert.urgency]
                  const urgencyLabel = alert.urgency === 'overdue' ? 'Vencido' : `${alert.daysLeft}d restantes`
                  const href = role === 'admin' ? '/admin/reportes' : `/cursos/${alert.courseId}`
                  return (
                    <NotificationItem
                      key={alert.courseId}
                      href={href}
                      dotClass={config.dot}
                      title={alert.courseTitle}
                      label={urgencyLabel}
                      labelClass={config.labelStyle}
                      extra={alert.pendingWorkers !== undefined ? `${alert.pendingWorkers} sin completar` : undefined}
                      progressPct={alert.completionPct}
                    />
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {totalCount > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
              {/* 1.4.3 · a 10 px sobre `bg-slate-50`, `--tinta-2` (7.4:1) en vez de
                  `text-slate-400` (2.56:1) */}
              <p className="text-[10px] text-[var(--tinta-2)] text-center">
                {role === 'admin'
                  ? 'Las alertas se actualizan al recargar la página'
                  : 'Completa estos cursos antes de que venzan'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
