'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'alumco-intro-visto'

/**
 * Intro de carga: reproduce el video del armado del logo Alumco a pantalla
 * completa (sin sonido) y, al terminar, se desvanece para revelar la página.
 * Se muestra una sola vez por sesión.
 */
export function IntroSplash() {
  const [visible, setVisible] = useState(true)
  const [fade, setFade] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const cerrar = useCallback(() => {
    setFade(true)
    setTimeout(() => setVisible(false), 650)
  }, [])

  // Decide si mostrarlo (solo 1 vez por sesión; nunca con reduce-motion).
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const yaVisto = sessionStorage.getItem(STORAGE_KEY) === '1'
    if (reduce || yaVisto) {
      // Diferido para no llamar setState de forma síncrona dentro del efecto.
      queueMicrotask(() => setVisible(false))
      return
    }
    sessionStorage.setItem(STORAGE_KEY, '1')

    // Red de seguridad: si el video no dispara 'ended', cerrar igual.
    const fallback = setTimeout(() => cerrar(), 12000)
    return () => clearTimeout(fallback)
  }, [cerrar])

  // Bloquea el scroll del fondo mientras el intro está visible.
  useEffect(() => {
    if (!visible) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#C3BEB4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fade ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }}
    >
      <video
        ref={videoRef}
        src="/intro-alumco.mp4"
        autoPlay
        muted
        playsInline
        onEnded={cerrar}
        onError={cerrar}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />

      {/* Saltar intro */}
      <button
        type="button"
        onClick={cerrar}
        style={{
          position: 'absolute',
          bottom: 28,
          right: 28,
          minWidth: 0,
          minHeight: 0,
          padding: '8px 16px',
          borderRadius: 999,
          border: '1px solid rgba(0,0,0,0.25)',
          background: 'rgba(255,255,255,0.45)',
          color: '#2b3140',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
        }}
      >
        Saltar intro
      </button>
    </div>
  )
}
