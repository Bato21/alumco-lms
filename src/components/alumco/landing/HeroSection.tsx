'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

// Slides del carrusel del hero. La primera mantiene la imagen original.
const SLIDES = [
  '/hero-home.webp',
  '/hero-2.jpg',
  '/hero-3.jpg',
  '/hero-4.jpg',
]

const INTERVALO_MS = 5000

export default function HeroSection() {
  const [actual, setActual] = useState(0)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const id = setInterval(() => {
      setActual((i) => (i + 1) % SLIDES.length)
    }, INTERVALO_MS)
    return () => clearInterval(id)
  }, [])

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
      {/* Carrusel de fondo — cross-fade entre slides */}
      {SLIDES.map((src, i) => (
        <div
          key={src}
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: i === actual ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
            zIndex: 0,
          }}
        >
          <Image
            src={src}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            style={{ objectFit: 'cover', transform: 'scale(1.04)' }}
          />
        </div>
      ))}
      {/* Velo superior — legibilidad del nav (solo arriba) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
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
          zIndex: 1,
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
            'linear-gradient(180deg, rgba(43,79,160,0) 0%, rgba(43,79,160,0.6) 50%, rgba(43,79,160,1) 88%, rgba(43,79,160,1) 100%)',
        }}
      />

      <div className="entra" style={{ position: 'relative', zIndex: 3, maxWidth: 1040 }}>
        <h1
          className="hero-title"
          style={{ fontSize: 'max(2.75rem, 4.6vw)', color: '#fff' }}
        >
          Nuestros cuidados son el
          <br />
          reflejo de la <em style={{ color: '#fff', fontStyle: 'italic', fontSize: '1.18em' }}>EMPATÍA</em>.
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

      {/* Puntos de navegación del carrusel */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: 0,
          right: 0,
          zIndex: 4,
          display: 'flex',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {SLIDES.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActual(i)}
            aria-label={`Ver imagen ${i + 1}`}
            aria-current={i === actual}
            style={{
              width: i === actual ? 14 : 5,
              height: 5,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              background: i === actual ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>
    </section>
  )
}
