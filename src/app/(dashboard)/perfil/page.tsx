import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient, getCachedUser } from '@/lib/supabase/server'
import { ProfileClient } from './ProfileClient'
import Link from 'next/link'
import { ActivarNotificaciones } from '@/components/alumco/shared/ActivarNotificaciones'
import { AccessibilityPanel } from '@/components/alumco/shared/AccessibilityPanel'
import { getMyAdminDaysSummary } from '@/lib/actions/admin-days'
import { getUserPreferences } from '@/lib/actions/preferences'
import { Icono } from '@/components/alumco/ds'

export const metadata: Metadata = { title: 'Mi perfil' }

export default async function PerfilPage() {
  const supabase = await createClient()
  const user = await getCachedUser()

  if (!user) redirect('/login')

  // El perfil y las stats de trabajador se piden juntos: esperar el perfil
  // para decidir la rama agregaba un round trip serial. Para admin/profesor
  // las 3 queries extra son baratas (filtran por su propio user_id) y se
  // descartan.
  const [{ data: profile }, { data: wProgress }, { data: wCerts }, { data: wCourses }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, rut, sede, area_trabajo, role, status, fecha_nacimiento, avatar_url, firma_url, created_at, approved_at')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: { id: string; full_name: string; rut: string | null; sede: string; area_trabajo: string[] | null; role: string; status: string; fecha_nacimiento: string | null; avatar_url: string | null; firma_url: string | null; created_at: string; approved_at: string | null } | null }>,
    supabase
      .from('course_progress')
      .select('course_id, is_completed, completed_modules')
      .eq('user_id', user.id) as unknown as Promise<{ data: { course_id: string; is_completed: boolean; completed_modules: string[] | null }[] | null }>,
    supabase
      .from('certificates')
      .select('id')
      .eq('user_id', user.id) as unknown as Promise<{ data: { id: string }[] | null }>,
    supabase
      .from('courses')
      .select('id, target_areas')
      .eq('is_published', true) as unknown as Promise<{ data: { id: string; target_areas: string[] | null }[] | null }>,
  ])

  const role = profile?.role ?? 'trabajador'
  const userId = profile?.id ?? user.id
  const isAdminOrProfesor = role === 'admin' || role === 'profesor'

  // Stats para trabajador
  let completedCount = 0
  let inProgressCount = 0
  let notStartedCount = 0
  let certsCount = 0

  // Stats para admin / profesor
  let totalCreated: number | undefined
  let capacitatedWorkers: number | undefined
  let approvalRate: number | undefined
  let totalCerts: number | undefined

  if (isAdminOrProfesor) {
    const adminClient = await createAdminClient()

    const { data: createdCourses } = await supabase
      .from('courses')
      .select('id, is_published')
      .eq('created_by', userId) as { data: { id: string; is_published: boolean }[] | null }

    const createdCourseIds = (createdCourses ?? []).map(c => c.id)
    totalCreated = createdCourseIds.length

    const [{ data: progressOnCourses }, { data: certsOnCourses }, { data: quizzesOnCourses }] =
      createdCourseIds.length > 0
        ? await Promise.all([
            adminClient
              .from('course_progress')
              .select('user_id, is_completed, course_id')
              .in('course_id', createdCourseIds) as unknown as Promise<{ data: { user_id: string; is_completed: boolean; course_id: string }[] | null }>,
            adminClient
              .from('certificates')
              .select('id')
              .in('course_id', createdCourseIds) as unknown as Promise<{ data: { id: string }[] | null }>,
            adminClient
              .from('quizzes')
              .select('id, modules!inner(course_id)')
              .in('modules.course_id', createdCourseIds) as unknown as Promise<{ data: { id: string }[] | null }>,
          ])
        : [{ data: [] }, { data: [] }, { data: [] }] as [
            { data: { user_id: string; is_completed: boolean; course_id: string }[] },
            { data: { id: string }[] },
            { data: { id: string }[] },
          ]

    capacitatedWorkers = new Set(
      (progressOnCourses ?? [])
        .filter(p => p.is_completed)
        .map(p => p.user_id)
    ).size

    totalCerts = certsOnCourses?.length ?? 0

    const quizIds = (quizzesOnCourses ?? []).map(q => q.id)

    const { data: attemptsOnCourses } = (quizIds.length > 0
      ? await adminClient
          .from('quiz_attempts')
          .select('status')
          .in('quiz_id', quizIds) as { data: { status: string }[] | null }
      : { data: [] as { status: string }[] })

    const totalAttempts = attemptsOnCourses?.length ?? 0
    const approvedAttempts = attemptsOnCourses?.filter(
      a => a.status === 'aprobado'
    ).length ?? 0
    approvalRate = totalAttempts > 0
      ? Math.round((approvedAttempts / totalAttempts) * 100)
      : 0
  } else {
    const progress = wProgress
    const certs = wCerts
    const allCourses = wCourses

    const workerAreas = (profile?.area_trabajo as string[]) ?? []
    const visibleCourseIds = new Set(
      (allCourses ?? [])
        .filter(c => {
          const tAreas = (c.target_areas as string[] | null) ?? []
          return tAreas.length === 0 || tAreas.some(a => workerAreas.includes(a))
        })
        .map(c => c.id as string)
    )

    completedCount = (progress ?? []).filter(p => p.is_completed).length
    inProgressCount = (progress ?? []).filter(
      p => !p.is_completed && Array.isArray(p.completed_modules) && p.completed_modules.length > 0
    ).length

    const visibleProgressIds = new Set(
      (progress ?? []).map(p => p.course_id as string).filter(id => visibleCourseIds.has(id))
    )
    notStartedCount = Math.max(0, visibleCourseIds.size - visibleProgressIds.size)

    certsCount = (certs ?? []).length
  }

  // Días administrativos (solo trabajador)
  const adminDays = isAdminOrProfesor ? null : await getMyAdminDaysSummary()

  // cache() dedup con el layout raíz: no cuesta una consulta extra.
  const prefs = await getUserPreferences()

  return (
    <div className="col max-w-4xl mx-auto" style={{ gap: 22 }} data-screen-label="Trabajador · Perfil">
      <div className="entra">
        <h1 className="t-display" style={{ fontSize: 32 }}>Mi perfil</h1>
        <p className="silencio" style={{ marginTop: 4, fontSize: 15 }}>Gestiona tu información personal</p>
      </div>

      <ProfileClient
        userId={userId}
        fullName={profile?.full_name ?? ''}
        rut={profile?.rut ?? null}
        email={user!.email ?? ''}
        sede={profile?.sede ?? ''}
        areas={Array.isArray(profile?.area_trabajo) ? profile.area_trabajo : []}
        role={role}
        status={profile?.status ?? 'activo'}
        fechaNacimiento={profile?.fecha_nacimiento ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        firmaUrl={profile?.firma_url ?? null}
        createdAt={profile?.created_at ?? ''}
        approvedAt={profile?.approved_at ?? null}
        completedCount={completedCount}
        inProgressCount={inProgressCount}
        notStartedCount={notStartedCount}
        certsCount={certsCount}
        totalCreated={totalCreated}
        capacitatedWorkers={capacitatedWorkers}
        approvalRate={approvalRate}
        totalCerts={totalCerts}
        adminDaysRemaining={adminDays?.remainingDays}
        adminDaysQuota={adminDays?.quota}
        adminDaysUsed={adminDays?.usedDays}
        adminDaysPending={adminDays?.pendingDays}
      />

      <AccessibilityPanel initial={prefs} />

      {/* Soporte: el acceso principal está en la barra de escritorio, pero en
          móvil no cabe una sexta pestaña, así que este es el camino. */}
      <div className="card card-pad fila" style={{ gap: 14, flexWrap: 'wrap' }}>
        <span
          aria-hidden="true"
          style={{
            width: 44, height: 44, borderRadius: '50%', flex: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--ambar-50)', color: 'var(--ambar-700)',
          }}
        >
          <Icono n="alerta" s={22} />
        </span>
        <div className="crece" style={{ minWidth: 200 }}>
          <h2 style={{ fontSize: 16.5 }}>¿Algo no funciona?</h2>
          <p className="texto-s silencio-3">
            Repórtalo y sigue el estado de tu ticket.
          </p>
        </div>
        <Link href="/soporte" className="btn btn-secondary btn-sm">Ir a soporte</Link>
      </div>

      <ActivarNotificaciones />
    </div>
  )
}
