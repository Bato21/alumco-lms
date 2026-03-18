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
  return sede === 'sede_1' ? 'Sede Principal' : 'Sede Secundaria'
}