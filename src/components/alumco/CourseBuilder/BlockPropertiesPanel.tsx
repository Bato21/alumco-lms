'use client'

import { useState, useTransition } from 'react'
import { updateModuleAction } from '@/lib/actions/courses'
import { type ModuleBlock } from './CourseBuilder'

interface BlockPropertiesPanelProps {
  module: ModuleBlock
  courseId: string
  onClose: () => void
  onUpdated: (updated: ModuleBlock) => void
}

export function BlockPropertiesPanel({
  module,
  courseId,
  onClose,
  onUpdated,
}: BlockPropertiesPanelProps) {
  const [title, setTitle] = useState(module.title)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const formData = new FormData()
    formData.append('title', title)

    startTransition(async () => {
      const result = await updateModuleAction(module.id, courseId, formData)
      if (result.error) {
        setError(result.error)
        return
      }
      onUpdated({ ...module, title })
      onClose()
    })
  }

  const typeLabels: Record<string, string> = {
    video: 'Video',
    pdf: 'PDF',
    quiz: 'Evaluación',
    slides: 'Presentación',
  }

  const typeColors: Record<string, string> = {
    video: 'bg-[#E6F1FB] text-[#0C447C]',
    pdf: 'bg-[#FAECE7] text-[#712B13]',
    quiz: 'bg-[#EAF3DE] text-[#27500A]',
    slides: 'bg-[#EEEDFE] text-[#3C3489]',
  }

  return (
    <div className="bg-white rounded-xl border border-[#2B4FA0] p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${typeColors[module.content_type] ?? 'bg-muted text-muted-foreground'}`}>
            {typeLabels[module.content_type] ?? module.content_type}
          </span>
          <h3 className="font-semibold text-sm text-[#1A1A2E]">
            Propiedades del bloque
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[#F5F5F5] text-muted-foreground transition-colors"
          aria-label="Cerrar panel de propiedades"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-border"/>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-[#FAECE7] border border-[#E74C3C]/20">
          <p className="text-sm text-[#E74C3C]">{error}</p>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Título */}
        <div className="space-y-1.5">
          <label
            htmlFor="edit-title"
            className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Título
          </label>
          <input
            id="edit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isPending}
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
          />
        </div>

        {/* Info de solo lectura según tipo */}
        {module.content_type === 'video' && module.content_url && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              URL del video
            </p>
            <p className="text-sm text-muted-foreground truncate bg-[#F5F5F5] px-3 py-2 rounded-lg">
              {module.content_url}
            </p>
          </div>
        )}

        {module.content_type === 'pdf' && module.content_url && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              URL del PDF
            </p>
            <p className="text-sm text-muted-foreground truncate bg-[#F5F5F5] px-3 py-2 rounded-lg">
              {module.content_url}
            </p>
          </div>
        )}

        {module.content_type === 'quiz' && module.quiz && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Puntaje mínimo</span>
              <span className="font-semibold text-[#1A1A2E]">
                {module.quiz.passing_score}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Intentos máximos</span>
              <span className="font-semibold text-[#1A1A2E]">
                {module.quiz.max_attempts}
              </span>
            </div>
            <p className="text-xs text-muted-foreground bg-[#F5F5F5] p-3 rounded-lg">
              Para editar las preguntas del quiz, usa la vista de edición completa.
            </p>
          </div>
        )}

        {module.content_type === 'video' && module.duration_mins && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Duración</span>
            <span className="font-semibold text-[#1A1A2E]">
              {module.duration_mins} min
            </span>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 h-10 rounded-lg border text-sm font-medium text-muted-foreground hover:bg-[#F5F5F5] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || title === module.title}
            className="flex-1 h-10 rounded-lg bg-[#2B4FA0] text-white text-sm font-semibold hover:bg-[#2B4FA0]/90 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}