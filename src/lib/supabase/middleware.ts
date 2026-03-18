// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { type Database } from '@/lib/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: no agregar lógica entre createServerClient y getUser()
  // Refrescar sesión requiere que no haya awaits intermedios
  const { data: { user } } = await supabase.auth.getUser()

  // Rutas protegidas — redirige a login si no hay sesión
  const protectedPaths = ['/cursos', '/perfil', '/admin']
  const isProtected = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protección de rutas admin — verifica rol en DB
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/cursos', request.url))
    }
  }

  // Redirige a /cursos si ya está autenticado y va a login
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/cursos', request.url))
  }

  return supabaseResponse
}