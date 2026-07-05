import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Icono } from '@/components/alumco/ds'
import { TaskChecklist } from './TaskChecklist'
import { EVENT_TYPE_LABELS, type EventRecord, type EventTask } from '@/lib/types/database'

export async function EventoInicioBlock({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'activo')
    .order('event_date') as unknown as { data: EventRecord[] | null }

  const event = events?.[0]
  if (!event) return null

  const { data: myTasks } = await supabase
    .from('event_tasks')
    .select('id, title, area, is_done')
    .eq('event_id', event.id)
    .eq('assigned_to', userId)
    .order('order_index') as unknown as { data: Pick<EventTask, 'id' | 'title' | 'area' | 'is_done'>[] | null }

  const tasks = myTasks ?? []

  const fecha = new Date(event.event_date + 'T00:00:00')
    .toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })

  return (
    <div className="card entra card-pad col" style={{ gap: 16 }}>
      <div className="fila" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div className="fila" style={{ gap: 14 }}>
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--ambar-50)',
              color: 'var(--ambar-700)',
              flex: 'none',
            }}
          >
            <Icono n="calendario" s={22} />
          </span>
          <div>
            <span className="t-eyebrow">◆ {EVENT_TYPE_LABELS[event.event_type]}</span>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{event.title}</h2>
            <p className="texto-s silencio-3">{fecha}</p>
          </div>
        </div>
        <Link href={`/eventos/${event.id}`} className="btn btn-ghost btn-sm">
          Ver evento <Icono n="chevR" s={16} />
        </Link>
      </div>

      {tasks.length > 0 ? (
        <div className="col" style={{ gap: 8 }}>
          <h3 className="texto-s silencio-3" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Tus tareas
          </h3>
          <TaskChecklist tasks={tasks} />
        </div>
      ) : (
        <p className="texto-s silencio-3">No tienes tareas asignadas — mira los detalles del evento.</p>
      )}
    </div>
  )
}
