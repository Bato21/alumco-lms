'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MarcaAlumco, Avatar, Icono, type IconoNombre } from '@/components/alumco/ds'
import { NotificationBell } from './NotificationBell'

interface WorkerAlertItem {
  courseId: string
  courseTitle: string
  deadline: string
  daysLeft: number
  urgency: 'overdue' | 'critical' | 'warning'
}

interface WorkerTopNavProps {
  fullName: string
  avatarUrl?: string | null
  alerts: { count: number; alerts: WorkerAlertItem[] }
}

const NAV: { href: string; label: string; icono: IconoNombre; exact?: boolean }[] = [
  { href: '/inicio', label: 'Inicio', icono: 'inicio' },
  { href: '/cursos', label: 'Mis cursos', icono: 'cursos', exact: true },
  { href: '/mis-certificados', label: 'Certificados', icono: 'certificado' },
]

const TABS: { href: string; label: string; icono: IconoNombre; exact?: boolean }[] = [
  { href: '/inicio', label: 'Inicio', icono: 'inicio' },
  { href: '/cursos', label: 'Cursos', icono: 'cursos', exact: true },
  { href: '/mis-certificados', label: 'Certificados', icono: 'certificado' },
  { href: '/perfil', label: 'Perfil', icono: 'perfil' },
]

function useActivo() {
  const pathname = usePathname()
  return (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
}

export function WorkerTopNav({ fullName, avatarUrl, alerts }: WorkerTopNavProps) {
  const esActivo = useActivo()
  const pathname = usePathname()
  const perfilActivo = pathname === '/perfil' || pathname.startsWith('/perfil/')

  return (
    <>
      {/* Desktop: topbar horizontal */}
      <header className="topbar hidden lg:flex" style={{ position: 'sticky', top: 0, zIndex: 30 }}>
        <Link href="/inicio" aria-label="Inicio">
          <MarcaAlumco compacta />
        </Link>
        <nav className="fila" style={{ gap: 4, marginLeft: 18 }} aria-label="Navegación">
          {NAV.map((it) => {
            const act = esActivo(it.href, it.exact)
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={act ? 'page' : undefined}
                className="btn btn-ghost"
                style={act ? { background: 'var(--ambar-50)', color: 'var(--ambar-700)', fontWeight: 600 } : { fontWeight: 500 }}
              >
                <Icono n={it.icono} s={19} /> {it.label}
              </Link>
            )
          })}
        </nav>
        <div className="crece" />
        <NotificationBell initialAlerts={alerts} role="trabajador" />
        <Link
          href="/perfil"
          title="Mi perfil"
          className="fila"
          style={{
            gap: 10,
            background: perfilActivo ? 'var(--ambar-50)' : 'transparent',
            padding: '6px 10px',
            borderRadius: 12,
            minHeight: 44,
          }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <Avatar nombre={fullName} s={36} tono="ambar" />
          )}
          <span style={{ fontWeight: 600, fontSize: 14.5 }}>{fullName.split(' ')[0]}</span>
        </Link>
      </header>

      {/* Móvil: cabecera */}
      <header className="topbar lg:hidden" style={{ position: 'sticky', top: 0, zIndex: 30, padding: '10px 16px' }}>
        <MarcaAlumco compacta />
        <div className="crece" />
        <NotificationBell initialAlerts={alerts} role="trabajador" />
      </header>

      {/* Móvil: navegación inferior */}
      <nav
        className="flex lg:hidden"
        aria-label="Navegación inferior"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          borderTop: '2px solid var(--azul-800)',
          background: 'var(--blanco)',
          paddingBottom: 'env(safe-area-inset-bottom, 6px)',
        }}
      >
        {TABS.map((t) => {
          const act = t.href === '/perfil' ? perfilActivo : esActivo(t.href, t.exact)
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={act ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '10px 4px 6px',
                minHeight: 56,
                color: act ? 'var(--ambar-700)' : 'var(--tinta-3)',
                fontWeight: act ? 600 : 500,
              }}
            >
              <Icono n={t.icono} s={23} />
              <span style={{ fontSize: 11.5 }}>{t.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
