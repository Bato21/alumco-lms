// src/components/alumco/AdminSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    href: '/admin/reportes',
    label: 'Reportes',
    icon: BarChart3,
  },
  {
    href: '/admin/trabajadores',
    label: 'Trabajadores',
    icon: Users,
  },
] as const

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegación de administración"
      className="flex-1 overflow-y-auto px-3 py-4"
    >
      <ul className="space-y-1" role="list">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
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
  )
}