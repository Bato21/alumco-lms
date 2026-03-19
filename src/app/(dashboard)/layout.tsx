import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/alumco/BottomNav'

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
    .select('full_name, role, sede')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Cargando perfil...</p>
      </div>
    )
  }

  if (profile.role === 'admin') redirect('/admin/dashboard')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <span className="font-bold text-primary text-lg">Alumco</span>
          <span className="ml-auto text-sm text-muted-foreground truncate max-w-[180px]">
            {profile.full_name}
          </span>
        </div>
      </header>

      <main
        id="main-content"
        className="pb-24 px-4 pt-6 max-w-2xl mx-auto"
      >
        {children}
      </main>

      <BottomNav />
    </div>
  )
}