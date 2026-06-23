import { getCourseGradient } from '@/lib/utils'

/**
 * Capa de imagen para el banner de un curso.
 *
 * La foto ocupa todo el banner y debajo se dibuja una línea fina con el
 * degradado de las áreas del curso (getCourseGradient): un solo color si es
 * un área, o varios combinados si apunta a varias. Un velo oscuro inferior
 * mantiene legibles el título y los badges superpuestos.
 *
 * Si el curso no tiene imagen, no renderiza nada y el banner se ve solo con
 * el degradado del contenedor padre, como antes.
 */
interface CourseBannerImageProps {
  thumbnailUrl?: string | null
  /** Áreas del curso, para el color de la línea inferior. */
  targetAreas: string[]
  /** Grosor de la línea de color en px. */
  lineHeight?: number
}

export function CourseBannerImage({
  thumbnailUrl,
  targetAreas,
  lineHeight = 6,
}: CourseBannerImageProps) {
  if (!thumbnailUrl) return null

  const gradient = getCourseGradient(targetAreas ?? [])

  return (
    <>
      {/* Foto a pantalla completa del banner */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
        {/* Velo para legibilidad del texto superpuesto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
      </div>

      {/* Línea de color con el degradado de áreas */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{ height: lineHeight, background: gradient }}
        aria-hidden="true"
      />
    </>
  )
}
