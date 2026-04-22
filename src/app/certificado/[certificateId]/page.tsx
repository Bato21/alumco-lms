import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PrintButton } from '@/components/alumco/PrintButton'

export const metadata: Metadata = { title: 'Certificado | Alumco LMS' }

interface CertificadoPageProps {
  params: Promise<{ certificateId: string }>
}

export default async function CertificadoPage({ params }: CertificadoPageProps) {
  const { certificateId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = await createAdminClient()

  const { data: certificate } = await adminClient
    .from('certificates')
    .select(`
      id,
      issued_at,
      pdf_url,
      user_id,
      course_id,
      courses (
        title,
        description
      )
    `)
    .eq('id', certificateId)
    .single()

  if (!certificate) notFound()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('full_name, role, sede, area_trabajo')
    .eq('id', user.id)
    .single()

  if (
    certificate.user_id !== user.id &&
    profile?.role !== 'admin'
  ) {
    notFound()
  }

  const { data: ownerProfile } = await adminClient
    .from('profiles')
    .select('full_name, sede, area_trabajo')
    .eq('id', certificate.user_id)
    .single()

  const course = Array.isArray(certificate.courses)
    ? certificate.courses[0]
    : certificate.courses

  const issuedDate = new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(certificate.issued_at))

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8 md:py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Navegación */}
        <Link
          href={profile?.role === 'admin' ? '/admin/certificados' : '/mis-certificados'}
          className="inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#1A1A2E] transition-colors min-h-[44px]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          {profile?.role === 'admin' ? 'Volver a certificados' : 'Volver a mis certificados'}
        </Link>

        {/* Certificado */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden border border-[#F5A623]/20">

          {/* Header dorado */}
          <div className="bg-gradient-to-r from-[#F5A623] to-[#e0961a] px-6 md:px-10 py-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-white"
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
            </div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">
              Certificado de aprobación
            </p>
            <h1 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight">
              Alumco LMS
            </h1>
            <p className="text-white/70 text-xs mt-1 tracking-wide">KimuKo · ELEAM Chile</p>
          </div>

          {/* Contenido */}
          <div className="px-6 md:px-10 py-8 space-y-6 text-center">
            <div>
              <p className="text-[#6B7280] text-sm mb-2">
                Este certificado acredita que
              </p>
              <p className="text-3xl md:text-4xl font-extrabold text-[#1A1A2E] break-words leading-tight">
                {ownerProfile?.full_name}
              </p>
            </div>

            <div>
              <p className="text-[#6B7280] text-sm mb-2">
                ha completado satisfactoriamente el curso
              </p>
              <p className="text-xl md:text-2xl font-bold text-[#2B4FA0] break-words">
                {course?.title}
              </p>
            </div>

            {/* Detalles */}
            <div className="grid grid-cols-3 gap-4 py-5 border-y border-[#F5A623]/20">
              <div>
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1.5 font-semibold">
                  Fecha
                </p>
                <p className="text-sm font-semibold text-[#1A1A2E] leading-snug">
                  {issuedDate}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1.5 font-semibold">
                  Sede
                </p>
                <p className="text-sm font-semibold text-[#1A1A2E]">
                  {ownerProfile?.sede === 'sede_1' ? 'Hualpén' : 'Coyhaique'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1.5 font-semibold">
                  ID
                </p>
                <p className="text-sm font-mono text-[#6B7280]">
                  {certificate.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Logo Alumco */}
            <div className="flex justify-center pt-2">
              <img
                src="https://ongalumco.cl/wp-content/uploads/2023/11/logo-alumco-completoccc-300x102.png"
                alt="ONG Alumco"
                width={140}
                height={48}
                className="object-contain opacity-70"
              />
            </div>
          </div>

          {/* Footer con acciones */}
          <div className="px-6 md:px-10 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-end">
            <PrintButton />

            {certificate.pdf_url && (
              <a
                href={certificate.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#F5A623] text-white text-sm font-semibold hover:bg-[#e0961a] transition-colors min-h-[44px]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar PDF
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
