'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'

const navItems = [
  { href: '/cursos', label: 'Inicio', icon: 'home' },
  { href: '/cursos', label: 'Mis Cursos', icon: 'school' },
  { href: '/perfil', label: 'Mi Perfil', icon: 'person' },
] as const

interface WorkerSidebarProps {
  fullName: string
  sede: string
  area?: string
  avatarUrl?: string | null
}

export function WorkerSidebar({ fullName, sede, area = 'Área de Enfermería', avatarUrl }: WorkerSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 z-40 flex flex-col p-4 bg-slate-50 border-r border-slate-200 shadow-sm"
      aria-label="Navegación principal"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-[#2B4FA0] flex items-center justify-center rounded-lg rotate-45">
          <svg
            className="w-5 h-5 text-white -rotate-45"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2L22 12L12 22L2 12L12 2Z" />
          </svg>
        </div>
        <span className="text-2xl font-bold tracking-tight text-[#2B4FA0]">alumco</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/cursos' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200',
                isActive
                  ? 'bg-blue-50 text-[#4059aa] font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="mt-auto border-t border-slate-200 pt-6 px-2 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`Avatar de ${fullName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#2B4FA0] text-white font-semibold">
                {fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 truncate">{fullName.split(' ')[0]}</span>
            <span className="text-[10px] text-slate-500 leading-tight">
              {sede === 'sede_1' ? 'Sede Principal' : 'Sede 2'}
              <br />
              {area}
            </span>
          </div>
        </div>

        <LogoutButton />
      </div>
    </aside>
  )
}
