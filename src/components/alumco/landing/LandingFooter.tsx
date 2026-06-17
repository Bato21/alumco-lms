import Image from 'next/image'
import { NAV_LINKS } from './content'

export default function LandingFooter() {
  return (
    <footer style={{ background: 'var(--azul-950)', color: 'rgba(255,255,255,0.75)' }}>
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: '48px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Image
          src="/LogoAlumco.png"
          alt="ONG Alumco"
          width={132}
          height={44}
          style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.92 }}
        />
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 22 }}>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, textDecoration: 'none' }}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.12)',
          padding: '18px 24px',
          textAlign: 'center',
          fontSize: 13,
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        Copyright © {new Date().getFullYear()} ONG Alumco
      </div>
    </footer>
  )
}
