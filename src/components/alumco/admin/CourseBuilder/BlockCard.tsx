'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { type ModuleBlock } from './CourseBuilder'

interface BlockCardProps {
  module: ModuleBlock
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

// ── Configuración visual por tipo ──────────────────────────

const typeConfig = {
  video: {
    label: 'Video',
    bgColor: 'bg-[#E6F1FB]',
    textColor: 'text-[#0C447C]',
    iconColor: '#185FA5',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    ),
  },
  pdf: {
    label: 'PDF',
    bgColor: 'bg-[#FAECE7]',
    textColor: 'text-[#712B13]',
    iconColor: '#993C1D',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  quiz: {
    label: 'Evaluación',
    bgColor: 'bg-[#EAF3DE]',
    textColor: 'text-[#27500A]',
    iconColor: '#3B6D11',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  slides: {
    label: 'Presentación',
    bgColor: 'bg-[#EEEDFE]',
    textColor: 'text-[#3C3489]',
    iconColor: '#534AB7',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
}

export function BlockCard({
  module,
  isSelected,
  onSelect,
  onDelete,
}: BlockCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  const config = typeConfig[module.content_type] ?? typeConfig.video

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl border transition-all ${
        isSelected
          ? 'border-[#2B4FA0] ring-1 ring-[#2B4FA0]/20'
          : 'border-border hover:border-[#2B4FA0]/40'
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-2 lg:gap-3 p-3 lg:p-4">

        {/* Handle de arrastre - 48x48px en mobile */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0 p-2 lg:p-1 min-h-[48px] min-w-[48px] lg:min-h-0 lg:min-w-0 flex items-center justify-center"
          aria-label="Arrastrar para reordenar"
        >
          <svg className="h-5 w-5 lg:h-5 lg:w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="9" cy="6" r="1.5"/>
            <circle cx="15" cy="6" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/>
            <circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="18" r="1.5"/>
            <circle cx="15" cy="18" r="1.5"/>
          </svg>
        </button>

        {/* Ícono de tipo */}
        <div
          className={`h-9 w-9 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}
          style={{ color: config.iconColor }}
        >
          {config.icon}
        </div>

        {/* Info del bloque */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${config.bgColor} ${config.textColor}`}>
              {config.label}
            </span>
            {!module.is_required && (
              <span className="text-xs text-muted-foreground">Opcional</span>
            )}
          </div>
          <p className="font-medium text-[#1A1A2E] truncate text-sm">
            {module.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {module.content_type === 'video' && module.duration_mins
              ? `${module.duration_mins} min`
              : module.content_type === 'quiz' && module.quiz
              ? `${module.quiz.max_attempts} intentos · ${module.quiz.passing_score}% aprobación`
              : null}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 lg:gap-2 shrink-0">
          {/* Botón editar */}
          <button
            onClick={onSelect}
            className="p-2 lg:p-2 rounded-lg hover:bg-[#F5F5F5] text-muted-foreground hover:text-[#2B4FA0] transition-colors min-h-[44px] min-w-[44px] lg:min-h-[36px] lg:min-w-[36px] flex items-center justify-center"
            aria-label={`Editar ${module.title}`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>

          {/* Botón eliminar */}
          <button
            onClick={onDelete}
            className="p-2 lg:p-2 rounded-lg hover:bg-[#FAECE7] text-muted-foreground hover:text-[#E74C3C] transition-colors min-h-[44px] min-w-[44px] lg:min-h-[36px] lg:min-w-[36px] flex items-center justify-center"
            aria-label={`Eliminar ${module.title}`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/>
              <path d="M14 11v6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
