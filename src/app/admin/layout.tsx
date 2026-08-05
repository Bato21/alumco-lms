import { redirect } from 'next/navigation'
import { createClient, getCachedUser } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/alumco/nav/AdminSidebar'
import { CursorBlobs } from '@/components/alumco/shared/CursorBlobs'
import { getAdminAlerts } from '@/lib/actions/alerts'
import { getProximoEventoResumen } from '@/lib/eventos/proximoEvento'
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

  const [{ data: rawProfile }, adminAlerts, evento] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single(),
    getAdminAlerts(),
    getProximoEventoResumen(true),
  ])

  const profile = rawProfile as AdminProfile | null

  if (!profile || (profile.role !== 'admin' && profile.role !== 'profesor')) redirect('/inicio')

  const eventoBell = evento
    ? { id: evento.id, title: evento.title, categoria: evento.categoria, diasRestantes: evento.diasRestantes, href: evento.href }
    : null

  return (
    <div className="min-h-screen paleta-oliva">
      <CursorBlobs />
      <AdminSidebar fullName={profile.full_name} role={profile.role as UserRole} />

    <div className="lg:pl-[264px] min-h-screen flex flex-col overflow-x-hidden">
      <AdminTopBar alerts={adminAlerts} role={profile.role as 'admin' | 'profesor'} fullName={profile.full_name} evento={eventoBell} />
      {/* Espaciador para el header fixed */}
      <div className="hidden lg:block h-[73px] shrink-0" aria-hidden="true" />

      {/* Contenido */}
      <main className="relative z-10 flex-1 w-full min-w-0 mx-auto max-w-[1240px] p-4 lg:px-8 lg:py-7">
        {children}
      </main>
      </div>
    </div>
  )
}