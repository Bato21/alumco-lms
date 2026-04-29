import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Award } from 'lucide-react'

export const metadata: Metadata = { title: 'Mis Certificados | Alumco LMS' }

export default async function MisCertificadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: certificates } = await supabase
    .from('certificates')
    .select(`
      id,
      issued_at,
      pdf_url,
      course_id,
      courses (
        title,
        description
      )
    `)
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false }) as { data: { id: string; issued_at: string; pdf_url: string | null; course_id: string; courses: { title: string; description: string | null } | { title: string; description: string | null }[] | null }[] | null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single() as { data: { full_name: string } | null }

  const total = certificates?.length ?? 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Mis certificados</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">Historial de cursos completados</p>
        </div>
        {total > 0 && (
          <span className="bg-[#2B4FA0]/10 text-[#2B4FA0] text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap">
            {total} {total === 1 ? 'certificado' : 'certificados'}
          </span>
        )}
      </div>

      {/* Lista */}
      {!certificates || certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="h-16 w-16 rounded-2xl bg-[#FFF8EC] flex items-center justify-center">
            <Award className="h-8 w-8 text-[#F5A623]" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-lg text-[#1A1A2E]">
              Aún no tienes certificados
            </p>
            <p className="text-sm text-[#6B7280] mt-1">
              Completa un curso para obtener tu primer certificado.
            </p>
          </div>
          <Link
            href="/cursos"
            className="px-5 py-2.5 bg-[#2B4FA0] text-white text-sm font-semibold rounded-xl hover:bg-[#1A2F6B] transition-colors min-h-[48px] inline-flex items-center"
          >
            Ver mis cursos
          </Link>
        </div>
      ) : (
        <ul className="space-y-4" role="list">
          {certificates.map((cert) => {
            const course = Array.isArray(cert.courses)
              ? cert.courses[0]
              : cert.courses

            const issuedDate = new Intl.DateTimeFormat('es-CL', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }).format(new Date(cert.issued_at))

            return (
              <li key={cert.id}>
                <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-l-4 border-[#F5A623] hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] transition-shadow p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">

                    {/* Ícono */}
                    <div className="h-12 w-12 rounded-xl bg-[#FFF8EC] flex items-center justify-center shrink-0">
                      <Award className="h-6 w-6 text-[#F5A623]" aria-hidden="true" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-[#F5A623] uppercase tracking-widest mb-1">
                        Certificado de aprobación
                      </p>
                      <h2 className="font-bold text-[#1A1A2E] text-lg leading-tight truncate">
                        {course?.title ?? '—'}
                      </h2>
                      <p className="text-sm text-[#6B7280] mt-1">
                        Emitido el {issuedDate}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 w-full sm:w-auto shrink-0 self-end sm:self-center">
                      <Link
                        href={`/certificado/${cert.id}`}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-[#F5A623] text-white text-sm font-semibold rounded-xl hover:bg-[#e0961a] transition-colors text-center min-h-[44px] inline-flex items-center justify-center"
                      >
                        Ver
                      </Link>
                      {cert.pdf_url && (
                        <a
                          href={cert.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none px-4 py-2.5 border border-[#F5A623] text-[#F5A623] text-sm font-semibold rounded-xl hover:bg-[#F5A623]/5 transition-colors text-center min-h-[44px] inline-flex items-center justify-center"
                        >
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
