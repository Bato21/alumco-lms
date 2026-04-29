// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Combina clases de Tailwind sin conflictos (ej: cn('p-4', condition && 'p-8'))
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatea fecha para mostrar en UI
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateString))
}

// Calcula edad desde fecha de nacimiento
export function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  return edad
}

// Convierte score numérico a label legible
export function scoreLabel(score: number): string {
  if (score >= 90) return 'Excelente'
  if (score >= 70) return 'Aprobado'
  if (score >= 50) return 'Insuficiente'
  return 'Reprobado'
}

// Convierte sede enum a nombre legible
export function sedeLabel(sede: 'sede_1' | 'sede_2'): string {
  return sede === 'sede_1' ? 'Sede Hualpén' : 'Sede Coyhaique'
}

// Filtra cursos según las áreas del trabajador.
// Un curso es visible si target_areas está vacío (todos) o comparte al menos un área.
// Si el trabajador no tiene áreas asignadas, solo ve cursos sin restricción de área.
export function filterCoursesByWorkerAreas<T extends { target_areas: string[] }>(
  courses: T[],
  workerAreas: string[]
): T[] {
  if (!workerAreas || workerAreas.length === 0) {
    return courses.filter(course => !course.target_areas || course.target_areas.length === 0)
  }
  return courses.filter(course => {
    if (!course.target_areas || course.target_areas.length === 0) return true
    return course.target_areas.some(area => workerAreas.includes(area))
  })
}

// Escapa wildcards `%` y `_` en patrones ilike para evitar matches no deseados.
export function escapeIlike(s: string): string {
  return s.replace(/[\\%_]/g, c => `\\${c}`)
}

// ── Colores por área de trabajo ───────────────────────────
export const AREA_COLORS: Record<string, string> = {
  'Enfermería':              '#E05252',
  'Auxiliar de enfermería':  '#E07B52',
  'Kinesiología':            '#27AE60',
  'Terapia ocupacional':     '#2A9D8F',
  'Nutrición':               '#F5A623',
  'Trabajo social':          '#7B6CF6',
  'Psicología':              '#A855B5',
  'Administración':          '#2B4FA0',
  'Dirección técnica':       '#1A2F6B',
  'Geriatría':               '#0891B2',
}

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #1A2F6B 0%, #2B4FA0 100%)'

export function getCourseGradient(targetAreas: string[]): string {
  if (!targetAreas || targetAreas.length === 0) {
    return DEFAULT_GRADIENT
  }

  const colors = targetAreas
    .map(area => AREA_COLORS[area])
    .filter(Boolean)

  if (colors.length === 0) {
    return DEFAULT_GRADIENT
  }

  if (colors.length === 1) {
    const hex = colors[0]
    const darker = darkenHex(hex, 25)
    return `linear-gradient(135deg, ${darker} 0%, ${hex} 100%)`
  }

  const stops = colors.map((color, i) => {
    const pct = Math.round((i / (colors.length - 1)) * 100)
    return `${color} ${pct}%`
  }).join(', ')

  return `linear-gradient(135deg, ${stops})`
}

function darkenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (num >> 16) - Math.round(255 * percent / 100))
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * percent / 100))
  const b = Math.max(0, (num & 0xff) - Math.round(255 * percent / 100))
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}