import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient, createAdminClient, getCachedUser } from '@/lib/supabase/server'
import { EncabezadoPagina, Badge } from '@/components/alumco/ds'
import { TaskChecklist } from '@/components/alumco/eventos/TaskChecklist'
import { TareasEditor } from '@/components/alumco/eventos/TareasEditor'
import { GaleriaFotos } from '@/components/alumco/eventos/GaleriaFotos'
import { DocsPanel } from '@/components/alumco/eventos/DocsPanel'
import {
  EVENT_TYPE_LABELS,
  type EventRecord, type EventRole, type EventTask, type EventDocument, type EventPhoto,
} from '@/lib/types/database'

export const metadata: Metadata = { title: 'Evento | Alumco LMS' }
export const dynamic = 'force-dynamic'

export default async function EventoDetallePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const supabase = await createClient()
  const user = await getCachedUser()

  const [{ data: event }, { data: roles }, { data: tasks }, { data: docs }, { data: photos }] = await Promise.all([
    supabase.from('events').select('*').eq('id', id).single() as unknown as Promise<{ data: EventRecord | null }>,
    supabase.from('event_roles').select('*').eq('event_id', id) as unknown as Promise<{ data: EventRole[] | null }>,
    supabase.from('event_tasks').select('*').eq('event_id', id).order('order_index') as unknown as Promise<{ data: EventTask[] | null }>,
    supabase.from('event_documents').select('*').eq('event_id', id).order('created_at') as unknown as Promise<{ data: EventDocument[] | null }>,
    supabase.from('event_photos').select('*').eq('event_id', id).order('created_at', { ascending: false }) as unknown as Promise<{ data: EventPhoto[] | null }>,
  ])

  if (!event || event.status === 'planificacion') notFound()

  const userId = user!.id
  const myRoles = (roles ?? []).filter(r => r.user_id === userId)
  const myTasksAll = (tasks ?? []).filter(t => t.assigned_to === userId)
  const jefeAreas = myRoles.filter(r => r.role === 'jefe').map(r => r.area)
  const isParticipant = myRoles.length > 0 || myTasksAll.length > 0

  // Jefe activo: gestiona sus tareas desde el editor (crea/asigna/elimina).
  const esJefeActivo = jefeAreas.length > 0 && event.status === 'activo'

  // "Tus tareas" solo muestra tareas propias fuera de sus áreas de jefatura,
  // para no duplicar con lo que ya aparece en el editor de tareas del área.
  const myTasks = esJefeActivo
    ? myTasksAll.filter(t => !jefeAreas.includes(t.area))
    : myTasksAll

  // Vista de solo lectura (evento finalizado, o delegado sin editor)
  const areaTasks = (tasks ?? []).filter(t => jefeAreas.includes(t.area) && t.assigned_to !== userId)

  // Datos para el editor de tareas del jefe: todas las tareas de sus áreas
  // (incluidas las propias) + nombres de los participantes del evento.
  let jefeAreaTasksConNombre: (EventTask & { assigned_name: string | null })[] = []
  let participantWorkers: { id: string; full_name: string; area_trabajo: string[] }[] = []

  if (esJefeActivo) {
    const participantIds = Array.from(new Set((roles ?? []).map(r => r.user_id)))
    if (participantIds.length > 0) {
      const adminClient = await createAdminClient()
      const { data: profilesData } = await adminClient
        .from('profiles')
        .select('id, full_name, area_trabajo')
        .in('id', participantIds) as unknown as {
          data: { id: string; full_name: string; area_trabajo: string[] | null }[] | null
        }
      participantWorkers = (profilesData ?? []).map(p => ({
        id: p.id,
        full_name: p.full_name,
        area_trabajo: Array.isArray(p.area_trabajo) ? p.area_trabajo : [],
      }))
    }
    const nameById = new Map(participantWorkers.map(w => [w.id, w.full_name]))
    jefeAreaTasksConNombre = (tasks ?? [])
      .filter(t => jefeAreas.includes(t.area))
      .map(t => ({ ...t, assigned_name: t.assigned_to ? nameById.get(t.assigned_to) ?? null : null }))
  }

  return (
    <div className="col" style={{ gap: 24 }} data-screen-label="Trabajador · Detalle evento">
      <EncabezadoPagina
        titulo={event.title}
        sub={`${EVENT_TYPE_LABELS[event.event_type]} · ${new Date(event.event_date + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}`}
      >
        <div className="fila" style={{ gap: 8 }}>
          {event.status === 'activo' && <Badge tono="ok">En curso</Badge>}
          {myRoles.length > 0 && (
            <Badge tono="aviso" punto={false}>
              {myRoles[0].role === 'jefe' ? `Jefe · ${myRoles[0].area}` : `Delegado · ${myRoles[0].area}`}
            </Badge>
          )}
        </div>
      </EncabezadoPagina>

      <p className="silencio" style={{ maxWidth: 640, fontSize: 15 }}>{event.description}</p>

      {myTasks.length > 0 && (
        <section className="card card-pad col entra" style={{ gap: 12 }}>
          <h2 style={{ fontSize: 16.5 }}>Tus tareas</h2>
          <TaskChecklist tasks={myTasks.map(t => ({ id: t.id, title: t.title, area: t.area, is_done: t.is_done }))} />
        </section>
      )}

      {esJefeActivo ? (
        <TareasEditor
          eventId={event.id}
          tasks={jefeAreaTasksConNombre}
          workers={participantWorkers}
          jefeAreas={jefeAreas}
          isAdmin={false}
        />
      ) : (
        areaTasks.length > 0 && (
          <section className="card card-pad col entra" style={{ gap: 12 }}>
            <h2 style={{ fontSize: 16.5 }}>Tareas de tu área</h2>
            <TaskChecklist tasks={areaTasks.map(t => ({ id: t.id, title: t.title, area: t.area, is_done: t.is_done }))} />
          </section>
        )
      )}

      <DocsPanel eventId={event.id} docs={docs ?? []} canManage={false} />

      <GaleriaFotos
        eventId={event.id}
        photos={photos ?? []}
        canUpload={isParticipant}
        isAdmin={false}
        currentUserId={userId}
      />
    </div>
  )
}
