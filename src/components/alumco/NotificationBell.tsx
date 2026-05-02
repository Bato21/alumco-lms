'use client'

import { useState, useRef, useEffect } from 'react'

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

interface NotificationBellProps {
  initialAlerts: {
    count: number
    alerts: AlertItem[]
  }
  role: 'admin' | 'profesor' | 'trabajador'
}

const urgencyConfig = {
  overdue: {
    dot: 'bg-[#E74C3C]',
    labelStyle: 'text-[#E74C3C]',
  },
  critical: {
    dot: 'bg-[#F5A623]',
    labelStyle: 'text-[#F5A623]',
  },
  warning: {
    dot: 'bg-[#2B4FA0]',
    labelStyle: 'text-[#2B4FA0]',
  },
}

export function NotificationBell({ initialAlerts, role }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [seen, setSeen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasUnseen = initialAlerts.count > 0 && !seen

  return (
    <div className="relative" ref={dropdownRef}>

      {/* Botón campana */}
      <button
        onClick={() => { setIsOpen(!isOpen); setSeen(true) }}
        className="relative p-2 text-slate-500 hover:text-[#2B4FA0] transition-colors"
        aria-label="Notificaciones"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {hasUnseen && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full
            bg-[#E74C3C] ring-2 ring-white animate-pulse" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="fixed right-4 top-[66px] sm:absolute sm:right-0 sm:top-full sm:mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm min-w-[280px] sm:min-w-[320px] bg-white rounded-2xl
          shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-slate-100 z-[60]
          overflow-hidden">

          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#1A1A2E] text-sm">Alertas</h3>
              {initialAlerts.count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full
                  bg-[#FAECE7] text-[#E74C3C]">
                  {initialAlerts.count}
                </span>
              )}
            </div>
            {role === 'admin' && (
              <a
                href="/admin/reportes"
                className="text-xs text-[#2B4FA0] font-semibold hover:underline"
              >
                Ver reporte →
              </a>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {initialAlerts.count === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-[#6B7280]">Sin alertas pendientes</p>
                <p className="text-xs text-slate-400 mt-1">
                  {role === 'admin' ? 'Todo tu equipo está al día' : 'Estás al día con tus cursos'}
                </p>
              </div>
            ) : (
              initialAlerts.alerts.map(alert => {
                const config = urgencyConfig[alert.urgency]
                const urgencyLabel = alert.urgency === 'overdue'
                  ? 'Vencido'
                  : `${alert.daysLeft}d restantes`
                const href = role === 'admin'
                  ? '/admin/reportes'
                  : `/cursos/${alert.courseId}`

                return (
                  <a
                    key={alert.courseId}
                    href={href}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${config.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A2E] truncate">
                        {alert.courseTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-semibold ${config.labelStyle}`}>
                          {urgencyLabel}
                        </span>
                        {alert.pendingWorkers !== undefined && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs text-[#6B7280]">
                              {alert.pendingWorkers} sin completar
                            </span>
                          </>
                        )}
                      </div>
                      {alert.completionPct !== undefined && (
                        <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2B4FA0] rounded-full"
                            style={{ width: `${alert.completionPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </a>
                )
              })
            )}
          </div>

          {/* Footer */}
          {initialAlerts.count > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
              <p className="text-[10px] text-slate-400 text-center">
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
