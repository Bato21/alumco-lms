import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { getViewerIsDemo } from '@/lib/auth/demoScope'
import CertificadosClient from './CertificadosClient'
import { EncabezadoPagina, Vacio } from '@/components/alumco/ds'

export const metadata: Metadata = { title: 'Gestión de certificados' }
export const dynamic = 'force-dynamic'

export default async function AdminCertificadosPage() {
  const adminClient = await createAdminClient()
  const isDemo = await getViewerIsDemo()

  const { data: certificates } = await adminClient
    .from('certificates')
    .select(`
      id,
      issued_at,
      pdf_url,
      user_id,
      course_id,
      courses (
        title
      )
    `)
    .eq('is_demo', isDemo)
    .order('issued_at', { ascending: false }) as { data: { id: string; issued_at: string; pdf_url: string | null; user_id: string; course_id: string; courses: { title: string } | { title: string }[] | null }[] | null }

  const userIds = [...new Set((certificates ?? []).map((c) => c.user_id))]
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, full_name, sede, area_trabajo')
    .in('id', userIds.length > 0 ? userIds : ['none']) as { data: { id: string; full_name: string; sede: string; area_trabajo: string[] | null }[] | null }

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  )

  const enriched = (certificates ?? []).map(cert => {
    const rawProfile = profileMap[cert.user_id] ?? null
    return {
      ...cert,
      courses: Array.isArray(cert.courses)
        ? (cert.courses[0] ?? null)
        : cert.courses,
      profile: rawProfile ? {
        ...rawProfile,
        area_trabajo: rawProfile.area_trabajo ?? [],
      } : null,
    }
  })

  return (
    <div data-screen-label="Admin · Certificados">
      {enriched.length === 0 ? (
        <>
          <EncabezadoPagina titulo="Certificados emitidos" sub="Registro completo para auditorías normativas SENAMA">
            <span className="badge badge-info">0 certificados</span>
          </EncabezadoPagina>
          <div className="card">
            <Vacio
              icono="certificado"
              titulo="No hay certificados emitidos aún"
              texto="Los certificados aparecerán aquí cuando los trabajadores completen sus cursos."
            />
          </div>
        </>
      ) : (
        <CertificadosClient certificates={enriched} total={enriched.length} />
      )}
    </div>
  )
}
