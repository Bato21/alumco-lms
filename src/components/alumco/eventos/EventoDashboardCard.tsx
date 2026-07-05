import type { ReactNode } from 'react'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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
export async function EventoDashboardCard({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('status', ['planificacion', 'activo'])
    .order('event_date') as unknown as { data: EventRecord[] | null }

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

  const { data: sectionsRaw } = await supabase
    .from('event_sections')
    .select('*')
    .eq('event_id', event.id)
    .order('order_index') as unknown as { data: EventSection[] | null }
  const sections = sectionsRaw ?? []
  const sectionIds = sections.map(s => s.id)

  const { texto: diasTexto, tono: diasTono } = diasRestantes(event.event_date)

  let cuerpo: ReactNode

  if (isAdmin) {
    const [{ data: tasks }, { data: docs }] = await Promise.all([
      sectionIds.length > 0
        ? supabase
            .from('event_tasks')
            .select('id, section_id, status')
            .in('section_id', sectionIds) as unknown as Promise<{ data: Pick<EventTask, 'id' | 'section_id' | 'status'>[] | null }>
        : Promise.resolve({ data: [] as Pick<EventTask, 'id' | 'section_id' | 'status'>[] }),
      supabase
        .from('event_documents')
        .select('id')
        .eq('event_id', event.id)
        .eq('doc_type', 'dificultades_alimenticias')
        .limit(1) as unknown as Promise<{ data: { id: string }[] | null }>,
    ])

    const avancePorSeccion = new Map<string, { hechas: number; total: number }>()
    for (const t of tasks ?? []) {
      const actual = avancePorSeccion.get(t.section_id) ?? { hechas: 0, total: 0 }
      actual.total += 1
      if (t.status === 'completada') actual.hechas += 1
      avancePorSeccion.set(t.section_id, actual)
    }

    const docId = docs?.[0]?.id ?? null

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
    const { data: myMemberships } = sectionIds.length > 0
      ? await (supabase
          .from('event_section_members')
          .select('section_id, member_role')
          .eq('user_id', userId)
          .in('section_id', sectionIds) as unknown as Promise<{ data: Pick<EventSectionMember, 'section_id' | 'member_role'>[] | null }>)
      : { data: [] as Pick<EventSectionMember, 'section_id' | 'member_role'>[] }

    const mySectionIds = (myMemberships ?? []).map(m => m.section_id)
    const myRoleBySection = new Map((myMemberships ?? []).map(m => [m.section_id, m.member_role]))
    const misSecciones = sections.filter(s => mySectionIds.includes(s.id))

    if (misSecciones.length === 0) {
      cuerpo = <p className="texto-s silencio-3">No tienes secciones asignadas en este evento todavía.</p>
    } else {
      const [{ data: tasks }, { data: allMembers }] = await Promise.all([
        supabase
          .from('event_tasks')
          .select('*')
          .in('section_id', mySectionIds)
          .order('order_index') as unknown as Promise<{ data: EventTask[] | null }>,
        supabase
          .from('event_section_members')
          .select('*')
          .in('section_id', mySectionIds) as unknown as Promise<{ data: EventSectionMember[] | null }>,
      ])

      const encargadoIds = Array.from(
        new Set((allMembers ?? []).filter(m => m.member_role === 'encargado').map(m => m.user_id))
      )
      let nameById = new Map<string, string>()
      if (encargadoIds.length > 0) {
        const adminClient = await createAdminClient()
        const { data: profiles } = await adminClient
          .from('profiles')
          .select('id, full_name')
          .in('id', encargadoIds) as unknown as { data: { id: string; full_name: string }[] | null }
        nameById = new Map((profiles ?? []).map(p => [p.id, p.full_name]))
      }

      const tasksBySection = new Map<string, EventTask[]>()
      for (const t of tasks ?? []) {
        const list = tasksBySection.get(t.section_id) ?? []
        list.push(t)
        tasksBySection.set(t.section_id, list)
      }

      cuerpo = (
        <div className="col" style={{ gap: 16 }}>
          {misSecciones.map(s => {
            const encargadosNombres = (allMembers ?? [])
              .filter(m => m.section_id === s.id && m.member_role === 'encargado')
              .map(m => nameById.get(m.user_id) ?? '—')
            const canToggle = myRoleBySection.get(s.id) === 'encargado'
            const sTasks = tasksBySection.get(s.id) ?? []

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
            <span className="t-eyebrow">◆ {EVENT_TYPE_LABELS[event.event_type]}</span>
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
