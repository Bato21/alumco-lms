import { describe, expect, it } from 'vitest'
import {
  isValidVerificationCode,
  normalizeVerificationCode,
} from '@/lib/certificates/verify'

/**
 * El folio es la única llave de la ruta pública de verificación. Si el regex
 * acepta de más, se abre superficie de enumeración; si acepta de menos, un
 * fiscalizador con el certificado en la mano no puede validarlo.
 */
describe('normalizeVerificationCode', () => {
  it('sube a mayúsculas lo que venga de la URL', () => {
    expect(normalizeVerificationCode('abc123def456')).toBe('ABC123DEF456')
  })

  it('tolera guiones y espacios de un código tipeado a mano', () => {
    expect(normalizeVerificationCode('ABC1-23DE F456')).toBe('ABC123DEF456')
  })

  it('no inventa caracteres cuando llega vacío', () => {
    expect(normalizeVerificationCode('')).toBe('')
  })
})

describe('isValidVerificationCode', () => {
  it('acepta un folio de 12 caracteres del alfabeto Crockford', () => {
    expect(isValidVerificationCode('0123456789AB')).toBe(true)
    expect(isValidVerificationCode('ZYXWVTSRQPNM')).toBe(true)
  })

  it('rechaza largos distintos de 12', () => {
    expect(isValidVerificationCode('0123456789A')).toBe(false)
    expect(isValidVerificationCode('0123456789ABC')).toBe(false)
    expect(isValidVerificationCode('')).toBe(false)
  })

  it('rechaza las letras ambiguas que el generador nunca produce', () => {
    // I, L, O y U quedaron fuera del alfabeto justamente para que nadie las
    // confunda con 1 y 0 al copiar un folio impreso.
    for (const letra of ['I', 'L', 'O', 'U']) {
      expect(isValidVerificationCode(`${letra}12345678901`)).toBe(false)
    }
  })

  it('rechaza intentos de inyección y comodines', () => {
    expect(isValidVerificationCode("' OR 1=1 --")).toBe(false)
    expect(isValidVerificationCode('%%%%%%%%%%%%')).toBe(false)
    expect(isValidVerificationCode('../../etc/pa')).toBe(false)
    expect(isValidVerificationCode('<script>xx()')).toBe(false)
  })

  it('rechaza minúsculas sin normalizar (el filtro va sobre el código ya normalizado)', () => {
    expect(isValidVerificationCode('abc123def456')).toBe(false)
    expect(isValidVerificationCode(normalizeVerificationCode('abc123def456'))).toBe(true)
  })
})
