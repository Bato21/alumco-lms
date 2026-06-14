import { redirect } from 'next/navigation'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { WorkerTopNav } from '@/components/alumco/WorkerTopNav'
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
      .select('full_name, role, sede, area_trabajo, avatar_url')
      .eq('id', user.id)
      .single() as unknown as Promise<{ data: { full_name: string; role: string; sede: string; area_trabajo: string[] | null; avatar_url: string | null } | null }>,
    getWorkerAlerts(),
  ])

  if (!profile) {
    redirect('/login')
  }

  if (profile.role === 'admin' || profile.role === 'profesor') redirect('/admin/dashboard')

  return (
    <div className="min-h-screen flex flex-col">
      <WorkerTopNav
        fullName={profile.full_name ?? 'Usuario'}
        avatarUrl={profile.avatar_url}
        alerts={workerAlerts}
      />
      <main
        id="main-content"
        className="flex-1 w-full mx-auto max-w-[1080px] px-5 pt-7 pb-24 lg:pb-16"
      >
        {children}
      </main>
    </div>
  )
}
