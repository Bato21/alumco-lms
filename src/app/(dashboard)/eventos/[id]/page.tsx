import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { EncabezadoPagina, Badge } from '@/components/alumco/ds'
import { TaskChecklist } from '@/components/alumco/eventos/TaskChecklist'
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
  const myTasks = (tasks ?? []).filter(t => t.assigned_to === userId)
  const jefeAreas = myRoles.filter(r => r.role === 'jefe').map(r => r.area)
  const isParticipant = myRoles.length > 0 || myTasks.length > 0
  const areaTasks = (tasks ?? []).filter(t => jefeAreas.includes(t.area) && t.assigned_to !== userId)

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

      {areaTasks.length > 0 && (
        <section className="card card-pad col entra" style={{ gap: 12 }}>
          <h2 style={{ fontSize: 16.5 }}>Tareas de tu área</h2>
          <TaskChecklist tasks={areaTasks.map(t => ({ id: t.id, title: t.title, area: t.area, is_done: t.is_done }))} />
        </section>
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
