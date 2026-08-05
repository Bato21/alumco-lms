'use client'

import { useEffect, useRef, useState } from 'react'

// Barra fija que avisa que la sesión es demo. Publica su altura en la variable
// CSS --demo-banner-h para que los layouts y las navegaciones (que usan
// top: var(--demo-banner-h, 0px)) empujen su contenido hacia abajo en vez de
// quedar tapados. Se puede ocultar; la preferencia dura la sesión del tab.
const STORAGE_KEY = 'kk-demo-banner-hidden'

export function DemoBanner() {
  const [hidden, setHidden] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') setHidden(true)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (hidden) {
      root.style.setProperty('--demo-banner-h', '0px')
      return
    }
    const el = ref.current
    if (!el) return
    const apply = () => root.style.setProperty('--demo-banner-h', `${el.offsetHeight}px`)
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.setProperty('--demo-banner-h', '0px')
    }
  }, [hidden])

  if (hidden) return null

  return (
    <div
      ref={ref}
      role="status"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '10px 44px',
        textAlign: 'center',
        fontSize: 13.5,
        fontWeight: 700,
        letterSpacing: '0.01em',
        color: '#3a2a00',
        background: 'repeating-linear-gradient(45deg, #ffd54a, #ffd54a 14px, #ffcf33 14px, #ffcf33 28px)',
        borderBottom: '2px solid #b8860b',
      }}
    >
      <span aria-hidden="true">🧪</span>
      <span>
        MODO DEMO — todo lo que crees es privado de esta cuenta y se reinicia cada pocas horas.
      </span>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(STORAGE_KEY, '1')
          setHidden(true)
        }}
        aria-label="Ocultar aviso de modo demo"
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          minWidth: 0,
          minHeight: 0,
          padding: 0,
          borderRadius: 6,
          border: 'none',
          background: 'rgba(0,0,0,0.14)',
          color: '#3a2a00',
          cursor: 'pointer',
          fontSize: 11,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  )
}
