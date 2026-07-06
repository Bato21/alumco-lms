import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient, createAdminClient, getCachedUser } from '@/lib/supabase/server'
import { EncabezadoPagina, Badge } from '@/components/alumco/ds'
import { TaskChecklist } from '@/components/alumco/eventos/TaskChecklist'
import { DocsPanel } from '@/components/alumco/eventos/DocsPanel'
import { GaleriaFotos } from '@/components/alumco/eventos/GaleriaFotos'
import { firmarFotos } from '@/lib/eventos/fotos'
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_EMOJI,
  type EventRecord,
  type EventSection,
  type EventSectionMember,
  type EventTask,
  type EventDocument,
  type EventPhoto,
} from '@/lib/types/database'

export const metadata: Metadata = { title: 'Evento | Alumco LMS' }
export const dynamic = 'force-dynamic'

export default async function EventoDetallePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const user = await getCachedUser()
  const userId = user!.id

  // Cliente de usuario para todo lo relacionado al evento: RLS ya filtra
  // por sede (eventos/secciones/tareas) y por membresía (documentos — solo
  // ve algo si es admin o miembro de alguna sección del evento).
  const [{ data: event }, { data: sectionsRaw }, { data: docs }, { data: photosRaw }] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).maybeSingle() as unknown as Promise<{ data: EventRecord | null }>,
    supabase.from('event_sections').select('*').eq('event_id', id).order('order_index') as unknown as Promise<{ data: EventSection[] | null }>,
    supabase.from('event_documents').select('*').eq('event_id', id).order('created_at') as unknown as Promise<{ data: EventDocument[] | null }>,
    supabase.from('event_photos').select('*').eq('event_id', id).order('created_at', { ascending: false }) as unknown as Promise<{ data: EventPhoto[] | null }>,
  ])

  // notFound también si el evento está en planificación (todavía no visible
  // para colaboradores) — guard explícito aunque RLS ya debería filtrar por
  // sede antes de llegar acá.
  if (!event || event.status === 'planificacion') notFound()

  const sections = sectionsRaw ?? []
  const sectionIds = sections.map(s => s.id)

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

  const [{ data: tasks }, { data: allMembers }] = await Promise.all([
    mySectionIds.length > 0
      ? supabase.from('event_tasks').select('*').in('section_id', mySectionIds).order('order_index') as unknown as Promise<{ data: EventTask[] | null }>
      : Promise.resolve({ data: [] as EventTask[] }),
    mySectionIds.length > 0
      ? supabase.from('event_section_members').select('*').in('section_id', mySectionIds) as unknown as Promise<{ data: EventSectionMember[] | null }>
      : Promise.resolve({ data: [] as EventSectionMember[] }),
  ])

  const encargadoIds = Array.from(
    new Set((allMembers ?? []).filter(m => m.member_role === 'encargado').map(m => m.user_id))
  )
  // Nombres vía cliente admin: profiles no es legible entre trabajadores
  // (mismo patrón que admin/eventos/[id]/page.tsx y el wizard).
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

  const fotos = await firmarFotos(photosRaw ?? [])

  return (
    <div className="col" style={{ gap: 24 }} data-screen-label="Trabajador · Detalle evento">
      <EncabezadoPagina
        titulo={event.title}
        sub={
          <>
            <span aria-hidden="true">{EVENT_TYPE_EMOJI[event.event_type]}</span> {EVENT_TYPE_LABELS[event.event_type]}
            {' · '}
            {new Date(event.event_date + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </>
        }
      >
        {event.status === 'activo' && <Badge tono="ok">En curso</Badge>}
      </EncabezadoPagina>

      <p className="silencio" style={{ maxWidth: 640, fontSize: 15 }}>{event.description}</p>

      {misSecciones.length === 0 ? (
        <p className="silencio texto-s">No participas en ninguna sección de este evento todavía.</p>
      ) : (
        misSecciones.map(s => {
          const encargadosNombres = (allMembers ?? [])
            .filter(m => m.section_id === s.id && m.member_role === 'encargado')
            .map(m => nameById.get(m.user_id) ?? '—')
          const canToggle = myRoleBySection.get(s.id) === 'encargado'
          const sTasks = tasksBySection.get(s.id) ?? []

          return (
            <section key={s.id} className="card card-pad col entra" style={{ gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 16.5 }}>{s.name}</h2>
                {encargadosNombres.length > 0 && (
                  <p className="texto-s silencio-3">
                    Encargado{encargadosNombres.length > 1 ? 's' : ''}: {encargadosNombres.join(', ')}
                  </p>
                )}
              </div>
              {sTasks.length === 0 ? (
                <p className="texto-s silencio-3">Sin tareas en esta sección.</p>
              ) : (
                <TaskChecklist tasks={sTasks.map(t => ({ id: t.id, title: t.title, status: t.status, canToggle }))} />
              )}
            </section>
          )
        })
      )}

      {/* Solo se muestra si hay documentos visibles para este usuario (RLS
          devuelve vacío si no es miembro de ninguna sección del evento). */}
      {(docs ?? []).length > 0 && (
        <DocsPanel eventId={event.id} docs={docs ?? []} canManage={false} />
      )}

      {/* Fotos: filas filtradas por sede vía RLS; subir solo miembros del
          evento (la action además lo verifica server-side). */}
      <GaleriaFotos
        eventId={event.id}
        photos={fotos}
        canUpload={misSecciones.length > 0}
        isAdmin={false}
        currentUserId={userId}
      />
    </div>
  )
}
