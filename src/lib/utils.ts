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

// ── Progreso secuencial de módulos ────────────────────────
// Un módulo se abre solo cuando el anterior está completo. La UI ya lo pintaba
// así, pero la regla vive acá para que el servidor use exactamente la misma:
// pintar un candado no impide que alguien llame la server action a mano.

/** Estado de un módulo para el trabajador que lo mira. */
export type ModuleGate = 'completado' | 'disponible' | 'bloqueado'

/**
 * `modules` debe venir ordenado por `order_index`. Devuelve el estado de cada
 * módulo, indexado por id.
 */
export function computeModuleGates<T extends { id: string }>(
  modules: T[],
  completedModuleIds: string[]
): Map<string, ModuleGate> {
  const completados = new Set(completedModuleIds)
  const estados = new Map<string, ModuleGate>()

  // El primero siempre está disponible; el resto hereda del anterior. Un
  // módulo ya completado nunca se vuelve a bloquear, aunque se reabra el curso.
  let anteriorCompleto = true
  for (const m of modules) {
    if (completados.has(m.id)) estados.set(m.id, 'completado')
    else if (anteriorCompleto) estados.set(m.id, 'disponible')
    else estados.set(m.id, 'bloqueado')
    anteriorCompleto = completados.has(m.id)
  }

  return estados
}

/**
 * Atajo para el caso de un solo módulo (el que usan las server actions).
 *
 * Un `moduleId` que no está en `modules` devuelve false, no true: si el módulo
 * no pertenece a este curso, no hay nada que desbloquear. Las actions ya
 * validan la cadena módulo → curso por separado, pero esta función no puede
 * dar por buena una entrada que no reconoce.
 */
export function isModuleUnlocked<T extends { id: string }>(
  modules: T[],
  completedModuleIds: string[],
  moduleId: string
): boolean {
  const gate = computeModuleGates(modules, completedModuleIds).get(moduleId)
  return gate !== undefined && gate !== 'bloqueado'
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

const DEFAULT_GRADIENT = 'linear-gradient(160deg, #1A2F6B 0%, #2B4FA0 100%)'

// Todos los gradientes parten del navy de marca y terminan en el color del
// área: identidad por área sin romper la paleta corporativa. Con varias
// áreas se usa la primera como color dominante.
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

  const hex = colors[0]
  const darker = darkenHex(hex, 25)
  return `linear-gradient(160deg, #1A2F6B 0%, ${darker} 65%, ${hex} 100%)`
}

function darkenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (num >> 16) - Math.round(255 * percent / 100))
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * percent / 100))
  const b = Math.max(0, (num & 0xff) - Math.round(255 * percent / 100))
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}