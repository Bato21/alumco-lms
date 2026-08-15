'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MonthlyCertificates } from '@/lib/actions/analytics'
import { ChartTooltip, TablaDatos } from './ChartTooltip'
import { EJE_TICK, REJILLA, SERIE, SURFACE } from './chartTheme'

/**
 * Certificados emitidos mes a mes.
 *
 * Serie única (no hay identidades que distinguir), así que un tono y sin caja
 * de leyenda: el título ya dice qué se está mirando. El último punto va
 * marcado y rotulado — el dato que la directora busca primero es "¿cómo vamos
 * este mes?".
 */
export function CertificatesMonthlyChart({ data }: { data: MonthlyCertificates[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const ultimo = data[data.length - 1]

  if (total === 0) {
    return (
      <p className="silencio texto-s" style={{ padding: '28px 0', textAlign: 'center' }}>
        Todavía no hay certificados emitidos en este período.
      </p>
    )
  }

  return (
    <>
      <div style={{ width: '100%', height: 210 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 14, right: 16, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="washCertificados" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIE} stopOpacity={0.16} />
                <stop offset="100%" stopColor={SERIE} stopOpacity={0.01} />
              </linearGradient>
            </defs>

            {/* Rejilla recesiva: solo horizontal, hairline, sólida */}
            <CartesianGrid stroke={REJILLA} strokeWidth={1} vertical={false} />

            <XAxis
              dataKey="label"
              tick={EJE_TICK}
              tickLine={false}
              axisLine={{ stroke: REJILLA }}
              interval="preserveStartEnd"
              minTickGap={18}
            />
            <YAxis
              tick={EJE_TICK}
              tickLine={false}
              axisLine={false}
              width={44}
              allowDecimals={false}
            />

            <Tooltip
              cursor={{ stroke: REJILLA, strokeWidth: 1 }}
              content={({ active, payload, label }) => (
                <ChartTooltip
                  active={active}
                  label={String(label ?? '')}
                  valor={payload?.[0]?.value as number | undefined}
                  detalle="certificados emitidos"
                  color={SERIE}
                />
              )}
            />

            <Area
              type="monotone"
              dataKey="count"
              name="Certificados"
              stroke={SERIE}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="url(#washCertificados)"
              // Un punto por mes satura la línea; solo el último se marca,
              // con anillo de superficie para que se lea sobre el trazo.
              dot={false}
              activeDot={{ r: 5, fill: SERIE, stroke: SURFACE, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="texto-s silencio-3" style={{ marginTop: 2 }}>
        {total.toLocaleString('es-CL')} certificados en el período ·{' '}
        <strong style={{ color: 'var(--tinta)' }}>{ultimo?.count ?? 0}</strong> en {ultimo?.label}
      </p>

      <TablaDatos
        titulo="Certificados emitidos mes a mes"
        columnas={['Mes', 'Certificados']}
        filas={data.map((d) => [d.label, String(d.count)])}
      />
    </>
  )
}
