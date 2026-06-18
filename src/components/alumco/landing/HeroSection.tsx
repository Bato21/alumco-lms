import Image from 'next/image'

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
      {/* Velo superior — legibilidad del nav (solo arriba) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(10,16,40,0.22) 0%, rgba(10,16,40,0.05) 26%, transparent 50%)',
        }}
      />
      {/* Halo de legibilidad detrás del título */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(56% 46% at 50% 44%, rgba(8,14,35,0.38) 0%, transparent 70%)',
        }}
      />
      {/* Fade al pie → mismo tono oliva (alpha 0→1) que termina exacto en Misión.
          Misma hue todo el degradado = sin banda, transición seamless (estilo Giga) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '34%',
          zIndex: 2,
          background:
            'linear-gradient(180deg, rgba(43,52,39,0) 0%, rgba(43,52,39,0.6) 50%, rgba(43,52,39,1) 88%, rgba(43,52,39,1) 100%)',
        }}
      />

      <div className="entra" style={{ position: 'relative', zIndex: 1, maxWidth: 1040 }}>
        <h1
          className="hero-title"
          style={{ fontSize: 'max(2.75rem, 4.6vw)', color: '#fff' }}
        >
          Nuestros cuidados son el
          <br />
          reflejo de la <em style={{ color: 'var(--ambar)', fontStyle: 'italic' }}>empatía</em>.
        </h1>

        <p
          style={{
            color: '#fff',
            marginTop: 12,
            fontSize: 16,
            lineHeight: '2rem',
          }}
        >
          Atención integral para nuestras personas mayores.
        </p>
      </div>
    </section>
  )
}
