import { redirect } from 'next/navigation'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { WorkerTopNav } from '@/components/alumco/nav/WorkerTopNav'
import { CursorBlobs } from '@/components/alumco/shared/CursorBlobs'
import { DemoBanner } from '@/components/alumco/shared/DemoBanner'
import { getWorkerAlerts } from '@/lib/actions/alerts'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const user = await getCachedUser()

  if (!user) redirect('/login')

  const [{ data: profile }, workerAlerts] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, role, sede, area_trabajo, avatar_url, is_demo')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: { full_name: string; role: string; sede: string; area_trabajo: string[] | null; avatar_url: string | null; is_demo: boolean | null } | null }>,
    getWorkerAlerts(),
  ])

  if (!profile) {
    redirect('/login')
  }

  if (profile.role === 'admin' || profile.role === 'profesor') redirect('/admin/dashboard')

  return (
    <div className="min-h-screen flex flex-col paleta-azul" style={{ paddingTop: 'var(--demo-banner-h, 0px)' }}>
      {profile.is_demo && <DemoBanner />}
      <CursorBlobs />
      <WorkerTopNav
        fullName={profile.full_name ?? 'Usuario'}
        avatarUrl={profile.avatar_url}
        alerts={workerAlerts}
      />
      <main
        id="main-content"
        className="relative z-10 flex-1 w-full mx-auto max-w-[1080px] px-5 pt-7 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] lg:pb-16"
      >
        {children}
      </main>
    </div>
  )
}
