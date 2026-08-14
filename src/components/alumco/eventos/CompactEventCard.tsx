import Link from 'next/link'
import { Icono } from '@/components/alumco/ds'
import type { EventoResumen } from '@/lib/eventos/proximoEvento'

// Estado 2: tarjeta compacta del próximo evento, a la derecha del bloque azul
// de bienvenida (o arriba, apilada, cuando no hay espacio). No compite con el
// bloque principal: chica, sobria, un solo enlace de acción.
//
// En móvil se apila en columna. La versión anterior ponía los cuatro bloques en
// fila con `shrink-0`: sumaban ~436px de ancho mínimo dentro de una columna de
// 330px, así que el navegador alejaba TODA la página de inicio para que cupiera
// (innerWidth 459 en vez de 375/390/412). Ver
// docs/superpowers/specs/2026-08-05-mobile-colaborador-design.md
export function CompactEventCard({ evento }: { evento: EventoResumen }) {
  const dias = evento.diasRestantes

  return (
    <div
      className="card flex flex-col gap-2 p-4 items-start lg:w-[200px] lg:shrink-0"
      data-screen-label="Card evento compacta"
    >
      {/* Etiqueta */}
      <span className="t-eyebrow"><span aria-hidden="true">◆</span> Próximo evento</span>

      {/* Día y mes destacados */}
      <div className="flex items-baseline gap-1.5 lg:mt-1 flex-wrap">
        <span className="t-display" style={{ fontSize: 30, lineHeight: 1, color: 'var(--azul-900)' }}>{evento.dia}</span>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ambar-700)' }}>{evento.mes}</span>
        {dias > 0 && (
          <span className="badge badge-neutro" style={{ marginLeft: 6 }}>
            {dias}d
          </span>
        )}
      </div>

      {/* Nombre corto + categoría */}
      <div className="min-w-0 w-full">
        <p className="recorte" style={{ fontWeight: 600, fontSize: 15, color: 'var(--tinta)' }}>{evento.title}</p>
        {evento.categoria && (
          <p className="recorte texto-s silencio-3" style={{ marginTop: 2 }}>{evento.categoria}</p>
        )}
      </div>

      {/* Enlace de acción */}
      <Link href={evento.href} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
        Ver detalles <Icono n="chevR" s={15} />
      </Link>
    </div>
  )
}
