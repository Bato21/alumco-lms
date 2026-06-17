import Link from 'next/link'
import Image from 'next/image'
import { HeartHandshake, ChevronRight } from 'lucide-react'

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
        src="/hero-home.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
        style={{ objectFit: 'cover', transform: 'scale(1.04)' }}
      />
      {/* Velo suave — mantiene la foto luminosa (estilo Giga) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(10,16,40,0.28) 0%, rgba(10,16,40,0.06) 30%, rgba(10,16,40,0.18) 58%, rgba(8,14,34,0.62) 86%, rgba(6,11,28,0.88) 100%)',
        }}
      />
      {/* Oscurecido fuerte al pie — estilo Giga (donde van card y aliados) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '34%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(6,11,28,0.78) 100%)',
        }}
      />
      {/* Halo de legibilidad detrás del título */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(56% 46% at 50% 44%, rgba(8,14,35,0.40) 0%, transparent 70%)',
        }}
      />
      {/* Resplandor ámbar — el amanecer */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(70% 50% at 50% 112%, rgba(245,166,35,0.20) 0%, rgba(245,166,35,0.04) 46%, transparent 72%)',
        }}
      />

      <div className="entra" style={{ position: 'relative', zIndex: 1, maxWidth: 1040 }}>
        {/* Eyebrow pill dark-glass (estilo Giga) */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 9,
            padding: '8px 8px 8px 16px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.16)',
            background: 'rgba(12,18,38,0.42)',
            backdropFilter: 'blur(8px)',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.88)',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--ambar)' }} />
          ONG Alumco · ELEAM Hualpén
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.12)',
            }}
          >
            <ChevronRight size={13} />
          </span>
        </span>

        <h1
          className="hero-title"
          style={{ fontSize: 'clamp(38px, 6.4vw, 82px)', color: '#fff', marginTop: 26, lineHeight: 1.06 }}
        >
          Nuestros cuidados son el
          <br />
          reflejo de la <em style={{ color: 'var(--ambar)', fontStyle: 'italic' }}>empatía</em>.
        </h1>

        <p
          style={{
            color: 'rgba(255,255,255,0.78)',
            marginTop: 24,
            fontSize: 'clamp(15px, 1.6vw, 18px)',
            lineHeight: 1.6,
          }}
        >
          Atención integral para nuestras personas mayores.
        </p>

        {/* Pill blanco único centrado — firma Giga */}
        <div style={{ marginTop: 36, display: 'flex', justifyContent: 'center' }}>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#fff',
              color: 'var(--azul-950)',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 16,
              padding: '15px 32px',
              boxShadow: '0 6px 24px rgba(8,14,34,0.28)',
            }}
          >
            Ingresar a la plataforma
          </Link>
        </div>
      </div>

      {/* Card flotante dark-glass abajo-izquierda — firma Giga */}
      <div
        className="hero-float-card"
        style={{
          position: 'absolute',
          left: 28,
          bottom: 28,
          zIndex: 1,
          maxWidth: 308,
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          padding: '13px 16px',
          borderRadius: 16,
          background: 'rgba(12,18,38,0.55)',
          border: '1px solid rgba(255,255,255,0.14)',
          backdropFilter: 'blur(12px)',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'rgba(245,166,35,0.95)',
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
          <p style={{ color: 'rgba(255,255,255,0.74)', fontSize: 12.5, lineHeight: 1.3, marginTop: 2 }}>
            Enfoque biomédico, social, mental y espiritual.
          </p>
        </div>
      </div>
    </section>
  )
}
