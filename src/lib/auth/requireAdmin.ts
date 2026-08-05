import { cache } from 'react'
import { createClient, getCachedUser } from '@/lib/supabase/server'

/**
 * Verifica que el caller esté autenticado y tenga rol staff (admin o profesor).
 * `requireAdmin` es el nombre histórico; el layout admin permite ambos roles,
 * por lo que las server actions correspondientes también deben aceptarlos.
 */
export const requireAdmin = cache(async function requireAdmin(): Promise<
  | { ok: true; userId: string; role: 'admin' | 'profesor'; isDemo: boolean }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) return { ok: false, error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sp = supabase as any
  const { data: profile } = await sp
    .from('profiles')
    .select('role, is_demo')
    .eq('id', user.id)
    .single() as { data: { role: string; is_demo: boolean | null } | null }

  const role = profile?.role
  if (role !== 'admin' && role !== 'profesor') {
    return { ok: false, error: 'No autorizado' }
  }
  return {
    ok: true,
    userId: user.id,
    role: role as 'admin' | 'profesor',
    isDemo: profile?.is_demo === true,
  }
})
