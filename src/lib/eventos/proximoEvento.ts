// Resumen serializable del próximo evento institucional para el dashboard.
// Server-only (usa el cliente de Supabase con cookies). Se envuelve en cache()
// para deduplicar entre el layout (campana) y la página (modal + card).
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_EMOJI,
  type EventType,
  type EventRecord,
  type EventSection,
  type EventTask,
} from '@/lib/types/database'

export interface EventoResumen {
  id: string
  title: string
  eventType: EventType
  /** Etiqueta de fecha del tipo de evento, ej. "18 de septiembre". */
  fechaLabel: string
  /** Categoría (primera sección del evento, ej. "Cocina y alimentación"). */
  categoria: string | null
  eventDate: string
  /** Día y mes destacados, ej. { dia: "18", mes: "SEP" }. */
  dia: string
  mes: string
  coverImageUrl: string | null
  emoji: string
  diasRestantes: number
  tareasCompletadas: number
  tareasTotal: number
  /** True si falta subir la lista de dificultades alimenticias. */
  faltaAlimentacion: boolean
  href: string
}

type EventoEmbebido = EventRecord & {
  event_sections: (EventSection & { event_tasks: EventTask[] })[]
  event_documents: { id: string; doc_type: string }[]
}

const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

export const getProximoEventoResumen = cache(async function getProximoEventoResumen(
  isAdmin: boolean
): Promise<EventoResumen | null> {
  try {
    const supabase = await createClient()

    const { data: events } = (await supabase
      .from('events')
      .select('*, event_sections(*, event_tasks(*)), event_documents(id, doc_type)')
      .in('status', ['planificacion', 'activo'])
      .order('event_date')) as unknown as { data: EventoEmbebido[] | null }

    if (!events || events.length === 0) return null

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // Evento más próximo por cercanía absoluta a hoy (un 'activo' puede tener
    // fecha pasada y seguir siendo el relevante).
    const event = events.reduce((closest, e) => {
      const diff = Math.abs(new Date(e.event_date + 'T00:00:00').getTime() - hoy.getTime())
      const closestDiff = Math.abs(new Date(closest.event_date + 'T00:00:00').getTime() - hoy.getTime())
      return diff < closestDiff ? e : closest
    }, events[0])

    const sections = [...(event.event_sections ?? [])].sort((a, b) => a.order_index - b.order_index)

    let tareasTotal = 0
    let tareasCompletadas = 0
    for (const s of sections) {
      for (const t of s.event_tasks ?? []) {
        tareasTotal += 1
        if (t.status === 'completada') tareasCompletadas += 1
      }
    }

    const faltaAlimentacion = !(event.event_documents ?? []).some(
      (d) => d.doc_type === 'dificultades_alimenticias'
    )

    const fecha = new Date(event.event_date + 'T00:00:00')
    const diasRestantes = Math.round((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

    return {
      id: event.id,
      title: event.title,
      eventType: event.event_type,
      fechaLabel: EVENT_TYPE_LABELS[event.event_type],
      categoria: sections[0]?.name ?? null,
      eventDate: event.event_date,
      dia: String(fecha.getDate()),
      mes: MESES_CORTOS[fecha.getMonth()],
      coverImageUrl: event.cover_image_url,
      emoji: EVENT_TYPE_EMOJI[event.event_type],
      diasRestantes,
      tareasCompletadas,
      tareasTotal,
      faltaAlimentacion,
      href: isAdmin ? `/admin/eventos/${event.id}` : `/eventos/${event.id}`,
    }
  } catch {
    return null
  }
})
