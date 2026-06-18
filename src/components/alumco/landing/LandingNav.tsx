'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

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
        background: scrolled ? 'rgba(252,251,249,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(140%) blur(8px)' : 'none',
        boxShadow: scrolled ? 'var(--sombra-1)' : 'none',
      }}
    >
      <nav
        style={{
          width: '100%',
          padding: '18px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link href="#inicio" aria-label="ONG Alumco — inicio" style={{ display: 'flex', alignItems: 'center' }}>
          <Image src="/LogoAlumco.png" alt="ONG Alumco" width={128} height={42} priority style={{ objectFit: 'contain' }} />
        </Link>

        {/* Ingresar — pill sutil que se complementa con la foto */}
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 999,
            fontWeight: 500,
            fontSize: 14,
            padding: '9px 20px',
            transition: 'background 0.25s ease, color 0.25s ease, border-color 0.25s ease',
            backdropFilter: 'blur(8px)',
            background: scrolled ? 'transparent' : 'rgba(255,255,255,0.14)',
            border: scrolled ? '1px solid var(--azul-800)' : '1px solid rgba(255,255,255,0.45)',
            color: scrolled ? 'var(--azul-900)' : '#fff',
          }}
        >
          Ingresar
        </Link>
      </nav>
    </header>
  )
}
