import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import type { AdminDaysSummary } from '@/lib/actions/admin-days'
import { ADMIN_DAY_STATUS_LABELS, type AdminDayStatus } from '@/lib/types/database'

// Pares texto/fondo de los estados. Van por token del tema (no por literal)
// para que hereden la corrección de contraste de didasko.css y para que el
// admin conserve su ámbar mientras el trabajador ve el verde: los literales
// #F5A623 y #E74C3C como color de texto dan 1.96:1 y 3.82:1 → fallan 1.4.3.
const STATUS_STYLE: Record<AdminDayStatus, string> = {
  aprobada: 'bg-[var(--ok-bg)] text-[var(--ok)]',
  pendiente: 'bg-[var(--aviso-bg)] text-[var(--aviso)]',
  rechazada: 'bg-[var(--peligro-bg)] text-[var(--peligro)]',
  cancelada: 'bg-[var(--arena-100)] text-[var(--tinta-2)]',
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
        {/* El texto visible por sí solo ("Gestionar") no dice el destino (2.4.4);
            el aria-label lo completa y lo contiene, así que respeta 2.5.3. */}
        <Link
          href="/admin/dias-administrativos"
          aria-label="Gestionar días administrativos"
          className="text-sm font-semibold text-[#2B4FA0] hover:underline shrink-0 min-h-[44px] inline-flex items-center gap-1"
        >
          Gestionar
          <span aria-hidden="true">→</span>
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
                <span className="text-lg font-bold text-[var(--tinta-2)]"> / {quota}</span>
              </p>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--tinta-2)] mt-1.5">
                Días disponibles
              </p>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Decorativa a propósito: los tres valores que representa están
                escritos justo debajo, así que 1.4.1 y 1.4.11 se cumplen por
                texto y la barra no necesita nombre ni rol propio. */}
            <div
              className="h-2.5 w-full rounded-full bg-[var(--arena-200)] overflow-hidden flex"
              aria-hidden="true"
            >
              <div className="h-full bg-[var(--ok)]" style={{ width: `${usedPct}%` }} />
              <div className="h-full bg-[var(--aviso)]" style={{ width: `${pendingPct}%` }} />
            </div>
            <ul role="list" className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--tinta-2)]">
              <li className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--ok)]" aria-hidden="true" />
                <strong className="text-[#1A1A2E] font-bold">{usedDays}</strong> usados
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--aviso)]" aria-hidden="true" />
                <strong className="text-[#1A1A2E] font-bold">{pendingDays}</strong> por aprobar
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--arena-200)]" aria-hidden="true" />
                <strong className="text-[#1A1A2E] font-bold">{remainingDays}</strong> disponibles
              </li>
            </ul>
          </div>
        </div>

        <p className="text-xs text-[var(--tinta-2)]">
          {resetPeriod === 'anual'
            ? `Cupo anual: se renueva el 1 de enero. Los días mostrados corresponden a ${new Date().getFullYear()}.`
            : 'Cupo total fijo: no se renueva.'}
          {pendingDays > 0 && ' Las solicitudes pendientes ya descuentan del cupo disponible.'}
        </p>

        {/* Historial de solicitudes */}
        <div className="pt-1 border-t border-gray-100">
          {visibles.length === 0 ? (
            <p className="text-sm text-[var(--tinta-2)] pt-4">
              Este trabajador aún no ha solicitado días administrativos.
            </p>
          ) : (
            <ul role="list" className="divide-y divide-gray-100 -mx-6">
              {visibles.map(r => (
                <li key={r.id} className="px-6 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[#1A1A2E]">
                        {r.start_date === r.end_date ? (
                          formatDay(r.start_date)
                        ) : (
                          <>
                            {formatDay(r.start_date)}
                            {/* El guion largo se lee como pausa o no se lee:
                                el "al" es lo que hace legible el rango. */}
                            <span aria-hidden="true"> – </span>
                            <span className="sr-only"> al </span>
                            {formatDay(r.end_date)}
                          </>
                        )}
                      </span>
                      <span className="text-xs text-[var(--tinta-2)]">
                        {r.days_count} {r.days_count === 1 ? 'día' : 'días'}
                      </span>
                    </div>
                    {r.reason && (
                      <p className="text-xs text-[var(--tinta-2)] mt-0.5 line-clamp-2">{r.reason}</p>
                    )}
                    {r.status === 'rechazada' && r.review_note && (
                      <p className="text-xs text-[var(--peligro)] mt-0.5">Motivo: {r.review_note}</p>
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
            <p className="text-xs text-[var(--tinta-2)] pt-3">
              Mostrando las {MAX_VISIBLE_REQUESTS} más recientes de {requests.length}.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
