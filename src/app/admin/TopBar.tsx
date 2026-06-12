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
      className={`hidden lg:flex fixed top-0 left-64 right-0 items-center justify-end px-8 py-4 z-30 bg-white/90 backdrop-blur border-b border-slate-100 gap-6 transition-transform duration-300 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <SearchBar placeholder="Buscar personas o cursos…" className="w-64" />
      <div className="flex items-center gap-2">
        <NotificationBell initialAlerts={alerts} role={role} />
        <Link
          href="/admin/perfil"
          aria-label="Mi perfil y configuración"
          className="p-2 text-slate-500 hover:text-[#2B4FA0] transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B4FA0]/30"
        >
          <Settings className="h-6 w-6" aria-hidden="true" />
        </Link>
      </div>
    </header>
  )
}
