import { cache } from 'react'
import { createClient, getCachedUser } from '@/lib/supabase/server'

// Id de la sede reservada al mundo demo. Los eventos demo viven acá, lo que los
// aísla vía la RLS por sede (`user_sede()`) sin tocar policies de eventos.
export const SEDE_DEMO = 'sede_demo'

/**
 * ¿El usuario actual pertenece al mundo demo? Cacheado por request.
 * Devuelve false para usuarios reales y anónimos.
 * Para server actions que ya llaman `requireAdmin()`, usar el `isDemo` que
 * este devuelve en vez de esta función.
 */
export const getViewerIsDemo = cache(async function getViewerIsDemo(): Promise<boolean> {
  const user = await getCachedUser()
  if (!user) return false
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('profiles')
    .select('is_demo')
    .eq('id', user.id)
    .single()
  return data?.is_demo === true
}) as () => Promise<boolean>

/**
 * Guarda de aislamiento: verifica que el curso apuntado pertenezca al mismo
 * mundo (demo o real) que el caller. Como el panel admin usa service-role
 * (ignora RLS), esta comprobación es la que impide que un admin demo toque
 * contenido real y viceversa.
 */
export async function courseInScope(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ac: any,
  courseId: string,
  isDemo: boolean
): Promise<boolean> {
  const { data } = await ac
    .from('courses')
    .select('is_demo')
    .eq('id', courseId)
    .maybeSingle()
  return !!data && data.is_demo === isDemo
}

/** Igual que `courseInScope` pero para perfiles de trabajadores. */
export async function profileInScope(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ac: any,
  profileId: string,
  isDemo: boolean
): Promise<boolean> {
  const { data } = await ac
    .from('profiles')
    .select('is_demo')
    .eq('id', profileId)
    .maybeSingle()
  return !!data && data.is_demo === isDemo
}

/** Igual que `courseInScope` pero para eventos. */
export async function eventInScope(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ac: any,
  eventId: string,
  isDemo: boolean
): Promise<boolean> {
  const { data } = await ac
    .from('events')
    .select('is_demo')
    .eq('id', eventId)
    .maybeSingle()
  return !!data && data.is_demo === isDemo
}

/**
 * Resuelve el `event_id` de una sección y comprueba su scope. Útil para las
 * actions que reciben `sectionId` pero no `eventId`.
 */
export async function sectionInScope(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ac: any,
  sectionId: string,
  isDemo: boolean
): Promise<boolean> {
  const { data } = await ac
    .from('event_sections')
    .select('events(is_demo)')
    .eq('id', sectionId)
    .maybeSingle()
  const evDemo = data?.events?.is_demo
  return evDemo !== undefined && evDemo !== null && evDemo === isDemo
}

/** Igual que `sectionInScope` pero resolviendo desde una tarea. */
export async function taskInScope(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ac: any,
  taskId: string,
  isDemo: boolean
): Promise<boolean> {
  const { data } = await ac
    .from('event_tasks')
    .select('event_sections(events(is_demo))')
    .eq('id', taskId)
    .maybeSingle()
  const evDemo = data?.event_sections?.events?.is_demo
  return evDemo !== undefined && evDemo !== null && evDemo === isDemo
}
