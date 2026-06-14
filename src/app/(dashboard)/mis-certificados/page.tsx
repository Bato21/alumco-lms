import type { Metadata } from 'next'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Gota, BadgeEstado, Icono, Vacio } from '@/components/alumco/ds'

export const metadata: Metadata = { title: 'Mis Certificados | Alumco LMS' }

export default async function MisCertificadosPage() {
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const [{ data: certificates }, { data: profile }] = await Promise.all([
    supabase
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
      .order('issued_at', { ascending: false }) as unknown as Promise<{ data: { id: string; issued_at: string; pdf_url: string | null; course_id: string; courses: { title: string; description: string | null } | { title: string; description: string | null }[] | null }[] | null }>,
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: { full_name: string } | null }>,
  ])

  return (
    <div className="col" style={{ gap: 22 }} data-screen-label="Trabajador · Certificados">
      <div className="entra">
        <h1 className="t-display" style={{ fontSize: 32 }}>Mis certificados</h1>
        <p className="silencio" style={{ marginTop: 6, fontSize: 16 }}>
          Documentos con folio verificable para fiscalizaciones y concursos.
        </p>
      </div>

      {!certificates || certificates.length === 0 ? (
        <div className="card">
          <Vacio
            icono="certificado"
            titulo="Aún no tienes certificados"
            texto="Completa un curso para obtener tu primer certificado."
            accion="Ver mis cursos"
          />
        </div>
      ) : (
        <div className="entra entra-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {certificates.map((cert) => {
            const course = Array.isArray(cert.courses) ? cert.courses[0] : cert.courses
            const issuedDate = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(cert.issued_at))
            const folio = `ALC-${cert.id.slice(0, 8).toUpperCase()}`
            return (
              <article key={cert.id} className="card card-hover col" style={{ overflow: 'hidden' }}>
                <div className="bloque-marca" style={{ background: 'var(--grad-marca)', padding: '16px 20px', color: '#fff', position: 'relative' }}>
                  <div className="fila">
                    <Gota s={18} />
                    <span style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginLeft: 8 }}>
                      Certificado Alumco
                    </span>
                    <span className="crece" />
                    <BadgeEstado estado="vigente" />
                  </div>
                </div>
                <div className="card-pad col" style={{ gap: 12 }}>
                  <h3 style={{ fontSize: 16.5, lineHeight: 1.35, minHeight: 44 }}>{course?.title ?? '—'}</h3>
                  <div className="texto-s silencio col" style={{ gap: 4 }}>
                    <span className="fila" style={{ gap: 8 }}><Icono n="check" s={15} /> Emitido: {issuedDate}</span>
                    <span className="fila" style={{ gap: 8 }}><Icono n="doc" s={15} /> Folio {folio}</span>
                  </div>
                  <div className="fila" style={{ gap: 10, marginTop: 4 }}>
                    <Link href={`/certificado/${cert.id}`} className="btn btn-secondary btn-sm crece">
                      <Icono n="ojo" s={16} /> Ver
                    </Link>
                    {cert.pdf_url && (
                      <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm crece">
                        <Icono n="descargar" s={16} /> Descargar
                      </a>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
