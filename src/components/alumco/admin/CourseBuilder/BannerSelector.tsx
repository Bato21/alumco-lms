'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { CheckCircle2, ImageIcon, Loader2, Sparkles, Upload, X } from 'lucide-react'
import {
  updateCourseBannerAction,
  uploadCourseBannerAction,
} from '@/lib/actions/courses'
import { BANNER_GALLERY } from '@/lib/bannerGallery'
import { suggestBanner } from '@/lib/bannerSuggest'
import { getCourseGradient } from '@/lib/utils'

interface BannerSelectorProps {
  courseId: string
  /** Áreas objetivo actuales, para pintar la línea de degradado en la vista previa. */
  targetAreas: string[]
  initialThumbnailUrl: string | null
  /** Título del curso, para sugerir un banner relacionado. */
  courseTitle: string
}

export function BannerSelector({
  courseId,
  targetAreas,
  initialThumbnailUrl,
  courseTitle,
}: BannerSelectorProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initialThumbnailUrl)
  const [tab, setTab] = useState<'galeria' | 'subir'>('galeria')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const gradient = getCourseGradient(targetAreas ?? [])
  const suggestion = useMemo(() => suggestBanner(courseTitle), [courseTitle])

  function flashSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function selectGalleryImage(src: string) {
    setError(null)
    startTransition(async () => {
      const result = await updateCourseBannerAction(courseId, src)
      if (result.error) {
        setError(result.error)
      } else {
        setThumbnailUrl(src)
        flashSaved()
      }
    })
  }

  function removeImage() {
    setError(null)
    startTransition(async () => {
      const result = await updateCourseBannerAction(courseId, null)
      if (result.error) {
        setError(result.error)
      } else {
        setThumbnailUrl(null)
        flashSaved()
      }
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const fd = new FormData()
    fd.set('file', file)
    startTransition(async () => {
      const result = await uploadCourseBannerAction(courseId, fd)
      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        setThumbnailUrl(result.url)
        flashSaved()
      }
      if (fileInputRef.current) fileInputRef.current.value = ''
    })
  }

  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-[#1A1A2E] text-sm">Banner del curso</h2>
          <p className="text-[10px] text-[#6B7280] mt-0.5">
            El marco usa el color de las áreas.
          </p>
        </div>
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2B4FA0]" aria-hidden="true" />}
        {!isPending && saved && <CheckCircle2 className="h-3.5 w-3.5 text-[var(--ok)]" aria-hidden="true" />}
      </div>

      {/* Vista previa: foto completa + línea de color con el degradado */}
      <div
        className="relative h-24 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ background: gradient }}
      >
        {thumbnailUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt="Banner del curso"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{ height: 5, background: gradient }}
            />
          </>
        ) : (
          <span className="relative text-[10px] font-semibold text-white/80 uppercase tracking-wider">
            Solo degradado
          </span>
        )}
      </div>

      {/* Sugerencia automática según el título */}
      {suggestion && suggestion.banner.src !== thumbnailUrl && (
        <div className="rounded-lg border border-[#2B4FA0]/30 bg-[#F0F4FF] p-2.5 space-y-2">
          <p className="text-[10px] font-semibold text-[#2B4FA0] flex items-center gap-1">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {suggestion.score > 0 ? 'Sugerida por el título' : 'Sugerencia por defecto'}
          </p>
          <div className="flex items-center gap-2">
            <div className="relative w-14 h-9 rounded overflow-hidden shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={suggestion.banner.src}
                alt={suggestion.banner.label}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <span className="flex-1 text-xs font-medium text-[#1A1A2E] truncate">
              {suggestion.banner.label}
            </span>
            <button
              type="button"
              onClick={() => selectGalleryImage(suggestion.banner.src)}
              disabled={isPending}
              className="px-2.5 h-7 rounded-md bg-[#2B4FA0] text-white text-[11px] font-semibold hover:bg-[#1A2F6B] transition-colors disabled:opacity-50 shrink-0"
            >
              Usar
            </button>
          </div>
        </div>
      )}

      {thumbnailUrl && (
        <button
          type="button"
          onClick={removeImage}
          disabled={isPending}
          className="w-full h-8 rounded-lg border border-slate-200 text-[#6B7280] text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Quitar imagen
        </button>
      )}

      {/* Tabs galería / subir */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('galeria')}
          className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            tab === 'galeria'
              ? 'bg-[#2B4FA0] text-white border-[#2B4FA0]'
              : 'bg-white text-[#1A1A2E] border-slate-200 hover:border-[#2B4FA0]/40'
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
          Galería
        </button>
        <button
          type="button"
          onClick={() => setTab('subir')}
          className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            tab === 'subir'
              ? 'bg-[#2B4FA0] text-white border-[#2B4FA0]'
              : 'bg-white text-[#1A1A2E] border-slate-200 hover:border-[#2B4FA0]/40'
          }`}
        >
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
          Subir
        </button>
      </div>

      {tab === 'galeria' ? (
        <div className="grid grid-cols-2 gap-2">
          {BANNER_GALLERY.map((banner) => {
            const isActive = thumbnailUrl === banner.src
            return (
              <button
                key={banner.id}
                type="button"
                onClick={() => selectGalleryImage(banner.src)}
                disabled={isPending}
                className={`relative aspect-video rounded-md overflow-hidden border-2 transition-colors disabled:opacity-60 ${
                  isActive ? 'border-[#2B4FA0]' : 'border-transparent hover:border-[#2B4FA0]/40'
                }`}
                title={banner.label}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.src}
                  alt={banner.label}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {isActive && (
                  <span className="absolute inset-0 bg-[#2B4FA0]/30 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-white" aria-hidden="true" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="w-full h-20 rounded-lg border-2 border-dashed border-slate-300 text-[#6B7280] text-xs font-medium hover:border-[#2B4FA0] hover:text-[#2B4FA0] transition-colors disabled:opacity-50 flex flex-col items-center justify-center gap-1"
          >
            <Upload className="h-5 w-5" aria-hidden="true" />
            Subir imagen (PNG, JPG o WebP · máx 5 MB)
          </button>
        </div>
      )}

      {error && <p className="text-[11px] text-[var(--peligro)]">{error}</p>}
    </div>
  )
}
