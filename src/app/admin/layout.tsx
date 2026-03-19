// src/app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/alumco/AdminSidebar'
import { LogoutButton } from '@/components/alumco/LogoutButton'

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
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar en desktop, oculto en mobile */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-1 border-r bg-background">

          {/* Logo */}
          <div className="flex h-14 items-center border-b px-6">
            <span className="font-bold text-primary text-lg">
              Alumco Admin
            </span>
          </div>

          {/* Navegación */}
          <AdminSidebar />

          {/* Footer del sidebar */}
          <div className="border-t p-4 space-y-1">
            <p className="text-sm font-medium truncate">
              {profile.full_name}
            </p>
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="md:pl-64">
        {/* Header mobile */}
        <header className="sticky top-0 z-40 flex h-14 items-center border-b bg-background px-4 md:hidden">
          <span className="font-bold text-primary">Alumco Admin</span>
          <div className="ml-auto">
            <LogoutButton compact />
          </div>
        </header>

        <main
          id="main-content"
          className="p-4 md:p-8 max-w-7xl"
        >
          {children}
        </main>
      </div>
    </div>
  )
}