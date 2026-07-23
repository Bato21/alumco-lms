/**
 * "La gota de Kimün" — dibujo lineal que se traza progresivamente con el avance
 * del colaborador. La identidad Alumco (KimünKo = conocimiento + agua) dibujada
 * en cinco capas: ondas → gota → brillo → salpicadura → destellos.
 *
 * `avance` (0–100) reparte el trazado entre las 5 capas: cada curso completado
 * "entinta" una parte del dibujo. El boceto a lápiz queda de guía por debajo.
 */
interface DibujoGotaProps {
  /** Avance del recorrido, 0–100. */
  avance: number
  /** Mostrar el boceto guía a lápiz por detrás del trazo. */
  mostrarBoceto?: boolean
  /** Color de la tinta (líneas principales). */
  tinta?: string
  /** Color de los acentos (salpicadura y destellos). */
  sol?: string
  /** Color del boceto guía. */
  guia?: string
}

export function DibujoGota({
  avance,
  mostrarBoceto = true,
  tinta = 'var(--azul-800)',
  sol = 'var(--ambar)',
  guia = '#d8cfb8',
}: DibujoGotaProps) {
  const a = Math.max(0, Math.min(100, avance))
  // 5 capas: repartimos el avance en tramos de 20%.
  const u = (a / 100) * 5
  const frac = (i: number) => Math.max(0, Math.min(1, u - i))
  // stroke-dashoffset: 1 = oculto, 0 = trazado completo.
  const d = [0, 1, 2, 3, 4].map((i) => +(1 - frac(i)).toFixed(3)) as [number, number, number, number, number]
  const boceto = mostrarBoceto ? 1 : 0

  const tr = (offset: number, delay = 0) => ({
    strokeDashoffset: offset,
    transition: `stroke-dashoffset 0.9s ease ${delay}s`,
  })

  return (
    <svg
      viewBox="0 0 420 280"
      style={{ display: 'block', width: '100%', height: 'auto' }}
      role="img"
      aria-label={`La gota de Kimün — dibujo en progreso, ${Math.round(a)}% trazado`}
    >
      {/* Boceto a lápiz (guía) */}
      <g fill="none" stroke={guia} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="3 6" opacity={boceto}>
        <ellipse cx="210" cy="214" rx="150" ry="26" />
        <ellipse cx="210" cy="214" rx="104" ry="17" />
        <path d="M210 46 C 210 46 146 128 146 168 C 146 205 174 230 210 230 C 246 230 274 205 274 168 C 274 128 210 46 210 46 Z" />
        <path d="M184 152 C 176 166 176 184 186 196" />
        <path d="M118 200 Q 96 178 106 152 M302 200 Q 324 178 314 152" />
        <path d="M84 96 v16 M76 104 h16 M336 96 v16 M328 104 h16 M210 18 v14 M203 25 h14" />
      </g>

      {/* Capas de tinta (azul): ondas → gota → brillo */}
      <g fill="none" stroke={tinta} strokeWidth={3} strokeLinecap="round">
        <ellipse cx="210" cy="214" rx="150" ry="26" pathLength={1} strokeDasharray={1} style={tr(d[0])} />
        <ellipse cx="210" cy="214" rx="104" ry="17" pathLength={1} strokeDasharray={1} style={tr(d[0], 0.15)} />
        <path
          pathLength={1}
          strokeDasharray={1}
          style={tr(d[1])}
          d="M210 46 C 210 46 146 128 146 168 C 146 205 174 230 210 230 C 246 230 274 205 274 168 C 274 128 210 46 210 46 Z"
        />
        <path pathLength={1} strokeDasharray={1} style={tr(d[2])} strokeWidth={4} d="M184 152 C 176 166 176 184 186 196" />
      </g>

      {/* Acentos ámbar: salpicadura → destellos */}
      <g fill="none" stroke={sol} strokeWidth={3} strokeLinecap="round">
        <path pathLength={1} strokeDasharray={1} style={tr(d[3])} d="M118 200 Q 96 178 106 152" />
        <path pathLength={1} strokeDasharray={1} style={tr(d[3], 0.15)} d="M302 200 Q 324 178 314 152" />
        <path
          pathLength={1}
          strokeDasharray={1}
          style={tr(d[4])}
          d="M84 96 v16 M76 104 h16 M336 96 v16 M328 104 h16 M210 18 v14 M203 25 h14"
        />
      </g>
    </svg>
  )
}
