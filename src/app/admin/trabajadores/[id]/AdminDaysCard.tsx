import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import type { AdminDaysSummary } from '@/lib/actions/admin-days'
import { ADMIN_DAY_STATUS_LABELS, type AdminDayStatus } from '@/lib/types/database'

const STATUS_STYLE: Record<AdminDayStatus, string> = {
  aprobada: 'bg-[#fef6e6] text-[#b9740f]',
  pendiente: 'bg-amber-50 text-[#F5A623]',
  rechazada: 'bg-red-50 text-[#E74C3C]',
  cancelada: 'bg-gray-100 text-[#6B7280]',
}

// Cuántas solicitudes mostramos antes de mandar al listado completo.
const MAX_VISIBLE_REQUESTS = 5

function formatDay(dateStr: string): string {
  return new Date(dateStr.slice(0, 10) + 'T00:00:00').toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatRange(start: string, end: string): string {
  return start === end ? formatDay(start) : `${formatDay(start)} – ${formatDay(end)}`
}

export default function AdminDaysCard({ summary }: { summary: AdminDaysSummary }) {
  const { quota, usedDays, pendingDays, remainingDays, resetPeriod, requests } = summary

  // Porcentajes de la barra. Con cupo 0 no dividimos: la barra queda llena.
  const usedPct = quota > 0 ? Math.min(100, (usedDays / quota) * 100) : 100
  const pendingPct = quota > 0 ? Math.min(100 - usedPct, (pendingDays / quota) * 100) : 0

  const visibles = requests.slice(0, MAX_VISIBLE_REQUESTS)

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-[#1A1A2E]">Días administrativos</h2>
        <Link
          href="/admin/dias-administrativos"
          className="text-sm font-semibold text-[#2B4FA0] hover:underline shrink-0"
        >
          Gestionar →
        </Link>
      </div>

      <div className="p-6 space-y-5">
        {/* Cupo restante + barra */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-4 shrink-0">
            <div className="bg-[#E6F1FB] w-12 h-12 rounded-full flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-[#2B4FA0]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-[#1A1A2E] leading-none">
                {remainingDays}
                <span className="text-lg font-bold text-[#6B7280]"> / {quota}</span>
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mt-1.5">
                Días disponibles
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div
              className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden flex"
              role="img"
              aria-label={`${usedDays} días usados y ${pendingDays} pendientes de un cupo de ${quota}`}
            >
              <div className="h-full bg-[#b9740f]" style={{ width: `${usedPct}%` }} />
              <div className="h-full bg-[#F5A623]" style={{ width: `${pendingPct}%` }} />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#6B7280]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#b9740f]" aria-hidden="true" />
                <strong className="text-[#1A1A2E] font-bold">{usedDays}</strong> usados
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F5A623]" aria-hidden="true" />
                <strong className="text-[#1A1A2E] font-bold">{pendingDays}</strong> por aprobar
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-200" aria-hidden="true" />
                <strong className="text-[#1A1A2E] font-bold">{remainingDays}</strong> disponibles
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#6B7280]">
          {resetPeriod === 'anual'
            ? `Cupo anual: se renueva el 1 de enero. Los días mostrados corresponden a ${new Date().getFullYear()}.`
            : 'Cupo total fijo: no se renueva.'}
          {pendingDays > 0 && ' Las solicitudes pendientes ya descuentan del cupo disponible.'}
        </p>

        {/* Historial de solicitudes */}
        <div className="pt-1 border-t border-gray-100">
          {visibles.length === 0 ? (
            <p className="text-sm text-[#6B7280] pt-4">
              Este trabajador aún no ha solicitado días administrativos.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 -mx-6">
              {visibles.map(r => (
                <li key={r.id} className="px-6 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#1A1A2E]">
                        {formatRange(r.start_date, r.end_date)}
                      </span>
                      <span className="text-xs text-[#6B7280]">
                        {r.days_count} {r.days_count === 1 ? 'día' : 'días'}
                      </span>
                    </div>
                    {r.reason && (
                      <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">{r.reason}</p>
                    )}
                    {r.status === 'rechazada' && r.review_note && (
                      <p className="text-xs text-[#E74C3C] mt-0.5">Motivo: {r.review_note}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_STYLE[r.status]}`}
                  >
                    {ADMIN_DAY_STATUS_LABELS[r.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {requests.length > MAX_VISIBLE_REQUESTS && (
            <p className="text-xs text-[#6B7280] pt-3">
              Mostrando las {MAX_VISIBLE_REQUESTS} más recientes de {requests.length}.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
