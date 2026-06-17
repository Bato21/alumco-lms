'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { NAV_LINKS } from './content'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'background 0.25s ease, box-shadow 0.25s ease',
        background: scrolled ? 'rgba(252,250,246,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(140%) blur(8px)' : 'none',
        boxShadow: scrolled ? 'var(--sombra-1)' : 'none',
      }}
    >
      <nav
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link href="#inicio" aria-label="ONG Alumco — inicio" style={{ display: 'flex', alignItems: 'center' }}>
          <Image src="/LogoAlumco.png" alt="ONG Alumco" width={132} height={44} priority style={{ objectFit: 'contain' }} />
        </Link>

        {/* Links desktop */}
        <div className="landing-nav-links" style={{ alignItems: 'center', gap: 28 }}>
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                color: scrolled ? 'var(--tinta-2)' : 'rgba(255,255,255,0.9)',
                fontWeight: 500,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              {l.label}
            </a>
          ))}
          <Link href="/login" className="btn btn-primary" style={{ marginLeft: 8 }}>
            Ingresar
          </Link>
        </div>

        {/* Toggle móvil */}
        <button
          type="button"
          className="landing-nav-toggle btn-icon"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{ color: scrolled ? 'var(--tinta)' : '#fff', background: 'transparent', border: 'none' }}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {/* Menú móvil desplegable */}
      {open && (
        <div
          className="landing-nav-mobile"
          style={{
            background: 'var(--crema)',
            borderTop: '1px solid var(--borde-suave)',
            padding: '12px 24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{ color: 'var(--tinta-2)', fontWeight: 500, padding: '10px 0', textDecoration: 'none' }}
            >
              {l.label}
            </a>
          ))}
          <Link href="/login" className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setOpen(false)}>
            Ingresar
          </Link>
        </div>
      )}
    </header>
  )
}
