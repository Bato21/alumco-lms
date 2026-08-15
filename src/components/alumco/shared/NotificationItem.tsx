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
    // Cada alerta es un elemento de lista real: el desplegable anuncia cuántas hay (1.3.1).
    <li className="border-b border-slate-50 last:border-b-0">
      <a href={href} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
        {/* El punto de color repite lo que ya dice `label` en texto (1.4.1) */}
        <div aria-hidden="true" className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${dotClass}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1A1A2E] truncate">{title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs font-semibold ${labelClass}`}>{label}</span>
            {extra !== undefined && (
              <>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="text-xs text-[#6B7280] truncate">{extra}</span>
              </>
            )}
          </div>
          {progressPct !== undefined && (
            // Duplica visualmente el «N sin completar» de `extra`: decorativo.
            <div aria-hidden="true" className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#2B4FA0] rounded-full" style={{ width: `${progressPct}%` }} />
            </div>
          )}
        </div>
      </a>
    </li>
  )
}
