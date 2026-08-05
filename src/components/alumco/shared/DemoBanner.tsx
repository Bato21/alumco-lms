'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'

// Barra fija que avisa que la sesión es demo. Publica su altura en la variable
// CSS --demo-banner-h para que los layouts y las navegaciones (que usan
// top: var(--demo-banner-h, 0px)) empujen su contenido hacia abajo en vez de
// quedar tapados. Se puede ocultar; la preferencia dura la sesión del tab.
const STORAGE_KEY = 'kk-demo-banner-hidden'
const STORAGE_EVENT = 'kk-demo-banner-change'

function subscribeToBannerPreference(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(STORAGE_EVENT, onStoreChange)
  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(STORAGE_EVENT, onStoreChange)
  }
}

function getBannerPreference() {
  return sessionStorage.getItem(STORAGE_KEY) === '1'
}

export function DemoBanner() {
  // Leer la preferencia con useSyncExternalStore en vez de un useEffect que
  // llama setState: ese patrón dispara un render en cascada y ESLint lo marca
  // como error.
  const hidden = useSyncExternalStore(subscribeToBannerPreference, getBannerPreference, () => false)
  const ref = useRef<HTMLDivElement>(null)

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
        padding: '9px 48px',
        textAlign: 'center',
        fontSize: 13.5,
        lineHeight: 1.3,
        fontWeight: 700,
        letterSpacing: '0.01em',
        color: '#3a2a00',
        background: 'repeating-linear-gradient(45deg, #ffd54a, #ffd54a 14px, #ffcf33 14px, #ffcf33 28px)',
        borderBottom: '2px solid #b8860b',
      }}
    >
      <span aria-hidden="true">🧪</span>
      {/* En móvil el texto largo ocupaba tres líneas (~24% de una pantalla de
          667px). Se muestra la versión corta y la larga queda para escritorio;
          ambas dicen lo mismo, así que el lector de pantalla lee solo una. */}
      <span className="demo-banner-texto-corto">
        MODO DEMO — tus cambios se reinician cada pocas horas.
      </span>
      <span className="demo-banner-texto-largo">
        MODO DEMO — todo lo que crees es privado de esta cuenta y se reinicia cada pocas horas.
      </span>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(STORAGE_KEY, '1')
          window.dispatchEvent(new Event(STORAGE_EVENT))
        }}
        aria-label="Ocultar aviso de modo demo"
        className="area-tactil"
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 26,
          height: 26,
          minWidth: 0,
          minHeight: 0,
          padding: 0,
          borderRadius: 6,
          border: 'none',
          background: 'rgba(0,0,0,0.14)',
          color: '#3a2a00',
          cursor: 'pointer',
          fontSize: 13,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  )
}
