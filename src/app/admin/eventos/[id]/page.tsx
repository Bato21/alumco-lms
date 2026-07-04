import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { EncabezadoPagina, Progreso } from '@/components/alumco/ds'
import { RolesEditor } from '@/components/alumco/eventos/RolesEditor'
import { TareasEditor } from '@/components/alumco/eventos/TareasEditor'
import { DocsPanel } from '@/components/alumco/eventos/DocsPanel'
import { PublicarButton } from '@/components/alumco/eventos/PublicarButton'
// Task 9: import { GaleriaFotos } from '@/components/alumco/eventos/GaleriaFotos'
import {
  EVENT_TYPE_LABELS,
  type EventRecord,
  type EventRole,
  type EventTask,
  type EventDocument,
  // Task 9: type EventPhoto,
} from '@/lib/types/database'

export const metadata: Metadata = { title: 'Detalle del evento | Alumco LMS' }
export const dynamic = 'force-dynamic'

export default async function EventoDetalleAdmin(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const adminClient = await createAdminClient()

  const [{ data: event }, { data: roles }, { data: tasks }, { data: docs }, { data: workers }] = await Promise.all([
    adminClient.from('events').select('*').eq('id', id).single() as unknown as Promise<{ data: EventRecord | null }>,
    adminClient.from('event_roles').select('*').eq('event_id', id) as unknown as Promise<{ data: EventRole[] | null }>,
    adminClient.from('event_tasks').select('*').eq('event_id', id).order('order_index') as unknown as Promise<{ data: EventTask[] | null }>,
    adminClient.from('event_documents').select('*').eq('event_id', id).order('created_at') as unknown as Promise<{ data: EventDocument[] | null }>,
    // Task 9: photos query se agrega acá
    adminClient.from('profiles').select('id, full_name, area_trabajo').eq('status', 'activo').order('full_name') as unknown as Promise<{ data: { id: string; full_name: string; area_trabajo: string[] }[] | null }>,
  ])

  if (!event) notFound()

  const nameById = new Map((workers ?? []).map(w => [w.id, w.full_name]))
  const rolesConNombre = (roles ?? []).map(r => ({ ...r, full_name: nameById.get(r.user_id) ?? '—' }))
  const tasksConNombre = (tasks ?? []).map(t => ({ ...t, assigned_name: t.assigned_to ? nameById.get(t.assigned_to) ?? null : null }))
  const hasDocAlimentacion = (docs ?? []).some(d => d.doc_type === 'dificultades_alimenticias')
  const done = (tasks ?? []).filter(t => t.is_done).length
  const total = (tasks ?? []).length

  return (
    <div className="col" style={{ gap: 28 }} data-screen-label="Admin · Detalle evento">
      <EncabezadoPagina
        titulo={event.title}
        sub={`${EVENT_TYPE_LABELS[event.event_type]} · ${new Date(event.event_date + 'T00:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}`}
      >
        <PublicarButton eventId={event.id} status={event.status} hasDocAlimentacion={hasDocAlimentacion} />
      </EncabezadoPagina>

      <p className="silencio" style={{ maxWidth: 640, fontSize: 15 }}>{event.description}</p>

      {total > 0 && (
        <div style={{ maxWidth: 360 }}>
          <p className="texto-s" style={{ marginBottom: 6, fontWeight: 600 }}>{done} de {total} tareas listas</p>
          <Progreso pct={Math.round((done / total) * 100)} />
        </div>
      )}

      <RolesEditor eventId={event.id} roles={rolesConNombre} workers={workers ?? []} />
      <TareasEditor eventId={event.id} tasks={tasksConNombre} workers={workers ?? []} jefeAreas={[]} isAdmin />
      <DocsPanel eventId={event.id} docs={docs ?? []} canManage />
      {/* Task 9: <GaleriaFotos eventId={event.id} photos={photos ?? []} canUpload isAdmin currentUserId="" /> */}
    </div>
  )
}
