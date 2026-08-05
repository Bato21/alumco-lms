import Link from 'next/link'
import { Icono } from '@/components/alumco/ds'
import type { EventoResumen } from '@/lib/eventos/proximoEvento'

// Estado 2: tarjeta compacta del próximo evento, a la derecha del bloque azul
// de bienvenida (o abajo, horizontal, cuando no hay espacio). No compite con el
// bloque principal: chica, sobria, un solo enlace de acción.
export function CompactEventCard({ evento }: { evento: EventoResumen }) {
  const dias = evento.diasRestantes

  return (
    <div
      className="card flex flex-row lg:flex-col gap-3 lg:gap-2 p-4 items-center lg:items-start lg:w-[200px] lg:shrink-0"
      data-screen-label="Card evento compacta"
    >
      {/* Etiqueta */}
      <span className="t-eyebrow shrink-0" style={{ whiteSpace: 'nowrap' }}>◆ Próximo evento</span>

      {/* Día y mes destacados */}
      <div className="flex items-baseline gap-1.5 lg:mt-1 shrink-0">
        <span className="t-display" style={{ fontSize: 30, lineHeight: 1, color: 'var(--azul-900)' }}>{evento.dia}</span>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ambar-700)' }}>{evento.mes}</span>
        {dias > 0 && (
          <span className="badge badge-neutro" style={{ marginLeft: 6 }}>
            {dias}d
          </span>
        )}
      </div>

      {/* Nombre corto + categoría */}
      <div className="min-w-0 flex-1 lg:flex-none w-full">
        <p className="recorte" style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--tinta)' }}>{evento.title}</p>
        {evento.categoria && (
          <p className="recorte texto-s silencio-3" style={{ marginTop: 2 }}>{evento.categoria}</p>
        )}
      </div>

      {/* Enlace de acción */}
      <Link
        href={evento.href}
        className="btn btn-ghost btn-sm shrink-0"
        style={{ alignSelf: 'flex-start', paddingLeft: 8, paddingRight: 8 }}
      >
        Ver detalles <Icono n="chevR" s={15} />
      </Link>
    </div>
  )
}
