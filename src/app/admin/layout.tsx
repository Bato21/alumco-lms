import { redirect } from 'next/navigation'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/alumco/AdminSidebar'
import { getAdminAlerts } from '@/lib/actions/alerts'
import { type UserRole } from '@/lib/types/database'
import { AdminTopBar } from './TopBar'

export const dynamic = 'force-dynamic'

interface AdminProfile {
  full_name: string
  role: UserRole
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const user = await getCachedUser()
  if (!user) redirect('/login')

  const [{ data: rawProfile }, adminAlerts] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single(),
    getAdminAlerts(),
  ])

  const profile = rawProfile as AdminProfile | null

  if (!profile || (profile.role !== 'admin' && profile.role !== 'profesor')) redirect('/inicio')

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <AdminSidebar fullName={profile.full_name} role={profile.role as UserRole} />

    <div className="lg:pl-64 min-h-screen flex flex-col overflow-x-hidden">
      <AdminTopBar alerts={adminAlerts} role={profile.role as 'admin' | 'profesor'} />
      {/* Espaciador para el header fixed */}
      <div className="hidden lg:block h-[73px] shrink-0" aria-hidden="true" />

      {/* Contenido */}
      <main className="flex-1 w-full p-4 lg:p-8">
        {children}
      </main>
      </div>
    </div>
  )
}