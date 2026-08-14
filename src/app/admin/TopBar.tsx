'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { NotificationBell, type EventoBellItem } from '@/components/alumco/shared/NotificationBell'
import SearchBar from '@/components/alumco/shared/SearchBar'
import { Avatar } from '@/components/alumco/ds'

interface AdminTopBarProps {
  alerts: {
    count: number
    alerts: {
      courseId: string
      courseTitle: string
      deadline: string
      daysLeft: number
      urgency: 'overdue' | 'critical' | 'warning'
      pendingWorkers?: number
      totalWorkers?: number
      completionPct?: number
    }[]
  }
  role: 'admin' | 'profesor'
  fullName: string
  evento?: EventoBellItem | null
}

export function AdminTopBar({ alerts, role, fullName, evento }: AdminTopBarProps) {
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    function handleScroll() {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          if (currentScrollY < 10) {
            setIsVisible(true)
          } else if (currentScrollY < lastScrollY.current) {
            setIsVisible(true)
          } else if (currentScrollY > lastScrollY.current + 5) {
            setIsVisible(false)
          }
          lastScrollY.current = currentScrollY
          ticking.current = false
        })
        ticking.current = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className="topbar hidden lg:flex"
      style={{
        position: 'fixed',
        top: 'var(--demo-banner-h, 0px)',
        left: 264,
        right: 0,
        zIndex: 30,
        gap: 16,
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out',
      }}
    >
      <SearchBar
        placeholder="Buscar cursos, trabajadores o sedes…"
        className="w-full max-w-[480px]"
        id="busqueda-admin"
        etiqueta="Buscar cursos, trabajadores o sedes"
      />
      <div className="crece" />
      <NotificationBell initialAlerts={alerts} role={role} evento={evento} />
      <span style={{ width: 1, height: 26, background: 'var(--borde-suave)' }} />
      <Link
        href="/admin/perfil"
        aria-label="Mi perfil"
        className="fila"
        style={{ gap: 10, padding: '4px 6px', borderRadius: 12, minHeight: 44 }}
      >
        <Avatar nombre={fullName} s={36} />
        <span style={{ fontWeight: 600, fontSize: 14.5 }}>{fullName.split(' ')[0]}</span>
      </Link>
    </header>
  )
}
