import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GraduationCap, LayoutDashboard, Users, BarChart, LogOut, UserPlus } from 'lucide-react'

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
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/cursos')

  // 3. Server Action para cerrar sesión
  async function handleSignOut() {
    'use server'
    const supabaseServer = await createClient()
    await supabaseServer.auth.signOut()
    redirect('/login')
  }

  return (
    // CSS Grid principal: 256px para el sidebar azul, 1fr para el contenido
    <div className="grid min-h-screen w-full grid-cols-[256px_1fr] bg-[#f7f9fb] font-sans text-[#2a3439]">
      
      {/* SideNavBar Azul Fija */}
      <aside className="bg-[#1A2F6B] shadow-xl flex flex-col py-6 justify-between sticky top-0 h-screen overflow-y-auto">
        <div>
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#1A2F6B]" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Alumco LMS</h1>
          </div>
          <nav className="space-y-1">
            <Link href="/admin/dashboard" className="text-white font-semibold bg-white/10 rounded-lg mx-2 px-4 py-2 flex items-center gap-3 transition-transform scale-95 active:scale-90">
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-sm font-medium tracking-tight">Dashboard</span>
            </Link>
            <Link href="/admin/cursos" className="text-white/70 hover:text-white hover:bg-white/5 rounded-lg mx-2 px-4 py-2 flex items-center gap-3 transition-all">
              <GraduationCap className="w-5 h-5" />
              <span className="text-sm font-medium tracking-tight">Cursos</span>
            </Link>
            
            {/* Sección Recuperada: Solicitudes */}
            <Link href="/admin/solicitudes" className="text-white/70 hover:text-white hover:bg-white/5 rounded-lg mx-2 px-4 py-2 flex items-center gap-3 transition-all">
              <UserPlus className="w-5 h-5" />
              <span className="text-sm font-medium tracking-tight">Solicitudes</span>
            </Link>

            <Link href="/admin/trabajadores" className="text-white/70 hover:text-white hover:bg-white/5 rounded-lg mx-2 px-4 py-2 flex items-center gap-3 transition-all">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium tracking-tight">Trabajadores</span>
            </Link>
            <Link href="/admin/reportes" className="text-white/70 hover:text-white hover:bg-white/5 rounded-lg mx-2 px-4 py-2 flex items-center gap-3 transition-all">
              <BarChart className="w-5 h-5" />
              <span className="text-sm font-medium tracking-tight">Reportes</span>
            </Link>
          </nav>
        </div>

        <div className="px-4">
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-1">Rol Actual</p>
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold text-sm">Administrador</span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
            </div>
            {/* Si quisieras mostrar el nombre real del usuario traído de la BD, podrías ponerlo aquí usando {profile.full_name} */}
          </div>
          
          <form action={handleSignOut} className="w-full">
            <button type="submit" className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg px-4 py-2 flex items-center gap-3 transition-all text-left">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium tracking-tight">Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Área donde se inyectará el contenido de las páginas (como el dashboard) */}
      <main className="flex flex-col min-w-0">
        {children}
      </main>

    </div>
  )
}