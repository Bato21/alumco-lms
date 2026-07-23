import type { Metadata } from 'next'
import { EncabezadoPagina } from '@/components/alumco/ds'
import { WizardEvento } from '@/components/alumco/eventos/WizardEvento'
import { createAdminClient } from '@/lib/supabase/server'
import { getViewerIsDemo, SEDE_DEMO } from '@/lib/auth/demoScope'

export const metadata: Metadata = { title: 'Nuevo evento | Alumco LMS' }
export const dynamic = 'force-dynamic'

export default async function NuevoEventoPage() {
  const adminClient = await createAdminClient()
  const isDemo = await getViewerIsDemo()

  // El admin demo solo crea en la Sede Demo con trabajadores demo; el admin
  // real, en las sedes activas reales (nunca la demo).
  const sedesQuery = isDemo
    ? adminClient.from('sedes').select('id, nombre').eq('id', SEDE_DEMO)
    : adminClient.from('sedes').select('id, nombre').eq('activa', true).neq('id', SEDE_DEMO).order('nombre')

  const [{ data: sedes }, { data: profiles }] = await Promise.all([
    sedesQuery as unknown as Promise<{ data: { id: string; nombre: string }[] | null }>,
    adminClient
      .from('profiles')
      .select('id, full_name, sede, area_trabajo')
      .eq('status', 'activo')
      .eq('is_demo', isDemo)
      .order('full_name') as unknown as Promise<{ data: { id: string; full_name: string; sede: string; area_trabajo: string[] }[] | null }>,
  ])

  return (
    <div className="mx-auto max-w-3xl" data-screen-label="Admin · Nuevo evento">
      <EncabezadoPagina
        titulo="Nuevo evento"
        sub="Crea el evento completo: datos, secciones, equipos y documentos en un solo flujo"
      />
      <WizardEvento sedes={sedes ?? []} profiles={profiles ?? []} />
    </div>
  )
}
