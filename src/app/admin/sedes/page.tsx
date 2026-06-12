import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import SedesClient from './SedesClient'

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
    <div className="min-h-screen p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Sedes</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">Administra las sedes activas de la organización</p>
        </div>
        <span className="bg-[#2B4FA0]/10 text-[#2B4FA0] text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap">
          {sedes.filter(s => s.activa).length} sedes activas
        </span>
      </div>

      <SedesClient sedes={sedes} workersPerSede={workersPerSede} />
    </div>
  )
}
