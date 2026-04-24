'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[App Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Logo */}
        <img
          src="https://ongalumco.cl/wp-content/uploads/2023/11/logo-alumco-completoccc-300x102.png"
          alt="Alumco"
          className="h-10 object-contain mx-auto opacity-80"
        />

        {/* Ícono error */}
        <div className="relative">
          <p className="text-[160px] font-black text-[#E74C3C]/8 leading-none select-none">
            500
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-2xl bg-[#FAECE7] flex items-center justify-center">
              <svg className="h-10 w-10 text-[#E74C3C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Mensaje */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[#1A1A2E]">
            Algo salió mal
          </h1>
          <p className="text-[#6B7280]">
            Ocurrió un error inesperado. Puedes intentar
            nuevamente o volver al inicio.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-slate-400">
              Error: {error.digest}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#2B4FA0] text-white rounded-xl font-semibold text-sm hover:bg-[#2B4FA0]/90 transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            Intentar nuevamente
          </button>
          <a
            href="/inicio"
            className="px-6 py-3 bg-white border border-slate-200 text-[#1A1A2E] rounded-xl font-semibold text-sm hover:border-[#2B4FA0] transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            Ir al inicio
          </a>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400">
          KimuKo · ONG Alumco
        </p>
      </div>
    </div>
  )
}
