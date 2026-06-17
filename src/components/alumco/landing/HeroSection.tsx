import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

export default function HeroSection() {
  return (
    <section
      id="inicio"
      className="film-grain"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        overflow: 'hidden',
        color: '#fff',
        padding: '120px 24px 80px',
      }}
    >
      <Image
        src="/login-hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
        style={{ objectFit: 'cover', transform: 'scale(1.05)' }}
      />
      {/* Tinte navy de marca */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(168deg, rgba(13,28,69,0.82) 0%, rgba(21,42,102,0.80) 55%, rgba(10,22,56,0.90) 100%)',
        }}
      />
      {/* Resplandor ámbar — el amanecer */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(80% 55% at 50% 110%, rgba(245,166,35,0.28) 0%, rgba(245,166,35,0.06) 45%, transparent 72%)',
        }}
      />
      <div className="entra" style={{ position: 'relative', zIndex: 1, maxWidth: 760 }}>
        <span className="t-eyebrow" style={{ color: 'var(--ambar)' }}>
          ◆ ELEAM · ONG Alumco
        </span>
        <h1 className="t-display" style={{ fontSize: 'clamp(38px, 6vw, 64px)', color: '#fff', marginTop: 18 }}>
          Nuestros cuidados son el reflejo de la{' '}
          <em style={{ color: 'var(--ambar)', fontStyle: 'italic' }}>empatía</em>.
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.82)',
            marginTop: 22,
            fontSize: 'clamp(16px, 2.2vw, 20px)',
            lineHeight: 1.6,
            maxWidth: 560,
            marginInline: 'auto',
          }}
        >
          Dedicadas a brindar el más alto estándar de cuidado para nuestras personas mayores.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 14,
            justifyContent: 'center',
            marginTop: 36,
            flexWrap: 'wrap',
          }}
        >
          <a href="#contacto" className="btn btn-primary btn-lg">
            Contacto
          </a>
          <Link
            href="/login"
            className="btn btn-lg"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
          >
            Ingresar a la plataforma
          </Link>
        </div>
      </div>
      <a
        href="#mision-vision"
        aria-label="Bajar"
        style={{
          position: 'absolute',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.7)',
          zIndex: 1,
        }}
      >
        <ChevronDown size={28} />
      </a>
    </section>
  )
}
