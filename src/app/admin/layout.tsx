import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
// Importamos tu componente inteligente
import { AdminSidebar } from '@/components/alumco/AdminSidebar'

export const dynamic = 'force-dynamic'

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
    <div className="grid min-h-screen w-full grid-cols-[256px_1fr] bg-[#f7f9fb] font-sans text-[#2a3439]">
      
      {/* AQUÍ LA MAGIA: Inyectamos tu componente que sí sabe leer la URL */}
      <AdminSidebar fullName={profile?.full_name || 'Administrador'} />

      <main className="flex flex-col min-w-0">
        {children}
      </main>
    </div>
  )
}