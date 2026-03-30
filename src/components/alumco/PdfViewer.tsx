'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTransition } from 'react'
import { markModuleCompleteAction } from '@/lib/actions/progress'

interface PdfViewerProps {
  pdfUrl: string
  moduleId: string
  courseId: string
  isCompleted: boolean
  moduleTitle: string
}

export function PdfViewer({
  pdfUrl,
  moduleId,
  courseId,
  isCompleted,
  moduleTitle,
}: PdfViewerProps) {
  const [isCompletePending, startCompleteTransition] = useTransition()
  const [localCompleted, setLocalCompleted] = useState(isCompleted)

  // Sync with prop changes
  useEffect(() => {
    setLocalCompleted(isCompleted)
  }, [isCompleted])

  const handleMarkComplete = useCallback(() => {
    if (localCompleted || isCompletePending) return

    startCompleteTransition(async () => {
      const result = await markModuleCompleteAction(moduleId, courseId)
      if (result.success) {
        setLocalCompleted(true)
      }
    })
  }, [localCompleted, isCompletePending, moduleId, courseId])

  const handleDownload = () => {
    if (!pdfUrl) return

    // Open PDF in new tab for download/viewing
    window.open(pdfUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-4">
      {/* PDF Viewer */}
      <div className="bg-[var(--md-surface-container-low)] rounded-lg overflow-hidden min-h-[600px]">
        {pdfUrl ? (
          <iframe
            src={`${pdfUrl}#view=FitH`}
            title={moduleTitle}
            className="w-full min-h-[600px]"
            style={{ border: 'none' }}
          />
        ) : (
          <div className="w-full min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-20 h-20 text-[var(--md-primary)] mx-auto mb-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <path d="M9 15l2 2 4-4" />
              </svg>
              <h3 className="text-lg font-semibold text-[var(--md-on-surface)] mb-2">
                Documento PDF
              </h3>
              <p className="text-[var(--md-on-surface-variant)]">
                El documento no está disponible.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        {pdfUrl && (
          <button
            onClick={handleDownload}
            className="
              inline-flex items-center gap-2 px-5 py-2.5
              bg-[var(--md-surface-container-high)] text-[var(--md-primary)]
              font-semibold rounded-lg
              hover:bg-[var(--md-surface-container-highest)]
              transition-colors
            "
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Descargar PDF
          </button>
        )}

        {!pdfUrl && <div />}

        {!localCompleted ? (
          <button
            onClick={handleMarkComplete}
            disabled={isCompletePending}
            className="
              inline-flex items-center gap-2 px-6 py-2.5
              bg-[#27AE60] text-white font-semibold
              rounded-lg hover:bg-[#27AE60]/90
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              shadow-md shadow-[#27AE60]/20
            "
          >
            {isCompletePending ? (
              <>
                <svg
                  className="w-5 h-5 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                Marcar como leído
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[#27AE60] font-medium px-4 py-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            Módulo completado
          </div>
        )}
      </div>
    </div>
  )
}
