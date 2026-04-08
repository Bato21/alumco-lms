'use client'

import { useState, useTransition } from 'react'
import { createModuleAction } from '@/lib/actions/courses'
import { type ModuleBlock } from './CourseBuilder'
import { type ContentType } from '@/lib/types/database'

interface BlockPaletteProps {
  courseId: string
  onModuleCreated: (module: ModuleBlock) => void
}

type PaletteItem = {
  type: ContentType
  label: string
  description: string
  bgColor: string
  textColor: string
  iconColor: string
  icon: React.ReactNode
}

const paletteItems: PaletteItem[] = [
  {
    type: 'video',
    label: 'Video',
    description: 'YouTube embed',
    bgColor: 'bg-[#E6F1FB]',
    textColor: 'text-[#0C447C]',
    iconColor: '#185FA5',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    ),
  },
  {
    type: 'pdf',
    label: 'PDF',
    description: 'Documento o presentación',
    bgColor: 'bg-[#FAECE7]',
    textColor: 'text-[#712B13]',
    iconColor: '#993C1D',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    type: 'quiz',
    label: 'Evaluación',
    description: 'Preguntas de alternativas',
    bgColor: 'bg-[#EAF3DE]',
    textColor: 'text-[#27500A]',
    iconColor: '#3B6D11',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
]

export function BlockPalette({ courseId, onModuleCreated }: BlockPaletteProps) {
  const [selectedType, setSelectedType] = useState<ContentType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSelectType(type: ContentType) {
    setSelectedType(selectedType === type ? null : type)
    setError(null)
  }

  function handleSubmit(formData: FormData) {
    if (!selectedType) return
    setError(null)

    startTransition(async () => {
      const result = await createModuleAction(courseId, selectedType, formData)
      if (result.error) {
        setError(result.error)
        return
      }

      // Construir el módulo localmente para actualización optimista
      const title = formData.get('title') as string
      const newModule: ModuleBlock = {
        id: result.id!,
        title,
        content_type: selectedType,
        content_url: (formData.get('content_url') as string) ?? '',
        order_index: 999,
        duration_mins: selectedType === 'video'
          ? Number(formData.get('duration_mins')) || null
          : null,
        is_required: formData.get('is_required') !== 'false',
        quiz: selectedType === 'quiz'
          ? {
              id: '',
              passing_score: Number(formData.get('passing_score')) || 70,
              max_attempts: Number(formData.get('max_attempts')) || 3,
            }
          : undefined,
      }

      onModuleCreated(newModule)
      setSelectedType(null)
    })
  }

  return (
    <div className="space-y-4">

      {/* Título del panel */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold text-[#1A1A2E] mb-4">
          Agregar bloque
        </h2>

        {/* Tipos de bloque */}
        <div className="space-y-2">
          {paletteItems.map((item) => (
            <button
              key={item.type}
              onClick={() => handleSelectType(item.type)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                selectedType === item.type
                  ? 'border-[#2B4FA0] bg-[#E6F1FB]/30'
                  : 'border-border hover:border-[#2B4FA0]/40 hover:bg-[#F5F5F5]'
              }`}
              aria-pressed={selectedType === item.type}
            >
              <div
                className={`h-9 w-9 rounded-lg ${item.bgColor} flex items-center justify-center shrink-0`}
                style={{ color: item.iconColor }}
              >
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-[#1A1A2E]">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <svg
                className={`h-4 w-4 ml-auto shrink-0 transition-transform ${
                  selectedType === item.type ? 'rotate-180 text-[#2B4FA0]' : 'text-muted-foreground/40'
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Formulario del tipo seleccionado */}
      {selectedType && (
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-[#1A1A2E] mb-4 text-sm">
            Configurar bloque
          </h3>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-[#FAECE7] border border-[#E74C3C]/20">
              <p className="text-sm text-[#E74C3C]">{error}</p>
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">

            {/* Título — común a todos los tipos */}
            <div className="space-y-1.5">
              <label
                htmlFor="block-title"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Título
              </label>
              <input
                id="block-title"
                name="title"
                type="text"
                required
                disabled={isPending}
                placeholder={
                  selectedType === 'video' ? 'Ej: Introducción al cuidado' :
                  selectedType === 'pdf' ? 'Ej: Protocolo de higiene' :
                  'Ej: Evaluación módulo 1'
                }
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
              />
            </div>

            {/* Campos específicos por tipo */}
            {selectedType === 'video' && (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="content-url"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    URL de YouTube
                  </label>
                  <input
                    id="content-url"
                    name="content_url"
                    type="url"
                    required
                    disabled={isPending}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="duration"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Duración (min)
                  </label>
                  <input
                    id="duration"
                    name="duration_mins"
                    type="number"
                    min="1"
                    disabled={isPending}
                    placeholder="Ej: 12"
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
                  />
                </div>
              </>
            )}

            {selectedType === 'pdf' && (
              <div className="space-y-1.5">
                <label
                  htmlFor="pdf-url"
                  className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  URL del PDF
                </label>
                <input
                  id="pdf-url"
                  name="content_url"
                  type="url"
                  required
                  disabled={isPending}
                  placeholder="https://..."
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
                />
              </div>
            )}

            {selectedType === 'quiz' && (
              <>
                <div className="space-y-1.5">
                  <label
                    htmlFor="passing-score"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    % mínimo de aprobación
                  </label>
                  <input
                    id="passing-score"
                    name="passing_score"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue="70"
                    disabled={isPending}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="max-attempts"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Máximo de intentos
                  </label>
                  <input
                    id="max-attempts"
                    name="max_attempts"
                    type="number"
                    min="1"
                    max="5"
                    defaultValue="3"
                    disabled={isPending}
                    className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
                  />
                </div>
              </>
            )}

            {/* Toggle obligatorio — solo para video y pdf */}
            {(selectedType === 'video' || selectedType === 'pdf') && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-[#1A1A2E]">
                  Obligatorio
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_required"
                    value="true"
                    defaultChecked
                    disabled={isPending}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-muted peer-checked:bg-[#2B4FA0] rounded-full transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"/>
                </label>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedType(null)}
                disabled={isPending}
                className="flex-1 h-10 rounded-lg border text-sm font-medium text-muted-foreground hover:bg-[#F5F5F5] transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 h-10 rounded-lg bg-[#2B4FA0] text-white text-sm font-semibold hover:bg-[#2B4FA0]/90 transition-colors disabled:opacity-50"
              >
                {isPending ? 'Creando...' : 'Agregar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}