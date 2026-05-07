'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSedesAction(): Promise<{
  sedes: { id: string; nombre: string; activa: boolean }[]
  error?: string
}> {
  const adminClient = await createAdminClient()
  const { data, error } = await adminClient
    .from('sedes')
    .select('id, nombre, activa')
    .order('created_at', { ascending: true }) as {
      data: { id: string; nombre: string; activa: boolean }[] | null
      error: { message: string } | null
    }

  if (error) return { sedes: [], error: error.message }
  return { sedes: data ?? [] }
}

export async function createSedeAction(
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const nombre = (formData.get('nombre') as string | null)?.trim()
  if (!nombre || nombre.length < 2) return { error: 'El nombre debe tener al menos 2 caracteres' }

  const id = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')

  const adminClient = await createAdminClient()
  const { error } = await adminClient
    .from('sedes')
    .insert({ id, nombre, activa: true } as unknown as never)

  if (error) return { error: error.message }

  revalidatePath('/admin/sedes')
  revalidatePath('/admin/trabajadores')
  return { success: true }
}

export async function toggleSedeAction(
  sedeId: string,
  activa: boolean
): Promise<{ success?: boolean; error?: string }> {
  const adminClient = await createAdminClient()

  const { error } = await adminClient
    .from('sedes')
    .update({ activa } as unknown as never)
    .eq('id', sedeId)

  if (error) return { error: error.message }

  if (!activa) {
    await adminClient
      .from('profiles')
      .update({ sede: null } as unknown as never)
      .eq('sede', sedeId)
  }

  revalidatePath('/admin/sedes')
  revalidatePath('/admin/trabajadores')
  return { success: true }
}
