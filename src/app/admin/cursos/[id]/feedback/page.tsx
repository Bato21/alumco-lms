import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { getViewerIsDemo } from '@/lib/auth/demoScope'
import { getCourseFeedbackSummaryAction } from '@/lib/actions/feedback'
import { Icono, Progreso, Vacio } from '@/components/alumco/ds'
import { Estrellas } from '@/components/alumco/curso/CourseFeedbackForm'

export const metadata: Metadata = { title: 'Valoraciones del curso' }
export const dynamic = 'force-dynamic'

export default async function FeedbackCursoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const adminClient = await createAdminClient()
  const isDemo = await getViewerIsDemo()

  const { data: course } = await adminClient
    .from('courses')
    .select('id, title, is_demo')
    .eq('id', id)
    .maybeSingle() as { data: { id: string; title: string; is_demo: boolean } | null }

  if (!course || course.is_demo !== isDemo) notFound()

  const { data: resumen, error } = await getCourseFeedbackSummaryAction(id)
  if (error) notFound()

  const total = resumen?.total ?? 0

  return (
    <div className="col" style={{ gap: 18 }} data-screen-label="Admin · Valoraciones del curso">
      <Link href="/admin/cursos" className="btn btn-ghost" style={{ alignSelf: 'flex-start', marginLeft: -12 }}>
        <Icono n="flechaIzq" s={18} /> Volver a cursos
      </Link>

      <div>
        <h1 className="t-display" style={{ fontSize: 28 }}>Valoraciones</h1>
        <p className="silencio" style={{ marginTop: 4 }}>{course.title}</p>
      </div>

      {total === 0 ? (
        <Vacio
          icono="estrella"
          titulo="Sin valoraciones todavía"
          texto="Los participantes pueden valorar el curso cuando lo completan al 100%."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-5 items-start">
          {/* Promedio + distribución */}
          <div className="card card-pad col" style={{ gap: 16 }}>
            <div className="col" style={{ gap: 6, alignItems: 'center', textAlign: 'center' }}>
              <div className="t-display" style={{ fontSize: 52, lineHeight: 1 }}>
                {resumen!.average.toFixed(1)}
              </div>
              <Estrellas valor={Math.round(resumen!.average)} s={22} />
              <p className="texto-s silencio-3">
                {total} valoración{total !== 1 ? 'es' : ''} de participantes que completaron el curso
              </p>
            </div>

            <div className="col" style={{ gap: 8 }}>
              {([5, 4, 3, 2, 1] as const).map((nota) => {
                const n = resumen!.distribution[nota]
                const pct = total > 0 ? Math.round((n / total) * 100) : 0
                return (
                  <div key={nota} className="fila" style={{ gap: 10 }}>
                    <span className="texto-s" style={{ width: 26, fontWeight: 600 }}>{nota} ★</span>
                    <span className="crece"><Progreso pct={pct} alto={7} /></span>
                    <span className="texto-s silencio-3" style={{ width: 34, textAlign: 'right' }}>{n}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Comentarios */}
          <div className="card card-pad col" style={{ gap: 14 }}>
            <div>
              <h2 style={{ fontSize: 16.5 }}>Comentarios</h2>
              <p className="texto-s silencio-3">
                {resumen!.comments.length} de {total} valoraciones incluyen comentario
              </p>
            </div>

            {resumen!.comments.length === 0 ? (
              <p className="silencio texto-s">Nadie dejó comentario todavía.</p>
            ) : (
              <ul className="col" style={{ gap: 12, listStyle: 'none', margin: 0, padding: 0 }}>
                {resumen!.comments.map((c, i) => (
                  <li
                    key={`${c.author}-${c.created_at}-${i}`}
                    className="col"
                    style={{
                      gap: 6,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: 'var(--crema)',
                      border: '1px solid var(--borde-suave)',
                    }}
                  >
                    <div className="fila" style={{ gap: 10, flexWrap: 'wrap' }}>
                      <Estrellas valor={c.rating} s={15} />
                      <strong style={{ fontSize: 13.5 }}>{c.author}</strong>
                      <span className="crece" />
                      <span className="texto-s silencio-3">{fecha(c.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 14.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                      {c.comment}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function fecha(iso: string): string {
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(iso))
}
