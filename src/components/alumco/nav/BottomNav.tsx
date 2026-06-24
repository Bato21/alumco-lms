// src/components/alumco/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, User, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/cursos',
    label: 'Inicio',
    icon: Home,
  },
  {
    href: '/cursos',
    label: 'Mis cursos',
    icon: BookOpen,
  },
  {
    href: '/perfil',
    label: 'Mi perfil',
    icon: User,
  },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <ul className="flex h-16 items-stretch" role="list">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href ||
            (item.href !== '/cursos' && pathname.startsWith(item.href))

          return (
            <li key={item.label} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-full w-full flex-col items-center justify-center gap-1',
                  'text-xs font-medium transition-colors',
                  'focus-visible:bg-accent focus-visible:outline-none',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon
                  className="h-5 w-5"
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}