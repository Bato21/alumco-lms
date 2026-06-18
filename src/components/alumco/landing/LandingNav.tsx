'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      // La barra beige aparece solo cuando el hero (imagen) ya quedó atrás.
      const hero = document.getElementById('inicio')
      const trigger = (hero ? hero.offsetHeight : window.innerHeight) - 72
      setScrolled(window.scrollY > trigger)
    }
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
        transition: 'background 0.3s ease, box-shadow 0.3s ease',
        background: scrolled ? 'rgba(18,22,17,0.45)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(180%) blur(18px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(18px)' : 'none',
        boxShadow: scrolled ? 'inset 0 -1px 0 rgba(255,255,255,0.08)' : 'none',
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
            backdropFilter: 'blur(8px)',
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.45)',
            color: '#fff',
          }}
        >
          Ingresar
        </Link>
      </nav>
    </header>
  )
}
