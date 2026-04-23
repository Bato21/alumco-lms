import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from './ProfileClient'

export const metadata: Metadata = { title: 'Mi perfil | Alumco LMS' }

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, rut, sede, area_trabajo, role, status, fecha_nacimiento, avatar_url, created_at, approved_at')
    .eq('id', user!.id)
    .single()

  const { data: progress } = await supabase
    .from('course_progress')
    .select('is_completed, completed_modules')
    .eq('user_id', user!.id)

  const { data: certs } = await supabase
    .from('certificates')
    .select('id')
    .eq('user_id', user!.id)

  const completedCount = (progress ?? []).filter(p => p.is_completed).length
  const inProgressCount = (progress ?? []).filter(
    p => !p.is_completed && Array.isArray(p.completed_modules) && p.completed_modules.length > 0
  ).length
  const notStartedCount = (progress ?? []).filter(
    p => !p.is_completed && (!Array.isArray(p.completed_modules) || p.completed_modules.length === 0)
  ).length
  const certsCount = (certs ?? []).length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Mi perfil</h1>
        <p className="text-[#6B7280] text-sm mt-0.5">Gestiona tu información personal</p>
      </div>

      <ProfileClient
        userId={profile?.id ?? user!.id}
        fullName={profile?.full_name ?? ''}
        rut={profile?.rut ?? null}
        email={user!.email ?? ''}
        sede={profile?.sede ?? ''}
        areas={Array.isArray(profile?.area_trabajo) ? profile.area_trabajo : []}
        role={profile?.role ?? 'trabajador'}
        status={profile?.status ?? 'activo'}
        fechaNacimiento={profile?.fecha_nacimiento ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        createdAt={profile?.created_at ?? ''}
        approvedAt={profile?.approved_at ?? null}
        completedCount={completedCount}
        inProgressCount={inProgressCount}
        notStartedCount={notStartedCount}
        certsCount={certsCount}
      />
    </div>
  )
}
