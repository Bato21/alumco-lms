import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/alumco/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/cursos')

  return (
    <div className="min-h-screen bg-[var(--md-surface)]">
      {/* Dark Sidebar */}
      <AdminSidebar fullName={profile.full_name} />

      {/* Main Content */}
      <main className="ml-64 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  )
}
