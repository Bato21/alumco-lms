'use client'

import { useState, useTransition } from 'react'
import { completeOnboardingAction } from '@/lib/actions/trabajadores'
import { Badge } from '@/components/alumco/ds'
import { useAccessibleDialog } from '@/hooks/useAccessibleDialog'

interface WelcomeModalProps {
  fullName: string
  areas: string[]
  sede: string
}

export default function WelcomeModal({ fullName, areas, sede }: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isPending, startTransition] = useTransition()

  // A11Y-12 · octavo modal de la plataforma: bloquea /inicio en el primer
  // acceso y no declaraba rol, nombre ni gestión de foco.
  //
  // El cierre es intencionadamente un no-op: este diálogo no se cancela, se
  // completa con «Comenzar mi capacitación» —cerrarlo marca el onboarding como
  // hecho—, así que Escape no debe descartarlo. 2.1.2 no exige Escape, exige
  // que se pueda salir con teclado, y el botón está dentro de la trampa.
  const dialogRef = useAccessibleDialog<HTMLDivElement>(isVisible, () => {})

  function handleStart() {
    setIsLeaving(true)
    startTransition(async () => {
      await completeOnboardingAction()
      setTimeout(() => {
        setIsVisible(false)
      }, 300)
    })
  }

  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isLeaving ? 'opacity-0' : 'opacity-100'}`}>

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className={`card max-w-lg w-full overflow-hidden transition-all duration-300 ${isLeaving ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}
        style={{ boxShadow: 'var(--sombra-3)' }}
      >

        {/* Header ámbar con decoración y grano */}
        <div className="relative bg-gradient-to-br from-[#F5A623] to-[#e0961a] px-8 pt-10 pb-16 overflow-hidden film-grain">

          {/* Círculos decorativos */}
          <div className="absolute right-[-40px] top-[-40px] w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute right-[20px] bottom-[-20px] w-32 h-32 rounded-full bg-[#F5A623]/10" />

          {/* Logo */}
          <img
            src="https://ongalumco.cl/wp-content/uploads/2023/11/logo-alumco-completoccc-300x102.png"
            alt="Alumco"
            className="h-8 object-contain brightness-0 invert opacity-90 mb-6"
          />

          {/* Saludo. Es un <h2>, no un <h1>: /inicio ya declara el suyo y dos
              <h1> en la misma página rompen la jerarquía de encabezados. Da
              además el nombre accesible del diálogo vía aria-labelledby. */}
          <h2 id="welcome-title" className="t-display relative z-10" style={{ fontSize: 32, color: '#fff' }}>
            ¡Bienvenido/a a KimünKo,<br />{fullName.split(' ')[0]}!
          </h2>
          <p className="text-white/70 text-sm mt-2 relative z-10">
            Tu plataforma de capacitación está lista.
          </p>
        </div>

        {/* Contenido principal */}
        <div className="relative -mt-8 px-8 pb-8">

          {/* Card de acceso rápido */}
          <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.10)] p-5 mb-6 border border-slate-100">

            {/* Sede */}
            <div className="flex items-start gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-[#E6F1FB] flex items-center justify-center shrink-0">
                <svg className="h-5 w-5 text-[#2B4FA0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Tu sede</p>
                <p className="text-sm font-bold text-[#1A1A2E]">
                  {sede === 'sede_1' ? 'Sede Hualpén' : 'Sede Coyhaique'}
                </p>
              </div>
            </div>

            {/* Áreas */}
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-[#EAF3DE] flex items-center justify-center shrink-0">
                <svg className="h-5 w-5 text-[var(--ok)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Tus áreas</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {areas.length > 0 ? areas.map(area => (
                    <Badge key={area} tono="info" punto={false}>{area}</Badge>
                  )) : (
                    <span className="silencio texto-s">Sin asignar</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de features */}
          <div className="space-y-3 mb-6">
            {[
              {
                icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                color: '#2B4FA0',
                bg: '#E6F1FB',
                text: 'Accede a cursos de capacitación asignados a tu área',
              },
              {
                icon: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
                color: 'var(--ok)',
                bg: '#EAF3DE',
                text: 'Completa evaluaciones y obtén tus certificados digitales',
              },
              {
                icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9',
                // #F5A623 sobre #FFF8EC da 1.92:1: no llega al 3:1 de 1.4.11.
                color: 'var(--ambar-700)',
                bg: '#FFF8EC',
                text: 'Recibe alertas cuando tus cursos estén próximos a vencer',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: item.bg }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                  </svg>
                </div>
                <p className="text-sm text-[#1A1A2E]">{item.text}</p>
              </div>
            ))}
          </div>

          {/* Botón principal */}
          <button
            onClick={handleStart}
            disabled={isPending}
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
          >
            {isPending ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Un momento...
              </>
            ) : (
              <>
                Comenzar mi capacitación <span aria-hidden="true">→</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 mt-3">
            KimünKo · ONG Alumco Chile
          </p>
        </div>
      </div>
    </div>
  )
}
