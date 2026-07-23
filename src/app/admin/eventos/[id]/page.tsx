import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { EncabezadoPagina, Progreso, Icono } from '@/components/alumco/ds'
import { SeccionesEditor } from '@/components/alumco/eventos/SeccionesEditor'
import { TareasEditor } from '@/components/alumco/eventos/TareasEditor'
import { DocsPanel } from '@/components/alumco/eventos/DocsPanel'
import { EstadoEventoButton } from '@/components/alumco/eventos/EstadoEventoButton'
import { EditarEventoControl, EliminarEventoZona } from '@/components/alumco/eventos/EditarEventoPanel'
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

export const metadata: Metadata = { title: 'Detalle del evento | Alumco LMS' }
export const dynamic = 'force-dynamic'

export default async function EventoDetalleAdmin(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const auth = await requireAdmin()
  const isAdmin = auth.ok && auth.role === 'admin'
  const adminClient = await createAdminClient()

  // Primera tanda en paralelo: evento, secciones, documentos y sedes no
  // dependen entre sí. event_tasks y event_section_members sí dependen de
  // conocer los ids de las secciones (no hay FK directa evento→tarea, ver
  // patrón ya usado en admin/eventos/page.tsx), así que van en una segunda
  // tanda paralela una vez resueltas las secciones.
  const [{ data: event }, { data: sectionsRaw }, { data: docs }, { data: sedes }, { data: photosRaw }] = await Promise.all([
    adminClient.from('events').select('*').eq('id', id).maybeSingle() as unknown as Promise<{ data: EventRecord | null }>,
    adminClient.from('event_sections').select('*').eq('event_id', id).order('order_index') as unknown as Promise<{ data: EventSection[] | null }>,
    adminClient.from('event_documents').select('*').eq('event_id', id).order('created_at') as unknown as Promise<{ data: EventDocument[] | null }>,
    adminClient.from('sedes').select('id, nombre') as unknown as Promise<{ data: { id: string; nombre: string }[] | null }>,
    adminClient.from('event_photos').select('*').eq('event_id', id).order('created_at', { ascending: false }) as unknown as Promise<{ data: EventPhoto[] | null }>,
  ])

  if (!event) notFound()

  const sections = sectionsRaw ?? []
  const sectionIds = sections.map(s => s.id)

  const [{ data: members }, { data: tasks }, { data: workers }] = await Promise.all([
    sectionIds.length > 0
      ? adminClient.from('event_section_members').select('*').in('section_id', sectionIds) as unknown as Promise<{ data: EventSectionMember[] | null }>
      : Promise.resolve({ data: [] as EventSectionMember[] }),
    sectionIds.length > 0
      ? adminClient.from('event_tasks').select('*').in('section_id', sectionIds).order('order_index') as unknown as Promise<{ data: EventTask[] | null }>
      : Promise.resolve({ data: [] as EventTask[] }),
    // Solo trabajadores de la MISMA sede del evento: la RLS filtra los
    // eventos por sede, así que un miembro de otra sede nunca vería el evento
    // (quedaría asignado pero invisible). El selector debe reflejar eso.
    adminClient.from('profiles').select('id, full_name').eq('status', 'activo').eq('sede', event.sede_id).order('full_name') as unknown as Promise<{ data: { id: string; full_name: string }[] | null }>,
  ])

  const nameById = new Map((workers ?? []).map(w => [w.id, w.full_name]))
  const sedeNombre = (sedes ?? []).find(s => s.id === event.sede_id)?.nombre ?? 'Sede desconocida'

  const membersBySection = new Map<string, (EventSectionMember & { full_name: string })[]>()
  for (const m of members ?? []) {
    const list = membersBySection.get(m.section_id) ?? []
    list.push({ ...m, full_name: nameById.get(m.user_id) ?? '—' })
    membersBySection.set(m.section_id, list)
  }

  const tasksBySection = new Map<string, EventTask[]>()
  for (const t of tasks ?? []) {
    const list = tasksBySection.get(t.section_id) ?? []
    list.push(t)
    tasksBySection.set(t.section_id, list)
  }

  const sectionsConMiembros = sections.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    members: membersBySection.get(s.id) ?? [],
  }))

  const sectionsConTareas = sections.map(s => ({
    id: s.id,
    name: s.name,
    tasks: tasksBySection.get(s.id) ?? [],
  }))

  const hasDocAlimentacion = (docs ?? []).some(d => d.doc_type === 'dificultades_alimenticias')
  const totalTareas = (tasks ?? []).length
  const doneTareas = (tasks ?? []).filter(t => t.status === 'completada').length
  const fotos = await firmarFotos(photosRaw ?? [])

  return (
    <div className="col" style={{ gap: 28 }} data-screen-label="Admin · Detalle evento">
      <EncabezadoPagina
        titulo={event.title}
        sub={
          <>
            <span aria-hidden="true">{EVENT_TYPE_EMOJI[event.event_type]}</span> {EVENT_TYPE_LABELS[event.event_type]}
            {' · '}
            {new Date(event.event_date + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            {sedeNombre}
          </>
        }
      >
        {isAdmin && <EditarEventoControl event={event} />}
        {isAdmin && <EstadoEventoButton eventId={event.id} status={event.status} />}
      </EncabezadoPagina>

      {/* Advertencia persistente: NO bloquea nada, solo informa. Se muestra
          en el detalle admin y (Task 5) en el dashboard colaborador. */}
      {!hasDocAlimentacion && (
        <div
          role="alert"
          className="card card-pad fila entra"
          style={{ gap: 16, flexWrap: 'wrap', border: '2px solid var(--aviso)', background: 'var(--aviso-bg)' }}
        >
          <Icono n="alerta" s={22} />
          <div className="crece">
            <p style={{ fontWeight: 700, color: 'var(--aviso)' }}>⚠️ Falta la lista de dificultades alimenticias</p>
            <p className="texto-s" style={{ color: 'var(--aviso)' }}>
              Súbela en la sección Documentos cuando esté disponible. El evento puede seguir su curso mientras tanto.
            </p>
          </div>
        </div>
      )}

      <p className="silencio" style={{ maxWidth: 640, fontSize: 15 }}>{event.description}</p>

      {totalTareas > 0 && (
        <div style={{ maxWidth: 360 }}>
          <p className="texto-s" style={{ marginBottom: 6, fontWeight: 600 }}>{doneTareas} de {totalTareas} tareas listas</p>
          <Progreso pct={Math.round((doneTareas / totalTareas) * 100)} />
        </div>
      )}

      {isAdmin && (
        <SeccionesEditor eventId={event.id} sections={sectionsConMiembros} workers={workers ?? []} />
      )}
      <TareasEditor sections={sectionsConTareas} isAdmin={isAdmin} eventDate={event.event_date} />
      <DocsPanel eventId={event.id} docs={docs ?? []} canManage={isAdmin} />
      <GaleriaFotos
        eventId={event.id}
        photos={fotos}
        canUpload={isAdmin}
        isAdmin={isAdmin}
        currentUserId={auth.ok ? auth.userId : ''}
      />

      {isAdmin && <EliminarEventoZona eventId={event.id} />}
    </div>
  )
}
