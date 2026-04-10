'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Users,
  UserCheck,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'
import { usePendingRequestsCount } from '@/hooks/usePendingRequestsCount'
import Image from 'next/image'

interface AdminSidebarProps {
  fullName: string
}

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: boolean
}

const navItems: NavItem[] = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/cursos',
    label: 'Cursos',
    icon: BookOpen,
  },
  {
    href: '/admin/trabajadores',
    label: 'Trabajadores',
    icon: Users,
    badge: true,
  },
  {
    href: '/admin/reportes',
    label: 'Reportes',
    icon: BarChart3,
  },
  {
    href: '/admin/certificados',
    label: 'Certificados',
    icon: Award,
  },
]

export function AdminSidebar({ fullName }: AdminSidebarProps) {
  const pathname = usePathname()
  const { count, isLoading } = usePendingRequestsCount()

  return (
    // CAMBIO 1: sticky en vez de fixed, fondo azul y sombra
    <aside className="sticky top-0 h-screen w-full flex flex-col bg-[#1A2F6B] shadow-xl z-40">
      
      {/* Logo de la ONG (Local) */}
      <div className="flex flex-col items-center justify-center py-6 border-b border-white/10 mb-2">
        <Image
          src="/LogoAlumco.png" 
          alt="Alumco LMS"
          width={160}
          height={54}
          className="object-contain brightness-0 invert" 
          priority 
        />
      </div>

      {/* Navegación */}
      <nav
        aria-label="Navegación de administración"
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        <ul className="space-y-1" role="list">
          {navItems.map((item) => {
            const Icon = item.icon

            const isActive =
              item.href === '/admin/trabajadores'
                ? pathname === '/admin/trabajadores'
                : pathname === item.href ||
                  pathname.startsWith(item.href + '/')

            const showBadge = item.badge && !isLoading && (count ?? 0) > 0

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 transition-all',
                    'text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
                    // CAMBIO 2: Colores para modo oscuro (Azul/Blanco)
                    isActive
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.label}
                  </div>
                  {showBadge && (
                    <span className="bg-[#F5A623] text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center">
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer con nombre y logout */}
      <div className="border-t border-white/10 p-4 space-y-4">
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-1">Rol Actual</p>
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-sm truncate">{fullName}</span>
            <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0"></span>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  )
}