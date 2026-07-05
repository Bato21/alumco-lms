import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { filterCoursesByWorkerAreas } from '@/lib/utils'
import { DeadlineCalendar } from '@/components/alumco/curso/DeadlineCalendar'
import WelcomeModal from '@/components/alumco/shared/WelcomeModal'
import { EventoDashboardCard } from '@/components/alumco/eventos/EventoDashboardCard'
import { Anillo, Onda, Icono } from '@/components/alumco/ds'
import { CursoCardTrab, type EstadoCurso } from '@/components/alumco/curso/CursoCardTrab'

export const metadata: Metadata = { title: 'Inicio | Alumco LMS' }

export default async function InicioPage() {
  const supabase = await createClient()
  const user = await getCachedUser()

  const [{ data: profile }, { data: courses }, { data: progressData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, sede, area_trabajo, onboarding_completed')
      .eq('id', user!.id)
      .single() as unknown as Promise<{ data: { full_name: string; sede: string; area_trabajo: string[] | null; onboarding_completed: boolean | null } | null }>,
    supabase
      .from('courses')
      .select('id, title, deadline, deadline_description, is_published, target_areas')
      .eq('is_published', true)
      .order('order_index') as unknown as Promise<{ data: { id: string; title: string; deadline: string | null; deadline_description: string | null; is_published: boolean; target_areas: string[] | null }[] | null }>,
    supabase
      .from('course_progress')
      .select('course_id, completed_modules, is_completed')
      .eq('user_id', user!.id) as unknown as Promise<{ data: { course_id: string; completed_modules: string[] | null; is_completed: boolean }[] | null }>,
  ])

  const workerAreas = profile?.area_trabajo ?? []

  const filteredCourses = filterCoursesByWorkerAreas(
    (courses ?? []).map(c => ({ ...c, target_areas: c.target_areas ?? [] })),
    workerAreas
  )

  const courseIds = filteredCourses.map(c => c.id)
  const { data: allModules } = await supabase
    .from('modules')
    .select('course_id')
    .in('course_id', courseIds.length > 0 ? courseIds : ['none']) as { data: { course_id: string }[] | null }

  const totalModulesByCourse = new Map<string, number>()
  allModules?.forEach(m => {
    totalModulesByCourse.set(m.course_id, (totalModulesByCourse.get(m.course_id) || 0) + 1)
  })

  // Calcular stats
  const coursesWithStatus = filteredCourses.map(course => {
    const progress = progressData?.find(p => p.course_id === course.id)
    const completed = Array.isArray(progress?.completed_modules)
      ? progress.completed_modules.length
      : 0
    const total = totalModulesByCourse.get(course.id) || 1
    const progressPct = Math.round((completed / total) * 100)

    let status: 'completed' | 'in_progress' | 'not_started' = 'not_started'
    if (progress?.is_completed) status = 'completed'
    else if (completed > 0) status = 'in_progress'

    // Calcular estado del deadline
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let deadlineStatus: 'overdue' | 'soon' | 'ok' | null = null

    if (course.deadline && status !== 'completed') {
      const deadline = new Date(course.deadline)
      deadline.setHours(0, 0, 0, 0)
      const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (daysLeft < 0) deadlineStatus = 'overdue'
      else if (daysLeft <= 7) deadlineStatus = 'soon'
      else deadlineStatus = 'ok'
    }

    return { ...course, status, progressPct, deadlineStatus }
  })

  const totalCourses = coursesWithStatus.length
  const completedCount = coursesWithStatus.filter(c => c.status === 'completed').length

  const cumulativeProgress = coursesWithStatus.length > 0
    ? Math.round(
        coursesWithStatus.reduce((acc, c) => acc + c.progressPct, 0) /
        coursesWithStatus.length
      )
    : 0

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Bienvenido'

  const showWelcome = profile?.onboarding_completed === false

  const estadoCurso = (s: 'completed' | 'in_progress' | 'not_started'): EstadoCurso =>
    s === 'completed' ? 'completado' : s === 'in_progress' ? 'en-curso' : 'pendiente'

  const continuar =
    coursesWithStatus.find((c) => c.status === 'in_progress') ??
    coursesWithStatus.find((c) => c.status === 'not_started')

  const proximos = coursesWithStatus
    .filter((c) => c.id !== continuar?.id && c.status !== 'completed')
    .slice(0, 3)

  const alertCourse =
    coursesWithStatus.find((c) => c.deadlineStatus === 'overdue') ??
    coursesWithStatus.find((c) => c.deadlineStatus === 'soon')

  const fechaHoy = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="col" style={{ gap: 26 }} data-screen-label="Trabajador · Inicio">

      {showWelcome && (
        <WelcomeModal
          fullName={profile?.full_name ?? ''}
          areas={Array.isArray(profile?.area_trabajo) ? profile.area_trabajo : []}
          sede={profile?.sede ?? 'sede_1'}
        />
      )}

      <EventoDashboardCard userId={user!.id} isAdmin={false} />

      {/* Saludo */}
      <div className="entra">
        <span className="t-eyebrow">◆ {fechaHoy}</span>
        <h1 className="t-display" style={{ fontSize: 36, marginTop: 8 }}>
          Hola {firstName},<br />sigamos <em>aprendiendo</em>.
        </h1>
        <p className="silencio" style={{ marginTop: 8, fontSize: 16.5 }}>
          Llevas {completedCount} de {totalCourses} cursos al día. {completedCount === totalCourses && totalCourses > 0 ? '¡Excelente trabajo!' : '¡Buen trabajo!'}
        </p>
      </div>

      {/* Card continuar */}
      {continuar && (
        <div
          className="card bloque-marca entra entra-1"
          style={{ background: 'var(--grad-marca)', border: 'none', color: '#fff', overflow: 'hidden' }}
        >
          <div style={{ padding: '30px 32px 20px', position: 'relative', zIndex: 1 }}>
            <div className="fila" style={{ gap: 24, flexWrap: 'wrap' }}>
              <div className="crece" style={{ minWidth: 260 }}>
                <span className="t-eyebrow" style={{ color: 'var(--ambar)' }}>Continúa donde quedaste</span>
                <h2 className="t-display" style={{ fontSize: 27, color: '#fff', margin: '10px 0 8px' }}>{continuar.title}</h2>
                <p className="texto-s" style={{ color: 'rgba(255,255,255,0.72)', marginBottom: 18 }}>
                  {continuar.progressPct > 0 ? `Vas en el ${continuar.progressPct}% del curso` : 'Aún no comienzas este curso'}
                </p>
                <Link href={`/cursos/${continuar.id}`} className="btn btn-primary btn-lg">
                  <Icono n="play" s={20} /> {continuar.progressPct > 0 ? 'Continuar curso' : 'Comenzar curso'}
                </Link>
              </div>
              <div style={{ alignSelf: 'center' }}>
                <Anillo pct={cumulativeProgress} s={104} grosor={10} etiqueta={`${cumulativeProgress}%`} />
              </div>
            </div>
          </div>
          <Onda alto={30} />
        </div>
      )}

      {/* Próximos cursos */}
      {proximos.length > 0 && (
        <div className="entra entra-2">
          <div className="fila" style={{ marginBottom: 14 }}>
            <h2 className="t-display crece" style={{ fontSize: 23 }}>Tus próximos cursos</h2>
            <Link href="/cursos" className="btn btn-ghost">Ver todos <Icono n="chevR" s={17} /></Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 18 }}>
            {proximos.map((c) => (
              <CursoCardTrab
                key={c.id}
                titulo={c.title}
                href={`/cursos/${c.id}`}
                estado={estadoCurso(c.status)}
                progreso={c.progressPct}
                meta={`${totalModulesByCourse.get(c.id) ?? 0} módulos`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Alerta de vencimiento */}
      {alertCourse && (
        <div className="card entra entra-3 fila card-pad" style={{ gap: 18, flexWrap: 'wrap' }}>
          <span
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: alertCourse.deadlineStatus === 'overdue' ? 'var(--peligro-bg)' : 'var(--aviso-bg)',
              color: alertCourse.deadlineStatus === 'overdue' ? 'var(--peligro)' : 'var(--aviso)',
              flex: 'none',
            }}
          >
            <Icono n="alerta" s={24} />
          </span>
          <div className="crece" style={{ minWidth: 240 }}>
            <h3 style={{ fontSize: 16.5 }}>
              {alertCourse.deadlineStatus === 'overdue' ? 'Tienes un curso vencido' : 'Un curso vence pronto'}: {alertCourse.title}
            </h3>
            <p className="texto-s silencio">Complétalo a la brevedad para mantener tu certificación vigente.</p>
          </div>
          <Link href={`/cursos/${alertCourse.id}`} className="btn btn-primary">Ir al curso</Link>
        </div>
      )}

      {/* Calendario de plazos */}
      <div className="card card-pad entra entra-4 col" style={{ gap: 16 }}>
        <div className="fila">
          <h2 className="crece" style={{ fontSize: 16.5 }}>Plazos de cursos</h2>
          <Link href="/cursos" className="btn btn-ghost btn-sm">Ver todos <Icono n="chevR" s={16} /></Link>
        </div>
        <DeadlineCalendar courses={coursesWithStatus.filter((c): c is typeof c & { deadline: string } => c.deadline !== null)} />
      </div>

    </div>
  )
}
