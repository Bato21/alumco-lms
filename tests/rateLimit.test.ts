import { describe, expect, it } from 'vitest'
import { checkRateLimit } from '@/lib/rateLimit'

/**
 * El rate limit es lo único que separa la ruta pública de verificación de un
 * script que enumere folios. Se prueba la ventana deslizante, no el
 * almacenamiento (que es un Map por proceso, ver la nota en rateLimit.ts).
 */
describe('checkRateLimit', () => {
  it('deja pasar hasta el límite y corta el siguiente', () => {
    const key = `test-basico-${Math.random()}`
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000).ok).toBe(true)
    }
    expect(checkRateLimit(key, 3, 60_000).ok).toBe(false)
  })

  it('descuenta los intentos restantes', () => {
    const key = `test-restantes-${Math.random()}`
    expect(checkRateLimit(key, 3, 60_000).remaining).toBe(2)
    expect(checkRateLimit(key, 3, 60_000).remaining).toBe(1)
    expect(checkRateLimit(key, 3, 60_000).remaining).toBe(0)
  })

  it('informa cuántos segundos falta esperar al cortar', () => {
    const key = `test-espera-${Math.random()}`
    checkRateLimit(key, 1, 60_000)
    const bloqueado = checkRateLimit(key, 1, 60_000)
    expect(bloqueado.ok).toBe(false)
    expect(bloqueado.retryAfter).toBeGreaterThan(0)
    expect(bloqueado.retryAfter).toBeLessThanOrEqual(60)
  })

  it('aísla los buckets por clave — una IP no gasta el cupo de otra', () => {
    const a = `test-ip-a-${Math.random()}`
    const b = `test-ip-b-${Math.random()}`
    expect(checkRateLimit(a, 1, 60_000).ok).toBe(true)
    expect(checkRateLimit(a, 1, 60_000).ok).toBe(false)
    // b no fue tocada: sigue con su cupo entero.
    expect(checkRateLimit(b, 1, 60_000).ok).toBe(true)
  })

  it('libera el cupo cuando la ventana expira', async () => {
    const key = `test-ventana-${Math.random()}`
    expect(checkRateLimit(key, 1, 30).ok).toBe(true)
    expect(checkRateLimit(key, 1, 30).ok).toBe(false)

    await new Promise((r) => setTimeout(r, 45))
    expect(checkRateLimit(key, 1, 30).ok).toBe(true)
  })
})
