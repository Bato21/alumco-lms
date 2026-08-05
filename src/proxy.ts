import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // `offline` queda fuera del proxy a propósito: es la pantalla que el
    // service worker sirve cuando no hay red, así que no puede depender de una
    // llamada de auth. Es estática y no expone datos de usuario.
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|offline|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|mp4|webm)$).*)',
    
  ],
}
