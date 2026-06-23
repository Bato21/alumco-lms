import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import SedesClient from './SedesClient'
import { EncabezadoPagina } from '@/components/alumco/ds'

export const metadata: Metadata = {
  title: 'Gestión de Sedes | Alumco LMS',
}

export const dynamic = 'force-dynamic'

export default async function SedesPage() {
  const adminClient = await createAdminClient()

  const [{ data: sedesData }, { data: counts }] = await Promise.all([
    adminClient
      .from('sedes')
      .select('id, nombre, activa')
      .order('created_at', { ascending: true }) as unknown as Promise<{
        data: { id: string; nombre: string; activa: boolean }[] | null
      }>,
    adminClient
      .from('profiles')
      .select('sede')
      .eq('status', 'activo') as unknown as Promise<{ data: { sede: string }[] | null }>,
  ])

  const sedes = sedesData ?? []

  const workersPerSede: Record<string, number> = {}
  for (const row of counts ?? []) {
    workersPerSede[row.sede] = (workersPerSede[row.sede] ?? 0) + 1
  }

  return (
    <div data-screen-label="Admin · Sedes">
      <EncabezadoPagina titulo="Sedes" sub="Administra las sedes activas de la organización">
        <span className="badge badge-info">{sedes.filter(s => s.activa).length} sedes activas</span>
      </EncabezadoPagina>

      <SedesClient sedes={sedes} workersPerSede={workersPerSede} />
    </div>
  )
}
