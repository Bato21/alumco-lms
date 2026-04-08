'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  togglePublishCourseAction,
  deleteCourseAction,
} from '@/lib/actions/courses'
import { BlockCanvas } from './BlockCanvas'
import { BlockPalette } from './BlockPalette'
import { type ContentType } from '@/lib/types/database'

// ── Tipos locales ──────────────────────────────────────────

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
  }
}

export interface CourseData {
  id: string
  title: string
  description: string | null
  deadline: string | null
  deadline_description: string | null
  is_published: boolean
}

interface CourseBuilderProps {
  course: CourseData
  initialModules: ModuleBlock[]
}

export function CourseBuilder({
  course,
  initialModules,
}: CourseBuilderProps) {
  const router = useRouter()
  const [modules, setModules] = useState<ModuleBlock[]>(initialModules)
  const [isPublished, setIsPublished] = useState(course.is_published)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="min-h-screen bg-[#F5F5F5]">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => router.push('/admin/cursos')}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Volver a cursos"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-lg text-[#1A1A2E] truncate">
              {course.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {modules.length} {modules.length === 1 ? 'módulo' : 'módulos'}
              {course.deadline && (
                <span className="ml-2 text-[#F5A623]">
                  · Plazo: {new Date(course.deadline).toLocaleDateString('es-CL')}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {error && (
            <p className="text-sm text-[#E74C3C]">{error}</p>
          )}

          {/* Badge de estado */}
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            isPublished
              ? 'bg-[#27AE60]/10 text-[#27AE60]'
              : 'bg-slate-100 text-slate-500'
          }`}>
            {isPublished ? 'Publicado' : 'Borrador'}
          </span>

          {/* Botón eliminar */}
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-2 rounded-lg border border-[#E74C3C] text-[#E74C3C] text-sm font-semibold hover:bg-[#E74C3C]/5 transition-colors min-h-[40px] disabled:opacity-50"
          >
            Eliminar
          </button>

          {/* Botón publicar */}
          <button
            onClick={handlePublish}
            disabled={isPending}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors min-h-[40px] disabled:opacity-50 ${
              isPublished
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-[#2B4FA0] text-white hover:bg-[#2B4FA0]/90'
            }`}
          >
            {isPending
              ? 'Guardando...'
              : isPublished
              ? 'Despublicar'
              : 'Publicar curso'}
          </button>
        </div>
      </header>

      {/* Cuerpo: canvas + paleta */}
      <div className="flex gap-6 p-8 max-w-6xl mx-auto">

        {/* Canvas central */}
        <div className="flex-1 min-w-0">
          <BlockCanvas
            courseId={course.id}
            modules={modules}
            onModulesChange={handleModulesChange}
          />
        </div>

        {/* Panel lateral */}
        <div className="w-64 shrink-0">
          <BlockPalette
            courseId={course.id}
            onModuleCreated={(newModule) => {
              setModules((prev) => [...prev, newModule])
            }}
          />
        </div>
      </div>
    </div>
  )
}