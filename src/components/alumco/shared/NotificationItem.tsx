import type { ReactNode } from 'react'

// Item genérico de la campana de notificaciones (alerta de curso o evento).
export interface NotificationItemProps {
  href: string
  /** Clase de color del punto indicador, ej. 'bg-[#F5A623]'. */
  dotClass: string
  title: string
  /** Etiqueta principal (ej. "Vencido", "Faltan 5 días"). */
  label: string
  /** Clase de color de la etiqueta, ej. 'text-[#F5A623]'. */
  labelClass?: string
  /** Texto secundario opcional (ej. "3 sin completar" o la categoría). */
  extra?: ReactNode
  /** Barra de progreso opcional (0-100). */
  progressPct?: number
}

export function NotificationItem({
  href,
  dotClass,
  title,
  label,
  labelClass = 'text-[#6B7280]',
  extra,
  progressPct,
}: NotificationItemProps) {
  return (
    <a href={href} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${dotClass}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A1A2E] truncate">{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs font-semibold ${labelClass}`}>{label}</span>
          {extra !== undefined && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-[#6B7280] truncate">{extra}</span>
            </>
          )}
        </div>
        {progressPct !== undefined && (
          <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#2B4FA0] rounded-full" style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </div>
    </a>
  )
}
