import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminNav from './AdminNav'

// Server Action for logout
async function handleSignOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 1. Verificación de Autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Verificación de Rol Admin y obtención de datos
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, status')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/cursos')
  if (profile?.status !== 'activo') redirect('/login')

  return (
    <div className="grid min-h-screen w-full grid-cols-[256px_1fr] bg-[#f7f9fb] font-sans text-[#2a3439]">
      <AdminNav fullName={profile.full_name} onSignOut={handleSignOut} />
      <main className="flex flex-col min-w-0">
        {children}
      </main>
    </div>
  )
}
