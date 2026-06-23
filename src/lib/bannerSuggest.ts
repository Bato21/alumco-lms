// Sugiere un banner de la galería a partir del título del curso.
// Cada banner tiene palabras clave asociadas; se normaliza el título
// (minúsculas, sin tildes) y se cuenta cuántas claves aparecen. Gana el
// banner con más coincidencias; si no hay ninguna, cae a "general".

import { BANNER_GALLERY, type GalleryBanner } from './bannerGallery'

// Palabras clave por id de banner (en minúsculas y SIN tildes).
const BANNER_KEYWORDS: Record<string, string[]> = {
  seguridad: [
    'extintor', 'incendio', 'fuego', 'emergencia', 'evacuacion', 'prevencion',
    'riesgo', 'seguridad', 'accidente', 'caida', 'caidas', 'protocolo',
    'sismo', 'terremoto', 'epp', 'ergonomia',
  ],
  salud: [
    'salud', 'clinico', 'clinica', 'paciente', 'enfermeria', 'enfermera',
    'signos', 'vitales', 'medicamento', 'medicacion', 'herida', 'heridas',
    'curacion', 'presion', 'glucosa', 'auxilios', 'rcp', 'kinesiologia',
    'rehabilitacion', 'terapia', 'fisioterapia', 'oxigeno', 'ulcera', 'ulceras',
  ],
  nutricion: [
    'nutricion', 'nutricional', 'alimentacion', 'alimento', 'alimentos',
    'comida', 'dieta', 'hidratacion', 'deglucion', 'menu',
  ],
  cuidado: [
    'cuidado', 'cuidados', 'adulto', 'mayor', 'mayores', 'higiene', 'aseo',
    'movilizacion', 'acompanamiento', 'bano', 'demencia', 'alzheimer',
    'geriatria', 'geriatrico', 'mascota', 'mascotas', 'confort', 'bienestar',
  ],
  induccion: [
    'induccion', 'bienvenida', 'onboarding', 'introduccion', 'inicio',
    'presentacion', 'institucional', 'organizacion', 'eleam', 'ong', 'mision',
    'valores',
  ],
  general: [
    'capacitacion', 'curso', 'general', 'gestion', 'administracion',
  ],
}

const FALLBACK_ID = 'general'

/** Quita tildes y pasa a minúsculas. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // diacríticos (tildes)
    .replace(/[^a-z0-9\s]/g, ' ')    // signos -> espacio
}

export interface BannerSuggestion {
  banner: GalleryBanner
  /** Cantidad de palabras clave que coincidieron (0 = solo fallback). */
  score: number
  /** Palabras del título que dispararon la sugerencia. */
  matched: string[]
}

/**
 * Devuelve el banner sugerido para un título, o null si el título está vacío.
 * Siempre sugiere algo (cae a "general") cuando hay texto pero sin coincidencias.
 */
export function suggestBanner(title: string): BannerSuggestion | null {
  const norm = normalize(title).trim()
  if (!norm) return null

  let best: { id: string; score: number; matched: string[] } | null = null

  for (const banner of BANNER_GALLERY) {
    const keywords = BANNER_KEYWORDS[banner.id] ?? []
    const matched: string[] = []
    for (const kw of keywords) {
      // Coincidencia por palabra completa o como raíz dentro del título.
      const re = new RegExp(`\\b${kw}`, 'i')
      if (re.test(norm)) matched.push(kw)
    }
    const score = matched.length
    if (score > 0 && (!best || score > best.score)) {
      best = { id: banner.id, score, matched }
    }
  }

  const chosenId = best?.id ?? FALLBACK_ID
  const banner = BANNER_GALLERY.find((b) => b.id === chosenId)!
  return {
    banner,
    score: best?.score ?? 0,
    matched: best?.matched ?? [],
  }
}
