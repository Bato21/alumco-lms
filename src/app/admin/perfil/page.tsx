import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ProfileClient } from '@/app/(dashboard)/perfil/ProfileClient'

export const metadata: Metadata = { title: 'Mi perfil | Alumco LMS' }

export default async function AdminPerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, rut, sede, area_trabajo, role, status, fecha_nacimiento, avatar_url, firma_url, created_at, approved_at')
    .eq('id', user!.id)
    .single() as { data: { id: string; full_name: string; rut: string | null; sede: string; area_trabajo: string[] | null; role: string; status: string; fecha_nacimiento: string | null; avatar_url: string | null; firma_url: string | null; created_at: string; approved_at: string | null } | null }

  const role = profile?.role ?? 'admin'
  const userId = profile?.id ?? user!.id
  const isAdminOrProfesor = role === 'admin' || role === 'profesor'

  let completedCount = 0
  let inProgressCount = 0
  let notStartedCount = 0
  let certsCount = 0

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

    const { data: progressOnCourses } = (createdCourseIds.length > 0
      ? await adminClient
          .from('course_progress')
          .select('user_id, is_completed, course_id')
          .in('course_id', createdCourseIds) as { data: { user_id: string; is_completed: boolean; course_id: string }[] | null }
      : { data: [] as { user_id: string; is_completed: boolean; course_id: string }[] }

    capacitatedWorkers = new Set(
      (progressOnCourses ?? [])
        .filter(p => p.is_completed)
        .map(p => p.user_id)
    ).size

    const { data: certsOnCourses } = (createdCourseIds.length > 0
      ? await adminClient
          .from('certificates')
          .select('id')
          .in('course_id', createdCourseIds) as { data: { id: string }[] | null }
      : { data: [] as { id: string }[] }

    totalCerts = certsOnCourses?.length ?? 0

    const { data: quizzesOnCourses } = createdCourseIds.length > 0
      ? await adminClient
          .from('quizzes')
          .select('id, modules!inner(course_id)')
          .in('modules.course_id', createdCourseIds) as { data: { id: string }[] | null }
      : { data: [] as { id: string }[] }

    const quizIds = (quizzesOnCourses ?? []).map(q => q.id)

    const { data: attemptsOnCourses } = (quizIds.length > 0
      ? await adminClient
          .from('quiz_attempts')
          .select('status')
          .in('quiz_id', quizIds) as { data: { status: string }[] | null }
      : { data: [] as { status: string }[] }

    const totalAttempts = attemptsOnCourses?.length ?? 0
    const approvedAttempts = attemptsOnCourses?.filter(
      a => a.status === 'aprobado'
    ).length ?? 0
    approvalRate = totalAttempts > 0
      ? Math.round((approvedAttempts / totalAttempts) * 100)
      : 0
  } else {
    const { data: progress } = await supabase
      .from('course_progress')
      .select('is_completed, completed_modules')
      .eq('user_id', user!.id) as { data: { is_completed: boolean; completed_modules: string[] | null }[] | null }

    const { data: certs } = await supabase
      .from('certificates')
      .select('id')
      .eq('user_id', user!.id) as { data: { id: string }[] | null }

    completedCount = (progress ?? []).filter(p => p.is_completed).length
    inProgressCount = (progress ?? []).filter(
      p => !p.is_completed && Array.isArray(p.completed_modules) && p.completed_modules.length > 0
    ).length
    notStartedCount = (progress ?? []).filter(
      p => !p.is_completed && (!Array.isArray(p.completed_modules) || p.completed_modules.length === 0)
    ).length
    certsCount = (certs ?? []).length
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Mi perfil</h1>
        <p className="text-[#6B7280] text-sm mt-0.5">Gestiona tu información personal</p>
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
      />
    </div>
  )
}
