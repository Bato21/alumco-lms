import type { ReactNode } from 'react'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getViewerIsDemo } from '@/lib/auth/demoScope'
import { Icono, Badge, Progreso } from '@/components/alumco/ds'
import { TaskChecklist } from './TaskChecklist'
import { AbrirDocumentoBoton } from './AbrirDocumentoBoton'
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_EMOJI,
  type EventRecord,
  type EventSection,
  type EventSectionMember,
  type EventTask,
} from '@/lib/types/database'

type DiasTono = 'neutro' | 'ok' | 'aviso'

function diasRestantes(eventDate: string): { texto: string; tono: DiasTono } {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(eventDate + 'T00:00:00')
  const dias = Math.round((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

  if (dias > 0) return { texto: `Faltan ${dias} día${dias === 1 ? '' : 's'}`, tono: dias <= 7 ? 'aviso' : 'neutro' }
  if (dias === 0) return { texto: '¡Es hoy!', tono: 'ok' }
  return { texto: 'En curso', tono: 'ok' }
}

// Card del próximo evento institucional (18, Navidad, Año Nuevo) para el
// dashboard de inicio (trabajador) y admin. Usa el cliente de USUARIO: RLS
// ya filtra los eventos por sede solo, así el filtrado es gratis. La única
// excepción es la resolución de nombres (profiles.full_name de OTROS
// usuarios), que requiere cliente admin — mismo patrón que el resto de la
// feature (ver admin/eventos/[id]/page.tsx).
// Todo el árbol del evento (secciones + tareas + miembros + docs) viene en
// UNA sola query con embeds de PostgREST: la versión anterior encadenaba
// hasta 5 round trips seriales y era el mayor costo del inicio. RLS se
// aplica igual en cada tabla embebida, así que el filtrado por sede y
// membresía sigue siendo gratis.
type EventoEmbebido = EventRecord & {
  event_sections: (EventSection & {
    event_tasks: EventTask[]
    event_section_members: Pick<EventSectionMember, 'section_id' | 'user_id' | 'member_role'>[]
  })[]
  event_documents: { id: string; doc_type: string }[]
}

export async function EventoDashboardCard({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const supabase = await createClient()
  const isDemo = await getViewerIsDemo()

  // Los nombres (solo vista colaborador) se piden en paralelo con el árbol
  // del evento: esperar los ids de encargados costaba un round trip serial.
  // La tabla profiles de la ONG es chica, así que traer id+nombre de los
  // activos completos sale más barato que encadenar.
  // El filtro is_demo es explícito porque un admin demo pasa la RLS de eventos
  // vía is_admin() y si no, vería eventos reales.
  const [{ data: events }, nombres] = await Promise.all([
    supabase
      .from('events')
      .select('*, event_sections(*, event_tasks(*), event_section_members(section_id, user_id, member_role)), event_documents(id, doc_type)')
      .in('status', ['planificacion', 'activo'])
      .eq('is_demo', isDemo)
      .order('event_date') as unknown as Promise<{ data: EventoEmbebido[] | null }>,
    isAdmin
      ? Promise.resolve(null)
      : createAdminClient().then(admin =>
          admin
            .from('profiles')
            .select('id, full_name')
            .eq('status', 'activo') as unknown as Promise<{ data: { id: string; full_name: string }[] | null }>
        ).then(r => r.data),
  ])

  if (!events || events.length === 0) return null

  // Evento más próximo por event_date (menor diferencia absoluta con hoy):
  // un evento 'activo' puede tener fecha pasada y aun así ser el relevante.
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const event = events.reduce((closest, e) => {
    const diff = Math.abs(new Date(e.event_date + 'T00:00:00').getTime() - hoy.getTime())
    const closestDiff = Math.abs(new Date(closest.event_date + 'T00:00:00').getTime() - hoy.getTime())
    return diff < closestDiff ? e : closest
  }, events[0])

  const sections = [...(event.event_sections ?? [])].sort((a, b) => a.order_index - b.order_index)
  const tareasDe = (s: EventoEmbebido['event_sections'][number]) =>
    [...(s.event_tasks ?? [])].sort((a, b) => a.order_index - b.order_index)

  const { texto: diasTexto, tono: diasTono } = diasRestantes(event.event_date)

  let cuerpo: ReactNode

  if (isAdmin) {
    const avancePorSeccion = new Map<string, { hechas: number; total: number }>()
    for (const s of sections) {
      for (const t of s.event_tasks ?? []) {
        const actual = avancePorSeccion.get(t.section_id) ?? { hechas: 0, total: 0 }
        actual.total += 1
        if (t.status === 'completada') actual.hechas += 1
        avancePorSeccion.set(t.section_id, actual)
      }
    }

    const docId = (event.event_documents ?? []).find(d => d.doc_type === 'dificultades_alimenticias')?.id ?? null

    cuerpo = (
      <div className="col" style={{ gap: 14 }}>
        {sections.length === 0 ? (
          <p className="texto-s silencio-3">Aún no hay secciones creadas para este evento.</p>
        ) : (
          <ul className="col" style={{ gap: 10, listStyle: 'none' }}>
            {sections.map(s => {
              const avance = avancePorSeccion.get(s.id) ?? { hechas: 0, total: 0 }
              return (
                <li key={s.id} className="col" style={{ gap: 4 }}>
                  <div className="fila" style={{ justifyContent: 'space-between' }}>
                    <span className="texto-s" style={{ fontWeight: 600 }}>{s.name}</span>
                    <span className="texto-s silencio-3">{avance.hechas}/{avance.total}</span>
                  </div>
                  {avance.total > 0 && <Progreso pct={Math.round((avance.hechas / avance.total) * 100)} alto={6} />}
                </li>
              )
            })}
          </ul>
        )}

        {docId ? (
          <AbrirDocumentoBoton docId={docId} label="Ver lista de dificultades alimenticias" />
        ) : (
          <div
            role="alert"
            className="fila"
            style={{ gap: 10, padding: '10px 12px', borderRadius: 'var(--radio-m)', border: '2px solid var(--aviso)', background: 'var(--aviso-bg)' }}
          >
            <Icono n="alerta" s={18} />
            <span className="texto-s" style={{ color: 'var(--aviso)', fontWeight: 600 }}>
              ⚠️ Falta la lista de dificultades alimenticias
            </span>
          </div>
        )}
      </div>
    )
  } else {
    const miembrosTodos = sections.flatMap(s => s.event_section_members ?? [])
    const myMemberships = miembrosTodos.filter(m => m.user_id === userId)

    const mySectionIds = myMemberships.map(m => m.section_id)
    const myRoleBySection = new Map(myMemberships.map(m => [m.section_id, m.member_role]))
    const misSecciones = sections.filter(s => mySectionIds.includes(s.id))

    if (misSecciones.length === 0) {
      cuerpo = <p className="texto-s silencio-3">No tienes secciones asignadas en este evento todavía.</p>
    } else {
      const allMembers = miembrosTodos.filter(m => mySectionIds.includes(m.section_id))

      const nameById = new Map((nombres ?? []).map(p => [p.id, p.full_name]))

      cuerpo = (
        <div className="col" style={{ gap: 16 }}>
          {misSecciones.map(s => {
            const encargadosNombres = (allMembers ?? [])
              .filter(m => m.section_id === s.id && m.member_role === 'encargado')
              .map(m => nameById.get(m.user_id) ?? '—')
            const canToggle = myRoleBySection.get(s.id) === 'encargado'
            const sTasks = tareasDe(s)

            return (
              <div key={s.id} className="col" style={{ gap: 8 }}>
                <div>
                  <h3 className="texto-s silencio-3" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {s.name}
                  </h3>
                  {encargadosNombres.length > 0 && (
                    <p className="texto-s silencio-3">
                      Encargado{encargadosNombres.length > 1 ? 's' : ''}: {encargadosNombres.join(', ')}
                    </p>
                  )}
                </div>
                {sTasks.length === 0 ? (
                  <p className="texto-s silencio-3">Sin tareas todavía.</p>
                ) : (
                  <TaskChecklist tasks={sTasks.map(t => ({ id: t.id, title: t.title, status: t.status, canToggle }))} />
                )}
              </div>
            )
          })}
        </div>
      )
    }
  }

  return (
    <div className="card entra card-pad col" style={{ gap: 18 }} data-screen-label="Card evento">
      <div className="fila" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="fila" style={{ gap: 14 }}>
          <span
            aria-hidden="true"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--ambar-50)',
              fontSize: 22,
              flex: 'none',
            }}
          >
            {EVENT_TYPE_EMOJI[event.event_type]}
          </span>
          <div>
            <span className="t-eyebrow"><span aria-hidden="true">◆</span> {EVENT_TYPE_LABELS[event.event_type]}</span>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{event.title}</h2>
          </div>
        </div>
        <Badge tono={diasTono} punto={false}>{diasTexto}</Badge>
      </div>

      {cuerpo}

      <Link
        href={isAdmin ? `/admin/eventos/${event.id}` : `/eventos/${event.id}`}
        className="btn btn-ghost btn-sm"
        style={{ alignSelf: 'flex-start' }}
      >
        Ver evento <Icono n="chevR" s={16} />
      </Link>
    </div>
  )
}
