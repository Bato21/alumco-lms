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
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'
import { type UserRole } from '@/lib/types/database'
import { useState } from 'react'

interface AdminSidebarProps {
  fullName: string
  role: UserRole
}

function SidebarContent({ fullName, role, onClose }: AdminSidebarProps & { onClose?: () => void }) {
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
        <span className="mt-2 text-white/40 text-xs tracking-widest uppercase">KimuKo</span>
        {role === 'profesor' && (
          <span className="mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F5A623]/20 text-[#F5A623]">
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
                    onClick={handleLinkClick}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5',
                      'text-base font-medium transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
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
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">
              {fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">
              {fullName.split(' ')[0]}
            </p>
            <p className="text-white/50 text-[10px] capitalize">{role}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </>
  )
}

export function AdminSidebar({ fullName, role }: AdminSidebarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar - fijo, solo visible en lg+ */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 flex flex-col bg-[#1A2F6B] z-40">
        <SidebarContent fullName={fullName} role={role} />
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
          role={role}
          onClose={() => setIsDrawerOpen(false)}
        />
      </aside>
    </>
  )
}