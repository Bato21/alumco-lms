'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Users,
  Award,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'
import { usePendingRequestsCount } from '@/hooks/usePendingRequestsCount'
import Image from 'next/image'
import { useState } from 'react'

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

function SidebarContent({ fullName, onClose }: { fullName: string; onClose?: () => void }) {
  const pathname = usePathname()
  const { count, isLoading } = usePendingRequestsCount()

  const handleLinkClick = () => {
    onClose?.()
  }

  return (
    <>
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
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 transition-all',
                    'text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
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

      {/* Footer con rol y logout */}
      <div className="border-t border-white/10 p-4 space-y-4">
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest mb-1">Rol Actual</p>
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-sm truncate">Administrador</span>
            <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0"></span>
          </div>
        </div>
        <LogoutButton />
      </div>
    </>
  )
}

export function AdminSidebar({ fullName }: { fullName: string }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar - fijo, solo visible en lg+ */}
      <aside className="hidden lg:block sticky top-0 h-screen w-full flex flex-col bg-[#1A2F6B] shadow-xl z-40">
        <SidebarContent fullName={fullName} />
      </aside>

      {/* Mobile Header - solo visible en mobile/tablet */}
      <header className="lg:hidden sticky top-0 z-50 bg-[#1A2F6B] border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Image
          src="/LogoAlumco.png"
          alt="Alumco LMS"
          width={120}
          height={41}
          className="object-contain brightness-0 invert"
          priority
        />
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 h-screen w-64 bg-[#1A2F6B] z-50 transform transition-transform duration-300 ease-in-out',
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Menú de navegación"
      >
        {/* Botón de cerrar */}
        <div className="flex items-center justify-end p-4 border-b border-white/10">
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <SidebarContent
          fullName={fullName}
          onClose={() => setIsDrawerOpen(false)}
        />
      </aside>
    </>
  )
}
