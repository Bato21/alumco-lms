'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'alumco-intro-visto'
const LOGO = '/LogoAlumco.png'

// Logo real (300x102) escalado 1.4x. Se parte en x=122 (hueco entre el
// emblema y la palabra "alumco") para animarlos por separado.
const S = 1.4
const BG_W = 300 * S // 420
const BG_H = 102 * S // 142.8
const SPLIT = 122 * S // 170.8 — corte dentro del hueco
const EMB_W = Math.round(SPLIT)
const WORD_W = Math.round(BG_W - SPLIT)

/**
 * Intro de carga: animación del logo Alumco hecha en código (sin video).
 * El emblema entra girando y la palabra "alumco" se revela; luego se
 * disuelve para mostrar la página. Una vez por sesión.
 */
export function IntroSplash() {
  const [visible, setVisible] = useState(true)
  const [fade, setFade] = useState(false)

  const cerrar = useCallback(() => {
    setFade(true)
    setTimeout(() => setVisible(false), 700)
  }, [])

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const yaVisto = sessionStorage.getItem(STORAGE_KEY) === '1'
    if (reduce || yaVisto) {
      queueMicrotask(() => setVisible(false))
      return
    }
    sessionStorage.setItem(STORAGE_KEY, '1')
    // Dura la animación y se va sola.
    const t = setTimeout(() => cerrar(), 2500)
    return () => clearTimeout(t)
  }, [cerrar])

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
      onClick={cerrar}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        opacity: fade ? 0 : 1,
        transform: fade ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      {/* Resplandor suave detrás del logo */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 620,
          height: 620,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(43,79,160,0.10) 0%, rgba(245,166,35,0.05) 45%, transparent 70%)',
          filter: 'blur(18px)',
        }}
      />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Emblema */}
        <span
          className="alm-emb"
          aria-hidden="true"
          style={{
            display: 'block',
            width: EMB_W,
            height: BG_H,
            backgroundImage: `url(${LOGO})`,
            backgroundSize: `${BG_W}px ${BG_H}px`,
            backgroundPosition: '0 0',
            backgroundRepeat: 'no-repeat',
          }}
        />
        {/* Palabra "alumco" */}
        <span
          className="alm-word"
          aria-label="Alumco"
          style={{
            display: 'block',
            width: WORD_W,
            height: BG_H,
            backgroundImage: `url(${LOGO})`,
            backgroundSize: `${BG_W}px ${BG_H}px`,
            backgroundPosition: `-${EMB_W}px 0`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>

      <style>{`
        @keyframes almEmbIn {
          0%   { opacity: 0; transform: scale(0.25) rotate(-40deg); }
          55%  { opacity: 1; }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes almWordIn {
          0%   { opacity: 0; clip-path: inset(0 100% 0 0); }
          100% { opacity: 1; clip-path: inset(0 0 0 0); }
        }
        .alm-emb  { animation: almEmbIn 0.85s cubic-bezier(.18,.85,.25,1) both; transform-origin: center; }
        .alm-word { animation: almWordIn 0.7s ease 0.6s both; }
        @media (prefers-reduced-motion: reduce) {
          .alm-emb, .alm-word { animation: none; }
        }
      `}</style>
    </div>
  )
}
