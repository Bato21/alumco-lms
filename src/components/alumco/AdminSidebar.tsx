'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Users,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'
import { type UserRole } from '@/lib/types/database'

interface AdminSidebarProps {
  fullName: string
  role: UserRole
}

export function AdminSidebar({ fullName, role }: AdminSidebarProps) {
  const pathname = usePathname()
  const isAdmin = role === 'admin'

  const navItems = [
    {
      href: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: '/admin/cursos',
      label: 'Cursos',
      icon: BookOpen,
      show: true,
    },
    {
      href: '/admin/trabajadores',
      label: 'Trabajadores',
      icon: Users,
      show: isAdmin,
    },
    {
      href: '/admin/reportes',
      label: 'Reportes',
      icon: BarChart3,
      show: true,
    },
    {
      href: '/admin/certificados',
      label: 'Certificados',
      icon: Award,
      show: true,
    },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-[#1A2F6B] z-40">

      {/* Logo */}
      <div className="flex flex-col items-center justify-center py-6 border-b border-white/10">
        <Image
          src="/LogoAlumco.png"
          alt="Alumco LMS"
          width={160}
          height={54}
          className="object-contain brightness-0 invert"
          priority
        />
        {role === 'profesor' && (
          <span className="mt-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F5A623]/20 text-[#F5A623]">
            Profesor
          </span>
        )}
      </div>

      {/* Navegación */}
      <nav
        aria-label="Navegación de administración"
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        <ul className="space-y-1" role="list">
          {navItems
            .filter(item => item.show)
            .map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === '/admin/trabajadores'
                  ? pathname === '/admin/trabajadores' ||
                    pathname.startsWith('/admin/trabajadores')
                  : pathname === item.href ||
                    pathname.startsWith(item.href + '/')

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5',
                      'text-base font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-white font-semibold text-sm">
              {fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {fullName.split(' ')[0]}
            </p>
            <p className="text-white/50 text-xs capitalize">{role}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  )
}