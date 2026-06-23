// Galería de banners predefinidos para cursos.
// Las imágenes viven en /public/banners (fotos reales de Unsplash, licencia
// libre). El equipo puede reemplazarlas por fotos propias manteniendo el
// mismo nombre de archivo.

export interface GalleryBanner {
  id: string
  label: string
  src: string
}

export const BANNER_GALLERY: GalleryBanner[] = [
  { id: 'cuidado', label: 'Cuidado', src: '/banners/cuidado.jpg' },
  { id: 'salud', label: 'Salud clínica', src: '/banners/salud.jpg' },
  { id: 'seguridad', label: 'Seguridad', src: '/banners/seguridad.jpg' },
  { id: 'induccion', label: 'Inducción', src: '/banners/induccion.jpg' },
  { id: 'nutricion', label: 'Nutrición', src: '/banners/nutricion.jpg' },
  { id: 'general', label: 'Capacitación', src: '/banners/general.jpg' },
]
