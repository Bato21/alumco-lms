# Optimización móvil de la vista colaborador

Fecha: 2026-08-05
Estado: aprobado, en implementación

## Contexto

La vista colaborador se usa principalmente en teléfono y se instala como PWA.
El manifest, el service worker y `viewportFit: 'cover'` ya existen; lo que falta
es el trabajo de layout móvil.

Auditoría con Playwright sobre las 10 rutas del trabajador en 375 / 390 / 412 px
(`scripts/audit-mobile.mjs`, capturas en `tmp/mobile-audit/`).

## Decisiones tomadas

- **Alcance:** las 10 rutas de `(dashboard)` + navegación móvil + base responsive.
- **Público mixto:** base accesible (cuerpo ≥16px, targets ≥48px) sin sacrificar
  densidad donde no cuesta.
- **PWA:** solo pulido del shell instalado. **No** se cachea contenido de cursos:
  el service worker sigue sin tocar HTML ni datos, porque auth y RLS mandan.
- **Escritorio intacto:** todo override móvil vive dentro de media queries y
  bajo el prefijo `:is(.paleta-oliva, .paleta-azul)` para ganar la cascada sin
  alterar el layout de escritorio.

## Hallazgos de la auditoría

### P0 — `/inicio` se renderiza alejada en todos los teléfonos

`window.innerWidth` devuelve 459 px con viewports de 375, 390 y 412. El valor
constante indica contenido con ancho mínimo fijo: el navegador aleja la página
para que quepa y todo se ve ~22 % más chico de lo diseñado.

Aislado por bisección hasta `CompactEventCard.tsx:13`. Es una tarjeta pensada
como barra lateral de escritorio (`lg:flex-col lg:w-[200px]`) cuyo fallback móvil
dispone los mismos cuatro bloques en fila, tres de ellos con `shrink-0`:

| Bloque | Ancho mínimo |
| --- | --- |
| `◆ Próximo evento` (`shrink-0` + `nowrap`) | ~135 px |
| día + mes + badge (`shrink-0`) | ~95 px |
| `Ver detalles ›` (`shrink-0`) | ~122 px |
| gaps + `p-4` + bordes | ~84 px |
| **total** | **~436 px en una columna de 330 px** |

Verificado experimentalmente: `flex-wrap`, `flex-direction: column` o quitar
`shrink-0` devuelven el viewport a 375. Quitar solo el `nowrap` no alcanza.

Las otras nueve rutas miden correctamente y ninguna desborda horizontalmente.

### Violaciones sistémicas (design system, no por pantalla)

| Origen | Medido | Objetivo |
| --- | --- | --- |
| `.btn` | 44 px declarado, 37 px efectivo en variantes ghost/sm | 48 px |
| `.btn-sm` | 36 px | 48 px |
| `.input` / `.select` | 46 px | 48 px |
| `.input-busqueda` | 44 px | 48 px |
| `.chip` | 42 px | 48 px |
| ✕ del banner demo | 22 × 22 px | 48 × 48 px de área táctil |
| labels del tab bar | 11.5 px | ≥12.5 px |
| encabezados del calendario | 10 px | ≥12 px |

43 violaciones de target en total; la mayoría desaparece corrigiendo ~6 clases
base.

### Otros

- El bloque «PLATAFORMA CALMA» nunca sobrescribe `a`, así que
  `didasko.css:527` subraya en ámbar todos los enlaces, incluidos los labels del
  tab bar. Es residuo del tema brutalista ya descartado.
- El banner de modo demo ocupa tres líneas (~24 % de una pantalla de 667 px).
- `not-found.tsx` muestra una imagen rota.
- `BottomNav.tsx` es código muerto con hrefs incorrectos (Inicio → `/cursos`).

## Fuera de alcance (reportado, no corregido aquí)

- **`/eventos/[id]` muestra controles de edición al colaborador demo** (editor de
  tareas, «Sumar colaborador», subir foto). Puede ser correcto si la cuenta es
  encargada de sección. Cambiar permisos no es trabajo de layout móvil: se
  reporta para decidir aparte.
- **La ruta de quiz no se verificó visualmente.** No hay curso demo con
  evaluación pendiente, así que la URL adivinada devolvió 404. Hereda las
  correcciones de base, pero queda sin confirmación visual.

## Plan

**Fase 0 — P0 aislado.** `CompactEventCard` deja de forzar el ancho en móvil.
Commit propio para que no quede enterrado en el refactor.

**Fase 1 — Base responsive.** Capa móvil en `didasko.css`: escala tipográfica
fluida con `clamp()`, piso de 16 px en cuerpo, alturas mínimas de 48 px en
controles, override del subrayado `a` que faltó en CALMA, utilidad de área táctil
para íconos chicos.

**Fase 2 — Navegación y chrome.** Tab bar con labels legibles sin subrayado y
targets de 48 px; estado activo que no dependa solo del color. Banner demo
compacto en móvil con ✕ de área táctil suficiente. Se elimina `BottomNav.tsx`.

**Fase 3 — Pasada por pantalla.** Las 10 rutas contra las capturas: encabezado de
«Plazos de cursos» que parte en tres líneas, calendario de 10 px, recorrido
horizontal sin affordance.

**Fase 4 — Shell PWA.** Pantalla `/offline`, `overscroll-behavior`, iconos
apple-touch, verificación en modo standalone.

## Verificación

`scripts/audit-mobile.mjs` es el arnés de regresión. Criterios de salida en las
10 rutas × 3 anchos:

- `window.innerWidth` == ancho del dispositivo (sin alejamiento).
- 0 elementos con desbordamiento horizontal.
- 0 targets interactivos bajo 48 px.
- 0 texto de cuerpo bajo 16 px (se permiten labels/eyebrows ≥12 px).

Además: `tsc --noEmit`, `eslint` sin errores nuevos y `next build` en verde.
