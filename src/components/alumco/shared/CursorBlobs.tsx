'use client'

import { useEffect, useRef } from 'react'

// Círculos difuminados de fondo que siguen el cursor con distinto retardo
// (efecto parallax). Colores de marca: azul Alumco + ámbar.
const BLOBS = [
  { color: 'rgba(43,79,160,0.40)', size: 540, lag: 0.085 }, // azul — sigue más rápido
  { color: 'rgba(245,166,35,0.28)', size: 440, lag: 0.05 }, // ámbar
  { color: 'rgba(43,79,160,0.22)', size: 660, lag: 0.028 }, // azul grande — más lento
]

export function CursorBlobs() {
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    const target = { x: cx, y: cy }
    const pos = BLOBS.map(() => ({ x: cx, y: cy }))

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX
      target.y = e.clientY
    }
    window.addEventListener('mousemove', onMove)

    let raf = 0
    const tick = () => {
      BLOBS.forEach((b, i) => {
        const p = pos[i]
        const k = reduce ? 1 : b.lag
        p.x += (target.x - p.x) * k
        p.y += (target.y - p.y) * k
        const el = refs.current[i]
        if (el) {
          el.style.transform = `translate3d(${p.x - b.size / 2}px, ${p.y - b.size / 2}px, 0)`
        }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {BLOBS.map((b, i) => (
        <div
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            filter: 'blur(44px)',
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  )
}
