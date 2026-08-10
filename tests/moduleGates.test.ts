import { describe, expect, it } from 'vitest'
import { computeModuleGates, isModuleUnlocked } from '@/lib/utils'

/**
 * El candado secuencial. Esta función la usan la ficha del curso, el índice
 * lateral, la página del módulo, la del quiz y tres server actions: si acá se
 * equivoca, alguien llega al certificado sin haber abierto el contenido.
 */
const modulos = [
  { id: 'm1' },
  { id: 'm2' },
  { id: 'm3' },
  { id: 'm4' },
]

describe('computeModuleGates', () => {
  it('sin progreso: solo el primero está disponible', () => {
    const g = computeModuleGates(modulos, [])
    expect(g.get('m1')).toBe('disponible')
    expect(g.get('m2')).toBe('bloqueado')
    expect(g.get('m3')).toBe('bloqueado')
    expect(g.get('m4')).toBe('bloqueado')
  })

  it('completar uno abre exactamente el siguiente', () => {
    const g = computeModuleGates(modulos, ['m1'])
    expect(g.get('m1')).toBe('completado')
    expect(g.get('m2')).toBe('disponible')
    expect(g.get('m3')).toBe('bloqueado')
  })

  it('un módulo completado fuera de orden no abre los intermedios', () => {
    // Escenario del atacante: marcó m4 llamando la action a mano. m2 y m3
    // tienen que seguir bloqueados.
    const g = computeModuleGates(modulos, ['m1', 'm4'])
    expect(g.get('m2')).toBe('disponible')
    expect(g.get('m3')).toBe('bloqueado')
    expect(g.get('m4')).toBe('completado')
  })

  it('con todo completo, nada queda bloqueado', () => {
    const g = computeModuleGates(modulos, ['m1', 'm2', 'm3', 'm4'])
    for (const m of modulos) expect(g.get(m.id)).toBe('completado')
  })

  it('un curso sin módulos no explota', () => {
    expect(computeModuleGates([], []).size).toBe(0)
  })

  it('ignora ids de progreso que ya no existen en el curso', () => {
    // Pasa de verdad: se borra un módulo y el progreso guardado queda con su id.
    const g = computeModuleGates(modulos, ['borrado-123'])
    expect(g.get('m1')).toBe('disponible')
    expect(g.get('m2')).toBe('bloqueado')
  })
})

describe('isModuleUnlocked', () => {
  it('permite el primero siempre', () => {
    expect(isModuleUnlocked(modulos, [], 'm1')).toBe(true)
  })

  it('niega el salto al último módulo sin haber hecho nada', () => {
    expect(isModuleUnlocked(modulos, [], 'm4')).toBe(false)
  })

  it('permite un módulo ya completado (repaso)', () => {
    expect(isModuleUnlocked(modulos, ['m1', 'm2'], 'm1')).toBe(true)
  })

  it('permite justo el siguiente al último completado', () => {
    expect(isModuleUnlocked(modulos, ['m1', 'm2'], 'm3')).toBe(true)
    expect(isModuleUnlocked(modulos, ['m1', 'm2'], 'm4')).toBe(false)
  })

  it('niega un id que no pertenece al curso', () => {
    expect(isModuleUnlocked(modulos, ['m1'], 'de-otro-curso')).toBe(false)
  })
})
