import Link from 'next/link'
import Image from 'next/image'
import { HeartHandshake } from 'lucide-react'

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
      {/* Velo suave — mantiene la foto luminosa (estilo Giga) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(10,16,40,0.32) 0%, rgba(10,16,40,0.10) 34%, rgba(10,16,40,0.18) 64%, rgba(8,14,34,0.46) 100%)',
        }}
      />
      {/* Halo de legibilidad detrás del título */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(58% 48% at 50% 42%, rgba(8,14,35,0.42) 0%, transparent 70%)',
        }}
      />
      {/* Resplandor ámbar — el amanecer */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(70% 50% at 50% 112%, rgba(245,166,35,0.22) 0%, rgba(245,166,35,0.04) 46%, transparent 72%)',
        }}
      />

      <div className="entra" style={{ position: 'relative', zIndex: 1, maxWidth: 820 }}>
        {/* Eyebrow pill (estilo Giga) */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 15px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.28)',
            background: 'rgba(255,255,255,0.10)',
            backdropFilter: 'blur(6px)',
            fontSize: 12.5,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: 'rgba(255,255,255,0.92)',
          }}
        >
          <span style={{ color: 'var(--ambar)' }}>◆</span> ELEAM · ONG Alumco — Hualpén
        </span>

        <h1
          className="hero-title"
          style={{ fontSize: 'clamp(40px, 6.6vw, 72px)', color: '#fff', marginTop: 22, lineHeight: 1.08 }}
        >
          Nuestros cuidados son el
          <br />
          reflejo de la <em style={{ color: 'var(--ambar)', fontStyle: 'italic' }}>empatía</em>.
        </h1>

        <p
          style={{
            color: 'rgba(255,255,255,0.82)',
            marginTop: 22,
            fontSize: 'clamp(16px, 2vw, 19px)',
            lineHeight: 1.6,
            maxWidth: 540,
            marginInline: 'auto',
          }}
        >
          Atención integral para nuestras personas mayores.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 14,
            justifyContent: 'center',
            marginTop: 38,
            flexWrap: 'wrap',
          }}
        >
          {/* Pill blanco sólido — firma Giga */}
          <Link
            href="/login"
            className="btn btn-lg"
            style={{ background: '#fff', color: 'var(--azul-950)', borderRadius: 999, fontWeight: 600, padding: '13px 28px' }}
          >
            Ingresar a la plataforma
          </Link>
          {/* Outline translúcido */}
          <a
            href="#contacto"
            className="btn btn-lg"
            style={{
              background: 'rgba(255,255,255,0.10)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 999,
              backdropFilter: 'blur(6px)',
              padding: '13px 28px',
            }}
          >
            Contacto
          </a>
        </div>
      </div>

      {/* Card flotante glass abajo-izquierda — firma Giga */}
      <div
        className="hero-float-card"
        style={{
          position: 'absolute',
          left: 28,
          bottom: 28,
          zIndex: 1,
          maxWidth: 300,
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          padding: '13px 15px',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.20)',
          backdropFilter: 'blur(10px)',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'rgba(245,166,35,0.92)',
            color: 'var(--azul-950)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <HeartHandshake size={22} strokeWidth={1.9} />
        </span>
        <div>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, lineHeight: 1.25 }}>
            Atención centrada en la persona
          </p>
          <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 12.5, lineHeight: 1.3, marginTop: 2 }}>
            Enfoque biomédico, social, mental y espiritual.
          </p>
        </div>
      </div>
    </section>
  )
}
