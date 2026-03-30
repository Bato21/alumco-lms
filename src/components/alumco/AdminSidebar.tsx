'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/cursos', label: 'Cursos', icon: 'school' },
  { href: '/admin/trabajadores', label: 'Trabajadores', icon: 'group' },
  { href: '/admin/reportes', label: 'Reportes', icon: 'assessment' },
] as const

interface AdminSidebarProps {
  fullName?: string | null
}

export function AdminSidebar({ fullName }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#1A2F6B] shadow-xl flex flex-col py-6 justify-between z-50">
      <div>
        {/* Logo */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-[#1A2F6B]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Alumco LMS</h1>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all',
                  isActive
                    ? 'text-white font-semibold bg-white/10 scale-95'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span className="text-sm font-medium tracking-tight">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User Role & Logout */}
      <div className="px-4">
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-1">Rol Actual</p>
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Administrador</span>
            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
          </div>
        </div>

        <LogoutButton variant="dark" />
      </div>
    </aside>
  )
}
