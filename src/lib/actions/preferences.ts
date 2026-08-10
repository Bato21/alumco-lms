'use server'

import { cache } from 'react'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import {
  DEFAULT_PREFERENCES,
  type FontScale,
  type UserPreferences,
} from '@/lib/types/database'

/**
 * Preferencias de accesibilidad, persistidas por usuario.
 *
 * Van en la base y no en localStorage porque el equipo de un ELEAM rota entre
 * computadores compartidos: quien configuró letra grande en el PC de la
 * estación de enfermería la quiere también en el del turno de noche.
 */

export type PreferencesValues = Omit<UserPreferences, 'user_id' | 'updated_at'>

const PreferencesSchema = z.object({
  font_scale: z.enum(['normal', 'grande', 'extra']),
  high_contrast: z.boolean(),
  reduced_motion: z.boolean().nullable(),
})

/**
 * Lee las preferencias del usuario actual. Cacheado por request: el layout lo
 * llama una vez y el resto del árbol reusa.
 *
 * Sin sesión no toca la base — la landing y la verificación pública de
 * certificados no deben pagar una consulta por esto.
 */
export const getUserPreferences = cache(
  async function getUserPreferences(): Promise<PreferencesValues> {
    const user = await getCachedUser()
    if (!user) return DEFAULT_PREFERENCES

    const supabase = await createClient()
    const { data } = await supabase
      .from('user_preferences')
      .select('font_scale, high_contrast, reduced_motion')
      .eq('user_id', user.id)
      .maybeSingle() as { data: PreferencesValues | null }

    // Si la tabla todavía no se corrió en la DB viva, `data` viene null y la
    // app sigue con los defaults en vez de caerse.
    if (!data) return DEFAULT_PREFERENCES

    return {
      font_scale: (data.font_scale ?? 'normal') as FontScale,
      high_contrast: data.high_contrast === true,
      reduced_motion: data.reduced_motion ?? null,
    }
  }
) as () => Promise<PreferencesValues>

export async function saveUserPreferencesAction(
  input: PreferencesValues
): Promise<{ success?: boolean; error?: string }> {
  const user = await getCachedUser()
  if (!user) return { error: 'No autenticado' }

  const parsed = PreferencesSchema.safeParse(input)
  if (!parsed.success) return { error: 'Preferencias no válidas.' }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('user_preferences')
    .upsert({ user_id: user.id, ...parsed.data }, { onConflict: 'user_id' })

  if (error) {
    console.error('Error guardando preferencias de accesibilidad:', error)
    return { error: 'No se pudieron guardar tus preferencias.' }
  }

  // Las preferencias se aplican en el layout raíz, así que hay que revalidar
  // todo el árbol para que el cambio se vea sin recargar a mano.
  revalidatePath('/', 'layout')
  return { success: true }
}
