'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect, useId } from 'react'
import { Menu, X } from 'lucide-react'
import { Avatar, Icono, Gota, type IconoNombre } from '@/components/alumco/ds'
import { LogoutButton } from '@/components/alumco/auth/LogoutButton'
import { PreviewModeButton } from '@/components/alumco/shared/PreviewModeButton'
import { type UserRole } from '@/lib/types/database'
import { useAccessibleDialog } from '@/hooks/useAccessibleDialog'

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
    { href: '/admin/eventos', label: 'Eventos', icono: 'calendario', show: true },
    { href: '/admin/trabajadores', label: 'Trabajadores', icono: 'usuarios', show: isAdmin },
    { href: '/admin/sedes', label: 'Sedes', icono: 'sede', show: isAdmin },
    { href: '/admin/reportes', label: 'Reportes', icono: 'reportes', show: true },
    { href: '/admin/soporte', label: 'Soporte', icono: 'alerta', show: true },
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
  // `SidebarContent` se monta dos veces —barra de escritorio y cajón móvil—, así
  // que los id de los rótulos de grupo tienen que ser únicos por instancia.
  const idGrupo = useId()
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
        {/* A11Y-31 · «Gestión» y «Cuenta» agrupaban los enlaces sólo para la vista:
            eran `<div>` sin rol, así que un lector recorría los 9 enlaces seguidos
            sin saber que hay dos bloques. `role="group"` + `aria-labelledby` da la
            agrupación sin meter dos `<h2>` en el esquema de encabezados de todas las
            páginas de administración. El grupo va sin `position`, para no cambiar el
            `offsetParent` del que depende la gota indicadora. */}
        <div className="nav-grupo" role="group" aria-labelledby={`${idGrupo}-gestion`}>
          <div className="nav-seccion" id={`${idGrupo}-gestion`}>Gestión</div>
          {gestion.filter((i) => i.show).map(renderItem)}
        </div>
        <div className="nav-grupo" role="group" aria-labelledby={`${idGrupo}-cuenta`}>
          <div className="nav-seccion" id={`${idGrupo}-cuenta`}>Cuenta</div>
          {cuenta.filter((i) => i.show).map(renderItem)}
        </div>
      </nav>

      <div className="col" style={{ padding: '14px 18px 20px', gap: 12, position: 'relative', zIndex: 2 }}>
        {/* Vista previa: mirar la plataforma como la ve el equipo, sin cerrar
            sesión ni pedirle la clave a nadie. */}
        <PreviewModeButton />
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
  // A11Y-04 · el cajón se queda montado y sólo se desplaza con `translate`, así
  // que estando cerrado seguía en el orden de tabulación: el foco desaparecía
  // fuera de la pantalla. `inert` lo saca del recorrido y del árbol accesible;
  // el hook aporta el foco al abrir, Escape y la devolución al botón «Abrir
  // menú».
  const drawerRef = useAccessibleDialog<HTMLDivElement>(
    isDrawerOpen,
    () => setIsDrawerOpen(false)
  )

  return (
    <>
      {/* Desktop Sidebar */}
      {/* A11Y-31 · Era un `<aside aria-label="Navegación principal">`: `<aside>` mapea
          a `complementary`, no a `navigation`, así que el rótulo prometía un landmark
          de navegación que no era, y encima duplicaba el del `<nav>` de dentro. Es un
          contenedor de cromo, no contenido complementario: `<div>`. El único landmark
          de navegación es el `<nav>` de `SidebarContent`. */}
      <div
        className="sidebar hidden lg:flex fixed left-0 h-screen z-40"
        style={{ top: 'var(--demo-banner-h, 0px)', height: 'calc(100vh - var(--demo-banner-h, 0px))' }}
      >
        <SidebarContent fullName={fullName} role={role} />
      </div>

      {/* Mobile Header */}
      <header
        className="lg:hidden sticky z-50 topbar"
        style={{ top: 'var(--demo-banner-h, 0px)', justifyContent: 'space-between', padding: '12px 16px' }}
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
      {/* `role="dialog"` ya sustituía el rol implícito de `<aside>`; se usa `<div>`
          para que el elemento y su rol digan lo mismo. */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        inert={!isDrawerOpen}
        role="dialog"
        aria-modal="true"
        className={
          'sidebar lg:hidden fixed left-0 h-screen z-50 transform transition-transform duration-300 ease-in-out ' +
          (isDrawerOpen ? 'translate-x-0' : '-translate-x-full')
        }
        style={{ top: 'var(--demo-banner-h, 0px)', height: 'calc(100vh - var(--demo-banner-h, 0px))' }}
        aria-label="Menú de navegación"
      >
        <div className="fila" style={{ justifyContent: 'flex-end', padding: 12 }}>
          <button onClick={() => setIsDrawerOpen(false)} className="btn btn-ghost btn-icon btn-sm" aria-label="Cerrar menú">
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent fullName={fullName} role={role} onClose={() => setIsDrawerOpen(false)} />
      </div>
    </>
  )
}
