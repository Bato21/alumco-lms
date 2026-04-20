import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkerSidebar } from '@/components/alumco/WorkerSidebar'
import { UserRole } from '@/lib/types/database'

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
    .single()

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--md-on-surface-variant)]">Cargando perfil...</p>
      </div>
    )
  }

  if (profile.role === 'admin' || profile.role === 'profesor') redirect('/admin/dashboard')

  return (
    <div className="min-h-screen bg-[var(--md-surface)]">
      {/* Sidebar Navigation */}
      <WorkerSidebar
        fullName={profile.full_name ?? 'Usuario'}
        sede={profile.sede ?? 'sede_1'}
        area={profile.area_trabajo ?? undefined}
        avatarUrl={profile.avatar_url}
      />

      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Top Header - solo desktop */}
        <header className="hidden lg:flex sticky top-0 right-0 items-center justify-between px-8 py-4 w-full z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="flex-1">{/* Empty for layout alignment */}</div>
          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="relative group">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Buscar cursos..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-[#2B4FA0]/20 w-64 transition-all outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-500 hover:text-[#2B4FA0] transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              <button className="p-2 text-slate-500 hover:text-[#2B4FA0] transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>
        </header>

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
