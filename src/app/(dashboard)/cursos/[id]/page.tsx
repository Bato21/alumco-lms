import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { filterCoursesByWorkerAreas } from '@/lib/utils'
import { CertificateBadge } from '@/components/alumco/CertificateBadge'
import Link from 'next/link'
import type { ContentType, Module } from '@/lib/types/database'
import { Badge, BadgeEstado, Anillo, Onda, Icono, type IconoNombre } from '@/components/alumco/ds'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface CourseDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: course } = await supabase
    .from('courses')
    .select('title')
    .eq('id', id)
    .single() as { data: { title: string } | null }

  return {
    title: course?.title ? `${course.title} | Alumco LMS` : 'Curso | Alumco LMS',
  }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const user = await getCachedUser()

  if (!user) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="silencio">Debes iniciar sesión para ver este curso.</p>
      </div>
    )
  }

  const [
    { data: course },
    { data: profile },
    { data: modules },
    { data: progress },
    { data: certificate },
  ] = await Promise.all([
    supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single() as unknown as Promise<{ data: { id: string; title: string; description: string | null; thumbnail_url: string | null; is_published: boolean; order_index: number; created_by: string | null; created_at: string; updated_at: string; target_areas: string[] | null; deadline: string | null; deadline_description: string | null } | null }>,
    supabase
      .from('profiles')
      .select('full_name, area_trabajo, role')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: { full_name: string; area_trabajo: string[] | null; role: string } | null }>,
    supabase
      .from('modules')
      .select('*')
      .eq('course_id', id)
      .order('order_index') as unknown as Promise<{ data: import('@/lib/types/database').Module[] | null }>,
    supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', id)
      .single() as unknown as Promise<{ data: { completed_modules: string[]; is_completed: boolean } | null }>,
    supabase
      .from('certificates')
      .select('id, issued_at, pdf_url')
      .eq('user_id', user.id)
      .eq('course_id', id)
      .single() as unknown as Promise<{ data: { id: string; issued_at: string; pdf_url: string | null } | null }>,
  ])

  if (!course) {
    notFound()
  }

  if (profile?.role === 'trabajador') {
    const workerAreas = profile.area_trabajo ?? []
    const hasAccess = filterCoursesByWorkerAreas(
      [{ ...course, target_areas: course.target_areas ?? [] }],
      workerAreas
    ).length > 0

    if (!hasAccess) {
      return (
        <div className="col" style={{ maxWidth: 560, margin: '0 auto', padding: '64px 0', alignItems: 'center', textAlign: 'center', gap: 12 }}>
          <div className="vacio-icono"><Icono n="alerta" s={30} /></div>
          <h2 className="t-display" style={{ fontSize: 24 }}>Curso no disponible</h2>
          <p className="silencio">
            Este curso no está asignado a tu área de trabajo. Contacta a tu administrador si crees que es un error.
          </p>
          <Link href="/cursos" className="btn btn-primary" style={{ marginTop: 8 }}>
            <Icono n="flechaIzq" s={18} /> Volver a mis cursos
          </Link>
        </div>
      )
    }
  }

  const completedModuleIds = progress?.completed_modules || []
  const totalModules = modules?.length || 0
  const completedModules = completedModuleIds.length
  const courseProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0
  const isCourseCompleted = progress?.is_completed || false

  const estadoCurso = isCourseCompleted ? 'completado' : courseProgress > 0 ? 'en-curso' : 'pendiente'

  // Próximo módulo accesible no completado
  const nextModule = (modules ?? []).find((m, i) => {
    const prevDone = i === 0 || completedModuleIds.includes(modules![i - 1]?.id)
    return !completedModuleIds.includes(m.id) && prevDone
  })

  return (
    <div className="col" style={{ gap: 22 }} data-screen-label="Trabajador · Detalle de curso">
      <Link href="/cursos" className="btn btn-ghost entra" style={{ alignSelf: 'flex-start', marginLeft: -12 }}>
        <Icono n="flechaIzq" s={18} /> Volver a mis cursos
      </Link>

      {/* Hero del curso */}
      <div
        className="card bloque-marca entra entra-1"
        style={{ background: 'var(--grad-marca)', border: 'none', color: '#fff', overflow: 'hidden' }}
      >
        <div style={{ padding: '30px 32px 18px', position: 'relative', zIndex: 1 }}>
          <div className="fila" style={{ gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <BadgeEstado estado={estadoCurso} />
            {(course.target_areas ?? []).slice(0, 1).map((a) => (
              <Badge key={a} tono="info" punto={false}>{a}</Badge>
            ))}
          </div>
          <h1 className="t-display" style={{ fontSize: 30, color: '#fff', maxWidth: 640 }}>{course.title}</h1>
          {course.description && (
            <p style={{ color: 'rgba(255,255,255,0.72)', marginTop: 10, maxWidth: 600, fontSize: 15.5 }}>{course.description}</p>
          )}
          <div className="fila texto-s" style={{ gap: 20, marginTop: 16, color: 'rgba(255,255,255,0.85)', flexWrap: 'wrap' }}>
            <span className="fila" style={{ gap: 6 }}><Icono n="doc" s={16} />{totalModules} módulos</span>
            <span className="fila" style={{ gap: 6 }}><Icono n="check" s={16} />{completedModules} completados</span>
          </div>
        </div>
        <Onda alto={30} />
      </div>

      <div className="entra entra-2 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 items-start">
        {/* Contenido del curso */}
        <div className="card col" style={{ gap: 0 }}>
          <div className="fila card-pad" style={{ paddingBottom: 10 }}>
            <h2 className="t-display crece" style={{ fontSize: 21 }}>Contenido del curso</h2>
            <span className="badge badge-neutro">{totalModules} módulos</span>
          </div>
          {modules && modules.length > 0 ? (
            modules.map((module, index) => {
              const isCompleted = completedModuleIds.includes(module.id)
              const isPreviousCompleted = index === 0 || completedModuleIds.includes(modules[index - 1]?.id)
              const canAccess = isPreviousCompleted || isCompleted
              const enCurso = canAccess && !isCompleted && module.id === nextModule?.id
              return (
                <ModuleRow
                  key={module.id}
                  module={module}
                  index={index + 1}
                  isCompleted={isCompleted}
                  canAccess={canAccess}
                  enCurso={enCurso}
                />
              )
            })
          ) : (
            <div className="card-pad" style={{ textAlign: 'center', padding: 40 }}>
              <p className="silencio">Este curso aún no tiene contenido disponible.</p>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="col" style={{ gap: 20 }}>
          <div className="card card-pad col" style={{ gap: 16, alignItems: 'center', textAlign: 'center' }}>
            <Anillo pct={courseProgress} s={110} grosor={11} color={isCourseCompleted ? 'var(--ok)' : 'var(--ambar)'} />
            <div>
              <h3 style={{ fontSize: 17 }}>{isCourseCompleted ? '¡Curso completado!' : 'Vas por buen camino'}</h3>
              <p className="texto-s silencio" style={{ marginTop: 4 }}>
                {completedModules} de {totalModules} módulos completados.
              </p>
            </div>
            {nextModule ? (
              <Link href={`/cursos/${course.id}/modulos/${nextModule.id}`} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                <Icono n="play" s={20} /> {courseProgress > 0 ? 'Continuar' : 'Comenzar curso'}
              </Link>
            ) : modules && modules.length > 0 ? (
              <Link href={`/cursos/${course.id}/modulos/${modules[0].id}`} className="btn btn-secondary btn-lg" style={{ width: '100%' }}>
                Repasar curso
              </Link>
            ) : null}
          </div>

          {isCourseCompleted && certificate && profile ? (
            <div className="card card-pad">
              <CertificateBadge certificate={certificate} courseName={course.title} workerName={profile.full_name} />
            </div>
          ) : (
            <div className="card card-pad fila" style={{ gap: 14 }}>
              <span style={{ width: 44, height: 44, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ambar-50)', color: 'var(--ambar-700)' }}>
                <Icono n="certificado" s={22} />
              </span>
              <p className="texto-s silencio" style={{ lineHeight: 1.45 }}>
                Al completar todos los módulos y aprobar la evaluación recibirás tu{' '}
                <strong style={{ color: 'var(--tinta)' }}>certificado con folio verificable</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Module Row (didasko) ────────────────────────────────────────────────────

const TIPO_ICONO: Record<ContentType, IconoNombre> = {
  video: 'video',
  pdf: 'doc',
  slides: 'doc',
  quiz: 'quiz',
}

function ModuleRow({
  module,
  index,
  isCompleted,
  canAccess,
  enCurso,
}: {
  module: Module
  index: number
  isCompleted: boolean
  canAccess: boolean
  enCurso: boolean
}) {
  const icono: IconoNombre = isCompleted ? 'check' : TIPO_ICONO[module.content_type]
  const estado = isCompleted ? 'completado' : enCurso ? 'en-curso' : canAccess ? 'pendiente' : 'pendiente'

  const inner = (
    <>
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isCompleted ? 'var(--ok-bg)' : enCurso ? 'var(--ambar-100)' : 'var(--arena-100)',
          color: isCompleted ? 'var(--ok)' : enCurso ? 'var(--ambar-700)' : 'var(--tinta-3)',
        }}
      >
        <Icono n={icono} s={20} />
      </span>
      <div className="crece" style={{ lineHeight: 1.35, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15.5, color: 'var(--tinta)' }}>
          {index}. {module.title}
        </div>
        <div className="texto-s silencio-3">
          {module.duration_mins ? `${module.duration_mins} min` : 'Módulo'}
        </div>
      </div>
      {canAccess ? <BadgeEstado estado={estado} /> : <Icono n="ojo" s={18} />}
      {canAccess && (isCompleted || enCurso) && <Icono n="chevR" s={18} />}
    </>
  )

  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    textAlign: 'left' as const,
    padding: '16px 22px',
    minHeight: 68,
    borderTop: '1px solid var(--borde-suave)',
    background: enCurso ? 'var(--ambar-50)' : 'transparent',
  }

  if (!canAccess) {
    return <div style={{ ...baseStyle, opacity: 0.6 }}>{inner}</div>
  }
  return (
    <Link href={`/cursos/${module.course_id}/modulos/${module.id}`} style={baseStyle}>
      {inner}
    </Link>
  )
}
