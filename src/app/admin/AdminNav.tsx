'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GraduationCap, LayoutDashboard, Users, BarChart, LogOut, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  href: string
  icon: React.ElementType
  label: string
}

function NavLink({ href, icon: Icon, label }: NavLinkProps) {
  const pathname = usePathname()

  // Check if current path matches or starts with the link href
  const isActive =
    href === '/admin/dashboard'
      ? pathname === '/admin/dashboard'
      : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        'rounded-lg mx-2 px-4 py-2 flex items-center gap-3 transition-all text-sm font-medium',
        isActive
          ? 'text-white font-semibold bg-white/10'
          : 'text-white/70 hover:text-white hover:bg-white/5'
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="tracking-tight">{label}</span>
    </Link>
  )
}

export default function AdminNav({
  fullName,
  onSignOut
}: {
  fullName: string
  onSignOut: () => Promise<void>
}) {
  return (
    <aside className="bg-[#1A2F6B] shadow-xl flex flex-col py-6 justify-between sticky top-0 h-screen overflow-y-auto">
      <div>
        <div className="px-6 mb-8">
          <Image
            src="/LogoAlumco.png"
            alt="Alumco"
            width={300}
            height={102}
            className="object-contain brightness-0 invert"
            priority
          />
          <div className="mt-3 h-px w-12 bg-white/20" />
        </div>
        <nav className="space-y-1">
          <NavLink href="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavLink href="/admin/cursos" icon={GraduationCap} label="Cursos" />
          <NavLink href="/admin/trabajadores/solicitudes" icon={UserPlus} label="Solicitudes" />
          <NavLink href="/admin/trabajadores" icon={Users} label="Trabajadores" />
          <NavLink href="/admin/reportes" icon={BarChart} label="Reportes" />
        </nav>
      </div>

      <div className="px-4">
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-1">Rol Actual</p>
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Administrador</span>
            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
          </div>
        </div>

        <form action={onSignOut} className="w-full">
          <button type="submit" className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg px-4 py-2 flex items-center gap-3 transition-all text-left">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium tracking-tight">Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
