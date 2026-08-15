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
  // A11Y-38 · 2.2.2 (nivel A) exige poder detener todo movimiento automático que
  // dure más de 5 s y conviva con otro contenido. Respetar
  // `prefers-reduced-motion` es necesario pero NO suficiente: el criterio pide un
  // mecanismo en la propia página.
  const [enPausa, setEnPausa] = useState(false)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || enPausa) return

    const id = setInterval(() => {
      setActual((i) => (i + 1) % SLIDES.length)
    }, INTERVALO_MS)
    return () => clearInterval(id)
  }, [enPausa])

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
            quality={90}
            sizes="100vw"
            style={{ objectFit: 'cover', transform: 'scale(1.03)', filter: 'blur(2px)' }}
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
      {/* Halo de legibilidad detrás del título.
          A11Y-36 · Estaba al 0.38 y no bastaba: el fondo real es una fotografía,
          así que el contraste depende del píxel. Medido sobre las cuatro slides
          (con el `blur(2px)` aplicado), en el percentil 5 de la banda de texto:
          al 0.38 el peor caso daba 2.99:1 — por debajo incluso del 3:1 de texto
          grande, y el párrafo es de 16 px, que exige 4.5:1. Al 0.55 el peor caso
          sube a 4.96:1 y las cuatro slides cumplen para texto normal. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background: 'radial-gradient(56% 46% at 50% 44%, rgba(8,14,35,0.55) 0%, transparent 70%)',
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
            'linear-gradient(180deg, rgba(15,31,77,0) 0%, rgba(15,31,77,0.6) 50%, rgba(15,31,77,1) 88%, rgba(15,31,77,1) 100%)',
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

      {/* Controles del carrusel */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          left: 0,
          right: 0,
          zIndex: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        {SLIDES.map((src, i) => (
          // A11Y-37 · El botón era de 7×7 px, muy por debajo de los 24×24 de
          // 2.5.8, y con `gap: 10` tampoco aplicaba la excepción por separación.
          // El área táctil pasa a 24×24 con relleno transparente; el punto
          // visible sigue midiendo lo mismo, así que el diseño no cambia.
          <button
            key={src}
            type="button"
            onClick={() => setActual(i)}
            aria-label={`Ver imagen ${i + 1} de ${SLIDES.length}`}
            aria-current={i === actual}
            style={{
              width: 24,
              height: 24,
              minWidth: 24,
              minHeight: 24,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'block',
                width: i === actual ? 18 : 7,
                height: 7,
                borderRadius: 999,
                // A11Y-37 · El punto inactivo estaba a `0.32` = 2.83:1 contra el
                // fondo: por debajo del 3:1 que 1.4.11 pide a un control. A 0.45
                // da 4.25:1, y la distinción activo/inactivo se mantiene en 2.8:1
                // de luminancia más la diferencia de ancho, que es el canal no
                // cromático.
                background: i === actual ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          </button>
        ))}

        {/* A11Y-38 · Mecanismo de pausa exigido por 2.2.2 (nivel A). */}
        <button
          type="button"
          onClick={() => setEnPausa((p) => !p)}
          aria-label={enPausa ? 'Reanudar el cambio automático de imágenes' : 'Detener el cambio automático de imágenes'}
          style={{
            width: 24,
            height: 24,
            minWidth: 24,
            minHeight: 24,
            marginLeft: 6,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.85)',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            {enPausa ? <path d="M8 5v14l11-7z" /> : <path d="M6 5h4v14H6zm8 0h4v14h-4z" />}
          </svg>
        </button>
      </div>
    </section>
  )
}
