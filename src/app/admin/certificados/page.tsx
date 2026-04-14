import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Certificados | Alumco LMS' }
export const dynamic = 'force-dynamic'

export default async function AdminCertificadosPage() {
  const adminClient = await createAdminClient()

  // Cargar certificados con datos del curso y del trabajador
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

  // Obtener perfiles de los trabajadores
  const userIds = [...new Set((certificates ?? []).map((c) => c.user_id))]
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, full_name, sede, area_trabajo')
    .in('id', userIds.length > 0 ? userIds : ['none'])

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p])
  )

  return (
    <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#1A1A2E]">
            Certificados emitidos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Registro completo para auditorías normativas
          </p>
        </div>
        <span className="bg-[#2B4FA0]/10 text-[#2B4FA0] text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap">
          {certificates?.length ?? 0} certificados
        </span>
      </div>

      {/* Tabla */}
      {!certificates || certificates.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 lg:p-16 flex flex-col items-center text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-[#F5A623]/10 flex items-center justify-center">
            <svg
              className="h-7 w-7 text-[#F5A623]"
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
          <p className="font-medium text-lg text-[#1A1A2E]">
            No hay certificados emitidos aún
          </p>
          <p className="text-sm text-muted-foreground">
            Los certificados aparecerán aquí cuando los trabajadores
            completen sus cursos.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F5F5F5] border-b">
                  <th className="px-4 lg:px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Trabajador
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Curso
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Sede
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Fecha emisión
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    ID
                  </th>
                  <th className="px-4 lg:px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {certificates.map((cert) => {
                  const profile = profileMap[cert.user_id]
                  const course = Array.isArray(cert.courses)
                    ? cert.courses[0]
                    : cert.courses

                  const issuedDate = new Intl.DateTimeFormat('es-CL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }).format(new Date(cert.issued_at))

                  return (
                    <tr
                      key={cert.id}
                      className="hover:bg-[#F5F5F5]/50 transition-colors"
                    >
                      {/* Trabajador */}
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center text-[#2B4FA0] font-bold text-sm shrink-0">
                            {profile?.full_name
                              .split(' ')
                              .map((n: string) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#1A1A2E] text-sm truncate">
                              {profile?.full_name ?? '—'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate lg:hidden">
                              {course?.title ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Curso */}
                      <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                        <p className="text-sm font-medium text-[#1A1A2E] max-w-[200px] truncate">
                          {course?.title ?? '—'}
                        </p>
                      </td>

                      {/* Sede */}
                      <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          profile?.sede === 'sede_1'
                            ? 'bg-[#E6F1FB] text-[#0C447C]'
                            : 'bg-[#EAF3DE] text-[#27500A]'
                        }`}>
                          {profile?.sede === 'sede_1'
                            ? 'Sede Principal'
                            : 'Sede Secundaria'}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="px-4 lg:px-6 py-4 text-sm text-muted-foreground hidden lg:table-cell">
                        {issuedDate}
                      </td>

                      {/* ID */}
                      <td className="px-4 lg:px-6 py-4 hidden lg:table-cell">
                        <span className="text-xs font-mono text-muted-foreground">
                          {cert.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 lg:px-6 py-4 text-right">
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
