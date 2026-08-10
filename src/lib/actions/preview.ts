'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { PREVIEW_COOKIE } from '@/lib/auth/previewMode'

/**
 * Entra al modo vista previa y lleva al inicio del colaborador.
 *
 * Devuelve void porque se usa como `action` de un form. Quien no es staff
 * simplemente termina en su propio inicio, sin cookie.
 */
export async function enterPreviewModeAction(): Promise<void> {
  const auth = await requireAdmin()
  if (!auth.ok) redirect('/inicio')

  const store = await cookies()
  store.set(PREVIEW_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    // Sesión, no persistente: el preview no debe sobrevivir al cierre del
    // navegador — nadie quiere volver mañana y encontrarse en la vista del
    // colaborador sin recordar por qué.
  })

  redirect('/inicio')
}

/** Sale del modo vista previa y vuelve al dashboard admin. */
export async function exitPreviewModeAction(): Promise<void> {
  const store = await cookies()
  store.delete(PREVIEW_COOKIE)
  redirect('/admin/dashboard')
}
