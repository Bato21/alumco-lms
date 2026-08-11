import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { getViewerIsDemo } from '@/lib/auth/demoScope'
import { EncabezadoPagina, Badge, Vacio, Icono } from '@/components/alumco/ds'
import { EVENT_TYPE_LABELS, EVENT_TYPE_EMOJI, type EventRecord } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Gestión de eventos' }
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
  const isDemo = await getViewerIsDemo()

  const [{ data: events }, { data: sedes }, { data: sections }, { data: tasks }] = await Promise.all([
    adminClient
      .from('events')
      .select('*')
      .eq('is_demo', isDemo)
      .order('event_date', { ascending: false }) as unknown as Promise<{ data: EventRecord[] | null }>,
    adminClient
      .from('sedes')
      .select('id, nombre') as unknown as Promise<{ data: { id: string; nombre: string }[] | null }>,
    adminClient
      .from('event_sections')
      .select('id, event_id') as unknown as Promise<{ data: { id: string; event_id: string }[] | null }>,
    adminClient
      .from('event_tasks')
      .select('id, section_id, status') as unknown as Promise<{ data: { id: string; section_id: string; status: string }[] | null }>,
  ])

  const sedeNombrePorId = new Map((sedes ?? []).map(s => [s.id, s.nombre]))
  const eventoIdPorSeccionId = new Map((sections ?? []).map(s => [s.id, s.event_id]))

  // Avance de tareas por evento: se arma en memoria porque las tareas están
  // relacionadas a un evento vía su sección (event_tasks.section_id →
  // event_sections.event_id), no hay una FK directa a event_tasks.event_id.
  const avancePorEvento = new Map<string, { hechas: number; total: number }>()
  for (const t of tasks ?? []) {
    const eventId = eventoIdPorSeccionId.get(t.section_id)
    if (!eventId) continue
    const actual = avancePorEvento.get(eventId) ?? { hechas: 0, total: 0 }
    actual.total += 1
    if (t.status === 'completada') actual.hechas += 1
    avancePorEvento.set(eventId, actual)
  }

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
              {list.map(e => {
                const avance = avancePorEvento.get(e.id)
                return (
                  <Link
                    key={e.id}
                    href={`/admin/eventos/${e.id}`}
                    className="card card-hover card-pad col"
                    style={{ gap: 8, textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="fila" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="texto-s silencio-3" style={{ fontWeight: 600 }}>
                        <span aria-hidden="true">{EVENT_TYPE_EMOJI[e.event_type]}</span> {EVENT_TYPE_LABELS[e.event_type]}
                      </span>
                      <Badge tono={ESTADO_TONO[e.status] ?? 'neutro'}>{ESTADO_LABEL[e.status] ?? e.status}</Badge>
                    </div>
                    <h3 style={{ fontWeight: 600, fontSize: 16 }}>{e.title}</h3>
                    <p className="texto-s silencio-3">
                      {new Date(e.event_date + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {' · '}
                      {sedeNombrePorId.get(e.sede_id) ?? 'Sede desconocida'}
                    </p>
                    {avance && avance.total > 0 && (
                      <p className="texto-s silencio-3">{avance.hechas}/{avance.total} tareas listas</p>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
