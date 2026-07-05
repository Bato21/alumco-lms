import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EncabezadoPagina, Badge, Vacio } from '@/components/alumco/ds'
import { EVENT_TYPE_LABELS, type EventRecord } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Eventos | Alumco LMS' }
export const dynamic = 'force-dynamic'

export default async function EventosPage() {
  const supabase = await createClient()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('status', ['activo', 'finalizado'])
    .order('event_date', { ascending: false }) as unknown as { data: EventRecord[] | null }

  return (
    <div className="col" style={{ gap: 24 }} data-screen-label="Trabajador · Eventos">
      <EncabezadoPagina titulo="Eventos" sub="Celebraciones de la residencia — revisa las fotos y tus tareas" />

      {(events ?? []).length === 0 ? (
        <div className="card">
          <Vacio
            icono="calendario"
            titulo="Aún no hay eventos"
            texto="Cuando se publique una celebración aparecerá aquí."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(events ?? []).map(e => (
            <Link
              key={e.id}
              href={`/eventos/${e.id}`}
              className="card card-hover card-pad col entra"
              style={{ gap: 8, textDecoration: 'none', color: 'inherit' }}
            >
              <div className="fila" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="texto-s silencio-3" style={{ fontWeight: 600 }}>{EVENT_TYPE_LABELS[e.event_type]}</span>
                {e.status === 'activo' && <Badge tono="ok">En curso</Badge>}
              </div>
              <h3 style={{ fontWeight: 600, fontSize: 16 }}>{e.title}</h3>
              <p className="texto-s silencio-3">
                {new Date(e.event_date + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
