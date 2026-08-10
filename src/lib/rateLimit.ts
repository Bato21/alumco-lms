import { headers } from 'next/headers'

/**
 * Rate limiting en memoria del proceso.
 *
 * LIMITACIÓN CONOCIDA: en Vercel cada instancia serverless tiene su propio
 * Map, así que el límite real es `limit × instancias activas`. Para el tráfico
 * de Alumco (una ONG con dos sedes) eso alcanza: frena el scraping por script
 * desde una IP, que es el escenario que importa en la ruta pública de
 * verificación. Si algún día hace falta un límite exacto y compartido, el
 * reemplazo es @upstash/ratelimit — la firma de `checkRateLimit` no cambia.
 */

interface Bucket {
  /** Timestamps (ms) de los hits dentro de la ventana. */
  hits: number[]
}

const buckets = new Map<string, Bucket>()

/** Cada cuántas llamadas se barren los buckets vencidos. */
const SWEEP_EVERY = 500
let callsSinceSweep = 0

function sweep(now: number, windowMs: number) {
  for (const [key, bucket] of buckets) {
    const alive = bucket.hits.filter((t) => now - t < windowMs)
    if (alive.length === 0) buckets.delete(key)
    else bucket.hits = alive
  }
}

export interface RateLimitResult {
  ok: boolean
  /** Intentos restantes en la ventana actual. */
  remaining: number
  /** Segundos hasta que se libere un intento (solo cuando ok = false). */
  retryAfter: number
}

/**
 * Ventana deslizante simple. `key` debe incluir el scope y el identificador,
 * ej: `verify:1.2.3.4`.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()

  if (++callsSinceSweep >= SWEEP_EVERY) {
    callsSinceSweep = 0
    sweep(now, windowMs)
  }

  const bucket = buckets.get(key) ?? { hits: [] }
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs)

  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket)
    const oldest = bucket.hits[0]
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((windowMs - (now - oldest)) / 1000),
    }
  }

  bucket.hits.push(now)
  buckets.set(key, bucket)
  return { ok: true, remaining: limit - bucket.hits.length, retryAfter: 0 }
}

/**
 * IP del cliente según los headers del proxy. En Vercel `x-forwarded-for` es
 * confiable porque lo reescribe el edge; detrás de otro proxy habría que
 * revisarlo antes de confiar en él.
 *
 * Sin IP resoluble devuelve 'desconocida': todos esos requests comparten
 * bucket, que es el lado seguro (limita de más, no de menos).
 */
export async function getClientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return h.get('x-real-ip')?.trim() || 'desconocida'
}
