# Declaración de conformidad de accesibilidad

**Producto evaluado:** Alumco LMS / KimünKo — plataforma de capacitación continua de ONG Alumco
**URL de producción:** https://kimunko.vercel.app/
**Responsable de la evaluación:** equipo de desarrollo del proyecto
**Fecha de esta declaración:** 2026-08-14
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

**Resumen numérico** — 41 criterios aplicables de nivel A + AA (§ 5 los lista uno a uno):

| | Antes de esta fase | A la fecha de esta declaración |
| :--- | ---: | ---: |
| Criterios conformes | 15 | **37** |
| Conformes con observación | 3 | **3** |
| Criterios **no** conformes | 22 | **1** |
| No aplicables | 0 | 0 |

> **El denominador cambió: son 41 criterios, no 40.** El barrido de la landing del 2026-08-14
> encontró que **2.2.2 (Poner en pausa, detener, ocultar, nivel A)** faltaba en esta lista —se
> había evaluado 2.2.1 y anotado que el carrusel "no impone plazos", que resuelve 2.2.1 pero no
> 2.2.2— y que además se incumplía. Está corregido y contabilizado. Que un criterio de nivel A se
> escapara del alcance es un dato sobre la fiabilidad del recuento, no sólo sobre el carrusel:
> conviene reconciliar la lista contra los 55 criterios A+AA de WCAG 2.2 antes de dar la
> declaración por definitiva.

Pasaron a conformes, en orden de cierre: **2.4.1** (Evitar bloques), **2.4.2** (Titulado de
páginas), **2.1.2** (Sin trampas de teclado), **2.4.3** (Orden del foco), **1.4.10** (Reflujo),
**2.4.7** (Foco visible), **4.1.3** (Mensajes de estado), **1.4.1** (Uso del color), **2.1.1**
(Teclado), **2.4.6** (Encabezados y etiquetas), **2.5.8** (Tamaño del objetivo), **4.1.2**
(Nombre, rol, valor), **1.1.1** (Contenido no textual), **1.3.1** (Información y relaciones),
**1.4.3** (Contraste mínimo), **1.4.11** (Contraste no textual), **2.4.11** (Foco no oscurecido),
**1.4.13** (Contenido al pasar el cursor o al enfocar), **3.3.2** (Etiquetas o instrucciones) y
**3.3.3** (Sugerencia ante errores); **2.5.3** (Etiqueta en el nombre) pasó de conforme con
observación a conforme, y **1.4.12** (Espaciado del texto), de no conforme a conforme con
observación.

> ### **Queda un solo criterio no conforme, y no es un defecto de código**
>
> **1.2.2 Subtítulos (grabado), nivel A.** Los videos se sirven desde YouTube y los sube personal
> administrativo: el código no puede garantizar que lleven subtítulos. Es una decisión de proceso
> —ver § 6.1— y, mientras no se tome, **la plataforma no alcanza ni el nivel A**, por muy
> corregido que esté el resto.

Todo lo que dependía de código está cerrado. El § 5 detalla criterio por criterio; los tres con
observación (1.4.4, 1.4.12 y 3.2.4) **sí cumplen**, y la observación anota una deuda técnica o
una verificación empírica pendiente, no un incumplimiento.

**Hallazgos** (31 de la auditoría del 2026-08-10 + 7 de los tres barridos de verificación del
2026-08-14). "Parcial" = una parte del hallazgo está corregida y
verificada, pero el criterio sigue sin cumplirse por el resto:

| Severidad | Detectados | Cerrados | Parciales | Abiertos |
| :--- | ---: | ---: | ---: | ---: |
| Bloqueante | 8 | **8** | 0 | **0** |
| Alta | 16 | **16** | 0 | **0** |
| Media | 10 | **10** | 0 | **0** |
| Baja | 4 | **4** | 0 | **0** |
| **Total** | **38** | **38** | **0** | **0** |

> ### **Los 38 hallazgos están cerrados**
>
> Son 38 y no 31: **A11Y-32 a A11Y-38 no vienen de la auditoría del 2026-08-10**, sino de tres
> barridos posteriores del mismo día. Cada uno miraba un sitio distinto y por eso cada uno encontró
> lo que el anterior no podía ver: primero las reglas base de CSS, luego las paletas con scope,
> luego los estilos en línea de la landing. Los siete son incumplimientos reales, cinco de
> severidad alta, y uno de ellos —el carrusel sin pausa— es de **nivel A**.
>
> Conviene leer el resto con precisión: significa que **no queda deuda de código conocida**. **No**
> significa que la plataforma sea conforme AA —falta 1.2.2, que es de proceso— ni que esté validada
> empíricamente: todo lo anterior es revisión de código, sin lector de pantalla, sin axe en
> navegador y sin usuarios reales. Ver § 4.2 y el cierre del § 8.

### Lección de los siete hallazgos tardíos

**Cinco de los siete correspondían a criterios o hallazgos ya dados por conformes**, y sobrevivían
en la capa que el arreglo original no alcanzaba:

| Hallazgo tardío | Se creía cubierto por | Qué cubría realmente |
| :--- | :--- | :--- |
| **A11Y-32** — anillo de foco de los campos | A11Y-03 | Las 26 ocurrencias de `focus:outline-none` en JSX, no las reglas `:focus` de CSS |
| **A11Y-33** — ámbar como texto en el `<em>` | A11Y-02 | Los ~120 literales de JSX y los tokens base, no una regla con `!important` dentro del scope |
| **A11Y-34** — borde de campos y controles | A11Y-01 | Los tokens de shadcn (`--border`/`--input`), no la clase `.input` de didasko con `var(--borde)` |
| **A11Y-35** — `.t-eyebrow` sobre fondo claro | — | Había dos `style` en línea que intentaban arreglarlo y que el `!important` del scope anulaba |
| **A11Y-36** — texto del héroe sobre foto | 1.4.3 «conforme» | El cálculo de contraste se hizo sobre tokens; con fondo fotográfico el contraste depende del píxel y hay que medir la imagen |
| **A11Y-37** — controles de la landing | 1.4.11, 2.5.8, 4.1.2 | El barrido de controles cubrió el CSS y los componentes de la app, no los estilos en línea de la landing |
| **A11Y-38** — carrusel sin pausa | — | **El criterio 2.2.2 no estaba en la lista de aplicables** |

Tres conclusiones operativas, todas recogidas ya en `CLAUDE.md`:

1. **Las paletas con scope son un punto ciego.** Cinco veces una corrección "global" no llegó a
   ninguna vista real (contando `--ambar-700` el 2026-08-13). Verificar siempre dentro del scope y
   **sobre el bundle compilado**, no sobre el fuente.
2. **El contraste sobre imagen no se calcula, se mide.** Un token no dice nada si detrás hay una
   fotografía: hay que componer el velo sobre los píxeles reales.
3. **La lista de criterios aplicables también se audita.** Que 2.2.2 —nivel A— se escapara indica
   que el recuento merece reconciliarse contra los 55 criterios A+AA de WCAG 2.2.

Los anexos de la auditoría recogen, por barrido, lo que se midió y **no** presentó hallazgo, para
no repetir el trabajo.

| Estado | Hallazgos |
| :--- | :--- |
| **Cerrados** | A11Y-01 (tokens de color en conflicto) · A11Y-02 (ámbar de marca como texto) · A11Y-03 (`focus:outline-none`) · A11Y-04 (cajón móvil enfocable estando cerrado) · A11Y-05 (tooltip del quiz inalcanzable por teclado) · A11Y-06 (radios `sr-only` sin foco visible ni agrupación) · A11Y-07 (texto blanco sobre ámbar y sobre verde) · A11Y-08 (buscador global sin etiqueta y con atajos falsos) · A11Y-09 (enlace de salto) · A11Y-10 (landmarks y `<h1>` del login) · A11Y-11 (estado del curso en "Tu recorrido") · A11Y-12 (foco en los 8 diálogos) · A11Y-13 (campana de notificaciones) · A11Y-14 (mensajes de estado del quiz y del progreso) · A11Y-15 (`caption`, `scope` y `aria-sort` en las tablas) · A11Y-16 (objetivos táctiles sobre enlaces en línea) · A11Y-17 (riel de la barra de progreso) · A11Y-18 (módulos bloqueados con `opacity-50`) · A11Y-19 (píldoras del calendario y series de gráfico) · A11Y-20 (`<h1>` del flujo de evaluación) · A11Y-21 (títulos de página) · A11Y-22 (`<iframe>` titulado en inglés) · A11Y-23 (`--tinta-3` sobre el fondo crema) · A11Y-24 (requisitos en el `placeholder` y errores sin sugerencia) · A11Y-25 (desbordamiento del desplegable a 320 px) · A11Y-26 (`nowrap` sobre texto de interfaz) · A11Y-27 (`title` como tooltip informativo) · A11Y-28 (glifos decorativos leídos como texto) · A11Y-29 (SVG inline sin `aria-hidden`) · A11Y-30 (foco bajo las barras fijas) · A11Y-31 (semántica del sidebar y landmarks duplicados) · **A11Y-32** (`.input:focus` anulaba el anillo del sistema en todos los campos) · **A11Y-33** (ámbar de marca como texto en el `<em>` del display) · **A11Y-34** (borde de campos y controles a 1.28–1.41:1) · **A11Y-35** (`.t-eyebrow` con el ámbar claro de los bloques navy sobre fondo claro) · **A11Y-36** (texto blanco del héroe sobre fotografía, hasta 2.52:1) · **A11Y-37** (controles y estructura de la landing) · **A11Y-38** (carrusel sin mecanismo de pausa — nivel A) |
| **Parciales** | — |
| **Abiertos** | — |

**Nota sobre A11Y-17.** El fix propuesto en la auditoría **estaba mal calculado y no se aplicó**:
oscurecer el riel a `#C9BB99` da **1.07:1** con el ámbar, no 3.05:1, porque acerca su luminancia a
la del relleno en vez de alejarla. Se resolvió delimitando el relleno con un anillo interior de
`--ambar-700` —el borde que porta la información contrasta 4.01:1 con el riel— en vez de cambiar
el riel o perder el ámbar de marca. Detalle del cálculo en la auditoría.

**Nota sobre A11Y-20.** El hallazgo contaba 15 páginas sin `<h1>` y él mismo pedía verificar
cuáles usaban `EncabezadoPagina`. Hecha esa verificación, **13 de las 15 sí emitían `<h1>`** —vía
`EncabezadoPagina` o desde el componente cliente al que la página delega—. El incumplimiento real
estaba concentrado en el flujo de evaluación, donde siete estados de pantalla arrancaban la
jerarquía en `<h2>`. Es un caso de sobreconteo en la medición original, no de trabajo omitido.

**Nota sobre A11Y-19.** La mitad de gráficos del hallazgo **había dejado de aplicar**: los charts
del dashboard se reescribieron después de la auditoría y hoy no usan el color como clave de serie
—eje rotulado, valor impreso por barra, resumen en texto y tabla de datos alternativa—. El mapa
`AREA_COLORS` sólo alimenta ya degradados decorativos. Lo que sí se corrigió es el calendario de
plazos.

**Nota sobre A11Y-08.** El hallazgo pedía exponer el rol de `combobox`. Se resolvió por otra
vía: el campo es un `<input type="search">` con etiqueta real dentro de un `role="search"`, y
los resultados son listas de botones que se recorren con `Tab`. Se descartó el patrón
`combobox`/`listbox` con `aria-activedescendant` porque exige navegación por flechas que el
público objetivo —trabajadores de ELEAM, mayoría en móvil— no usa, y porque el patrón a medias
es peor que no declararlo. Los tres incumplimientos reales del hallazgo (campo sin nombre
accesible, cambio de resultados no anunciado, y un pie que prometía «Enter para buscar · Esc
para cerrar» sin que ninguna de las dos teclas estuviera implementada) sí están corregidos.

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
| 1.1.1 Contenido no textual | A | ✅ | **Cerrado.** Los glifos decorativos (`◆`, `←`, `→`, `✓`) van en `<span aria-hidden>` y la flecha de `ActivarNotificaciones`, que describe una secuencia de menú, lleva además su equivalente textual (A11Y-28). Barrido sobre todo `src/**/*.tsx`: 70 SVG inline en 16 archivos marcados con `aria-hidden`, excluyendo los que ya declaraban `role` o `aria-label`. Verificado a posteriori: **0 SVG sin marcar** (A11Y-29) |
| 1.2.2 Subtítulos (grabado) | A | ❌ | Los videos se sirven desde YouTube y el código no puede garantizar subtítulos. Requiere control editorial — ver § 6 |
| 1.3.1 Información y relaciones | A | ✅ | **Cerrado.** Landmarks del login, `role="listitem"` sobre `<Link>` en "Tu recorrido", etiquetas huérfanas en constructor de cursos y edición de trabajador, alternativas del quiz en `role="radiogroup"` (A11Y-06), `<caption>` y `scope="col"` en las seis tablas que faltaban (A11Y-15), jerarquía de encabezados del flujo de evaluación (A11Y-20), lista de alertas de la campana como `<ul>`/`<li>` reales, y las dos secciones del sidebar como `role="group"` con nombre accesible, con un único landmark de navegación (A11Y-31) |
| 1.3.2 Secuencia significativa | A | ✅ | Orden DOM = orden visual en todas las vistas revisadas |
| 1.3.4 Orientación | AA | ✅ | `manifest.ts` no fija `orientation`; sin bloqueos en CSS |
| 1.3.5 Identificar propósito de entrada | AA | ✅ | `autoComplete` correcto en login, registro y recuperación. `rut` usa `off` por no existir token HTML para el identificador chileno |
| 1.4.1 Uso del color | A | ✅ | **Cerrado.** Los tres focos del hallazgo tienen ya un canal no cromático: el estado de curso en "Tu recorrido" viaja en texto además de en la forma del nodo (A11Y-11); el punto rojo de la campana pasó a insignia con el número de alertas, y el conteo va también en el nombre accesible del botón (A11Y-13); las píldoras del calendario declaran su estado de plazo en el `aria-label`, y los gráficos identifican cada serie por rótulo de eje y valor impreso, no por color (A11Y-19) |
| 1.4.3 Contraste (mínimo) | AA | ✅ | **Cerrado.** Los pares token/fondo del sistema cumplen (A11Y-01). Migrados los ~120 literales usados como color de texto y los botones con texto blanco sobre ámbar y sobre verde (A11Y-02, A11Y-07); corregidos `--ambar-700`, `--ok` y `--aviso` en las tres paletas con scope y los pares `--ok`/`--ok-bg` (4.34:1) y `--aviso`/`--aviso-bg` (4.46:1). En esta pasada: `--tinta-3` de `#6e7488` a `#666c80` —4.84:1 sobre la crema de página, que es el fondo real y donde antes daba 4.31:1 (A11Y-23)— y los módulos bloqueados, que ahora atenúan el fondo en vez de la tinta; el subtexto de la fila activa pasa de 3.25:1 a 6.11:1 (A11Y-18) |
| 1.4.4 Cambio de tamaño del texto | AA | ⚠️ | Se cumple: el zoom al 200 % escala y el layout responde. Pero el sistema mide casi todo en `px`, muchos inline, así que la app ignora en gran medida el tamaño de fuente configurado en el navegador. `html` ya pasó a `112.5%` |
| 1.4.10 Reflujo | AA | ✅ | **Cerrado.** El desplegable del buscador ya no fuerza `min-w-[320px]`, que con el margen del contenedor desbordaba horizontalmente en pantallas de 320 px. **A11Y-25** (A11Y-16 ya estaba cerrado) |
| 1.4.11 Contraste no textual | AA | ✅ | **Cerrado.** Anillo de foco del sistema (2.03:1 → 7.14:1 sobre crema) y los 26 controles que lo anulaban (A11Y-03); el foco de los radios `sr-only` y el borde de alternativa seleccionada, de 2.03:1 a 5.05:1 (A11Y-06); el indicador de orden de las tablas, de `opacity-40` (~1.5:1) a `opacity-70` (A11Y-15); la barra de progreso, con un anillo de `--ambar-700` a 4.01:1 contra el riel, donde antes daba 1.54:1 (A11Y-17). Y los dos que se detectaron en los barridos de verificación: el anillo de foco de **todos los campos**, que las reglas `:focus` de didasko anulaban dejando un halo de 1.15:1 (A11Y-32), y el **contorno de campos, botones secundarios y chips**, que en las dos paletas de la app daba 1.28–1.41:1 y ahora usa un token propio a ≥3.12:1 (A11Y-34). El borde de los tokens de shadcn (1.26:1 → 3.34:1) se había corregido en A11Y-01, pero no gobernaba los campos reales |
| 1.4.12 Espaciado del texto | AA | ⚠️ | Corregido en botones, badges, barra de tabs y encabezados de tabla — este último era el `nowrap` que quedaba sobre texto de interfaz. Los `truncate` sobre valores de dato (nombres, títulos) se aceptan como residual: el `text-overflow` es puramente visual, la cadena completa sigue en el DOM y el lector de pantalla la lee entera, y cada valor cuelga de un enlace o fila que abre el registro. **Observación:** falta pasar el bookmarklet de espaciado de WCAG en navegador, que es lo que convierte esto en comprobado. **A11Y-26** |
| 1.4.13 Contenido al pasar el cursor o al enfocar | AA | ✅ | **Cerrado.** El tooltip "Sistema de intentos" del quiz es un disclosure con estado — descartable con `Escape`, hoverable y persistente hasta cerrarlo (A11Y-05). No queda ningún `title` usado como tooltip: en el calendario pasó a `aria-label`, en `WorkersTable` se eliminó por redundante con el `aria-label`, y en `WorkerTopNav` pasó a un prefijo `sr-only` dentro del enlace (A11Y-27). Los dos `title` que restan son de `<iframe>`, donde el atributo es el nombre accesible del elemento y no genera tooltip |

### 5.2 Principio 2 — Operable

| Criterio | Nivel | Estado | Justificación |
| :--- | :---: | :---: | :--- |
| 2.1.1 Teclado | A | ✅ | **Cerrado.** La intro de la landing se puede saltar con teclado; el plegado de filas en reportes tiene botón con `aria-expanded`; el tooltip del quiz abre con Enter/Espacio (A11Y-05); el buscador global cierra con `Escape` devolviendo el foco al campo (A11Y-08); y la campana de notificaciones, último punto que faltaba, cierra con `Escape` y devuelve el foco al botón que la abrió (A11Y-13) |
| 2.1.2 Sin trampas de teclado | A | ✅ | **Cerrado.** El hook `useAccessibleDialog` (`src/hooks/useAccessibleDialog.ts`) atrapa el foco en los 8 diálogos y cierra con `Escape`; los cajones móviles de admin y de trabajador llevan `inert` estando cerrados, así que dejan de aportar paradas de foco fantasma. **A11Y-04, A11Y-12** |
| 2.2.2 Poner en pausa, detener, ocultar | A | ✅ | **Cerrado — criterio incorporado el 2026-08-14.** No figuraba en esta lista: se había anotado bajo 2.2.1 que el carrusel de la landing "no impone plazos", lo cual resuelve 2.2.1 pero deja 2.2.2 sin evaluar. El carrusel cambia de imagen cada 5 s indefinidamente y en paralelo con el texto de portada, así que el criterio **sí aplica y se incumplía**: respetar `prefers-reduced-motion` es necesario pero no basta, porque 2.2.2 exige un mecanismo en la propia página. Añadido un botón de pausa junto a los puntos del carrusel. **A11Y-38** |
| 2.2.1 Tiempo ajustable | A | ✅ | **Sin contenido aplicable.** Verificado: no hay ningún `setInterval` ni cuenta atrás en el flujo de evaluación (`QuizClient.tsx`), y el quiz no tiene límite de tiempo. El único `setInterval` del repositorio está en el carrusel de la landing, que no impone plazos. Si en el futuro se añade un temporizador al quiz, este criterio pasa a aplicar y exige poder ajustarlo, extenderlo o desactivarlo |
| 2.3.1 Destellos | A | ✅ | No se detectó ninguna animación que supere tres destellos por segundo. Además, todas respetan `prefers-reduced-motion` y hay preferencia de usuario propia |
| 2.4.1 Evitar bloques | A | ✅ | **Cerrado.** Enlace "Saltar al contenido principal" como primer elemento focusable del `<body>`, apuntando a `<main id="contenido-principal" tabIndex={-1}>` presente en los 12 puntos de entrada. **A11Y-09** |
| 2.4.2 Titulado de páginas | AA | ✅ | **Cerrado.** Títulos únicos y descriptivos; eliminado el sufijo duplicado en 28 páginas; desambiguados los 5 títulos que colisionaban entre vista de trabajador y de admin; añadido el título que faltaba en `/admin/cursos/nuevo`. **A11Y-21** |
| 2.4.3 Orden del foco | A | ✅ | **Cerrado.** Al abrir, el foco entra al diálogo; al cerrar, vuelve al control que lo abrió (con guarda por si ese control ya no existe). Los cajones móviles dejan de desplazar el foco fuera de pantalla. **A11Y-04, A11Y-12** |
| 2.4.4 Propósito del enlace (en contexto) | A | ✅ | Sin `href="#"` en el repositorio. Regla `anchor-ambiguous-text` activa con vocabulario en español |
| 2.4.5 Múltiples vías | AA | ✅ | Navegación por menú + buscador global en ambas vistas |
| 2.4.6 Encabezados y etiquetas | AA | ✅ | **Cerrado.** El `<h1>` del login (antes un eslogan oculto en móvil); los siete estados del flujo de evaluación que arrancaban en `<h2>`, promovidos, con los `<h3>` colgantes bajados a `<h2>` para no dejar saltos de nivel (A11Y-20); y el `<iframe>` de video, que pasa de "Video player" a «Video del módulo: *título*» —el de PDF, a «Documento del módulo: *título*» (A11Y-22). Verificado que las otras 13 páginas del recuento original sí emitían `<h1>` |
| 2.4.7 Foco visible | AA | ✅ | **Cerrado.** El anillo del sistema cumple (7.14:1 sobre crema) y los 26 controles que lo anulaban con `focus:outline-none` lo recuperan (A11Y-03). Los radios `sr-only` del quiz y del panel de accesibilidad dibujaban el foco sobre un elemento recortado: el anillo se pinta ahora en la etiqueta con `has-[:focus-visible]`, que además evita que aparezca al pulsar con ratón. **A11Y-03, A11Y-06** |
| 2.4.11 Foco no oscurecido (mínimo) | AA | ✅ | **Cerrado.** Regla global de `scroll-margin` sobre todo elemento enfocable, que reserva el alto de la barra superior fija y el de la barra de tabs inferior —esta última sumando `env(safe-area-inset-bottom)`, porque en móvil con barra de gestos el alto real depende del área segura—. Los espaciadores que ya existían en los layouts sólo protegían el final del contenido, no un control alcanzado por scroll a media página. **A11Y-30** |
| 2.5.3 Etiqueta en el nombre | A | ✅ | **Cerrado.** Los controles solo-icono no tienen etiqueta visible, así que el criterio no aplica a ellos. Los `title` de `WorkersTable`, que introducían una segunda cadena distinta del `aria-label` y confundían al control por voz, se eliminaron. En `WorkerTopNav` el rótulo se añadió como prefijo `sr-only` dentro del enlace y **no** como `aria-label`, precisamente para que el nombre accesible siga conteniendo el texto visible. **A11Y-27** |
| 2.5.7 Movimientos de arrastre | AA | ✅ | El constructor de cursos registra `KeyboardSensor` junto a `PointerSensor` y expone el asa como `<button>` con `aria-label`: reordenar por teclado funciona. Observación menor: dnd-kit emite sus anuncios en inglés |
| 2.5.8 Tamaño del objetivo (mínimo) | AA | ✅ | **Cerrado.** Las píldoras del calendario de plazos pasan de `min-h-[20px]` con 2 px de separación a 24 px con 4 px, y la celda de 60 a 76 px (88 en `sm`) para alojarlas. Se descartó ocultar una píldora en móvil —la otra opción sobre la mesa— porque escondía un vencimiento. **A11Y-19** |

### 5.3 Principio 3 — Comprensible

| Criterio | Nivel | Estado | Justificación |
| :--- | :---: | :---: | :--- |
| 3.1.1 Idioma de la página | A | ✅ | `<html lang="es">` en `src/app/layout.tsx` |
| 3.2.1 Al recibir el foco | A | ✅ | Ningún control cambia de contexto al enfocarse |
| 3.2.2 Al recibir entradas | A | ✅ | Los `<select>` filtran, no navegan; el panel de accesibilidad exige "Guardar" explícito |
| 3.2.3 Navegación consistente | AA | ✅ | Sidebar de admin y barra de tabs del trabajador estables en todas las vistas |
| 3.2.4 Identificación consistente | AA | ⚠️ | Dos tablas de suspendidos duplicadas (`SuspendedTable` / `SuspendidosTable`); un buscador lleva `aria-label` y el otro no. **A11Y-08** |
| 3.3.1 Identificación de errores | A | ✅ | Errores en texto dentro de `role="alert"` en login, registro y paneles de administración. Reforzado: `ActionResult` transporta ahora el campo que originó el error, y los cuatro formularios de autenticación lo marcan con `aria-invalid` apuntándole el `aria-describedby` — antes el mensaje se anunciaba pero no se sabía qué control corregir, y `ResetPasswordForm` marcaba inválidos los dos campos ante cualquier error. **A11Y-24** |
| 3.3.2 Etiquetas o instrucciones | A | ✅ | **Cerrado.** Interruptor "Obligatorio", enunciado y alternativas del editor de preguntas, selector de áreas de trabajo y etiqueta del buscador global (A11Y-08). En esta pasada: los dos requisitos que vivían solo en el `placeholder` —formato del RUT y longitud mínima de contraseña— pasan a texto de ayuda persistente asociado con `aria-describedby`, y la obligatoriedad consta en texto («Todos los campos son obligatorios») además de en `required`. **A11Y-24** |
| 3.3.3 Sugerencia ante errores | AA | ✅ | **Cerrado.** Reescritos los mensajes de los tres schemas Zod para que digan cómo corregir: el RUT remite al dígito verificador y al formato, el correo al `@` y el dominio, las contraseñas a volver a escribirlas. El rechazo de credenciales del login no revela cuál de los dos campos falló —sería un oráculo de cuentas— pero sí remite a «¿Olvidó su clave?»; los conflictos de RUT y correo duplicados proponen iniciar sesión o recuperar la clave. **A11Y-24** |
| 3.3.7 Entrada redundante | A | ✅ | Solo se repite la contraseña, exención explícita del criterio |
| 3.3.8 Autenticación accesible (mínimo) | AA | ✅ | Sin captcha ni acertijos cognitivos; `autoComplete` permite gestores de contraseñas; acceso demo de un clic |

### 5.4 Principio 4 — Robusto

| Criterio | Nivel | Estado | Justificación |
| :--- | :---: | :---: | :--- |
| 4.1.2 Nombre, rol, valor | A | ✅ | **Cerrado.** `role="listitem"` que anulaba el rol de enlace, nombre accesible de la barra de progreso, tres etiquetas huérfanas, cuatro controles sin nombre, el rol y nombre del modal de bienvenida, el `aria-expanded`/`aria-controls` del disclosure del quiz (A11Y-05), el `role="radiogroup"` de las alternativas (A11Y-06) y el nombre accesible del buscador (A11Y-08 — resuelto como campo de búsqueda etiquetado, no como combobox; ver nota del § 2). En esta pasada: la campana expone conteo en su nombre accesible más `aria-expanded`, `aria-haspopup` y `aria-controls`, y su panel declara `role="dialog"` con `aria-labelledby` (A11Y-13); las cinco columnas ordenables de `WorkersTable` declaran `aria-sort` (A11Y-15); y los dos `<iframe>` se identifican en español (A11Y-22) |
| 4.1.3 Mensajes de estado | AA | ✅ | **Cerrado.** El resultado de la evaluación (las cuatro ramas: revisión, aprobado, reprobado con intentos y sin intentos) y la confirmación de progreso en video y PDF se anuncian en `role="status"` (A11Y-14). El buscador global anuncia el número de resultados y el estado "Buscando…" (A11Y-08); días administrativos anuncia el recuento al filtrar, el cálculo de días hábiles y la respuesta de la Server Action de configuración. En esta pasada se sumaron el recuento de resultados de la tabla de trabajadores al filtrar y el rótulo de mes del calendario de plazos, que cambia sin que cambie nada más en pantalla. **A11Y-08, A11Y-14** |

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

**No queda trabajo de código conocido.** Los 38 hallazgos —31 de la auditoría y 7 de los tres barridos
de verificación posteriores— están cerrados, y 37 de los 41 criterios son conformes, más 3 con
observación. Lo que falta para la conformidad AA es de otra naturaleza:

| # | Qué | Por qué no es código | Esfuerzo |
| :-: | :--- | :--- | :---: |
| 1 | **Subtítulos de video (1.2.2, nivel A)** — casilla obligatoria "video con subtítulos verificados" en el constructor de cursos, más el repaso del material ya cargado | El código puede **exigir** la casilla, pero no verificar que el video la cumpla: eso es control editorial. Ver § 6.1 | Decisión + repaso del catálogo |
| 2 | **Validación visual con la clienta** de los cinco cambios que alteran mockups aprobados (tabla más abajo) | Es aprobación de diseño, no implementación | Una sesión |
| 3 | **Pasada con lector de pantalla real** — NVDA en Windows y VoiceOver en iOS, que es el escenario mayoritario | Ninguna revisión estática la sustituye | ~1 jornada |
| 4 | **Suite axe del § 7.2**, una vez aprobada | Requiere instalar dependencias y poblar la burbuja demo | ~0,75 jornada |
| 5 | **Sesión con dos o tres trabajadores de ELEAM** | Es la única prueba que mide si la plataforma se entiende | Media jornada + coordinación |
| 6 | **Bookmarklet de espaciado de texto de WCAG** sobre `/inicio`, `/cursos` y `/admin/trabajadores` | Cierra la observación de 1.4.12, que hoy es la única duda razonable que deja la revisión de código | ~1 hora |

**El punto 1 es el que bloquea.** Sin él no se alcanza ni el nivel A, por muy corregido que esté
el código. Los puntos 3 a 5 son los que convertirían esta declaración de "revisión de código" en
"verificado" — ver § 4.2.

Todos los hallazgos de la auditoría quedaron cerrados en cuatro pasadas: A11Y-01 el 2026-08-10;
A11Y-03, A11Y-04, A11Y-12 y A11Y-14 el 2026-08-11; A11Y-02, A11Y-05, A11Y-06, A11Y-07, A11Y-08,
A11Y-25 y A11Y-28 el 2026-08-13; y los diecinueve restantes el 2026-08-14.

Los que alteran la interfaz aprobada y siguen **pendientes de validación visual con la clienta**:

| Hallazgo | Qué cambia a la vista |
| :--- | :--- |
| **A11Y-02, A11Y-07** | Color de texto de badges y botones en toda la plataforma |
| **A11Y-19** | El calendario de plazos crece ~112 px de alto (celda de 60 a 76 px) |
| **A11Y-17** | La barra de progreso lleva un anillo de ámbar oscuro alrededor del relleno |
| **A11Y-18** | Los módulos bloqueados dejan de verse translúcidos y pasan a fondo gris |
| **A11Y-23** | El texto auxiliar se ve marginalmente más oscuro (8 unidades por canal) |
| **A11Y-32** | El foco de **todos los campos de formulario** pasa de un halo ámbar difuso al anillo navy de doble contorno que ya usa el resto de controles |
| **A11Y-33** | La palabra destacada del saludo de `/inicio` pasa de ámbar brillante a ámbar tostado — el mismo tono que ya usa la landing |
| **A11Y-34** | **Campos, botones secundarios y chips** pasan de un contorno casi invisible a uno gris medio perceptible, en toda la aplicación |
| **A11Y-35** | Los rótulos de sección (`.t-eyebrow`) pasan de ámbar claro a ámbar tostado sobre fondo claro; sobre los bloques navy no cambian |
| **A11Y-36** | **La fotografía del héroe de la portada se ve más oscura** (velo de 0.38 a 0.55). Es el precio de poner texto blanco encima |
| **A11Y-37** | Contorno visible en los campos del formulario de contacto; punto inactivo del carrusel algo más claro |
| **A11Y-38** | Un botón de pausa más en la fila de puntos del héroe |

**A11Y-11 se cerró sin tocar el texto visible**: la sustitución de «Curso N» por el estado sigue
sobre la mesa como mejora de contenido, ya no como incumplimiento.

---

## 9 · Registro de cambios de esta declaración

| Fecha | Cambio |
| :--- | :--- |
| 2026-08-10 | Emisión inicial. Estado: **parcialmente conforme** — 17 de 40 criterios conformes (+4 con observación), 5 de 31 hallazgos cerrados y 5 parciales, análisis estático de accesibilidad instalado y en verde en el pipeline |
| 2026-08-11 | Cerrados **A11Y-03** (26 controles recuperan el indicador de foco del sistema), **A11Y-14** (`role="status"` en las cuatro ramas de resultado del quiz y en la confirmación de progreso de video y PDF), **A11Y-12** (hook `useAccessibleDialog` en los 8 diálogos: trampa de foco, `Escape` y devolución al disparador) y **A11Y-04** (`inert` y gestión de foco en los cajones móviles). **2.1.2** y **2.4.3** pasan a conformes: 19 de 40 criterios (+4 con observación), 9 de 31 hallazgos cerrados. Hallazgos adicionales corregidos de paso: el modal de bienvenida no declaraba `role="dialog"` ni nombre accesible y duplicaba el `<h1>` de `/inicio` (promovido a `<h2>`); el cajón móvil de la vista de trabajador tenía el mismo defecto que el de admin y se corrigió con él |

| 2026-08-13 (1/2) | Integrada la rama `main` (tarjeta de días administrativos en la ficha del trabajador) y corregida a AA. **Causa de fondo detectada:** el valor base de `--ambar-700` ya era correcto (#b45309), pero las tres paletas con scope —`.paleta-oliva` (admin), `.paleta-azul` (trabajador) y `.landing-page`— lo re-sobrescribían a #b9740f (3.80:1), así que la corrección no llegaba a ninguna vista real. Corregidos también los pares `--ok`/`--ok-bg` (4.34:1) y `--aviso`/`--aviso-bg` (4.46:1), que fallaban contra su propio fondo de badge y no contra blanco. Commit `2bfbcac` |
| 2026-08-13 (2/2) | Cerrados **A11Y-05** (tooltip del quiz → disclosure con `Escape` y contenido hoverable), **A11Y-06** (`role="radiogroup"` y anillo de foco sobre la etiqueta en los radios `sr-only` del quiz y del panel de accesibilidad), **A11Y-07** (tinta oscura sobre ámbar siguiendo el patrón que ya usaba `.btn-primary`; verdes a `var(--ok)`), **A11Y-08** (buscador global: etiqueta real, `role="search"`, `Escape` funcional y anuncio de resultados), **A11Y-02** (literales de color migrados), **A11Y-25** y **A11Y-28**. **No queda ningún hallazgo bloqueante abierto.** **1.4.10**, **2.4.7** y **4.1.3** pasan a conformes: 22 de 40 criterios (+4 con observación), 16 de 31 hallazgos cerrados. Commit `8c14854` |
| 2026-08-14 | Cerrados **A11Y-15** (`<caption>`, `scope="col"` y `aria-sort` en las seis tablas que faltaban, más indicador de orden a `opacity-70` y recuento de resultados en `role="status"`), **A11Y-20** (siete estados del flujo de evaluación promovidos a `<h1>`, tras verificar que 13 de las 15 páginas del recuento original ya lo tenían), **A11Y-13** (campana: insignia numérica, conteo en el nombre accesible, `aria-expanded`/`aria-haspopup`/`aria-controls`, cierre con `Escape` con devolución de foco, panel como `role="dialog"` y lista real), **A11Y-19** (píldoras del calendario a 24 px con celda de 76 px; la mitad de gráficos había dejado de aplicar), **A11Y-11** (estado del curso en texto, sin tocar el visible) y **A11Y-22** (`<iframe>` de video y de PDF identificados en español). **1.4.1**, **2.1.1**, **2.4.6**, **2.5.8** y **4.1.2** pasan a conformes: 27 de 40 criterios (+4 con observación), 22 de 31 hallazgos cerrados. Verificado con `tsc --noEmit`, `npm run lint` (0 errores de accesibilidad) y `npm run build` |
| 2026-08-14 (2/2) | Cerrados **A11Y-17** (anillo de `--ambar-700` delimitando el relleno de la barra de progreso; **el fix de la auditoría estaba mal calculado** y se resolvió por otra vía — ver nota del § 2), **A11Y-18** (los módulos bloqueados atenúan el fondo, no la tinta; subtexto de la fila activa de 3.25:1 a 6.11:1), **A11Y-23** (`--tinta-3` a `#666c80`: 4.84:1 sobre la crema de página), **A11Y-29** (70 SVG inline marcados en 16 archivos; 0 sin marcar), **A11Y-30** (`scroll-margin` global con `env(safe-area-inset-bottom)`) y **A11Y-31** (secciones del sidebar como `role="group"` con `useId`, y un único landmark de navegación). **1.1.1**, **1.3.1**, **1.4.3**, **1.4.11** y **2.4.11** pasan a conformes: 32 de 40 criterios (+4 con observación), 28 de 31 hallazgos cerrados. **No queda ningún hallazgo bloqueante, alto ni bajo abierto.** Verificado con `tsc --noEmit`, `npm run lint` y `npm run build` |

| 2026-08-14 (3/3) | Cerrados los tres hallazgos que quedaban: **A11Y-24** (ayuda persistente con `aria-describedby` en RUT y contraseña, obligatoriedad en texto, mensajes de error reescritos para decir cómo corregir, y `ActionResult.field` para asociar el error a su control en los cuatro formularios de autenticación), **A11Y-26** (`.tabla th`, último `nowrap` sobre texto de interfaz) y **A11Y-27** (no queda ningún `title` usado como tooltip). **1.4.13**, **3.3.2** y **3.3.3** pasan a conformes y **2.5.3**, de conforme con observación a conforme: **36 de 40 criterios (+3 con observación) y los 31 hallazgos de la auditoría cerrados.** El único criterio no conforme es **1.2.2 (subtítulos)**, que no se resuelve programando. Verificado con `tsc --noEmit`, `npm run lint` y `npm run build` |

| 2026-08-14 (4/4) | **Barrido de verificación** tras cerrar los 31 hallazgos de la auditoría, para comprobar si quedaba trabajo de código. Quedaba: se detectan y cierran **A11Y-32** —`.input:focus` anulaba el anillo de foco del sistema en **todos** los campos de la plataforma; el sustituto era un halo ámbar al 22 % (1.15:1) y un cambio de borde de 1.41:1— y **A11Y-33** —el `<em>` del `<h1>` de `/inicio` seguía en `#F5A623` (1.88:1) por una regla con `!important` dentro de las paletas con scope—. Ambos correspondían a hallazgos **ya dados por cerrados** (A11Y-03 y A11Y-02), cuyo alcance cubría los literales de JSX pero no las reglas base de CSS. Los criterios afectados (1.4.11, 2.4.7, 1.4.3) ya figuraban como conformes y **se mantienen**, ahora sí con base: el recuento de criterios no cambia, el de hallazgos pasa a **33 de 33 cerrados**. Verificado sobre el bundle de producción: 0 ocurrencias del halo al 22 % y ningún `outline: none` salvo el intencionado de `main:focus` |

| 2026-08-14 (5/5) | **Barrido regla a regla de las paletas con scope**, motivado por el patrón que dejaron al descubierto A11Y-32 y A11Y-33. Se revisaron las 50 reglas que el bundle emite bajo `.paleta-oliva`, `.paleta-azul` y `.landing-page`, más sus tokens. Dos incumplimientos más: **A11Y-34** —el contorno de campos, botones secundarios y chips daba **1.28–1.41:1**, y era la única señal de dónde empieza un control porque el relleno y el fondo se diferencian en 1.02:1; A11Y-01 había corregido los tokens de shadcn, que no gobiernan estos campos— y **A11Y-35** —`.t-eyebrow` forzaba con `!important` el ámbar claro de los bloques navy también sobre crema (1.52:1), y de paso anulaba dos `style` en línea que intentaban arreglarlo—. Cerrados con un token `--borde-control` propio (opción (b) del § 3 de la auditoría, ≥3.12:1) y restringiendo el color claro a `.bloque-marca`. **35 de 35 hallazgos cerrados**; el recuento de criterios no cambia. El anexo de la auditoría deja constancia de lo que se midió y no presentó hallazgo |

| 2026-08-14 (6/6) | **Barrido regla a regla de la landing**, cuyo grueso no vive en CSS con scope sino en estilos en línea y `<style jsx>` de nueve componentes. Tres hallazgos: **A11Y-36** —el texto blanco del héroe va sobre fotografía con un velo del 38 % que no basta; medidas las cuatro slides con su desenfoque, el párrafo de 16 px fallaba en tres y el `<h1>` en una, bajando a 2.52:1—, **A11Y-37** —campo de novedades sin nombre accesible y con `outline: none`, puntos del carrusel de 7×7 px y a 2.83:1, borde de formulario a 1.28:1, y «Nuestra misión» fuera del esquema de encabezados— y **A11Y-38** —el carrusel se mueve solo cada 5 s sin mecanismo de pausa: **2.2.2, nivel A, y el criterio ni siquiera figuraba en la lista de aplicables**—. El denominador pasa de 40 a **41 criterios** y el total de hallazgos a **38, todos cerrados**. Velo al 0.55 (peor caso 4.96:1 verificado sobre las imágenes reales), áreas táctiles de 24 px, `--borde-control` también en `.landing-page`, y botón de pausa en el héroe |

**Próxima revisión:** al tomar la decisión sobre subtítulos (§ 6.1), tras la validación visual con
la clienta, tras reconciliar la lista de criterios aplicables contra los 55 de WCAG 2.2, o ante
cualquier cambio que afecte al sistema de color, al foco o a la estructura de landmarks.

**Pendiente de verificación empírica.** Todo lo anterior es revisión de código: `tsc`, el análisis
estático de `jsx-a11y` en preset `strict` y los cálculos de contraste. **Nada se ha probado en un
navegador real ni con lector de pantalla**, y las correcciones de contraste cambian la apariencia
de badges y botones en toda la plataforma. Mientras eso no se haga, esta declaración no puede
pasar de "revisión de código" a "verificado" — ver los tres puntos al final del § 8.

---

## 10 · Documentos relacionados

**Cómo se reparten estos dos documentos.** No dicen lo mismo y no se mantienen igual:

- **Este documento es el estado vigente.** Es el que hay que actualizar en cada pasada: el § 5
  (criterio por criterio), el § 8 (lo que falta y cuánto cuesta) y el § 9 (qué se hizo y cuándo).
  Si solo vas a leer uno, lee este.
- **La auditoría es el hallazgo tal como se detectó**, con su medición original. No se reescribe
  —es el registro de lo que se midió el 2026-08-11—, pero cada hallazgo lleva ahora una línea
  `**Estado:**` al principio que dice si está cerrado, parcial o abierto, y con qué commit. Eso
  evita "arreglar" algo ya arreglado leyendo un fix propuesto que ya se aplicó.

- [`AUDITORIA_A11Y.md`](./AUDITORIA_A11Y.md) — auditoría técnica completa: los 31 hallazgos
  originales más los 7 de los barridos posteriores (A11Y-32 a A11Y-38, en su propia sección), con
  archivo:línea, ratio medido, impacto en el usuario, fix propuesto, riesgo de regresión y estado
  actual; más las tablas de contraste de la corrección de la base de estilos.
- [`../CLAUDE.md`](../CLAUDE.md) § "Normas de accesibilidad" — reglas obligatorias para código
  nuevo.
- [`../eslint.config.mjs`](../eslint.config.mjs) — configuración de verificación automática y
  justificación de cada override.
- [`../README.md`](../README.md) § "Branding y accesibilidad" — resumen de estado.
