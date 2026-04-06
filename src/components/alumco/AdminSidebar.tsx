'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Users,
  UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'

interface AdminSidebarProps {
  fullName: string
}

const navItems = [
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
    href: '/admin/trabajadores/solicitudes',
    label: 'Solicitudes',
    icon: UserCheck,
  },
  {
    href: '/admin/trabajadores',
    label: 'Trabajadores',
    icon: Users,
  },
  {
    href: '/admin/reportes',
    label: 'Reportes',
    icon: BarChart3,
  },
] as const

export function AdminSidebar({ fullName }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r bg-background z-40">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-6">
        <span className="font-bold text-primary text-lg">Alumco Admin</span>
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

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5',
                    'text-base font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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

      {/* Footer con nombre y logout */}
      <div className="border-t p-4 space-y-1">
        <p className="text-sm font-medium truncate text-foreground">
          {fullName}
        </p>
        <LogoutButton />
      </div>
    </aside>
  )
}