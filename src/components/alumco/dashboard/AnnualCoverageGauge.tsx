import type { AnnualCoverage } from '@/lib/actions/analytics'
import { Icono } from '@/components/alumco/ds'
import { AVISO, OK, PELIGRO, SERIE_PISTA, SURFACE, TINTA, TINTA_3 } from './chartTheme'

/**
 * Cobertura anual vs. objetivo.
 *
 * Es un medidor, no un gráfico: un solo cociente contra un límite. La pista
 * vacía es un paso claro de la misma rampa y el relleno carga la severidad,
 * así el estado se lee de un vistazo a lo largo de todo el arco.
 *
 * El objetivo va marcado con una muesca sobre el arco — sin ella el número
 * solo no dice si vamos bien. Y el estado se dice además con icono y texto,
 * nunca solo con el color.
 */

const R = 82
const CX = 100
const CY = 100
const LARGO_ARCO = Math.PI * R

function punto(pct: number, radio: number): [number, number] {
  const rad = ((180 - pct * 1.8) * Math.PI) / 180
  return [CX + radio * Math.cos(rad), CY - radio * Math.sin(rad)]
}

function estado(actual: number, target: number) {
  if (actual >= target) {
    return { color: OK, icono: 'check' as const, texto: 'En el objetivo' }
  }
  if (actual >= target - 15) {
    return { color: AVISO, icono: 'reloj' as const, texto: 'Cerca del objetivo' }
  }
  return { color: PELIGRO, icono: 'alerta' as const, texto: 'Bajo el objetivo' }
}

export function AnnualCoverageGauge({ data }: { data: AnnualCoverage }) {
  const { actual, target, covered, totalWorkers, year } = data
  const { color, icono, texto } = estado(actual, target)

  const [ax, ay] = punto(target, R - 12)
  const [bx, by] = punto(target, R + 9)
  const [lx, ly] = punto(target, R + 22)

  const arco = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`

  return (
    <div className="col" style={{ gap: 12, alignItems: 'center' }}>
      <svg
        viewBox="0 0 200 128"
        style={{ width: '100%', maxWidth: 260, height: 'auto' }}
        role="img"
        aria-label={`Cobertura anual ${year}: ${actual}% de ${totalWorkers} trabajadores con certificado. Objetivo ${target}%. ${texto}.`}
      >
        {/* Pista */}
        <path
          d={arco}
          fill="none"
          stroke={SERIE_PISTA}
          strokeWidth={13}
          strokeLinecap="round"
        />
        {/* Relleno */}
        <path
          d={arco}
          fill="none"
          stroke={color}
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={`${(LARGO_ARCO * actual) / 100} ${LARGO_ARCO}`}
        />

        {/* Muesca del objetivo — anillo de superficie para que se lea sobre el relleno */}
        <line
          x1={ax} y1={ay} x2={bx} y2={by}
          stroke={SURFACE} strokeWidth={5} strokeLinecap="round"
        />
        <line
          x1={ax} y1={ay} x2={bx} y2={by}
          stroke={TINTA} strokeWidth={2} strokeLinecap="round"
        />
        <text
          x={lx} y={ly}
          textAnchor={target > 55 ? 'end' : target < 45 ? 'start' : 'middle'}
          style={{ fill: TINTA_3, fontSize: 9.5, fontWeight: 600 }}
        >
          meta {target}%
        </text>

        {/* Cifra protagonista */}
        <text
          x={CX} y={CY - 14}
          textAnchor="middle"
          style={{ fill: TINTA, fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          {actual}%
        </text>
        <text
          x={CX} y={CY + 4}
          textAnchor="middle"
          style={{ fill: TINTA_3, fontSize: 10 }}
        >
          cobertura {year}
        </text>
      </svg>

      {/* Estado con icono + texto: el color no es el único canal */}
      <span
        className="fila"
        style={{ gap: 6, color, fontWeight: 640, fontSize: 13.5, marginTop: -6 }}
      >
        <Icono n={icono} s={16} />
        {texto}
      </span>

      <p className="texto-s silencio-3" style={{ textAlign: 'center', lineHeight: 1.45 }}>
        <strong style={{ color: 'var(--tinta)' }}>{covered}</strong> de {totalWorkers} trabajadores
        activos tienen al menos un certificado emitido en {year}.
      </p>
    </div>
  )
}
