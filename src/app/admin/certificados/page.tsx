import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import CertificadosClient from './CertificadosClient'

export const metadata: Metadata = { title: 'Certificados | Alumco LMS' }
export const dynamic = 'force-dynamic'

export default async function AdminCertificadosPage() {
  const adminClient = await createAdminClient()

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
    .order('issued_at', { ascending: false }) as { data: { id: string; issued_at: string; pdf_url: string | null; user_id: string; course_id: string; courses: { title: string } | { title: string }[] | null }[] | null }

  const userIds = [...new Set((certificates ?? []).map((c) => c.user_id))]
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, full_name, sede, area_trabajo')
    .in('id', userIds.length > 0 ? userIds : ['none']) as { data: { id: string; full_name: string; sede: string; area_trabajo: string[] }[] | null }

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  )

  const enriched = (certificates ?? []).map(cert => ({
    ...cert,
    courses: Array.isArray(cert.courses)
      ? (cert.courses[0] ?? null)
      : cert.courses,
    profile: profileMap[cert.user_id] ?? null,
  }))

  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-6">

      {enriched.length === 0 ? (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1A1A2E]">Certificados emitidos</h1>
              <p className="text-[#6B7280] text-sm mt-0.5">Registro completo para auditorías normativas SENAMA</p>
            </div>
            <span className="bg-[#2B4FA0]/10 text-[#2B4FA0] text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap">
              0 certificados
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-8 lg:p-20 flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-[#FFF8EC] flex items-center justify-center">
              <svg
                className="h-8 w-8 text-[#F5A623]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="6"/>
                <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-lg text-[#1A1A2E]">No hay certificados emitidos aún</p>
              <p className="text-sm text-[#6B7280] mt-1">
                Los certificados aparecerán aquí cuando los trabajadores completen sus cursos.
              </p>
            </div>
          </div>
        </>
      ) : (
        <CertificadosClient certificates={enriched} total={enriched.length} />
      )}
    </div>
  )
}
