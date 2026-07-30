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
            fontWeight: 700,
            fontSize: 14,
            padding: '9px 20px',
            background: '#F5A623',
            border: '1px solid rgba(0,0,0,0.08)',
            color: '#1A1A2E',
            textDecoration: 'none',
            boxShadow: '0 2px 10px rgba(245,166,35,0.35)',
          }}
        >
          Ingresar
        </Link>
      </nav>
    </header>
  )
}
