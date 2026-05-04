import { createClient } from '@/lib/supabase/server'

/**
 * Verifica que el caller esté autenticado y tenga rol staff (admin o profesor).
 * `requireAdmin` es el nombre histórico; el layout admin permite ambos roles,
 * por lo que las server actions correspondientes también deben aceptarlos.
 */
export async function requireAdmin(): Promise<
  | { ok: true; userId: string; role: 'admin' | 'profesor' }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sp = supabase as any
  const { data: profile } = await sp
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  const role = profile?.role
  if (role !== 'admin' && role !== 'profesor') {
    return { ok: false, error: 'No autorizado' }
  }
  return { ok: true, userId: user.id, role: role as 'admin' | 'profesor' }
}
