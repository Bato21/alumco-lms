'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'alumco-intro-visto'

/**
 * Intro de carga: reproduce el video del armado del logo Alumco a pantalla
 * completa (sin sonido) y, al terminar, se disuelve con un leve zoom para
 * revelar la página. Se muestra una sola vez por sesión.
 */
export function IntroSplash() {
  const [visible, setVisible] = useState(true)
  const [fade, setFade] = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const cerrar = useCallback(() => {
    setFade(true)
    setTimeout(() => setVisible(false), 850)
  }, [])

  // Decide si mostrarlo (solo 1 vez por sesión; nunca con reduce-motion).
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const yaVisto = sessionStorage.getItem(STORAGE_KEY) === '1'
    if (reduce || yaVisto) {
      queueMicrotask(() => setVisible(false))
      return
    }
    sessionStorage.setItem(STORAGE_KEY, '1')

    // El botón "Saltar" aparece discreto tras un momento.
    const skipTimer = setTimeout(() => setShowSkip(true), 1600)
    // Red de seguridad: si el video no dispara 'ended', cerrar igual.
    const fallback = setTimeout(() => cerrar(), 12000)
    return () => {
      clearTimeout(skipTimer)
      clearTimeout(fallback)
    }
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
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fade ? 0 : 1,
        transform: fade ? 'scale(1.06)' : 'scale(1)',
        transition: 'opacity 0.85s ease, transform 0.85s ease',
      }}
    >
      <video
        ref={videoRef}
        src="/intro-alumco.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={cerrar}
        onError={cerrar}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Saltar intro — aparece discreto */}
      <button
        type="button"
        onClick={cerrar}
        style={{
          position: 'absolute',
          bottom: 26,
          right: 26,
          minWidth: 0,
          minHeight: 0,
          padding: '7px 14px',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.22)',
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.75)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.02em',
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
          opacity: showSkip && !fade ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        Saltar
      </button>
    </div>
  )
}
