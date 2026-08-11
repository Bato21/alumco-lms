# Declaración de conformidad de accesibilidad

**Producto evaluado:** Alumco LMS / KimünKo — plataforma de capacitación continua de ONG Alumco
**URL de producción:** https://alumco-lms-nm38.vercel.app/
**Responsable de la evaluación:** equipo de desarrollo del proyecto
**Fecha de esta declaración:** 2026-08-11
**Rama y estado del código evaluado:** `accesibilidad-AA`
**Compromiso de origen:** Matriz RACI del proyecto, actividad 9 — "Pruebas de Calidad y
Accesibilidad — WCAG AA"

---

## 1 · Estándar aplicado

| | |
| :--- | :--- |
| **Norma** | Web Content Accessibility Guidelines (WCAG) **2.2** |
| **Nivel objetivo** | **AA** — se evalúan todos los criterios de nivel A y AA |
| **Nivel AAA** | Fuera de alcance. Donde se cumple (p. ej. 2.5.5 Tamaño del objetivo), se indica como observación, no como compromiso |
| **Tecnologías de las que depende la conformidad** | HTML, CSS, JavaScript (React 19 / Next.js 16), WAI-ARIA 1.2 |

---

## 2 · Estado de conformidad

> ### ⚠️ **PARCIALMENTE CONFORME**
>
> La plataforma **no alcanza todavía** el nivel AA de WCAG 2.2. Se han corregido parte de los
> incumplimientos detectados y se ha instalado verificación automática permanente, pero
> permanecen abiertos incumplimientos en criterios de nivel A y AA.

Esta es una declaración de estado intermedio, no un certificado. Se emite para dejar constancia
verificable de qué se midió, qué se corrigió y qué falta, de cara a la entrega académica y al
cliente.

**Resumen numérico** — 40 criterios aplicables de nivel A + AA (§ 5 los lista uno a uno):

| | Antes de esta fase | A la fecha de esta declaración |
| :--- | ---: | ---: |
| Criterios conformes | 15 | **19** |
| Conformes con observación | 3 | **4** |
| Criterios **no** conformes | 22 | **17** |
| No aplicables | 0 | 0 |

Pasaron a conformes **2.4.1** (Evitar bloques), **2.4.2** (Titulado de páginas), **2.1.2** (Sin
trampas de teclado) y **2.4.3** (Orden del foco); **1.4.12** (Espaciado del texto) pasó de no
conforme a conforme con observación.

**Hallazgos de la auditoría** (31 en total). "Parcial" = una parte del hallazgo está corregida y
verificada, pero el criterio sigue sin cumplirse por el resto:

| Severidad | Detectados | Cerrados | Parciales | Abiertos |
| :--- | ---: | ---: | ---: | ---: |
| Bloqueante | 8 | 3 | 1 | **4** |
| Alta | 11 | 5 | 2 | **4** |
| Media | 8 | 1 | 1 | **6** |
| Baja | 4 | 0 | 1 | **3** |
| **Total** | **31** | **9** | **5** | **17** |

| Estado | Hallazgos |
| :--- | :--- |
| **Cerrados** | A11Y-01 (tokens de color en conflicto) · A11Y-03 (`focus:outline-none`) · A11Y-04 (cajón móvil enfocable estando cerrado) · A11Y-09 (enlace de salto) · A11Y-10 (landmarks y `<h1>` del login) · A11Y-12 (foco en los 8 diálogos) · A11Y-14 (mensajes de estado del quiz y del progreso) · A11Y-16 (objetivos táctiles sobre enlaces en línea) · A11Y-21 (títulos de página) |
| **Parciales** | A11Y-02 (anillo de foco corregido; ~120 literales de color sin migrar) · A11Y-11 (`role="listitem"` sobre `<Link>` corregido; el estado sigue siendo solo color) · A11Y-17 (barra de progreso ya tiene nombre accesible; el riel sigue en 1.54:1) · A11Y-26 (botones, badges y barra de tabs corregidos; quedan `truncate` sobre valores de dato) · A11Y-29 (`aria-hidden` añadido en los iconos tocados en esta pasada, no en todos) |
| **Abiertos** | A11Y-05, 06, 07, 08, 13, 15, 18, 19, 20, 22, 23, 24, 25, 27, 28, 30, 31 |

---

## 3 · Alcance evaluado

Se recorrió el **100 % del código de interfaz** del repositorio, no una muestra.

### Vistas

| Grupo | Rutas |
| :--- | :--- |
| Público | `/` (landing), `/login`, `/registro`, `/certificados/verificar/[codigo]`, `/offline`, `404`, error boundary |
| Trabajador | `/inicio`, `/cursos`, `/cursos/[id]`, `/cursos/[id]/modulos/[moduleId]`, `/cursos/[id]/modulos/[moduleId]/quiz`, `/mis-certificados`, `/perfil`, `/eventos`, `/eventos/[id]`, `/soporte`, `/soporte/[id]`, `/dias-administrativos`, `/certificado/[certificateId]` |
| Administración | `/admin/dashboard`, `/admin/trabajadores`, `/admin/trabajadores/[id]`, `/admin/cursos`, `/admin/cursos/nuevo`, `/admin/cursos/[id]/editar`, `/admin/cursos/[id]/feedback`, `/admin/reportes`, `/admin/certificados`, `/admin/eventos`, `/admin/eventos/nuevo`, `/admin/eventos/[id]`, `/admin/sedes`, `/admin/soporte`, `/admin/soporte/[id]`, `/admin/perfil`, `/admin/dias-administrativos` |

### Código

- `src/app/**` — todos los `layout.tsx` y `page.tsx`
- `src/components/ui/**` — primitivos shadcn/ui
- `src/components/alumco/**` — todos los subdirectorios de componentes de negocio
- `src/app/globals.css` y `src/app/didasko.css` — sistema de color, foco y tipografía

### Configuraciones de usuario cubiertas

Tema claro y tema oscuro (este último presente en tokens pero **no cableado** en la app),
preferencia de escala tipográfica, alto contraste y `prefers-reduced-motion`, todas expuestas
en el panel de accesibilidad del perfil.

### Fuera de alcance

- **Contenido cargado por el cliente:** videos de YouTube y PDF subidos por administradores. Su
  conformidad (subtítulos, PDF etiquetado) depende del flujo editorial, no del código. Ver § 6.
- **Supabase Studio** y cualquier consola de terceros.
- **Correos transaccionales** enviados por Supabase Auth.

---

## 4 · Metodología

### 4.1 Lo que se hizo

| Técnica | Cobertura | Herramienta |
| :--- | :--- | :--- |
| Revisión estática de código | 100 % de vistas y componentes | Lectura dirigida por criterio WCAG |
| Cálculo de contraste | 24 pares token/fondo + ~120 literales de color | Fórmula de luminancia relativa WCAG 2.x |
| Verificación de cascada CSS | `globals.css` + `didasko.css` + capas de Tailwind | Inspección del **bundle compilado**, no del código fuente |
| Análisis estático de JSX | Todo `src/**` | `eslint-plugin-jsx-a11y` preset `strict`, todas las reglas en `error` |
| Verificación de compilación | Build de producción | `npm run build` → exit 0 |

**Nota metodológica importante sobre el contraste.** Los ratios se calcularon sobre los
colores **efectivos en runtime**, no sobre los tokens declarados. Esto fue determinante: la
hoja de estilos tenía dos bloques `:root` en conflicto y el que ganaba la cascada era el de la
paleta neutra de shadcn, no el de la paleta Alumco. Medir el código fuente habría dado un
resultado falso favorable. Además, Lightning CSS convierte todo `oklch()` a hexadecimal al
compilar, así que los valores finales se extrajeron del bundle emitido.

Del mismo modo, los fondos de referencia son los reales de la plataforma —crema `#FAF6ED`,
tarjeta `#FFFDF6`, arena `#F3ECDC`— y no blanco puro, que habría inflado los ratios ~3 %.

### 4.2 Lo que **no** se hizo

Esta sección existe para que el alcance de la declaración no se lea por encima de lo que
respalda:

- **No se probó con lector de pantalla real** (NVDA, JAWS, VoiceOver, TalkBack). Todo el
  análisis de nombre/rol/valor es estático.
- **No se probó con usuarios reales**, y en particular no con trabajadores de ELEAM, que son el
  público objetivo.
- **No se ejecutó un motor de accesibilidad en navegador** (axe-core, Lighthouse) sobre las
  rutas autenticadas. La suite que cubriría esto está propuesta en § 7 y **pendiente de
  aprobación**.
- **No se probó navegación por conmutador, control por voz ni magnificación** de pantalla.
- **No se verificó el tema oscuro en ejecución**, porque ningún componente aplica la clase
  `.dark`: sus tokens son código latente.

Consecuencia: los criterios marcados como "conformes" lo son **por revisión de código**. Es una
base sólida, pero no equivale a una validación empírica. Las tres pruebas que faltan —lector de
pantalla, axe en navegador y usuarios reales— son las que convertirían esta declaración en un
certificado.

---

## 5 · Conformidad criterio por criterio

Leyenda: ✅ conforme · ⚠️ conforme con observación · ❌ no conforme
Los identificadores `A11Y-nn` remiten a [`AUDITORIA_A11Y.md`](./AUDITORIA_A11Y.md).

### 5.1 Principio 1 — Perceptible

| Criterio | Nivel | Estado | Justificación |
| :--- | :---: | :---: | :--- |
| 1.1.1 Contenido no textual | A | ❌ | SVG inline sin `aria-hidden` fuera del componente `Icono`; glifos decorativos (`◆`, `←`, `→`) leídos como texto. **A11Y-28, A11Y-29** |
| 1.2.2 Subtítulos (grabado) | A | ❌ | Los videos se sirven desde YouTube y el código no puede garantizar subtítulos. Requiere control editorial — ver § 6 |
| 1.3.1 Información y relaciones | A | ❌ | **Parcialmente corregido.** Cerrado: landmarks del login, `role="listitem"` sobre `<Link>` en "Tu recorrido", etiquetas huérfanas en constructor de cursos y edición de trabajador. Abierto: quiz sin `<fieldset>/<legend>`, 5 de 7 tablas sin `scope`/`caption`, 15 páginas sin `<h1>`. **A11Y-06, 15, 20, 31** |
| 1.3.2 Secuencia significativa | A | ✅ | Orden DOM = orden visual en todas las vistas revisadas |
| 1.3.4 Orientación | AA | ✅ | `manifest.ts` no fija `orientation`; sin bloqueos en CSS |
| 1.3.5 Identificar propósito de entrada | AA | ✅ | `autoComplete` correcto en login, registro y recuperación. `rut` usa `off` por no existir token HTML para el identificador chileno |
| 1.4.1 Uso del color | A | ❌ | El estado de curso en "Tu recorrido", la urgencia de las notificaciones y las áreas de los gráficos se distinguen solo por color. **A11Y-11, 13, 19** |
| 1.4.3 Contraste (mínimo) | AA | ❌ | **Parcialmente corregido.** Los 24 pares token/fondo del sistema cumplen (A11Y-01 cerrado). Siguen abiertos ~120 literales usados como color de texto: 37 `#F5A623` (2.03:1), 37 `#27AE60` (2.87:1), 48 `#E74C3C` (3.82:1). **A11Y-02, 07, 18, 23** |
| 1.4.4 Cambio de tamaño del texto | AA | ⚠️ | Se cumple: el zoom al 200 % escala y el layout responde. Pero el sistema mide casi todo en `px`, muchos inline, así que la app ignora en gran medida el tamaño de fuente configurado en el navegador. `html` ya pasó a `112.5%` |
| 1.4.10 Reflujo | AA | ❌ | El desplegable del buscador fuerza 320 px mínimos y desborda en pantallas de 320 px. **A11Y-25** (A11Y-16 cerrado) |
| 1.4.11 Contraste no textual | AA | ❌ | **Parcialmente corregido.** Bordes de campo (1.26:1 → 3.34:1), anillo de foco del sistema (2.03:1 → 7.14:1 sobre crema) y los 26 controles que lo anulaban (A11Y-03) cerrados. Abierto: radios `sr-only` del quiz, riel de la barra de progreso (1.54:1) y objetivos del calendario. **A11Y-06, 17, 19** |
| 1.4.12 Espaciado del texto | AA | ⚠️ | Corregido en botones, badges y barra de tabs. Quedan `truncate` sobre valores de dato (nombres, títulos), aceptados por tener vía alternativa de acceso. **A11Y-26** |
| 1.4.13 Contenido al pasar el cursor o al enfocar | AA | ❌ | El tooltip "Sistema de intentos" del quiz es solo-hover: no descartable, no hoverable, no persistente, e inalcanzable por teclado y en móvil. **A11Y-05, A11Y-27** |

### 5.2 Principio 2 — Operable

| Criterio | Nivel | Estado | Justificación |
| :--- | :---: | :---: | :--- |
| 2.1.1 Teclado | A | ❌ | **Parcialmente corregido.** Cerrado: la intro de la landing ya se puede saltar con teclado; el plegado de filas en reportes tiene botón con `aria-expanded`. Abierto: tooltip del quiz, cierre del buscador global. **A11Y-05, 08, 13** |
| 2.1.2 Sin trampas de teclado | A | ✅ | **Cerrado.** El hook `useAccessibleDialog` (`src/hooks/useAccessibleDialog.ts`) atrapa el foco en los 8 diálogos y cierra con `Escape`; los cajones móviles de admin y de trabajador llevan `inert` estando cerrados, así que dejan de aportar paradas de foco fantasma. **A11Y-04, A11Y-12** |
| 2.2.1 Tiempo ajustable | A | ✅ | **Sin contenido aplicable.** Verificado: no hay ningún `setInterval` ni cuenta atrás en el flujo de evaluación (`QuizClient.tsx`), y el quiz no tiene límite de tiempo. El único `setInterval` del repositorio está en el carrusel de la landing, que no impone plazos. Si en el futuro se añade un temporizador al quiz, este criterio pasa a aplicar y exige poder ajustarlo, extenderlo o desactivarlo |
| 2.3.1 Destellos | A | ✅ | No se detectó ninguna animación que supere tres destellos por segundo. Además, todas respetan `prefers-reduced-motion` y hay preferencia de usuario propia |
| 2.4.1 Evitar bloques | A | ✅ | **Cerrado.** Enlace "Saltar al contenido principal" como primer elemento focusable del `<body>`, apuntando a `<main id="contenido-principal" tabIndex={-1}>` presente en los 12 puntos de entrada. **A11Y-09** |
| 2.4.2 Titulado de páginas | AA | ✅ | **Cerrado.** Títulos únicos y descriptivos; eliminado el sufijo duplicado en 28 páginas; desambiguados los 5 títulos que colisionaban entre vista de trabajador y de admin; añadido el título que faltaba en `/admin/cursos/nuevo`. **A11Y-21** |
| 2.4.3 Orden del foco | A | ✅ | **Cerrado.** Al abrir, el foco entra al diálogo; al cerrar, vuelve al control que lo abrió (con guarda por si ese control ya no existe). Los cajones móviles dejan de desplazar el foco fuera de pantalla. **A11Y-04, A11Y-12** |
| 2.4.4 Propósito del enlace (en contexto) | A | ✅ | Sin `href="#"` en el repositorio. Regla `anchor-ambiguous-text` activa con vocabulario en español |
| 2.4.5 Múltiples vías | AA | ✅ | Navegación por menú + buscador global en ambas vistas |
| 2.4.6 Encabezados y etiquetas | AA | ❌ | **Parcialmente corregido.** Cerrado: el `<h1>` del login (antes un eslogan oculto en móvil). Abierto: 14 páginas sin `<h1>`, `<iframe>` de video titulado "Video player" en inglés. **A11Y-20, A11Y-22** |
| 2.4.7 Foco visible | AA | ❌ | **Parcialmente corregido.** El anillo del sistema ya cumple (7.14:1 sobre crema) y los 26 controles que lo anulaban con `focus:outline-none` lo recuperan (A11Y-03 cerrado). Abierto: los radios del quiz y del panel de accesibilidad son `sr-only` y el foco se dibuja sobre un píxel invisible. **A11Y-06** |
| 2.4.11 Foco no oscurecido (mínimo) | AA | ❌ | El elemento enfocado puede quedar bajo la barra superior fija o la barra de tabs inferior. **A11Y-30** |
| 2.5.3 Etiqueta en el nombre | A | ⚠️ | Los controles solo-icono no tienen etiqueta visible, así que el criterio no aplica a ellos. Observación: `WorkersTable` usa `title` donde debería usar `aria-label`. **A11Y-27** |
| 2.5.7 Movimientos de arrastre | AA | ✅ | El constructor de cursos registra `KeyboardSensor` junto a `PointerSensor` y expone el asa como `<button>` con `aria-label`: reordenar por teclado funciona. Observación menor: dnd-kit emite sus anuncios en inglés |
| 2.5.8 Tamaño del objetivo (mínimo) | AA | ❌ | Objetivos bajo 24 px en el calendario de plazos. **A11Y-19** |

### 5.3 Principio 3 — Comprensible

| Criterio | Nivel | Estado | Justificación |
| :--- | :---: | :---: | :--- |
| 3.1.1 Idioma de la página | A | ✅ | `<html lang="es">` en `src/app/layout.tsx` |
| 3.2.1 Al recibir el foco | A | ✅ | Ningún control cambia de contexto al enfocarse |
| 3.2.2 Al recibir entradas | A | ✅ | Los `<select>` filtran, no navegan; el panel de accesibilidad exige "Guardar" explícito |
| 3.2.3 Navegación consistente | AA | ✅ | Sidebar de admin y barra de tabs del trabajador estables en todas las vistas |
| 3.2.4 Identificación consistente | AA | ⚠️ | Dos tablas de suspendidos duplicadas (`SuspendedTable` / `SuspendidosTable`); un buscador lleva `aria-label` y el otro no. **A11Y-08** |
| 3.3.1 Identificación de errores | A | ✅ | Errores en texto dentro de `role="alert"` en login, registro y paneles de administración |
| 3.3.2 Etiquetas o instrucciones | A | ❌ | **Parcialmente corregido.** Cerrado: interruptor "Obligatorio", enunciado y alternativas del editor de preguntas, selector de áreas de trabajo. Abierto: el buscador global no tiene etiqueta y varios requisitos viven solo en el `placeholder`. **A11Y-08, A11Y-24** |
| 3.3.3 Sugerencia ante errores | AA | ❌ | Los mensajes dicen qué falló pero no cómo corregirlo. **A11Y-24** |
| 3.3.7 Entrada redundante | A | ✅ | Solo se repite la contraseña, exención explícita del criterio |
| 3.3.8 Autenticación accesible (mínimo) | AA | ✅ | Sin captcha ni acertijos cognitivos; `autoComplete` permite gestores de contraseñas; acceso demo de un clic |

### 5.4 Principio 4 — Robusto

| Criterio | Nivel | Estado | Justificación |
| :--- | :---: | :---: | :--- |
| 4.1.2 Nombre, rol, valor | A | ❌ | **Parcialmente corregido.** Cerrado: `role="listitem"` que anulaba el rol de enlace, nombre accesible de la barra de progreso, tres etiquetas huérfanas, cuatro controles sin nombre, y el rol y nombre del modal de bienvenida (que no declaraba ninguno). Abierto: el buscador no expone rol de combobox y la campana de notificaciones no expone estado ni conteo. **A11Y-05, 06, 08, 13, 15, 22** |
| 4.1.3 Mensajes de estado | AA | ❌ | **Parcialmente corregido.** Cerrado: el resultado de la evaluación (las cuatro ramas: revisión, aprobado, reprobado con intentos y sin intentos) y la confirmación de progreso en video y PDF se anuncian en `role="status"` (A11Y-14). Abierto: los resultados del buscador global siguen sin anunciarse. **A11Y-08** |

---

## 6 · No conformidades que no son defectos de código

Tres puntos no se resuelven programando y requieren decisión de proceso o de diseño con el
cliente:

1. **Subtítulos de video (1.2.2, nivel A).** Los módulos de video se sirven desde YouTube y los
   carga personal administrativo. La conformidad AA exige subtítulos en todo video pregrabado
   con audio. Propuesta: convertirlo en requisito del constructor de cursos (casilla obligatoria
   "video con subtítulos verificados" antes de publicar). **Sin esto, el nivel A no se alcanza
   por mucho que se arregle el código.**

2. **Siete fixes cambian la interfaz aprobada.** Corregir el contraste de los botones ámbar, el
   texto de "Tu recorrido", el riel de la barra de progreso y el calendario de plazos altera
   mockups ya validados por la clienta. Están detallados con sus alternativas en
   `AUDITORIA_A11Y.md` § 3. **No deben aplicarse sin validación.**

3. **Sistema de medidas en `px`.** La norma del proyecto pedía base 18 px; `html` ya usa
   `112.5%`, pero el resto del sistema mide en `px` y en gran parte inline. Migrar a `rem` es un
   refactor amplio con riesgo visual alto. No impide cumplir 1.4.4, pero perjudica al mismo
   público que motivó la norma. Se propone evaluarlo como trabajo aparte.

---

## 7 · Verificación permanente

### 7.1 Instalado y operativo

**Análisis estático en cada `npm run lint` y en cada build.**

`eslint-plugin-jsx-a11y` 6.10.2 como dependencia directa de desarrollo, con el preset **`strict`
y todas sus reglas elevadas a `error`** (`eslint.config.mjs`). Antes solo corrían las 6 reglas
que trae `eslint-config-next` por defecto, que no cubren ninguno de los patrones que la
auditoría encontró.

Estado a la fecha: **0 errores de accesibilidad**. Los 15 avisos restantes son de otra
naturaleza (variables sin usar, `<img>` vs `next/image`) y quedaron fuera de este encargo.

Cuatro reglas llevan override, **todos justificados por escrito en el propio archivo**:

| Regla | Ajuste | Por qué |
| :--- | :--- | :--- |
| `prefer-tag-over-role` | desactivada | No corresponde a ningún criterio WCAG. Sus 26 avisos pedían convertir 8 modales de React a `<dialog>` (cambio funcional prohibido en el encargo), `role="img"` de SVG inline a `<img>` (contrario a la recomendación del WAI), `role="progressbar"` a `<progress>` y `role="status"` a `<output>`. Los casos que sí eran corregibles (`role="list"`/`"listitem"` sobre `<div>`) se arreglaron con `<ul>`/`<li>` reales **antes** de desactivarla |
| `no-redundant-roles` | desactivada | Su único caso era `<ul role="list">`, que no es redundante: con `list-style: none` Safari/VoiceOver pierde la semántica de lista (WebKit #170179) |
| `aria-role` | `ignoreNonDOM: true` | Varios componentes tienen una prop de negocio llamada `role` (`'admin'`/`'trabajador'`). Sobre elementos DOM reales el chequeo sigue activo |
| `label-has-associated-control`, `control-has-associated-label` | `depth: 5` | El valor por defecto (2) no alcanza a ver el texto de etiquetas que lo envuelven en dos `<span>` anidados, y daba falsos positivos sobre etiquetas correctas |

Quedan **tres** `eslint-disable` de reglas `jsx-a11y`, cada uno con su comentario: dos en
`CourseFeedbackForm` (previsualización de estrellas al pasar el cursor, con paridad de teclado
añadida vía `onFocus`/`onBlur`) y uno en `ReportesClient` (clic sobre la fila como atajo de
ratón, existiendo ya un `<button>` con `aria-expanded` para lo mismo).

Hay además un `eslint-disable` que **no** es de accesibilidad, en `EventNotificationModal`:
`react-hooks/set-state-in-effect` sobre el efecto que decide si auto-abrir el modal leyendo
`localStorage`. Estaba enmascarado y quedó al descubierto el 2026-08-11 al retirar el manejador
suelto de `Escape` que sustituyó `useAccessibleDialog`. El estado inicial depende de
`localStorage`, que no existe durante el render del servidor, así que calcularlo en el cuerpo del
componente daría un desajuste de hidratación; la alternativa limpia es `useSyncExternalStore`,
que cambia el momento en que aparece el modal. Se dejó anotado como mejora aparte para no
modificar comportamiento en una pasada de accesibilidad.

**Normas para código nuevo.** Sección "Normas de accesibilidad" de `CLAUDE.md`: semántica,
formularios, color, foco y teclado, iconografía, mensajes de estado, tablas y objetivos
táctiles, con la regla explícita de que todo `eslint-disable` de `jsx-a11y` debe justificarse.

### 7.2 Propuesto — pendiente de aprobación

**Suite de humo con `@axe-core/playwright` sobre 15 rutas autenticadas**, que falle el build
ante cualquier violación `serious` o `critical`.

Dependencias a instalar (ninguna instalada aún):

```
@playwright/test    ^1.61   (dev)   — runner; `playwright` ya está, falta el runner
@axe-core/playwright ^4.10  (dev)   — integración de axe-core con Playwright
```

Autenticación: la plataforma ya tiene **dos cuentas demo reales** en una burbuja aislada
(`sede_demo`, `is_demo=true`), que es exactamente lo que hace falta y evita crear usuarios de
prueba nuevos:

| Rol | Correo | Uso en el test |
| :--- | :--- | :--- |
| Trabajador | `demo-colab@kimunko.demo` | 9 rutas de `(dashboard)` |
| Administración | `demo-admin@kimunko.demo` | 6 rutas de `/admin` |

Mecánica propuesta:

1. Un `globalSetup` inicia sesión una vez por rol contra `/login` y guarda el estado de sesión
   (`storageState`) en dos ficheros. Playwright arranca cada test con las cookies ya puestas, sin
   repetir el login 15 veces.
2. Dos proyectos de Playwright (`trabajador`, `admin`), cada uno con su `storageState`.
3. Los IDs dinámicos (`[id]`, `[moduleId]`) **no se cablean**: el test entra a `/cursos`, toma el
   primer curso, y desde el detalle toma el primer módulo. Así la suite no depende de datos
   concretos de la base y sobrevive a un reinicio de la burbuja demo.
4. En cada ruta: `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'])`,
   y se falla si hay algún resultado con `impact` `serious` o `critical`.
5. `/perfil` y `/admin/trabajadores/[id]` se analizan además con los paneles y modales abiertos:
   axe solo ve lo que está en el DOM, y los diálogos son justamente donde están los hallazgos
   abiertos de foco.

Requisitos de entorno para poder ejecutarla:

- `BASE_URL` apuntando a un servidor levantado (`npm run build && npm start`, o un despliegue de
  preview). Se recomienda el build de producción, no `next dev`: los estilos se compilan distinto
  y el contraste se mide sobre lo que ve el usuario.
- Las credenciales demo en variables de entorno (`A11Y_DEMO_COLAB_PASS`, `A11Y_DEMO_ADMIN_PASS`),
  **no** hardcodeadas en el repositorio.
- La burbuja demo debe estar poblada: al menos un curso publicado con un módulo y una evaluación
  visibles para el área del trabajador demo. Si no, cuatro rutas quedan sin cobertura real.
- Navegadores de Playwright descargados (`npx playwright install chromium`) — en CI, un paso más.

Limitación que conviene declarar desde ya: **axe detecta entre el 30 % y el 40 % de los
problemas de accesibilidad**. Cubre bien contraste, nombres accesibles, roles ARIA inválidos y
estructura de encabezados. No detecta orden de foco, trampas de teclado, calidad del texto
alternativo ni si un `aria-label` describe de verdad lo que hace el botón. Es una red de
seguridad contra regresiones, no un sustituto de la revisión manual ni de las pruebas con lector
de pantalla.

**Esta suite no se ha instalado.** Requiere aprobación previa, tanto por las dependencias como
por el requisito de poblar la burbuja demo.

---

## 8 · Trabajo pendiente para alcanzar la conformidad AA

Orden por relación beneficio/coste. Estimaciones en jornadas de una persona.

| # | Hallazgo | Qué cierra | Esfuerzo |
| :-: | :--- | :--- | :---: |
| 1 | **A11Y-02 + A11Y-07** — migrar ~120 literales a los tokens de texto | Grueso de 1.4.3. Los tokens ya existen y están verificados | 1,5 d |
| 2 | **A11Y-15** — `scope`, `caption` y `aria-sort` en 5 tablas | 1.3.1 y 4.1.2. Hoy: 6 `scope="col"`, 2 `<caption>`, 0 `aria-sort` | 0,5 d |
| 3 | **A11Y-06** — `<fieldset>/<legend>` y foco visible en los radios del quiz | 1.3.1, 2.4.7 y 4.1.2 en el flujo crítico | 0,5 d |
| 4 | **A11Y-05** — convertir el tooltip del quiz en disclosure | 2.1.1, 1.4.13 y 4.1.2 | 0,25 d |
| 5 | **A11Y-08** — etiqueta y semántica de combobox en el buscador global | 3.3.2, 4.1.2, 4.1.3 y 2.1.1 | 0,5 d |
| 6 | **A11Y-20 + A11Y-22 + A11Y-28 + A11Y-29 + A11Y-30 + A11Y-23** — `<h1>`, título del iframe, `aria-hidden`, `scroll-margin`, `--tinta-3` | 1.1.1, 2.4.6, 2.4.11 y el resto de 1.4.3 | 0,75 d |
| 7 | **A11Y-11, 13, 19** — canal no cromático en recorrido, notificaciones y gráficos | 1.4.1 completo | 0,75 d |
| 8 | **A11Y-24, 25, 26, 27, 31** — instrucciones de campo, reflujo del buscador, `title`, grupos del sidebar | 3.3.2, 3.3.3, 1.4.10, 1.4.13 | 1 d |

**Total estimado: ~5,75 jornadas** de código, más las tres decisiones del § 6 y la validación de
diseño con la clienta.

Los cuatro puntos que encabezaban esta lista —A11Y-03, A11Y-14, A11Y-12 y A11Y-04— se cerraron el
2026-08-11 y ya no figuran aquí. Ninguno requería validación de diseño: no alteran la interfaz
aprobada.

A esto hay que sumar, para que la declaración pase de "revisión de código" a "verificado":

- Pasada con lector de pantalla real (NVDA en Windows y VoiceOver en iOS, que es el escenario de
  uso mayoritario): ~1 jornada.
- Suite axe del § 7.2, una vez aprobada: ~0,75 jornada.
- Sesión con dos o tres trabajadores de ELEAM: media jornada más coordinación.

---

## 9 · Registro de cambios de esta declaración

| Fecha | Cambio |
| :--- | :--- |
| 2026-08-10 | Emisión inicial. Estado: **parcialmente conforme** — 17 de 40 criterios conformes (+4 con observación), 5 de 31 hallazgos cerrados y 5 parciales, análisis estático de accesibilidad instalado y en verde en el pipeline |
| 2026-08-11 | Cerrados **A11Y-03** (26 controles recuperan el indicador de foco del sistema), **A11Y-14** (`role="status"` en las cuatro ramas de resultado del quiz y en la confirmación de progreso de video y PDF), **A11Y-12** (hook `useAccessibleDialog` en los 8 diálogos: trampa de foco, `Escape` y devolución al disparador) y **A11Y-04** (`inert` y gestión de foco en los cajones móviles). **2.1.2** y **2.4.3** pasan a conformes: 19 de 40 criterios (+4 con observación), 9 de 31 hallazgos cerrados. Hallazgos adicionales corregidos de paso: el modal de bienvenida no declaraba `role="dialog"` ni nombre accesible y duplicaba el `<h1>` de `/inicio` (promovido a `<h2>`); el cajón móvil de la vista de trabajador tenía el mismo defecto que el de admin y se corrigió con él |

**Próxima revisión:** al cerrar los puntos 1 a 3 del § 8, o ante cualquier cambio que afecte al
sistema de color, al foco o a la estructura de landmarks.

---

## 10 · Documentos relacionados

- [`AUDITORIA_A11Y.md`](./AUDITORIA_A11Y.md) — auditoría técnica completa: los 31 hallazgos con
  archivo:línea, ratio medido, impacto en el usuario, fix propuesto y riesgo de regresión; más
  las tablas de contraste de la corrección de la base de estilos.
- [`../CLAUDE.md`](../CLAUDE.md) § "Normas de accesibilidad" — reglas obligatorias para código
  nuevo.
- [`../eslint.config.mjs`](../eslint.config.mjs) — configuración de verificación automática y
  justificación de cada override.
- [`../README.md`](../README.md) § "Branding y accesibilidad" — resumen de estado.
