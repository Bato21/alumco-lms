'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, User, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'

const navItems = [
  { href: '/inicio', label: 'Inicio', icon: Home, exact: false },
  { href: '/cursos', label: 'Mis Cursos', icon: BookOpen, exact: true },
  { href: '/mis-certificados', label: 'Certificados', icon: Award, exact: false },
  { href: '/perfil', label: 'Mi Perfil', icon: User, exact: false },
] as const

interface WorkerSidebarProps {
  fullName: string
  sede: string
  area?: string
  avatarUrl?: string | null
}

export function WorkerSidebar({ fullName, sede, area, avatarUrl }: WorkerSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r bg-[#1A2F6B] z-40">
      {/* Logo */}
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
        aria-label="Navegación principal"
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        <ul className="space-y-1" role="list">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5',
                    'text-base font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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

      {/* Footer con nombre y logout */}
      <div className="border-t border-white/10 p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`Avatar de ${fullName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold">
                {fullName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-white text-sm truncate">
              {fullName.split(' ')[0]}
            </span>
            <span className="text-[10px] text-white/60 truncate">
              {sede === 'sede_1' ? 'Sede Principal' : 'Sede 2'}
              {area && ` · ${area}`}
            </span>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  )
}