import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkerSidebar } from '@/components/alumco/WorkerSidebar'
import { getWorkerAlerts } from '@/lib/actions/alerts'
import { UserRole } from '@/lib/types/database'
import { WorkerTopBar } from './TopBar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role, sede, area_trabajo, avatar_url')
    .eq('id', user.id)
    .single() as { data: { full_name: string; role: string; sede: string; area_trabajo: string[] | null; avatar_url: string | null } | null; error: unknown }

  if (!profile) {
    redirect('/login')
  }

  if (profile.role === 'admin' || profile.role === 'profesor') redirect('/admin/dashboard')

  const workerAlerts = await getWorkerAlerts()

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Sidebar Navigation */}
      <WorkerSidebar
        fullName={profile.full_name ?? 'Usuario'}
        sede={profile.sede ?? 'sede_1'}
        area={profile.area_trabajo ? profile.area_trabajo[0] : undefined}
        avatarUrl={profile.avatar_url}
        alerts={workerAlerts}
      />

      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen flex flex-col overflow-x-hidden">
        <WorkerTopBar alerts={workerAlerts} />
        {/* Espaciador para el header fixed */}
        <div className="hidden lg:block h-[73px] shrink-0" aria-hidden="true" />

        {/* Main Content */}
        <main
          id="main-content"
          className="flex-1 w-full p-4 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  )
}
