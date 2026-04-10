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

  // Cargar certificado con datos del curso y del usuario
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

  // Solo el dueño del certificado puede verlo (o un admin)
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

  // Si es el dueño, obtener su nombre. Si es admin viendo el de otro, obtener el nombre del dueño
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
    <div className="min-h-screen bg-[#F5F5F5] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Navegación */}
        <Link
          href="/cursos"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#1A1A2E] transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver a mis cursos
        </Link>

        {/* Certificado */}
        <div className="bg-white rounded-2xl border-2 border-[#F5A623] overflow-hidden">

          {/* Header dorado */}
          <div className="bg-[#F5A623] px-8 py-6 text-center">
            <div className="flex justify-center mb-3">
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
            <p className="text-white/80 text-sm font-medium uppercase tracking-widest mb-1">
              Certificado de aprobación
            </p>
            <h1 className="text-white text-2xl font-extrabold">
              Alumco LMS
            </h1>
          </div>

          {/* Contenido */}
          <div className="px-8 py-8 space-y-6 text-center">
            <div>
              <p className="text-muted-foreground text-sm mb-1">
                Este certificado acredita que
              </p>
              <p className="text-3xl font-extrabold text-[#1A1A2E]">
                {ownerProfile?.full_name}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground text-sm mb-1">
                ha completado satisfactoriamente el curso
              </p>
              <p className="text-xl font-bold text-[#2B4FA0]">
                {course?.title}
              </p>
            </div>

            {/* Detalles */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-[#F5A623]/20">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Fecha
                </p>
                <p className="text-sm font-semibold text-[#1A1A2E]">
                  {issuedDate}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Sede
                </p>
                <p className="text-sm font-semibold text-[#1A1A2E]">
                  {ownerProfile?.sede === 'sede_1' ? 'Sede Principal' : 'Sede Secundaria'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  ID
                </p>
                <p className="text-sm font-mono text-muted-foreground">
                  {certificate.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Logo Alumco */}
            <div className="flex justify-center">
              <img
                src="https://ongalumco.cl/wp-content/uploads/2023/11/logo-alumco-completoccc-300x102.png"
                alt="ONG Alumco"
                width={150}
                height={51}
                className="object-contain opacity-80"
              />
            </div>
          </div>

          {/* Footer con acciones */}
          <div className="px-8 py-5 bg-[#F5F5F5] border-t flex gap-3">
            <PrintButton />

            {certificate.pdf_url && (
              
                href={certificate.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-11 rounded-lg bg-[#F5A623] text-white text-sm font-semibold hover:bg-[#F5A623]/90 transition-colors flex items-center justify-center gap-2"
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