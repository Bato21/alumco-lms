import Link from 'next/link'
import type { Module } from '@/lib/types/database'

interface ModuleIndexProps {
  modules: Module[]
  currentModuleId: string
  completedModuleIds: string[]
  courseId: string
}

export function ModuleIndex({
  modules,
  currentModuleId,
  completedModuleIds,
  courseId,
}: ModuleIndexProps) {
  const getModuleStatus = (module: Module, index: number): 'completed' | 'active' | 'available' | 'locked' => {
    if (completedModuleIds.includes(module.id)) {
      return 'completed'
    }
    if (module.id === currentModuleId) {
      return 'active'
    }
    // First module is always available, others need previous completed
    if (index === 0 || completedModuleIds.includes(modules[index - 1]?.id)) {
      return 'available'
    }
    return 'locked'
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
            <path d="m9 9 6 3-6 3V9z" />
          </svg>
        )
      case 'pdf':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
          </svg>
        )
      case 'slides':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
          </svg>
        )
      case 'quiz':
        return (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        )
      default:
        return null
    }
  }

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video'
      case 'pdf':
        return 'PDF'
      case 'slides':
        return 'Presentación'
      case 'quiz':
        return 'Evaluación'
      default:
        return type
    }
  }

  return (
    <div className="bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] overflow-hidden">
      <div className="p-4 border-b border-[var(--md-surface-container)]">
        <h3 className="font-semibold text-[var(--md-on-surface)]">Contenido del curso</h3>
        <p className="text-sm text-[var(--md-on-surface-variant)] mt-1">
          {modules.length} módulos
        </p>
      </div>

      <div className="divide-y divide-[var(--md-surface-container)]">
        {modules.map((module, index) => {
          const status = getModuleStatus(module, index)
          const isClickable = status !== 'locked'

          const content = (
            <div
              className={`
                p-4 min-h-[48px] flex items-start gap-3 transition-colors
                ${status === 'active'
                  ? 'bg-[var(--md-primary-container)]'
                  : status === 'completed'
                    ? 'bg-[var(--md-surface-container-low)]'
                    : status === 'locked'
                      ? 'opacity-50'
                      : 'hover:bg-[var(--md-surface-container-low)]'
                }
              `}
            >
              {/* Status Icon */}
              <div className="shrink-0 mt-0.5">
                {status === 'completed' ? (
                  <div className="w-6 h-6 rounded-full bg-[#27AE60] text-white flex items-center justify-center">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  </div>
                ) : status === 'active' ? (
                  <div className="w-6 h-6 rounded-full bg-[#2B4FA0] text-white flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </div>
                ) : status === 'locked' ? (
                  <div className="w-6 h-6 rounded-full bg-[var(--md-surface-container)] text-[var(--md-outline)] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </div>
                )}
              </div>

              {/* Module Info */}
              <div className="flex-1 min-w-0">
                <p className={`
                  font-medium text-sm truncate
                  ${status === 'active'
                    ? 'text-[var(--md-on-primary-container)]'
                    : 'text-[var(--md-on-surface)]'
                  }
                `}>
                  {module.title}
                </p>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`
                    inline-flex items-center gap-1 text-xs
                    ${status === 'active'
                      ? 'text-[var(--md-on-primary-container)]/70'
                      : 'text-[var(--md-on-surface-variant)]'
                    }
                  `}>
                    {getContentTypeIcon(module.content_type)}
                    {getContentTypeLabel(module.content_type)}
                  </span>

                  {module.duration_mins && (
                    <span className={`
                      text-xs
                      ${status === 'active'
                        ? 'text-[var(--md-on-primary-container)]/70'
                        : 'text-[var(--md-on-surface-variant)]'
                      }
                    `}>
                      {module.duration_mins} min
                    </span>
                  )}
                </div>
              </div>
            </div>
          )

          if (isClickable) {
            return (
              <Link
                key={module.id}
                href={`/cursos/${courseId}/modulos/${module.id}`}
                className="block focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#2B4FA0]"
              >
                {content}
              </Link>
            )
          }

          return <div key={module.id}>{content}</div>
        })}
      </div>
    </div>
  )
}
