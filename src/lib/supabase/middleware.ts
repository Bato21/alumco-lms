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
          // Primero setear en el request
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Recrear response con el request actualizado
          supabaseResponse = NextResponse.next({ request })
          // Luego setear TODAS las cookies en la response
          // incluyendo las que ya existían antes
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getClaims verifica el JWT localmente (llave pública ES256 vía JWKS,
  // cacheada en memoria) — cero round trips a Supabase en el caso común.
  // Solo toca la red para refrescar un token vencido. getUser() acá costaba
  // ~100-300ms de latencia extra en CADA navegación.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims ?? null
  const pathname = request.nextUrl.pathname
  const isPublic = pathname === '/' || pathname === '/login' || pathname === '/registro'

  // Verificación de certificados: abierta a cualquiera, con o sin sesión.
  // Un fiscalizador de SENAMA escanea el QR de un PDF impreso y tiene que
  // poder validarlo sin credenciales — y un admin logueado que abra el mismo
  // link tampoco debe ser redirigido a /cursos.
  const isCertVerification = pathname.startsWith('/certificados/verificar/')

  // Restablecer contraseña: igual que la verificación de certificados, entra
  // por ambos lados. Sin sesión, porque quien olvidó su clave no la tiene; y
  // CON sesión sin rebotar a /cursos, porque alguien que sigue logueado en el
  // teléfono y abre el enlace del correo también tiene que poder cambiarla.
  const isResetPassword = pathname === '/reset-password'

  if (!user && !isPublic && !isCertVerification && !isResetPassword) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isPublic) {
    return NextResponse.redirect(new URL('/cursos', request.url))
  }

  // CRÍTICO: retornar siempre supabaseResponse, nunca un NextResponse nuevo
  // para que las cookies de sesión lleguen al Server Component
  return supabaseResponse
}