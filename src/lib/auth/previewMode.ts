import { cache } from 'react'
import { cookies } from 'next/headers'
import { requireAdmin } from '@/lib/auth/requireAdmin'

/**
 * Preview Mode: un admin o profesor mira la plataforma con la interfaz del
 * colaborador, sin cerrar su sesión ni cambiar de rol.
 *
 * Es una cookie, no un cambio de rol ni un segundo login. Eso es lo que hace
 * que salir del modo sea instantáneo y que no exista ningún estado a medias
 * en la base si alguien cierra la pestaña dentro del preview.
 *
 * La cookie por sí sola NO otorga nada: `isPreviewMode()` siempre confirma
 * contra la base que el caller es staff. Un trabajador que se la ponga a mano
 * queda exactamente donde estaba.
 */

export const PREVIEW_COOKIE = 'alumco_preview_colaborador'

export const isPreviewMode = cache(async function isPreviewMode(): Promise<boolean> {
  const store = await cookies()
  if (store.get(PREVIEW_COOKIE)?.value !== '1') return false

  const auth = await requireAdmin()
  return auth.ok
})
