import Link from 'next/link'
import { Icono, Gota } from '@/components/alumco/ds'
import type { EstacionCurso } from './CauceCursos'

/**
 * "Tu recorrido · capas" — versión horizontal del avance (mockup 1a "Horizonte").
 * Cada curso es una capa del dibujo de la gota de Kimün: al completarlo, su nodo
 * se entinta y el agua avanza por el cauce hasta la capa actual.
 */
interface RecorridoCapasProps {
  estaciones: EstacionCurso[]
}

const AGUA = 'var(--azul-700)'
const SECO = 'repeating-linear-gradient(90deg, #d8cfb8 0 6px, transparent 6px 12px)'

export function RecorridoCapas({ estaciones }: RecorridoCapasProps) {
  // Estación actual: la marcada como actual o, si no hay, la última completada.
  let indiceActual = estaciones.findIndex((e) => e.esActual)
  if (indiceActual === -1) {
    indiceActual = estaciones.map((e) => e.estado === 'completado').lastIndexOf(true)
  }

  return (
    // `role="list"` explícito: con `list-style: none` Safari/VoiceOver deja
    // de anunciar la lista (WebKit #170179).
    <ul className="recorrido-capas" role="list" aria-label="Tu recorrido de cursos">
      {estaciones.map((e, i) => {
        const hecho = e.estado === 'completado'
        const actual = i === indiceActual && !hecho

        const aguaLlega = hecho || i <= indiceActual
        const aguaSigue = hecho || i < indiceActual
        const lineaIzq = i === 0 ? 'transparent' : aguaLlega ? AGUA : SECO
        const lineaDer = i === estaciones.length - 1 ? 'transparent' : aguaSigue ? AGUA : SECO

        const subColor = hecho ? 'var(--ok)' : actual ? 'var(--ambar-700)' : 'var(--tinta-3)'
        const sub = `Curso ${i + 1}`

        return (
          // Antes el `role="listitem"` iba sobre el propio <Link> y ANULABA
          // su rol de enlace: el lector anunciaba «elemento de lista», nunca
          // «enlace», y la persona no sabía que se podía activar (A11Y-11).
          <li className="recorrido-item" key={e.id}>
          <Link href={e.href} className="recorrido-col">
            <div className="recorrido-linea">
              <span className="recorrido-conector" style={{ background: lineaIzq }} />
              <span
                className={'recorrido-nodo ' + (hecho ? 'es-hecho' : actual ? 'es-actual' : 'es-seco')}
                aria-hidden="true"
              >
                {hecho ? (
                  <Icono n="check" s={20} />
                ) : actual ? (
                  <Gota s={20} color="#fff" />
                ) : (
                  <span className="recorrido-punto" />
                )}
                {actual && <span className="cauce-onda" />}
              </span>
              <span className="recorrido-conector" style={{ background: lineaDer }} />
            </div>
            <div className="recorrido-texto">
              <div className="recorrido-titulo">{e.titulo}</div>
              <div className="recorrido-sub" style={{ color: subColor }}>{sub}</div>
            </div>
          </Link>
          </li>
        )
      })}
    </ul>
  )
}
