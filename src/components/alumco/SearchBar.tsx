'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { searchAction } from '@/lib/actions/search'
import { Search, BookOpen, Users, X, Loader2 } from 'lucide-react'

interface SearchBarProps {
  placeholder?: string
  className?: string
}

export default function SearchBar({ placeholder, className }: SearchBarProps) {
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
  const timeoutRef = useRef<NodeJS.Timeout>()
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
    <div className={`relative ${className ?? ''}`} ref={containerRef}>

      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true)
          }}
          placeholder={placeholder ?? 'Buscar...'}
          className="pl-9 pr-8 py-2 bg-slate-100 rounded-full text-sm focus:ring-2 focus:ring-[#2B4FA0]/20 focus:bg-white w-full outline-none transition-all border border-transparent focus:border-[#2B4FA0]/20"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isPending ? (
            <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
          ) : query.length > 0 ? (
            <button
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-slate-100 z-50 overflow-hidden min-w-[320px]">

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
                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3" />
                  Cursos
                </p>
              </div>
              {results.courses.map(course => (
                <button
                  key={course.id}
                  onClick={() => handleSelectCourse(course.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F0F4FF] transition-colors text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-[#E6F1FB] flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-[#2B4FA0]" />
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
              ))}
            </div>
          )}

          {/* Resultados de trabajadores — solo admin/profesor */}
          {results.workers.length > 0 && (
            <div className={results.courses.length > 0 ? 'border-t border-slate-100' : ''}>
              <div className="px-4 py-2 border-b border-slate-50">
                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  Trabajadores
                </p>
              </div>
              {results.workers.map(worker => {
                const initials = worker.full_name
                  .split(' ')
                  .map(n => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
                const sedeLabel = worker.sede === 'sede_1' ? 'Hualpén' : 'Coyhaique'

                return (
                  <button
                    key={worker.id}
                    onClick={() => handleSelectWorker(worker.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F0F4FF] transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#2B4FA0]">
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
                )
              })}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-50 bg-slate-50">
            <p className="text-[10px] text-slate-400 text-center">
              Presiona Enter para buscar · Esc para cerrar
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
