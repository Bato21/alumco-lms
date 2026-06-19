import Link from 'next/link'
import Image from 'next/image'

export default function LandingNav() {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
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
        {/* Logo solo */}
        <Link href="#inicio" aria-label="ONG Alumco — inicio" style={{ display: 'flex', alignItems: 'center' }}>
          <Image src="/LogoAlumco.png" alt="ONG Alumco" width={128} height={42} priority style={{ objectFit: 'contain' }} />
        </Link>

        {/* Ingresar — pill pequeño */}
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 999,
            fontWeight: 600,
            fontSize: 14,
            padding: '9px 20px',
            background: 'rgba(24,32,26,0.42)',
            border: '1px solid rgba(255,255,255,0.30)',
            color: '#fff',
            textDecoration: 'none',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            textShadow: '0 1px 2px rgba(0,0,0,0.45)',
          }}
        >
          Ingresar
        </Link>
      </nav>
    </header>
  )
}
