'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  togglePublishCourseAction,
  deleteCourseAction,
  updateCourseAction,
} from '@/lib/actions/courses'
import { BlockCanvas } from './BlockCanvas'
import { BlockPalette } from './BlockPalette'
import { type ContentType } from '@/lib/types/database'
import { AREAS_TRABAJO } from '@/lib/types/database'
import { CheckCircle2, ChevronDown, Loader2 } from 'lucide-react'
import { type Question } from '@/lib/types/database'

// ── Tipos ──────────────────────────────────────────────────

export interface ModuleBlock {
  id: string
  title: string
  content_type: ContentType
  content_url: string
  order_index: number
  duration_mins: number | null
  is_required: boolean
  quiz?: {
    id: string
    passing_score: number
    max_attempts: number
    questions?: Question[]
  }
}

export interface CourseData {
  id: string
  title: string
  description: string | null
  deadline: string | null
  deadline_description: string | null
  is_published: boolean
  target_areas: string[]
}

interface CourseBuilderProps {
  course: CourseData
  initialModules: ModuleBlock[]
  initialTargetAreas: string[]
}

// ── Selector de área objetivo ──────────────────────────────

interface AreaTargetSelectorProps {
  mode: 'all' | 'select'
  selectedAreas: string[]
  onModeChange: (mode: 'all' | 'select') => void
  onAreasChange: (areas: string[]) => void
}

function AreaTargetSelector({
  mode,
  selectedAreas,
  onModeChange,
  onAreasChange,
}: AreaTargetSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  function toggleArea(area: string) {
    if (selectedAreas.includes(area)) {
      onAreasChange(selectedAreas.filter((a) => a !== area))
    } else {
      onAreasChange([...selectedAreas, area])
    }
  }

  const triggerText =
    selectedAreas.length === 0
      ? 'Selecciona las áreas...'
      : selectedAreas.length === 1
      ? selectedAreas[0]
      : `${selectedAreas.length} áreas seleccionadas`

  return (
    <div className="space-y-2">

      {/* Botones modo */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onModeChange('all')}
          className={`flex-1 text-center rounded-xl border px-3 py-2.5 font-medium text-xs cursor-pointer transition-colors ${
            mode === 'all'
              ? 'bg-[#2B4FA0] text-white border-[#2B4FA0]'
              : 'bg-white text-[#1A1A2E] border-slate-200 hover:border-[#2B4FA0]/40'
          }`}
        >
          Todas las áreas
        </button>
        <button
          type="button"
          onClick={() => onModeChange('select')}
          className={`flex-1 text-center rounded-xl border px-3 py-2.5 font-medium text-xs cursor-pointer transition-colors ${
            mode === 'select'
              ? 'bg-[#2B4FA0] text-white border-[#2B4FA0]'
              : 'bg-white text-[#1A1A2E] border-slate-200 hover:border-[#2B4FA0]/40'
          }`}
        >
          Por área
        </button>
      </div>

      {/* Dropdown multi-select */}
      {mode === 'select' && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="w-full h-9 px-3 rounded-lg border border-input bg-white text-xs flex items-center justify-between hover:border-[#2B4FA0] transition-colors"
          >
            <span className={`truncate ${selectedAreas.length === 0 ? 'text-[#6B7280]' : 'text-[#1A1A2E]'}`}>
              {triggerText}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-[#6B7280] shrink-0 ml-1 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 w-full bg-white rounded-xl border shadow-lg mt-1">
              <div className="max-h-48 overflow-y-auto py-1">
                {AREAS_TRABAJO.map((area) => {
                  const isSelected = selectedAreas.includes(area)
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArea(area)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F0F4FF] cursor-pointer text-xs w-full text-left"
                    >
                      <div
                        className={`h-4 w-4 rounded shrink-0 flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#2B4FA0]' : 'border-2 border-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span className="text-[#1A1A2E] leading-snug">{area}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center justify-between px-4 py-2 border-t">
                <span className="text-[10px] text-[#6B7280]">
                  {selectedAreas.length}{' '}
                  {selectedAreas.length === 1 ? 'área' : 'áreas'}
                </span>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(false)}
                  className="text-[#2B4FA0] font-semibold text-xs"
                >
                  Listo
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── CourseBuilder principal ────────────────────────────────

export function CourseBuilder({
  course,
  initialModules,
  initialTargetAreas,
}: CourseBuilderProps) {
  const router = useRouter()
  const [modules, setModules] = useState<ModuleBlock[]>(initialModules)
  const [isPublished, setIsPublished] = useState(course.is_published)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Áreas objetivo
  const [mode, setMode] = useState<'all' | 'select'>(
    initialTargetAreas.length > 0 ? 'select' : 'all'
  )
  const [targetAreas, setTargetAreas] = useState<string[]>(initialTargetAreas)
  const [isSavingAreas, startAreaTransition] = useTransition()
  const [areasSaved, setAreasSaved] = useState(false)

  function handleModulesChange(updated: ModuleBlock[]) {
    setModules(updated)
  }

  function handlePublish() {
    setError(null)
    startTransition(async () => {
      const result = await togglePublishCourseAction(course.id, !isPublished)
      if (result.error) {
        setError(result.error)
      } else {
        setIsPublished(!isPublished)
      }
    })
  }

  function handleDelete() {
    if (!confirm('¿Eliminar este curso? Esta acción no se puede deshacer.')) return
    startTransition(async () => {
      await deleteCourseAction(course.id)
    })
  }

  function handleSaveAreas() {
    setAreasSaved(false)
    startAreaTransition(async () => {
      const fd = new FormData()
      fd.set('title', course.title)
      if (course.description) fd.set('description', course.description)
      if (course.deadline) fd.set('deadline', course.deadline)
      if (course.deadline_description) fd.set('deadline_description', course.deadline_description)
      // Si mode === 'all', no se append nada → target_areas = []
      if (mode === 'select') {
        targetAreas.forEach((area) => fd.append('target_areas', area))
      }

      const result = await updateCourseAction(course.id, fd)
      if (!result.error) {
        setAreasSaved(true)
        setTimeout(() => setAreasSaved(false), 2000)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b px-4 lg:px-8 py-3 lg:py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1">
          <button
            onClick={() => router.push('/admin/cursos')}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Volver a cursos"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-base lg:text-lg text-[#1A1A2E] truncate">
              {course.title}
            </h1>
            <p className="text-xs lg:text-sm text-muted-foreground truncate">
              {modules.length} {modules.length === 1 ? 'módulo' : 'módulos'}
              {course.deadline && (
                <span className="ml-2 text-[#F5A623] hidden sm:inline">
                  · Plazo: {new Date(course.deadline).toLocaleDateString('es-CL')}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {error && (
            <p className="text-xs lg:text-sm text-[#E74C3C] hidden md:block">{error}</p>
          )}

          <span className={`text-xs font-semibold px-2.5 lg:px-3 py-1 rounded-full whitespace-nowrap ${
            isPublished
              ? 'bg-[#27AE60]/10 text-[#27AE60]'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {isPublished ? 'Publicado' : 'Borrador'}
          </span>

          <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-3 lg:px-4 py-2 rounded-lg border border-[#E74C3C] text-[#E74C3C] text-xs lg:text-sm font-semibold hover:bg-[#E74C3C]/5 transition-colors min-h-[44px] min-w-[44px] hidden sm:inline-flex items-center justify-center"
          >
            Eliminar
          </button>

          <button
            onClick={handlePublish}
            disabled={isPending}
            className={`px-4 lg:px-5 py-2 rounded-lg text-xs lg:text-sm font-bold transition-colors min-h-[44px] min-w-[44px] disabled:opacity-50 whitespace-nowrap ${
              isPublished
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-[#2B4FA0] text-white hover:bg-[#2B4FA0]/90'
            }`}
          >
            {isPending ? 'Guardando...' : isPublished ? 'Despublicar' : 'Publicar'}
          </button>
        </div>
      </header>

      {/* Cuerpo: canvas + panel lateral */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-8 max-w-6xl mx-auto">

        {/* Canvas central */}
        <div className="flex-1 min-w-0">
          <BlockCanvas
            courseId={course.id}
            modules={modules}
            onModulesChange={handleModulesChange}
          />
        </div>

        {/* Panel lateral */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          <BlockPalette
            courseId={course.id}
            onModuleCreated={(newModule) => {
              setModules((prev) => [...prev, newModule])
            }}
          />

          {/* Panel área objetivo */}
          <div className="bg-white rounded-xl border p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-[#1A1A2E] text-sm">Área objetivo</h2>
              <p className="text-[10px] text-[#6B7280] mt-0.5">
                ¿A quién va dirigido este curso?
              </p>
            </div>

            <AreaTargetSelector
              mode={mode}
              selectedAreas={targetAreas}
              onModeChange={setMode}
              onAreasChange={setTargetAreas}
            />

            <button
              type="button"
              onClick={handleSaveAreas}
              disabled={isSavingAreas}
              className="w-full h-9 rounded-lg bg-[#2B4FA0] text-white text-xs font-semibold hover:bg-[#1A2F6B] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSavingAreas ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Guardando...
                </>
              ) : areasSaved ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Guardado
                </>
              ) : (
                'Guardar áreas'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
