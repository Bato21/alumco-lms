'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  reviewAdminDayRequest,
  updateAdminDaysConfig,
  type AdminDayRequestRow,
  type AdminDaysConfigData,
} from '@/lib/actions/admin-days'
import { Badge, Icono } from '@/components/alumco/ds'
import {
  ADMIN_DAY_STATUS_LABELS,
  AREAS_TRABAJO,
  type AdminDayResetPeriod,
  type AdminDayStatus,
} from '@/lib/types/database'

const STATUS_TONE: Record<AdminDayStatus, 'ok' | 'aviso' | 'peligro' | 'neutro'> = {
  aprobada: 'ok',
  pendiente: 'aviso',
  rechazada: 'peligro',
  cancelada: 'neutro',
}

const SEDE_LABEL: Record<string, string> = {
  sede_1: 'Hualpén',
  sede_2: 'Coyhaique',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso.slice(0, 10) + 'T00:00:00')
  )
}
function formatRange(start: string, end: string) {
  return start === end ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`
}

export function DiasAdminAdminClient({
  requests,
  config,
}: {
  requests: AdminDayRequestRow[]
  config: AdminDaysConfigData
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'pendientes' | 'todas'>('pendientes')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const pendientes = useMemo(() => requests.filter(r => r.status === 'pendiente'), [requests])
  const visibles = tab === 'pendientes' ? pendientes : requests

  function handleReview(id: string, decision: 'aprobada' | 'rechazada') {
    let note: string | undefined
    if (decision === 'rechazada') {
      const input = prompt('Motivo del rechazo (opcional):') ?? ''
      note = input.trim() || undefined
    }
    setBusyId(id)
    startTransition(async () => {
      const res = await reviewAdminDayRequest(id, decision, note)
      setBusyId(null)
      if (res.error) alert(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="col" style={{ gap: 22 }}>
      {/* ── Solicitudes ─────────────────────────────────────── */}
      <div className="card card-pad col" style={{ gap: 16 }}>
        <div className="fila" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: 18 }}>Solicitudes</h2>
          <div className="fila" style={{ gap: 6 }}>
            <button className={'btn btn-sm ' + (tab === 'pendientes' ? 'btn-primary' : 'btn-ghost')} onClick={() => setTab('pendientes')}>
              Pendientes {pendientes.length > 0 && `(${pendientes.length})`}
            </button>
            <button className={'btn btn-sm ' + (tab === 'todas' ? 'btn-primary' : 'btn-ghost')} onClick={() => setTab('todas')}>
              Todas
            </button>
          </div>
        </div>

        {visibles.length === 0 ? (
          <p className="texto-s silencio">
            {tab === 'pendientes' ? 'No hay solicitudes pendientes.' : 'No hay solicitudes.'}
          </p>
        ) : (
          <ul className="col" style={{ gap: 10, listStyle: 'none', margin: 0, padding: 0 }}>
            {visibles.map(r => (
              <li key={r.id} className="fila" style={{ gap: 14, padding: '12px 14px', border: '1px solid var(--borde-suave)', borderRadius: 'var(--radio-m)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div className="crece" style={{ minWidth: 220 }}>
                  <div className="fila" style={{ gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>{r.full_name}</span>
                    <Badge tono={STATUS_TONE[r.status]} punto={false}>{ADMIN_DAY_STATUS_LABELS[r.status]}</Badge>
                  </div>
                  <p className="texto-s silencio" style={{ marginTop: 3 }}>
                    {SEDE_LABEL[r.sede] ?? r.sede}{r.area_trabajo.length > 0 && ` · ${r.area_trabajo.join(', ')}`}
                  </p>
                  <div className="fila texto-s" style={{ gap: 8, marginTop: 6, color: 'var(--tinta-2)' }}>
                    <Icono n="calendario" s={16} />
                    <span>{formatRange(r.start_date, r.end_date)} · {r.days_count} {r.days_count === 1 ? 'día' : 'días'}</span>
                  </div>
                  {r.reason && <p className="texto-s silencio" style={{ marginTop: 4 }}>Motivo: {r.reason}</p>}
                  {r.status === 'rechazada' && r.review_note && (
                    <p className="texto-s" style={{ marginTop: 4, color: 'var(--peligro)' }}>Rechazo: {r.review_note}</p>
                  )}
                </div>

                {r.status === 'pendiente' && (
                  <div className="fila" style={{ gap: 8 }}>
                    <button className="btn btn-primary btn-sm" disabled={busyId === r.id} onClick={() => handleReview(r.id, 'aprobada')}>
                      <Icono n="check" s={16} /> Aprobar
                    </button>
                    <button className="btn btn-peligro-ghost btn-sm" disabled={busyId === r.id} onClick={() => handleReview(r.id, 'rechazada')}>
                      <Icono n="cerrar" s={16} /> Rechazar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Configuración ───────────────────────────────────── */}
      <ConfigPanel config={config} />
    </div>
  )
}

function ConfigPanel({ config }: { config: AdminDaysConfigData }) {
  const router = useRouter()
  const [defaultQuota, setDefaultQuota] = useState(String(config.default_quota))
  const [resetPeriod, setResetPeriod] = useState<AdminDayResetPeriod>(config.reset_period)

  const initialAreas = useMemo(() => {
    const map: Record<string, string> = {}
    config.areaQuotas.forEach(q => { map[q.area] = String(q.quota) })
    return map
  }, [config.areaQuotas])

  const [areaValues, setAreaValues] = useState<Record<string, string>>(initialAreas)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setMsg(null)
    const areaQuotas = Object.entries(areaValues)
      .filter(([, v]) => v.trim() !== '')
      .map(([area, v]) => ({ area, quota: Number(v) }))
      .filter(q => Number.isFinite(q.quota) && q.quota >= 0)

    startTransition(async () => {
      const res = await updateAdminDaysConfig({
        default_quota: Number(defaultQuota),
        reset_period: resetPeriod,
        areaQuotas,
      })
      if (res.error) setMsg({ ok: false, text: res.error })
      else {
        setMsg({ ok: true, text: 'Configuración guardada.' })
        router.refresh()
      }
    })
  }

  return (
    <div className="card card-pad col" style={{ gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 18 }}>Configuración de cupos</h2>
        <p className="texto-s silencio" style={{ marginTop: 2 }}>
          Define el cupo por defecto, la renovación y los cupos por área. Las áreas sin valor usan el cupo por defecto.
        </p>
      </div>

      <div className="fila" style={{ gap: 16, flexWrap: 'wrap' }}>
        <div className="col" style={{ gap: 6 }}>
          <label htmlFor="cfg-default" className="texto-s" style={{ fontWeight: 600 }}>Cupo por defecto</label>
          <input
            id="cfg-default"
            type="number"
            min={0}
            max={365}
            className="input"
            style={{ width: 140 }}
            value={defaultQuota}
            onChange={e => setDefaultQuota(e.target.value)}
          />
        </div>
        <div className="col" style={{ gap: 6 }}>
          <label htmlFor="cfg-reset" className="texto-s" style={{ fontWeight: 600 }}>Renovación</label>
          <select
            id="cfg-reset"
            className="select"
            style={{ width: 220 }}
            value={resetPeriod}
            onChange={e => setResetPeriod(e.target.value as AdminDayResetPeriod)}
          >
            <option value="anual">Anual (se reinicia el 1 de enero)</option>
            <option value="fijo">Fijo (sin renovación)</option>
          </select>
        </div>
      </div>

      <div className="col" style={{ gap: 8 }}>
        <span className="texto-s" style={{ fontWeight: 600 }}>Cupo por área <span className="silencio">(opcional)</span></span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {AREAS_TRABAJO.map(area => (
            <div key={area} className="fila" style={{ gap: 10 }}>
              <label htmlFor={`area-${area}`} className="crece texto-s">{area}</label>
              <input
                id={`area-${area}`}
                type="number"
                min={0}
                max={365}
                className="input"
                style={{ width: 90 }}
                placeholder={String(config.default_quota)}
                value={areaValues[area] ?? ''}
                onChange={e => setAreaValues(prev => ({ ...prev, [area]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      {msg && (
        <p className="texto-s" style={{ fontWeight: 600, color: msg.ok ? 'var(--ok)' : 'var(--peligro)' }}>{msg.text}</p>
      )}

      <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={isPending} onClick={handleSave}>
        {isPending ? 'Guardando…' : 'Guardar configuración'}
      </button>
    </div>
  )
}
