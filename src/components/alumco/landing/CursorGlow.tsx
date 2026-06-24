'use client'

import { useEffect, useRef } from 'react'

// Círculos ámbar difuminados que siguen el cursor, al fondo de la sección
// (con distinto retardo = parallax). Quedan recortados al contenedor.
const BLOBS = [
  { size: 380, lag: 0.09, color: 'rgba(245,166,35,0.24)' },
  { size: 300, lag: 0.055, color: 'rgba(245,166,35,0.17)' },
  { size: 460, lag: 0.03, color: 'rgba(245,166,35,0.12)' },
]

export function CursorGlow() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    let rect = wrap.getBoundingClientRect()
    const refresh = () => { rect = wrap.getBoundingClientRect() }
    window.addEventListener('resize', refresh)
    window.addEventListener('scroll', refresh, { passive: true })

    const target = { x: rect.width / 2, y: rect.height / 2 }
    const pos = BLOBS.map(() => ({ x: rect.width / 2, y: rect.height / 2 }))

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX - rect.left
      target.y = e.clientY - rect.top
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
        if (el) el.style.transform = `translate3d(${p.x - b.size / 2}px, ${p.y - b.size / 2}px, 0)`
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', refresh)
      window.removeEventListener('scroll', refresh)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}
    >
      {BLOBS.map((b, i) => (
        <div
          key={i}
          ref={(el) => { refs.current[i] = el }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
            filter: 'blur(46px)',
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  )
}
