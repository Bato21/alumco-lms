// Primitivas del sistema de diseño DIDASKO — port de lib/ui.jsx (tipado)
import type { CSSProperties, ReactNode } from 'react'
import { Icono, type IconoNombre } from './Icono'

export { Icono }
export type { IconoNombre }

type Tono = 'neutro' | 'ok' | 'peligro' | 'aviso' | 'info'

/* ---------- Marca ---------- */
export function Gota({ s = 26, color = 'var(--ambar)' }: { s?: number; color?: string }) {
  return (
    <svg width={s} height={s * 1.18} viewBox="0 0 30 36" fill="none" aria-hidden="true">
      <path d="M15 1.5C15 1.5 3 16.2 3 23.4 3 30.1 8.4 34.5 15 34.5s12-4.4 12-11.1C27 16.2 15 1.5 15 1.5Z" fill={color} />
      <ellipse cx="10.6" cy="20.5" rx="2.7" ry="4" transform="rotate(-18 10.6 20.5)" fill="#fff" opacity="0.55" />
    </svg>
  )
}

export function MarcaAlumco({ claro = false, compacta = false }: { claro?: boolean; compacta?: boolean }) {
  return (
    <div className="fila" style={{ gap: 10 }}>
      <Gota s={compacta ? 20 : 24} />
      <div style={{ lineHeight: 1.1 }}>
        <div
          style={{
            fontFamily: 'var(--fuente-display)',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            fontSize: compacta ? 19 : 21,
            color: claro ? '#fff' : 'var(--azul-900)',
          }}
        >
          alumco
        </div>
        {!compacta && (
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: claro ? 'rgba(255,255,255,0.55)' : 'var(--tinta-3)',
            }}
          >
            Kimün<span style={{ color: 'var(--ambar)' }}>Ko</span> · capacitación
          </div>
        )}
      </div>
    </div>
  )
}

/* Onda decorativa (motivo de agua) */
export function Onda({
  color = 'rgba(255,255,255,0.10)',
  alto = 46,
  voltear = false,
}: {
  color?: string
  alto?: number
  voltear?: boolean
}) {
  return (
    <svg
      className="onda"
      viewBox="0 0 600 60"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: alto, transform: voltear ? 'scaleY(-1)' : 'none' }}
    >
      <path d="M0 38 C 90 10 170 56 280 34 C 380 14 460 50 600 26 L 600 60 L 0 60 Z" fill={color} />
      <path d="M0 48 C 120 26 220 60 330 44 C 440 28 520 54 600 40 L 600 60 L 0 60 Z" fill={color} opacity="0.7" />
    </svg>
  )
}

/* ---------- Primitivas ---------- */
export function Avatar({ nombre, s = 38, tono }: { nombre: string; s?: number; tono?: 'ambar' }) {
  const ini = nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return (
    <span
      className="avatar"
      style={{
        width: s,
        height: s,
        fontSize: s * 0.38,
        background: tono === 'ambar' ? 'var(--ambar-100)' : undefined,
        color: tono === 'ambar' ? 'var(--ambar-700)' : undefined,
      }}
    >
      {ini}
    </span>
  )
}

export function Badge({ tono = 'neutro', children, punto = true }: { tono?: Tono; children: ReactNode; punto?: boolean }) {
  return (
    <span className={'badge badge-' + tono}>
      {punto && <span className="badge-dot"></span>}
      {children}
    </span>
  )
}

const BADGE_ESTADO: Record<string, [Tono, string]> = {
  publicado: ['ok', 'Publicado'],
  borrador: ['neutro', 'Borrador'],
  vigente: ['ok', 'Vigente'],
  'por-vencer': ['aviso', 'Por vencer'],
  vencido: ['peligro', 'Vencido'],
  'al-dia': ['ok', 'Al día'],
  'en-riesgo': ['aviso', 'En riesgo'],
  atrasado: ['peligro', 'Atrasado'],
  completado: ['ok', 'Completado'],
  'en-curso': ['info', 'En curso'],
  pendiente: ['neutro', 'Pendiente'],
  disponible: ['info', 'Disponible'],
  bloqueado: ['neutro', 'Bloqueado'],
}

export function BadgeEstado({ estado }: { estado: string }) {
  const [tono, texto] = BADGE_ESTADO[estado] || (['neutro', estado] as [Tono, string])
  return <Badge tono={tono}>{texto}</Badge>
}

/**
 * Barra de progreso.
 *
 * `etiqueta` es opcional y sólo añade contexto: sin ella el rol
 * `progressbar` quedaba sin nombre accesible y un lector de pantalla
 * anunciaba «55 %» sin decir de qué (A11Y-17, criterios 1.3.1 y 4.1.2).
 * Pásala siempre que en la pantalla haya más de una barra.
 */
export function Progreso({ pct, azul = false, alto = 8, etiqueta }: { pct: number; azul?: boolean; alto?: number; etiqueta?: string }) {
  return (
    <div
      className={'progreso' + (azul ? ' progreso-azul' : '')}
      style={{ height: alto }}
      role="progressbar"
      aria-label={etiqueta ?? 'Progreso'}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${pct}% completado`}
    >
      <div style={{ width: pct + '%' }}></div>
    </div>
  )
}

export function Vacio({
  icono = 'cursos',
  titulo,
  texto,
  accion,
  onAccion,
}: {
  icono?: IconoNombre
  titulo: string
  texto: string
  accion?: string
  onAccion?: () => void
}) {
  return (
    <div className="vacio">
      <div className="vacio-icono">
        <Icono n={icono} s={30} />
      </div>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {accion && (
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onAccion}>
          {accion}
        </button>
      )}
    </div>
  )
}

export function Skeleton({
  w = '100%',
  h = 14,
  r = 8,
  style,
}: {
  w?: number | string
  h?: number | string
  r?: number
  style?: CSSProperties
}) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }}></div>
}

export function TarjetaStat({
  etiqueta,
  valor,
  detalle,
  tono,
  icono,
}: {
  etiqueta: string
  valor: ReactNode
  detalle?: ReactNode
  tono?: 'ambar' | 'peligro'
  icono: IconoNombre
}) {
  return (
    <div className="card card-pad fila" style={{ gap: 16, alignItems: 'flex-start' }}>
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: tono === 'ambar' ? 'var(--ambar-50)' : tono === 'peligro' ? 'var(--peligro-bg)' : 'var(--azul-50)',
          color: tono === 'ambar' ? 'var(--ambar-700)' : tono === 'peligro' ? 'var(--peligro)' : 'var(--azul-800)',
        }}
      >
        <Icono n={icono} s={22} />
      </span>
      <div className="crece">
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tinta-2)' }}>{etiqueta}</div>
        <div style={{ fontSize: 30, fontWeight: 640, fontFamily: 'var(--fuente-display)', lineHeight: 1.15, color: 'var(--tinta)' }}>
          {valor}
        </div>
        {detalle && <div className="texto-s silencio-3" style={{ marginTop: 2 }}>{detalle}</div>}
      </div>
    </div>
  )
}

/* Anillo de progreso (SVG) */
export function Anillo({
  pct,
  s = 92,
  grosor = 9,
  color = 'var(--ambar)',
  etiqueta,
}: {
  pct: number
  s?: number
  grosor?: number
  color?: string
  etiqueta?: ReactNode
}) {
  const r = (s - grosor) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} role="img" aria-label={`${pct}% completado`}>
      <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke="var(--arena-200)" strokeWidth={grosor} />
      <circle
        cx={s / 2}
        cy={s / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={grosor}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct / 100)}
        transform={`rotate(-90 ${s / 2} ${s / 2})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: s * 0.24, fontWeight: 640, fontFamily: 'var(--fuente-display)', fill: 'var(--tinta)' }}
      >
        {etiqueta != null ? etiqueta : pct + '%'}
      </text>
    </svg>
  )
}

/* Encabezado de página de contenido */
export function EncabezadoPagina({ titulo, sub, children }: { titulo: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="fila entra" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
      <div className="crece" style={{ minWidth: 260 }}>
        <h1 className="t-display" style={{ fontSize: 32, color: 'var(--tinta)' }}>{titulo}</h1>
        {sub && <p className="silencio" style={{ marginTop: 4, fontSize: 15 }}>{sub}</p>}
      </div>
      {children}
    </div>
  )
}
