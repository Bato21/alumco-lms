'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTransition } from 'react'
import { markModuleCompleteAction } from '@/lib/actions/progress'

interface VideoPlayerProps {
  videoUrl: string
  moduleId: string
  courseId: string
  isCompleted: boolean
  thumbnailUrl?: string | null
}

export function VideoPlayer({
  videoUrl,
  moduleId,
  courseId,
  isCompleted,
  thumbnailUrl,
}: VideoPlayerProps) {
  const [isCompletePending, startCompleteTransition] = useTransition()
  const [localCompleted, setLocalCompleted] = useState(isCompleted)
  const [showCompleteButton, setShowCompleteButton] = useState(true)
  const [embedUrl, setEmbedUrl] = useState<string>('')

  // Extract YouTube video ID and create embed URL
  useEffect(() => {
    const videoId = extractYouTubeId(videoUrl)
    if (videoId) {
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}?enablejsapi=1`)
    } else if (videoUrl) {
      // If it's not a YouTube URL, use it directly
      setEmbedUrl(videoUrl)
    }
  }, [videoUrl])

  const extractYouTubeId = (url: string): string | null => {
    if (!url) return null

    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
      /youtube\.com\/watch\?.*v=([^&\s]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match?.[1]) {
        return match[1]
      }
    }

    // If the URL is just an ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url
    }

    return null
  }

  const handleMarkComplete = useCallback(() => {
    if (localCompleted || isCompletePending) return

    startCompleteTransition(async () => {
      const result = await markModuleCompleteAction(moduleId, courseId)
      if (result.success) {
        setLocalCompleted(true)
        setShowCompleteButton(false)
      }
    })
  }, [localCompleted, isCompletePending, moduleId, courseId])

  // Auto-mark as complete if video is watched (simulated with a timer for now)
  // In a real implementation, you'd use YouTube IFrame API to track actual progress
  useEffect(() => {
    if (localCompleted) {
      setShowCompleteButton(false)
    }
  }, [localCompleted])

  return (
    <div className="space-y-4">
      {/* Video Container - 16:9 aspect ratio */}
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Video player"
            className="absolute inset-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-black rounded-lg flex items-center justify-center text-white">
            <div className="text-center px-4">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-white/50"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
                <path d="m9 9 6 3-6 3V9z" />
              </svg>
              <p>URL del video no válida</p>
            </div>
          </div>
        )}
      </div>

      {/* Mark as Complete Button */}
      {showCompleteButton && !localCompleted && (
        <div className="flex justify-end">
          <button
            onClick={handleMarkComplete}
            disabled={isCompletePending}
            className="
              inline-flex items-center gap-2 px-6 py-3
              bg-[#27AE60] text-white font-semibold
              rounded-lg hover:bg-[#27AE60]/90
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              shadow-md shadow-[#27AE60]/20
              min-h-[48px]
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
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                Marcar como visto
              </>
            )}
          </button>
        </div>
      )}

      {/* Completed State */}
      {localCompleted && (
        <div className="flex items-center gap-2 text-[#27AE60] font-medium">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12" />
          </svg>
          Módulo completado
        </div>
      )}
    </div>
  )
}
