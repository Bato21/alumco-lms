import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type Database } from '@/lib/types/database'
import { createClient as createSupabaseClient, type User } from '@supabase/supabase-js'

// cache() memoiza por request: layout, página y server actions comparten
// la misma instancia en un mismo render.
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // En Server Components el set falla silenciosamente
            // Las cookies se manejan en el middleware
          }
        },
      },
    }
  )
})

export const createAdminClient = cache(async function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
})

// Evita llamadas repetidas al servidor de auth dentro de un mismo request
// (layout + página + alerts llamaban a getUser por separado).
// getClaims verifica el JWT localmente (ES256 + JWKS cacheado en memoria del
// proceso) en vez del round trip de red de getUser(): ahorra ~50-150ms por
// request. Solo id y email se consumen en la app; el objeto se castea a User
// para no tocar las 19 páginas que ya tipan contra él.
export const getCachedUser = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims?.sub) return null
  return { id: data.claims.sub, email: data.claims.email } as User
})