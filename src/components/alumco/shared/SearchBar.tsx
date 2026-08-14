'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { searchAction } from '@/lib/actions/search'
import { Search, BookOpen, Users, X, Loader2 } from 'lucide-react'

interface SearchBarProps {
  placeholder?: string
  className?: string
  /** Rótulo del campo. Se lee, no se ve: el diseño aprobado no lleva etiqueta visible. */
  etiqueta?: string
  /** Distingue los ids cuando hay más de un buscador montado (móvil + escritorio). */
  id?: string
}

export default function SearchBar({
  placeholder,
  className,
  etiqueta = 'Buscar cursos y trabajadores',
  id = 'busqueda-global',
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [results, setResults] = useState<{
    courses: { id: string; title: string; is_published: boolean }[]
    workers: { id: string; full_name: string; area_trabajo: string[]; sede: string }[]
    role: 'admin' | 'profesor' | 'trabajador'
  }>({ courses: [], workers: [], role: 'trabajador' })

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current &&
          !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  // El pie del panel prometía "Esc para cerrar" sin que nadie escuchara la
  // tecla. Va en el documento y no en el contenedor porque el foco puede estar
  // en el campo o en cualquiera de los botones de resultado.
  useEffect(() => {
    if (!isOpen) return
    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setIsOpen(false)
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', alPresionarTecla)
    return () => document.removeEventListener('keydown', alPresionarTecla)
  }, [isOpen])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setQuery(value)

    clearTimeout(timeoutRef.current)

    if (value.trim().length < 2) {
      setIsOpen(false)
      setResults({ courses: [], workers: [], role: 'trabajador' })
      return
    }

    timeoutRef.current = setTimeout(() => {
      startTransition(async () => {
        const data = await searchAction(value)
        setResults(data)
        setIsOpen(true)
      })
    }, 300)
  }

  function handleClear() {
    setQuery('')
    setIsOpen(false)
    setResults({ courses: [], workers: [], role: 'trabajador' })
    inputRef.current?.focus()
  }

  const totalResultados = results.courses.length + results.workers.length

  function handleSelectCourse(courseId: string) {
    const basePath = results.role === 'trabajador'
      ? `/cursos/${courseId}`
      : `/admin/cursos`
    router.push(basePath)
    setIsOpen(false)
    setQuery('')
  }

  function handleSelectWorker(workerId: string) {
    router.push(`/admin/trabajadores/${workerId}`)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div
      className={`relative ${className ?? ''}`}
      ref={containerRef}
      role="search"
    >

      {/* Input */}
      {/* El placeholder desaparece al escribir: la etiqueta real va aquí,
          visible solo para lectores porque el diseño no la muestra. */}
      <label htmlFor={id} className="sr-only">{etiqueta}</label>
      <div className="input-busqueda" style={{ width: '100%' }}>
        <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--tinta-3)' }} aria-hidden="true" />
        <input
          ref={inputRef}
          id={id}
          type="search"
          autoComplete="off"
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true)
          }}
          placeholder={placeholder ?? 'Buscar...'}
        />
        {isPending ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" style={{ color: 'var(--tinta-3)' }} aria-hidden="true" />
        ) : query.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tinta-3)', display: 'flex' }}
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {/* Los resultados llegan tras un debounce: sin esto el cambio es mudo. */}
      <p role="status" className="sr-only">
        {isPending
          ? 'Buscando…'
          : isOpen
            ? totalResultados === 0
              ? `Sin resultados para ${query}`
              : `${totalResultados} ${totalResultados === 1 ? 'resultado' : 'resultados'} para ${query}`
            : ''}
      </p>

      {/* Dropdown de resultados */}
      {isOpen && (
        /* Sin `min-w-[320px]`: con el margen del contenedor desbordaba
           horizontalmente en pantallas de 320 px (1.4.10). */
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-slate-100 z-50 overflow-hidden">

          {/* Sin resultados */}
          {results.courses.length === 0 && results.workers.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[#6B7280]">
                Sin resultados para &quot;{query}&quot;
              </p>
            </div>
          )}

          {/* Resultados de cursos */}
          {results.courses.length > 0 && (
            <div>
              <div className="px-4 py-2 border-b border-slate-50">
                <p id={`${id}-cursos`} className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3" aria-hidden="true" />
                  Cursos
                </p>
              </div>
              <ul role="list" aria-labelledby={`${id}-cursos`}>
                {results.courses.map(course => (
                  <li key={course.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectCourse(course.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F0F4FF] transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-[#E6F1FB] flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-[#2B4FA0]" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1A1A2E] truncate">
                          {course.title}
                        </p>
                        {!course.is_published && (
                          <p className="text-[10px] text-[#6B7280]">
                            Borrador
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resultados de trabajadores — solo admin/profesor */}
          {results.workers.length > 0 && (
            <div className={results.courses.length > 0 ? 'border-t border-slate-100' : ''}>
              <div className="px-4 py-2 border-b border-slate-50">
                <p id={`${id}-trabajadores`} className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-3 w-3" aria-hidden="true" />
                  Trabajadores
                </p>
              </div>
              <ul role="list" aria-labelledby={`${id}-trabajadores`}>
              {results.workers.map(worker => {
                const initials = worker.full_name
                  .split(' ')
                  .map(n => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
                const sedeLabel = worker.sede === 'sede_1' ? 'Hualpén' : 'Coyhaique'

                return (
                  <li key={worker.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectWorker(worker.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F0F4FF] transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#2B4FA0]" aria-hidden="true">
                          {initials}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1A1A2E] truncate">
                          {worker.full_name}
                        </p>
                        <p className="text-xs text-[#6B7280] truncate">
                          {sedeLabel}
                          {worker.area_trabajo.length > 0 &&
                            ` · ${worker.area_trabajo[0]}`}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
              </ul>
            </div>
          )}

          {/* Footer */}
          {/* Antes prometía "Enter para buscar", que nunca estuvo implementado.
              Ahora describe lo que el panel hace de verdad. */}
          <div className="px-4 py-2 border-t border-slate-50 bg-slate-50">
            <p className="text-[10px] text-[var(--tinta-2)] text-center">
              Tabula para recorrer los resultados · Esc para cerrar
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
