'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, User, Award, X, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'
import { useState } from 'react'

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

function SidebarContent({ fullName, sede, area, avatarUrl, onClose }: WorkerSidebarProps & { onClose?: () => void }) {
  const pathname = usePathname()

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
          <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`Avatar de ${fullName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-sm">
                {fullName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-white text-sm truncate">
              {fullName.split(' ')[0]}
            </span>
            <span className="text-[10px] text-white/50 truncate">
              {sede === 'sede_1' ? 'Sede Hualpén' : 'Sede Coyhaique'}
              {area && ` · ${area}`}
            </span>
          </div>
        </div>
        <LogoutButton />
      </div>
    </>
  )
}

export function WorkerSidebar({ fullName, sede, area, avatarUrl }: WorkerSidebarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar - fijo, solo visible en lg+ */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-64 flex flex-col border-r bg-[#1A2F6B] z-40">
        <SidebarContent fullName={fullName} sede={sede} area={area} avatarUrl={avatarUrl} />
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
          sede={sede}
          area={area}
          avatarUrl={avatarUrl}
          onClose={() => setIsDrawerOpen(false)}
        />
      </aside>
    </>
  )
}
