import Link from 'next/link'
import { Icono, Gota, BadgeEstado, Progreso } from '@/components/alumco/ds'

export type EstadoCurso = 'completado' | 'en-curso' | 'pendiente'

export interface EstacionCurso {
  id: string
  titulo: string
  href: string
  estado: EstadoCurso
  progreso: number
  modulos: number
  esActual: boolean
  deadlineStatus?: 'overdue' | 'soon' | 'ok' | null
}

interface CauceCursosProps {
  estaciones: EstacionCurso[]
  /** Nombre del recorrido para el hito final (certificación). */
  todoCompleto?: boolean
}

const COLOR_AGUA = 'var(--azul-700)'
const COLOR_SECO = 'var(--borde)'

/**
 * "Cauce de aprendizaje" — recorrido vertical estilo sendero (Duolingo)
 * tematizado como un río (KimünKo: Kimün = conocimiento, Ko = agua).
 * El agua "baja" por el cauce hasta la estación actual, marcada con la gota.
 */
export function CauceCursos({ estaciones, todoCompleto = false }: CauceCursosProps) {
  // Índice de la estación actual (donde vive la gota). Si no hay una marcada
  // como actual, el agua llega hasta la última completada.
  let indiceActual = estaciones.findIndex((e) => e.esActual)
  if (indiceActual === -1) {
    const ultimaHecha = estaciones.map((e) => e.estado === 'completado').lastIndexOf(true)
    indiceActual = ultimaHecha
  }

  return (
    <div className="cauce" role="list" aria-label="Cauce de aprendizaje">
      {estaciones.map((e, i) => {
        const hecho = e.estado === 'completado'
        const actual = i === indiceActual && !hecho
        const lado = i % 2 === 0 ? 'izq' : 'der'

        // Nivel del agua: la línea superior se moja al llegar a esta estación
        // (completada o actual); la inferior sigue mojada solo si ya la pasaste.
        const aguaLlega = hecho || i <= indiceActual
        const aguaSigue = hecho || i < indiceActual
        const lineaTop = i === 0 ? 'transparent' : aguaLlega ? COLOR_AGUA : COLOR_SECO
        const lineaBot = aguaSigue ? COLOR_AGUA : COLOR_SECO

        const cta = hecho ? 'Repasar' : e.estado === 'en-curso' ? 'Continuar' : 'Comenzar'

        const chipVence =
          !hecho && e.deadlineStatus === 'overdue'
            ? { txt: 'Vencido', bg: 'var(--peligro-bg)', fg: 'var(--peligro)' }
            : !hecho && e.deadlineStatus === 'soon'
              ? { txt: 'Vence pronto', bg: 'var(--aviso-bg)', fg: 'var(--aviso)' }
              : null

        return (
          <div className="cauce-fila" data-lado={lado} role="listitem" key={e.id}>
            <div
              className="cauce-rail"
              style={{ ['--linea-top' as string]: lineaTop, ['--linea-bot' as string]: lineaBot }}
            >
              <span
                className={
                  'cauce-nodo ' + (hecho ? 'es-hecho' : actual ? 'es-actual' : 'es-seco')
                }
                aria-hidden="true"
              >
                {hecho ? (
                  <Icono n="check" s={24} />
                ) : actual ? (
                  <Gota s={22} color="#fff" />
                ) : (
                  <span className="cauce-punto" />
                )}
                {actual && <span className="cauce-onda" />}
              </span>
            </div>

            <article className={'card card-hover cauce-card' + (actual ? ' es-actual' : '')}>
              <div className="fila" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <BadgeEstado estado={e.estado} />
                {chipVence && (
                  <span
                    className="fila"
                    style={{
                      gap: 5,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '3px 9px',
                      borderRadius: 999,
                      background: chipVence.bg,
                      color: chipVence.fg,
                    }}
                  >
                    <Icono n="reloj" s={14} /> {chipVence.txt}
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: 17, lineHeight: 1.3 }}>{e.titulo}</h3>

              <div className="fila texto-s silencio" style={{ gap: 6, marginTop: 4 }}>
                <Icono n="doc" s={15} /> {e.modulos} módulos
              </div>

              {e.estado === 'en-curso' && e.progreso > 0 && (
                <div className="col" style={{ gap: 5, marginTop: 10 }}>
                  <div className="fila texto-s">
                    <span className="crece silencio">Tu avance</span>
                    <strong>{e.progreso}%</strong>
                  </div>
                  <Progreso pct={e.progreso} />
                </div>
              )}

              <Link
                href={e.href}
                className={'btn btn-sm ' + (hecho ? 'btn-secondary' : 'btn-primary')}
                style={{ marginTop: 12, alignSelf: 'flex-start' }}
              >
                {actual ? <Icono n="play" s={16} /> : null}
                {cta}
              </Link>
            </article>
          </div>
        )
      })}

      {/* Hito final: certificación */}
      <div className="cauce-fila cauce-meta" data-lado="izq" role="listitem">
        <div
          className="cauce-rail"
          style={{ ['--linea-top' as string]: todoCompleto ? COLOR_AGUA : COLOR_SECO, ['--linea-bot' as string]: 'transparent' }}
        >
          <span className={'cauce-nodo cauce-nodo-meta ' + (todoCompleto ? 'es-logrado' : 'es-seco')} aria-hidden="true">
            <Icono n="certificado" s={24} />
          </span>
        </div>
        <div className="cauce-meta-texto">
          <h3 style={{ fontSize: 16 }}>{todoCompleto ? '¡Recorrido completo!' : 'Meta: certificación'}</h3>
          <p className="texto-s silencio" style={{ marginTop: 2 }}>
            {todoCompleto
              ? 'Completaste todos tus cursos. Revisa tus certificados.'
              : 'Completa tus cursos para obtener tu certificación.'}
          </p>
        </div>
      </div>
    </div>
  )
}
