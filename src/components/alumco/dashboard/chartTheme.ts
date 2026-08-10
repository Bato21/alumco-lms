/**
 * Tokens de los gráficos del dashboard.
 *
 * Son los mismos valores de didasko.css, repetidos acá en hex porque Recharts
 * los usa además para calcular gradientes y medir texto, y ahí un `var(--x)`
 * llega sin resolver.  Si cambia la paleta en didasko.css, cambia acá también.
 *
 * Sobre el color: ningún gráfico de este dashboard es multi-serie, así que no
 * hay paleta categórica que validar. Cada gráfico compara magnitud con UN solo
 * tono (azul de marca) y el gauge usa los colores de estado del sistema, que
 * nunca aparecen dos a la vez y siempre van con icono + texto. Los cuatro
 * pasan contraste ≥ 3:1 contra la superficie blanca de las tarjetas.
 */

/** Superficie sobre la que se dibujan (fondo de .card). */
export const SURFACE = '#ffffff'

/** Tono único de datos: --azul-700. */
export const SERIE = '#2c4a9e'
/** Wash del área bajo la línea (~10% del tono). */
export const SERIE_WASH = 'rgba(44, 74, 158, 0.10)'
/** Pista del gauge y barras vacías: paso claro de la misma rampa (--azul-100). */
export const SERIE_PISTA = '#dde6f5'

/** Rejilla y ejes: un paso sobre la superficie, recesivos (--borde-suave). */
export const REJILLA = '#E8EDF4'
/** Texto de ejes y etiquetas (--tinta-3, AA sobre blanco). */
export const TINTA_3 = '#6e7488'
/** Texto principal (--tinta). */
export const TINTA = '#21283b'

/** Estados — reservados, nunca como "serie N". */
export const OK = '#2e7d5b'
export const AVISO = '#b45309'
export const PELIGRO = '#bb3a2e'

/** Grosor máximo de barra: el resto de la banda queda como aire. */
export const BARRA_MAX = 22

export const EJE_TICK = { fill: TINTA_3, fontSize: 11.5 } as const
