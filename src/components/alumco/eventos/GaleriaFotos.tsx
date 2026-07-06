'use client'

// Galería de fotos del evento. El bucket `event-photos` es PRIVADO (fotos de
// residentes = dato sensible, Ley 21.719): las páginas server resuelven una
// signed URL por foto antes de renderizar y este componente solo la muestra.

import { useState, useTransition } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { uploadEventPhotoAction, deleteEventPhotoAction } from '@/lib/actions/events'
import { Icono } from '@/components/alumco/ds'
import type { EventPhoto } from '@/lib/types/database'

export type FotoConUrl = EventPhoto & { signedUrl: string | null }

export function GaleriaFotos({ eventId, photos, canUpload, isAdmin, currentUserId }: {
  eventId: string
  photos: FotoConUrl[]
  canUpload: boolean
  isAdmin: boolean
  currentUserId: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // Foto abierta en el lightbox (preview grande)
  const [preview, setPreview] = useState<FotoConUrl | null>(null)
  const [bajando, setBajando] = useState(false)

  // Descarga forzada: el bucket es privado y la signed URL es cross-origin,
  // así que fetch → blob → <a download> en vez de confiar en el atributo.
  async function descargar(foto: FotoConUrl) {
    if (!foto.signedUrl) return
    setBajando(true)
    try {
      const res = await fetch(foto.signedUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = foto.image_url.split('/').pop() || `foto-${foto.id}.jpg`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      window.open(foto.signedUrl, '_blank', 'noopener')
    } finally {
      setBajando(false)
    }
  }

  function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    setError(null)
    startTransition(async () => {
      const res = await uploadEventPhotoAction(eventId, formData)
      if (res.error) setError(res.error)
      else form.reset()
    })
  }

  function onDelete(photoId: string) {
    setError(null)
    startTransition(async () => {
      const res = await deleteEventPhotoAction(photoId)
      if (res.error) setError(res.error)
    })
  }

  return (
    <section className="card card-pad col entra" style={{ gap: 16 }}>
      <h2 style={{ fontSize: 16.5 }}>Galería</h2>

      {photos.length === 0 ? (
        <p className="texto-s silencio">Aún no hay fotos de este evento.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map(p => (
            <figure
              key={p.id}
              className="col"
              style={{ gap: 0, overflow: 'hidden', borderRadius: 'var(--radio-m)', border: '1px solid var(--arena-200)', background: 'var(--blanco)' }}
            >
              <div className="group relative" style={{ background: 'var(--arena-100)' }}>
                {p.signedUrl ? (
                  <button
                    type="button"
                    onClick={() => setPreview(p)}
                    aria-label={`Ver foto${p.caption ? `: ${p.caption}` : ''} más grande`}
                    style={{ display: 'block', width: '100%', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.signedUrl}
                      alt={p.caption ?? 'Foto del evento'}
                      style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }}
                    />
                  </button>
                ) : (
                  <div style={{ width: '100%', aspectRatio: '4 / 3' }} aria-hidden="true" />
                )}
                {(isAdmin || p.uploaded_by === currentUserId) && (
                  <button
                    type="button"
                    onClick={() => onDelete(p.id)}
                    disabled={pending}
                    className="opacity-0 transition group-hover:opacity-100"
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      border: 'none',
                      background: 'rgba(0,0,0,0.55)',
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    aria-label="Eliminar foto"
                  >
                    <Icono n="basura" s={16} />
                  </button>
                )}
              </div>
              {p.caption && (
                <figcaption className="texto-s silencio-3" style={{ padding: '9px 12px' }}>
                  {p.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      {canUpload && (
        <form
          onSubmit={onUpload}
          className="fila"
          style={{ gap: 10, flexWrap: 'wrap', borderTop: '1px solid var(--arena-200)', paddingTop: 16 }}
        >
          <input
            type="file"
            name="file"
            required
            disabled={pending}
            accept="image/jpeg,image/png,image/webp"
            className="input-archivo"
            aria-label="Foto"
          />
          <input
            name="caption"
            placeholder="Descripción (opcional)"
            maxLength={200}
            disabled={pending}
            className="input"
            style={{ flex: 1, minWidth: 180 }}
            aria-label="Descripción"
          />
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Subir foto
          </button>
        </form>
      )}

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="fila"
          style={{ gap: 10, padding: '12px 14px', borderRadius: 'var(--radio-m)', background: 'var(--peligro-bg)', color: 'var(--peligro)', border: '2px solid var(--peligro)', boxShadow: '3px 3px 0 var(--peligro)', fontSize: 14.5, fontWeight: 600 }}
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {preview && preview.signedUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80"
          role="dialog"
          aria-modal="true"
          aria-label="Vista de la foto"
          onClick={(e) => { if (e.target === e.currentTarget) setPreview(null) }}
        >
          <div className="col" style={{ gap: 12, maxWidth: '92vw', maxHeight: '92vh', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.signedUrl}
              alt={preview.caption ?? 'Foto del evento'}
              style={{ maxWidth: '92vw', maxHeight: '78vh', objectFit: 'contain', borderRadius: 'var(--radio-m)' }}
            />
            {preview.caption && (
              <p style={{ color: '#fff', fontSize: 14.5, textAlign: 'center' }}>{preview.caption}</p>
            )}
            <div className="fila" style={{ gap: 10 }}>
              <button
                type="button"
                onClick={() => descargar(preview)}
                disabled={bajando}
                className="btn btn-primary btn-sm"
              >
                <Icono n="descargar" s={16} /> {bajando ? 'Descargando…' : 'Descargar'}
              </button>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="btn btn-sm"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
