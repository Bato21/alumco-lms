// Solo server (usa service role) — no importar desde client components.
import { createAdminClient } from '@/lib/supabase/server'
import type { EventPhoto } from '@/lib/types/database'
import type { FotoConUrl } from '@/components/alumco/eventos/GaleriaFotos'

// El bucket event-photos es privado: cada render firma las URLs en lote
// (1 hora). Quién puede VER qué fotos lo decide la query de filas (RLS por
// sede con el cliente del usuario); esto solo convierte paths en URLs.
export async function firmarFotos(photos: EventPhoto[]): Promise<FotoConUrl[]> {
  if (photos.length === 0) return []

  const adminClient = await createAdminClient()
  const { data } = await adminClient.storage
    .from('event-photos')
    .createSignedUrls(photos.map(p => p.image_url), 3600)

  const porPath = new Map((data ?? []).map(d => [d.path, d.signedUrl]))
  return photos.map(p => ({ ...p, signedUrl: porPath.get(p.image_url) ?? null }))
}
