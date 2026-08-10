'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AreaCompliance } from '@/lib/actions/analytics'
import { ChartTooltip, TablaDatos } from './ChartTooltip'
import { BARRA_MAX, EJE_TICK, PELIGRO, REJILLA, SERIE, TINTA_3 } from './chartTheme'

/**
 * Cumplimiento por área de trabajo.
 *
 * Barras horizontales porque los nombres de área son largos ("Auxiliar de
 * enfermería" no cabe rotado). Un solo tono: acá se compara magnitud, no
 * identidad — pintar cada área de un color distinto sugeriría que el color
 * significa algo.
 *
 * Las áreas bajo el 50% se marcan en rojo de estado y llevan además el rótulo
 * de porcentaje: el color nunca es el único canal.
 */
const UMBRAL_CRITICO = 50

export function ComplianceByAreaChart({ data }: { data: AreaCompliance[] }) {
  if (data.length === 0) {
    return (
      <p className="silencio texto-s" style={{ padding: '28px 0', textAlign: 'center' }}>
        Todavía no hay trabajadores activos con áreas asignadas.
      </p>
    )
  }

  const criticas = data.filter((d) => d.rate < UMBRAL_CRITICO).length

  return (
    <>
      <div style={{ width: '100%', height: Math.max(160, data.length * 34 + 28) }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 44, bottom: 4, left: 4 }}
            barCategoryGap="24%"
          >
            <CartesianGrid stroke={REJILLA} strokeWidth={1} horizontal={false} />

            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={EJE_TICK}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="area"
              tick={{ ...EJE_TICK, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={132}
            />

            <Tooltip
              cursor={{ fill: 'rgba(44, 74, 158, 0.05)' }}
              content={({ active, payload }) => {
                const fila = payload?.[0]?.payload as AreaCompliance | undefined
                return (
                  <ChartTooltip
                    active={active}
                    label={fila?.area}
                    valor={fila?.rate}
                    sufijo="%"
                    detalle={
                      fila
                        ? `${fila.completed} de ${fila.assigned} cursos · ${fila.workers} trabajador${fila.workers !== 1 ? 'es' : ''}`
                        : undefined
                    }
                    color={fila && fila.rate < UMBRAL_CRITICO ? PELIGRO : SERIE}
                  />
                )
              }}
            />

            <Bar dataKey="rate" barSize={BARRA_MAX} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.area} fill={d.rate < UMBRAL_CRITICO ? PELIGRO : SERIE} />
              ))}
              {/* Valor fuera de la barra: dentro no cabe con las barras cortas,
                  que son justamente las que más importa leer. */}
              <LabelList
                dataKey="rate"
                position="right"
                offset={8}
                formatter={(v: React.ReactNode) => `${v}%`}
                style={{ fill: TINTA_3, fontSize: 11.5, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="texto-s silencio-3">
        {criticas > 0
          ? `${criticas} área${criticas !== 1 ? 's' : ''} bajo el ${UMBRAL_CRITICO}% de cumplimiento.`
          : `Ninguna área bajo el ${UMBRAL_CRITICO}% de cumplimiento.`}
      </p>

      <TablaDatos
        columnas={['Área de trabajo', 'Cumplimiento']}
        filas={data.map((d) => [
          `${d.area} (${d.workers})`,
          `${d.rate}% — ${d.completed}/${d.assigned}`,
        ])}
      />
    </>
  )
}
