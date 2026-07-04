import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { EncabezadoPagina, Badge, Vacio, Icono } from '@/components/alumco/ds'
import { EVENT_TYPE_LABELS, type EventRecord } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Eventos | Alumco LMS' }
export const dynamic = 'force-dynamic'

const ESTADO_TONO: Record<string, 'neutro' | 'ok' | 'peligro' | 'aviso' | 'info'> = {
  planificacion: 'aviso',
  activo: 'ok',
  finalizado: 'neutro',
}
const ESTADO_LABEL: Record<string, string> = {
  planificacion: 'En planificación',
  activo: 'Activo',
  finalizado: 'Finalizado',
}

export default async function EventosAdminPage() {
  const adminClient = await createAdminClient()
  const { data: events } = await adminClient
    .from('events')
    .select('*')
    .order('event_date', { ascending: false }) as unknown as { data: EventRecord[] | null }

  const porAno = new Map<number, EventRecord[]>()
  for (const e of events ?? []) {
    const year = new Date(e.event_date + 'T00:00:00').getFullYear()
    porAno.set(year, [...(porAno.get(year) ?? []), e])
  }

  return (
    <div data-screen-label="Admin · Eventos">
      <EncabezadoPagina titulo="Eventos" sub="18 de septiembre, Navidad y Año Nuevo — organiza las celebraciones de la residencia">
        <Link href="/admin/eventos/nuevo" className="btn btn-primary">
          <Icono n="mas" s={18} /> Nuevo evento
        </Link>
      </EncabezadoPagina>

      {(events ?? []).length === 0 ? (
        <div className="card">
          <Vacio
            icono="calendario"
            titulo="Aún no hay eventos"
            texto="Crea el primero para organizar la próxima celebración."
          />
        </div>
      ) : (
        [...porAno.entries()].map(([year, list]) => (
          <section key={year} className="entra" style={{ marginBottom: 28 }}>
            <h2 className="texto-s silencio-3" style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>
              {year}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map(e => (
                <Link
                  key={e.id}
                  href={`/admin/eventos/${e.id}`}
                  className="card card-hover card-pad col"
                  style={{ gap: 8, textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="fila" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="texto-s silencio-3" style={{ fontWeight: 600 }}>{EVENT_TYPE_LABELS[e.event_type]}</span>
                    <Badge tono={ESTADO_TONO[e.status] ?? 'neutro'}>{ESTADO_LABEL[e.status] ?? e.status}</Badge>
                  </div>
                  <h3 style={{ fontWeight: 600, fontSize: 16 }}>{e.title}</h3>
                  <p className="texto-s silencio-3">
                    {new Date(e.event_date + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
