'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { SolicitarDiasForm } from '@/components/alumco/dias/SolicitarDiasForm'
import { cancelAdminDayRequest, type AdminDaysSummary } from '@/lib/actions/admin-days'
import { Badge, Icono, TarjetaStat } from '@/components/alumco/ds'
import {
  ADMIN_DAY_STATUS_LABELS,
  type AdminDayRequest,
  type AdminDayStatus,
} from '@/lib/types/database'

const STATUS_TONE: Record<AdminDayStatus, 'ok' | 'aviso' | 'peligro' | 'neutro'> = {
  aprobada: 'ok',
  pendiente: 'aviso',
  rechazada: 'peligro',
  cancelada: 'neutro',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso.slice(0, 10) + 'T00:00:00')
  )
}

function formatRange(start: string, end: string) {
  return start === end ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`
}

export function DiasAdminClient({ summary }: { summary: AdminDaysSummary }) {
  const router = useRouter()
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const hasOverdue = summary.overdueCourses.length > 0

  function handleCancel(id: string) {
    if (!confirm('¿Cancelar esta solicitud?')) return
    setCancelingId(id)
    startTransition(async () => {
      await cancelAdminDayRequest(id)
      setCancelingId(null)
      router.refresh()
    })
  }

  return (
    <div className="col" style={{ gap: 22 }}>
      {/* Stats de cupo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <TarjetaStat etiqueta="Días disponibles" valor={summary.remainingDays} icono="calendario" tono="ambar" />
        <TarjetaStat etiqueta="Cupo total" valor={summary.quota} icono="check" />
        <TarjetaStat etiqueta="Usados" valor={summary.usedDays} icono="reloj" />
        <TarjetaStat etiqueta="Pendientes" valor={summary.pendingDays} icono="doc" />
      </div>

      <p className="texto-s silencio">
        Cupo {summary.resetPeriod === 'anual' ? 'anual (se renueva cada 1 de enero)' : 'total fijo'}. Puedes pedir
        entre 1 y 5 días por solicitud, con al menos 5 días hábiles de anticipación.
      </p>

      {/* Formulario de nueva solicitud */}
      <div className="card card-pad col" style={{ gap: 16 }}>
        <h2 style={{ fontSize: 18 }}>Solicitar días administrativos</h2>
        {summary.remainingDays === 0 && !hasOverdue ? (
          <p className="texto-s silencio">Ya no te quedan días disponibles en este período.</p>
        ) : (
          <SolicitarDiasForm
            remainingDays={summary.remainingDays}
            quota={summary.quota}
            hasOverdue={hasOverdue}
            onSuccess={() => router.refresh()}
          />
        )}
      </div>

      {/* Historial de solicitudes */}
      <div className="card card-pad col" style={{ gap: 14 }}>
        <h2 style={{ fontSize: 18 }}>Mis solicitudes</h2>
        {summary.requests.length === 0 ? (
          <p className="texto-s silencio">Aún no has solicitado días administrativos.</p>
        ) : (
          <ul className="col" style={{ gap: 10, listStyle: 'none', margin: 0, padding: 0 }}>
            {summary.requests.map((r: AdminDayRequest) => (
              <li key={r.id} className="fila" style={{ gap: 14, padding: '12px 14px', border: '1px solid var(--borde-suave)', borderRadius: 'var(--radio-m)', flexWrap: 'wrap' }}>
                <div className="crece" style={{ minWidth: 200 }}>
                  <div className="fila" style={{ gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>{formatRange(r.start_date, r.end_date)}</span>
                    <Badge tono={STATUS_TONE[r.status]} punto={false}>{ADMIN_DAY_STATUS_LABELS[r.status]}</Badge>
                    <span className="texto-s silencio">{r.days_count} {r.days_count === 1 ? 'día' : 'días'}</span>
                  </div>
                  {r.reason && <p className="texto-s silencio" style={{ marginTop: 4 }}>{r.reason}</p>}
                  {r.status === 'rechazada' && r.review_note && (
                    <p className="texto-s" style={{ marginTop: 4, color: 'var(--peligro)' }}>Motivo: {r.review_note}</p>
                  )}
                </div>
                {r.status === 'pendiente' && (
                  <button
                    className="btn btn-peligro-ghost btn-sm"
                    onClick={() => handleCancel(r.id)}
                    disabled={cancelingId === r.id}
                  >
                    <Icono n="cerrar" s={16} /> Cancelar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
