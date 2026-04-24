import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'

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
    .order('issued_at', { ascending: false })

  const userIds = [...new Set((certificates ?? []).map((c) => c.user_id))]
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, full_name, sede, area_trabajo')
    .in('id', userIds.length > 0 ? userIds : ['none'])

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  )

  const total = certificates?.length ?? 0

  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Certificados emitidos</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">Registro completo para auditorías normativas SENAMA</p>
        </div>
        <span className="bg-[#2B4FA0]/10 text-[#2B4FA0] text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap">
          {total} {total === 1 ? 'certificado' : 'certificados'}
        </span>
      </div>

      {/* Empty state */}
      {!certificates || certificates.length === 0 ? (
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
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-widest text-[#6B7280] font-bold">
                <tr>
                  <th className="px-5 lg:px-6 py-3">Trabajador</th>
                  <th className="px-5 lg:px-6 py-3 hidden sm:table-cell">Curso</th>
                  <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">Sede</th>
                  <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">Fecha emisión</th>
                  <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">ID</th>
                  <th className="px-5 lg:px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {certificates.map((cert) => {
                  const profile = profileMap[cert.user_id]
                  const course = Array.isArray(cert.courses)
                    ? cert.courses[0]
                    : cert.courses

                  const initials = profile?.full_name
                    ? profile.full_name
                        .split(' ')
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : '?'

                  const issuedDate = new Intl.DateTimeFormat('es-CL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }).format(new Date(cert.issued_at))

                  return (
                    <tr key={cert.id} className="hover:bg-gray-50/70 transition-colors">

                      {/* Trabajador */}
                      <td className="px-5 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center text-[#2B4FA0] font-bold text-sm shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1A1A2E] truncate max-w-[160px]">
                              {profile?.full_name ?? '—'}
                            </p>
                            <p className="text-xs text-[#6B7280] truncate">
                              {Array.isArray(profile?.area_trabajo)
                                ? profile.area_trabajo.join(', ')
                                : (profile?.area_trabajo ?? '')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Curso */}
                      <td className="px-5 lg:px-6 py-4 hidden sm:table-cell">
                        <p className="text-sm font-medium text-[#1A1A2E] max-w-[180px] truncate">
                          {course?.title ?? '—'}
                        </p>
                      </td>

                      {/* Sede */}
                      <td className="px-5 lg:px-6 py-4 hidden lg:table-cell">
                        {profile?.sede ? (
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            profile.sede === 'sede_1'
                              ? 'bg-[#E6F1FB] text-[#2B4FA0]'
                              : 'bg-[#EAF3DE] text-[#27500A]'
                          }`}>
                            {profile.sede === 'sede_1' ? 'Hualpén' : 'Coyhaique'}
                          </span>
                        ) : (
                          <span className="text-[#6B7280] text-xs">—</span>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="px-5 lg:px-6 py-4 text-sm text-[#6B7280] hidden lg:table-cell">
                        {issuedDate}
                      </td>

                      {/* ID */}
                      <td className="px-5 lg:px-6 py-4 hidden lg:table-cell">
                        <span className="text-xs font-mono text-[#6B7280]">
                          {cert.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-5 lg:px-6 py-4 text-right">
                        <Link
                          href={`/certificado/${cert.id}`}
                          className="inline-flex items-center px-4 py-2 text-sm text-[#2B4FA0] font-semibold hover:bg-[#2B4FA0]/5 rounded-lg transition-colors min-h-[44px]"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
