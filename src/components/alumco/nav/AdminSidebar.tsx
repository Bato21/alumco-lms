'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { Avatar, Icono, Gota, type IconoNombre } from '@/components/alumco/ds'
import { LogoutButton } from '@/components/alumco/auth/LogoutButton'
import { type UserRole } from '@/lib/types/database'

interface AdminSidebarProps {
  fullName: string
  role: UserRole
}

interface NavItem {
  href: string
  label: string
  icono: IconoNombre
  show: boolean
}

function SidebarContent({ fullName, role, onClose }: AdminSidebarProps & { onClose?: () => void }) {
  const pathname = usePathname()
  const isAdmin = role === 'admin'

  const gestion: NavItem[] = [
    { href: '/admin/dashboard', label: 'Dashboard', icono: 'inicio', show: true },
    { href: '/admin/cursos', label: 'Cursos', icono: 'cursos', show: true },
    { href: '/admin/trabajadores', label: 'Trabajadores', icono: 'usuarios', show: isAdmin },
    { href: '/admin/sedes', label: 'Sedes', icono: 'sede', show: isAdmin },
    { href: '/admin/reportes', label: 'Reportes', icono: 'reportes', show: true },
  ]
  const cuenta: NavItem[] = [
    { href: '/admin/certificados', label: 'Certificados', icono: 'certificado', show: true },
    { href: '/admin/perfil', label: 'Mi perfil', icono: 'perfil', show: true },
  ]

  const isActivo = (href: string) =>
    href === '/admin/dashboard' ? pathname === '/admin/dashboard' : pathname === href || pathname.startsWith(href + '/')

  // Gota indicadora: se desliza hasta el tab activo (mide su posición en el nav)
  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [gotaY, setGotaY] = useState<number | null>(null)
  const activeHref = [...gestion, ...cuenta].find((i) => i.show && isActivo(i.href))?.href

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const DROP_H = 29
    const update = () => {
      const el = activeHref ? itemRefs.current[activeHref] : null
      if (el) setGotaY(el.offsetTop + el.offsetHeight / 2 - DROP_H / 2)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(nav)
    return () => ro.disconnect()
  }, [activeHref])

  const renderItem = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      ref={(el) => { itemRefs.current[item.href] = el }}
      aria-current={isActivo(item.href) ? 'page' : undefined}
      onClick={() => onClose?.()}
      className={'nav-item' + (isActivo(item.href) ? ' activo' : '')}
    >
      <Icono n={item.icono} /> {item.label}
    </Link>
  )

  return (
    <>
      <div style={{ padding: '22px 24px 14px' }}>
        <Link
          href="/admin/dashboard"
          aria-label="Ir al inicio"
          onClick={() => onClose?.()}
          style={{ display: 'inline-block', textDecoration: 'none' }}
        >
          <Image src="/LogoAlumco.png" alt="Alumco" width={156} height={53} priority style={{ width: 156, height: 'auto' }} />
          <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--tinta-3)', marginTop: 6 }}>
            Kimün<span style={{ color: 'var(--ambar)' }}>Ko</span> · capacitación
          </div>
        </Link>
        {role === 'profesor' && (
          <span
            className="badge badge-info"
            style={{ marginTop: 10 }}
          >
            Profesor
          </span>
        )}
      </div>

      <nav ref={navRef} className="sidebar-nav" aria-label="Navegación de administración">
        {gotaY !== null && (
          <span className="gota-indicador" aria-hidden="true" style={{ transform: `translateY(${gotaY}px)` }}>
            <span className="gota-idle"><Gota s={24} color="var(--ambar)" /></span>
          </span>
        )}
        <div className="nav-seccion">Gestión</div>
        {gestion.filter((i) => i.show).map(renderItem)}
        <div className="nav-seccion">Cuenta</div>
        {cuenta.filter((i) => i.show).map(renderItem)}
      </nav>

      <div style={{ padding: '14px 18px 20px', position: 'relative', zIndex: 2 }}>
        <div className="fila" style={{ gap: 12 }}>
          <Avatar nombre={fullName} s={40} tono="ambar" />
          <div className="crece" style={{ lineHeight: 1.25, minWidth: 0 }}>
            <div className="recorte" style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--azul-900)' }}>
              {fullName.split(' ')[0]}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--tinta-3)', textTransform: 'capitalize' }}>{role}</div>
          </div>
          <LogoutButton compact />
        </div>
      </div>
    </>
  )
}

export function AdminSidebar({ fullName, role }: AdminSidebarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar hidden lg:flex fixed left-0 top-0 h-screen z-40" aria-label="Navegación principal">
        <SidebarContent fullName={fullName} role={role} />
      </aside>

      {/* Mobile Header */}
      <header
        className="lg:hidden sticky top-0 z-50 topbar"
        style={{ justifyContent: 'space-between', padding: '12px 16px' }}
      >
        <Link href="/admin/dashboard" aria-label="Ir al inicio" style={{ textDecoration: 'none' }}>
          <Image src="/LogoAlumco.png" alt="Alumco" width={116} height={39} priority style={{ width: 116, height: 'auto' }} />
        </Link>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="btn btn-secondary btn-icon btn-sm"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          style={{ background: 'rgba(15,31,77,0.4)' }}
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={
          'sidebar lg:hidden fixed top-0 left-0 h-screen z-50 transform transition-transform duration-300 ease-in-out ' +
          (isDrawerOpen ? 'translate-x-0' : '-translate-x-full')
        }
        aria-label="Menú de navegación"
      >
        <div className="fila" style={{ justifyContent: 'flex-end', padding: 12 }}>
          <button onClick={() => setIsDrawerOpen(false)} className="btn btn-ghost btn-icon btn-sm" aria-label="Cerrar menú">
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent fullName={fullName} role={role} onClose={() => setIsDrawerOpen(false)} />
      </aside>
    </>
  )
}
