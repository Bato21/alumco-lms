'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { NotificationBell } from '@/components/alumco/NotificationBell'
import SearchBar from '@/components/alumco/SearchBar'

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
}

export function AdminTopBar({ alerts, role }: AdminTopBarProps) {
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
        top: 0,
        left: 264,
        right: 0,
        zIndex: 30,
        justifyContent: 'flex-end',
        gap: 16,
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out',
      }}
    >
      <SearchBar placeholder="Buscar personas o cursos…" className="w-72" />
      <NotificationBell initialAlerts={alerts} role={role} />
      <span style={{ width: 1, height: 26, background: 'var(--borde-suave)' }} />
      <Link
        href="/admin/perfil"
        aria-label="Mi perfil y configuración"
        className="btn btn-ghost btn-icon"
      >
        <Settings className="h-5 w-5" aria-hidden="true" />
      </Link>
    </header>
  )
}
