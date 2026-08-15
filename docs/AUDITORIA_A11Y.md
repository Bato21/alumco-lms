# Auditoría de accesibilidad — WCAG 2.2 nivel AA

**Proyecto:** Alumco LMS / KimünKo
**Fecha:** 2026-08-10
**Rama auditada:** `accesibilidad-AA` (HEAD `7142a67`)
**Estándar objetivo:** WCAG 2.2, nivel AA (criterios A + AA). No se evalúa AAA.
**Compromiso contractual:** Matriz RACI, actividad 9 — "Pruebas de Calidad y Accesibilidad — WCAG AA".

**Alcance recorrido:**

- `src/app/(auth)/**` — login, registro
- `src/app/(dashboard)/**` — inicio, cursos, módulos, quiz, certificados, perfil, eventos, soporte, días administrativos
- `src/app/admin/**` — dashboard, trabajadores, cursos, reportes, eventos, sedes, certificados, soporte
- `src/components/**` — `ui/` (shadcn), `alumco/` (todos los subdirectorios)
- `src/app/globals.css`, `src/app/didasko.css`
- `src/app/layout.tsx` y los `layout.tsx` de cada grupo de rutas

**Método:** revisión estática de código (no se ejecutó el navegador). Los ratios de contraste
se calcularon con la fórmula de luminancia relativa de WCAG 2.x sobre los colores **efectivos
en runtime** —es decir, después de resolver la cascada de `@layer` descrita en A11Y-01—, no
sobre los tokens declarados. Cuando el fondo real es la crema del tema (`#FAF6ED`) y no blanco
puro, se indica explícitamente.

> **Esta fase no modificó ningún archivo.** Todo lo que sigue son hallazgos y propuestas.

---

## Resumen ejecutivo

| Severidad | Cantidad |
| :--- | ---: |
| Bloqueante | 8 |
| Alta | 11 |
| Media | 8 |
| Baja | 4 |
| **Total** | **31** |

> **Este recuento es el de la auditoría del 2026-08-10 y no se reescribe.** Un barrido de
> verificación posterior (2026-08-14) encontró **dos hallazgos más**, A11Y-32 y A11Y-33, que
> tienen su propia sección al final del documento. El total vigente es **33**. Nótese que los dos
> nuevos corresponden a los puntos 2 y 3 de la lista de aquí abajo: el alcance original cubría los
> literales escritos en JSX, pero no las reglas base de CSS ni las paletas con scope.

Tres problemas explican la mayoría del resto:

1. **La cascada de `globals.css` está rota** (A11Y-01). El segundo bloque `:root` vive fuera de
   toda `@layer`, así que gana a todo lo demás y reemplaza la paleta Alumco por la paleta
   neutra por defecto de shadcn. Consecuencia directa: bordes de input a **1.26:1** y anillos
   de foco de shadcn a **1.54:1**, ambos muy por debajo del 3:1 de 1.4.11.
2. **El indicador de foco se destruye en 26 lugares** (A11Y-03). `focus:outline-none` vive en
   la capa `utilities` de Tailwind, que gana a la capa `components` donde vive el anillo ámbar
   de DIDASKO. El reemplazo es un anillo al 20–30 % de opacidad, invisible.
3. **El ámbar de marca `#F5A623` se usa como color de texto y de foco** (A11Y-02, A11Y-07).
   Sobre blanco da **2.03:1**. Es el color del anillo de foco de toda la plataforma y el fondo
   de varios CTA con texto blanco encima.

Ninguno de los tres es un problema de "un componente": son decisiones de sistema. Arreglarlos
resuelve, en cascada, ~15 de los 31 hallazgos.

---

## Estado de los hallazgos previos (H1–H5)

| ID previo | Estado tras verificación | Dónde quedó |
| :--- | :--- | :--- |
| **H1** — dos `:root` en conflicto | ✅ **Confirmado y ampliado.** El alcance real es mayor al reportado. | A11Y-01 |
| **H2** — colores hardcodeados sin contraste | ✅ **Confirmado.** Inventario completo con archivo:línea y clasificación texto/fondo. | A11Y-02 |
| **H3** — tooltip del quiz | ✅ **Confirmado.** Suma un tercer incumplimiento (4.1.2) al par reportado. | A11Y-05 |
| **H4** — `min-height: 48px` en todo `<a>` | ✅ **Confirmado.** La observación sobre 2.5.5 (AAA) vs 2.5.8 (AA) es correcta. | A11Y-16 |
| **H5** — tres `<a href="#">` en el login | ❌ **No reproduce.** | ver abajo |

### H5 — no reproduce

`src/app/(auth)/login/page.tsx` fue reescrito. No queda ningún `href="#"` en el repositorio:

```bash
$ grep -rn 'href="#"' src --include=*.tsx
# (sin resultados)
```

Los tres enlaces placeholder (Términos, Privacidad, Soporte) ya no existen. En su lugar hay un
único enlace real:

```tsx
// src/app/(auth)/login/page.tsx:155
<a href="mailto:soporte@alumco.cl" className="silencio-3">¿Problemas para ingresar? Contactar soporte</a>
```

Ese enlace **sí cumple** 2.4.4 (el texto describe el destino fuera de contexto) y **sí cumple**
4.1.2 (es un `<a>` con `href` real). El punto de contraste de H5 sigue vivo pero cambió de
color: `.silencio-3` resuelve a `--tinta-3` (`#6E7488`), no a `slate-400`. Sobre la crema del
panel (`#FAF6ED`) da **4.31:1** → falla igual, pero por poco y por otro motivo. Se documenta
como A11Y-23, no como H5.

**H5 se cierra.** Los otros cuatro hallazgos previos se mantienen y se detallan abajo.

---

## Hallazgos bloqueantes

### A11Y-01 — Dos bloques `:root` en conflicto: la paleta Alumco no llega al runtime
- **Estado:** ✅ **Cerrado** — tokens de color unificados (80077f4)
- **Criterio WCAG:** 1.4.11 Contraste de elementos no textuales (Nivel AA) · 2.4.7 Foco visible (Nivel AA)
- **Severidad:** Bloqueante
- **Archivo:** `src/app/globals.css:11-40` (bloque 1), `src/app/globals.css:164-197` (bloque 2), `src/app/globals.css:233-243` (segundo `@layer base`)
- **Vistas afectadas:** todas — es la hoja de estilos raíz.

**Descripción**

`globals.css` declara los tokens de color dos veces con dos sintaxis distintas:

```css
/* globals.css:11 — DENTRO de @layer base */
@layer base {
  :root {
    --primary:    213 90% 35%;   /* azul Alumco, HSL sin envolver */
    --ring:       213 90% 35%;
    --background: 0 0% 100%;
    --border:     214 20% 88%;
  }
}

/* globals.css:164 — FUERA de toda @layer */
:root {
  --primary:    oklch(0.205 0 0);   /* negro neutro de shadcn */
  --ring:       oklch(0.708 0 0);   /* gris medio */
  --background: oklch(1 0 0);
  --border:     oklch(0.922 0 0);
}
```

En CSS, **las reglas sin capa ganan a las reglas de cualquier capa**. El orden que establece
`@import "tailwindcss"` es `theme < base < components < utilities`, y todo eso queda por debajo
del CSS sin capa. `didasko.css` se importa con `layer(components)` (`globals.css:9`), así que
también pierde contra el bloque de la línea 164.

**Mapa de qué token gana realmente en runtime:**

| Token | En `@layer base` | Sin capa (l.164) | Gana | Valor efectivo |
| :--- | :--- | :--- | :--- | :--- |
| `--primary` | `213 90% 35%` (azul) | `oklch(0.205 0 0)` | sin capa | negro `#333` |
| `--ring` | `213 90% 35%` | `oklch(0.708 0 0)` | sin capa | gris `#A1A1A1` |
| `--background` | `0 0% 100%` | `oklch(1 0 0)` | sin capa | blanco |
| `--border` / `--input` | `214 20% 88%` | `oklch(0.922 0 0)` | sin capa | `#EBEBEB` |
| `--muted-foreground` | `215 16% 40%` | `oklch(0.556 0 0)` | sin capa | gris medio |
| `--success` / `--warning` | definidos | no redefinidos | `@layer base` | **sí aplican** |
| `--ambar`, `--tinta`, `--azul-800`… | — | no existen ahí | `layer(components)` | **sí aplican** |

Es decir: **los tokens shadcn quedan en la paleta neutra por defecto; los tokens DIDASKO
sobreviven intactos.** La app se ve "bien" porque el 90 % de la UI usa clases DIDASKO
(`.btn`, `.card`, `.input`), pero todo lo que usa clases shadcn/Tailwind semánticas
(`border-input`, `ring-ring`, `bg-primary`) cae en la paleta gris.

**Consecuencias medidas (todas fallan 1.4.11, que exige ≥ 3:1):**

| Uso | Color efectivo | Contraste sobre blanco | Veredicto |
| :--- | :--- | ---: | :--- |
| `border-input` en 29 sitios (`admin/cursos/nuevo`, CourseBuilder…) | `oklch(0.922 0 0)` ≈ `#EBEBEB` | **1.26:1** | ❌ |
| `focus-visible:ring-ring/50` (`ui/input`, `ui/button`, `ui/select`, `ui/textarea`) | gris 50 % ≈ `#D0D0D0` | **1.54:1** | ❌ |
| `* { @apply border-border }` (`globals.css:235`) — borde por defecto de **todo** elemento | `#EBEBEB` | **1.26:1** | ❌ |

**Declaraciones inválidas que el navegador descarta en silencio:**

```css
/* globals.css:70-73 */
body {
  background-color: hsl(var(--background));  /* → hsl(oklch(1 0 0)) → INVÁLIDO, descartado */
  color: hsl(var(--foreground));             /* → INVÁLIDO, descartado */
}

/* globals.css:97-99 */
:focus-visible {
  outline: 3px solid hsl(var(--ring));       /* → INVÁLIDO, el shorthand entero se descarta */
}
```

El daño visual en `body` es nulo: dos reglas más abajo `globals.css:237` aplica
`@apply bg-background text-foreground`, y `didasko.css:64` gana con `background: var(--crema)`.
Pero **el anillo de foco de `globals.css:97` nunca se aplica**: el que se ve es el de
`didasko.css:82`, `outline: 3px solid var(--ambar)` — y ese ámbar da 2.03:1 (ver A11Y-02).

**Duplicados adicionales:** `@import "tailwindcss"` aparece **una sola vez** (línea 4) — el
duplicado reportado en H1 no se confirma. Sí hay **dos bloques `@layer base`** (líneas 11 y
233), lo que fragmenta las reglas base y define `body`/`html` en dos lugares distintos.

**Impacto en el usuario**

Una persona con baja visión que navegue con teclado no distingue qué campo tiene el foco en los
formularios de shadcn, ni dónde termina un campo de texto: un borde a 1.26:1 es literalmente
invisible con luz ambiente alta o con el brillo de pantalla bajo. En un ELEAM, con turnos y
equipos compartidos, ese es el escenario normal, no el excepcional.

**Fix propuesto**

Un único bloque de tokens, dentro de `@layer base`, en una sola sintaxis, conservando la paleta
Alumco:

```css
/* ANTES — globals.css:164-197 (sin capa) */
:root {
  --background: oklch(1 0 0);
  --primary: oklch(0.205 0 0);
  --ring: oklch(0.708 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  /* … */
}

/* DESPUÉS — dentro de @layer base, con la paleta Alumco */
@layer base {
  :root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.21 0.03 265);
    --primary:    oklch(0.42 0.14 264);   /* #2B4FA0 — 7.70:1 sobre blanco */
    --primary-foreground: oklch(1 0 0);
    --ring:       oklch(0.42 0.14 264);   /* mismo azul: 7.70:1, cumple 1.4.11 */
    --border:     oklch(0.72 0.02 265);   /* ≈ #A3AAB8 → 3.02:1 sobre blanco */
    --input:      oklch(0.72 0.02 265);
    /* … resto sin cambios … */
  }
}
```

Y corregir las dos declaraciones inválidas:

```css
/* ANTES — globals.css:70-73 y 97-99 */
body { background-color: hsl(var(--background)); color: hsl(var(--foreground)); }
:focus-visible { outline: 3px solid hsl(var(--ring)); }

/* DESPUÉS — los tokens ya son colores completos, no componentes HSL sueltos */
body { background-color: var(--background); color: var(--foreground); }
:focus-visible { outline: 3px solid var(--ring); }
```

Fusionar además los dos `@layer base` (líneas 11 y 233) en uno solo.

**Riesgo de regresión**

Medio-alto y **visible**. Al reparar `--primary`, todos los `bg-primary` / `text-primary` de
shadcn pasan de negro a azul Alumco: es lo correcto según la paleta del proyecto, pero cambia
el aspecto de esos componentes. Al subir `--border` de `#EBEBEB` a `#A3AAB8`, los bordes
hairline se vuelven claramente más oscuros — es el objetivo del fix, pero contradice la
intención estética declarada en `didasko.css:804-808` ("hairline casi invisible… se leen por
espacio en blanco, no por contorno"). **Requiere validación visual con la clienta**: ver la
lista de fixes con decisión de diseño al final.

---

### A11Y-02 — El ámbar de marca `#F5A623` se usa como color de texto y como anillo de foco (2.03:1)
- **Estado:** ✅ **Cerrado** — literales migrados a tokens de texto (8c14854)
- **Criterio WCAG:** 1.4.3 Contraste (mínimo) (Nivel AA) · 1.4.11 Contraste de elementos no textuales (Nivel AA)
- **Severidad:** Bloqueante
- **Archivo:** `src/app/didasko.css:82-86` (anillo de foco global) + 38 ocurrencias de `#F5A623`
- **Vistas afectadas:** **todas** (el anillo de foco es global); además quiz, notificaciones, certificados, detalle de trabajador, constructor de cursos.

**Descripción**

El anillo de foco efectivo de toda la plataforma es ámbar puro:

```css
/* didasko.css:82 — este es el que gana la cascada (ver A11Y-01) */
:focus-visible {
  outline: 3px solid var(--ambar);   /* #F5A623 */
  outline-offset: 2px;
}
```

Ratios recalculados sobre los fondos reales de la plataforma:

| Color | Sobre blanco `#FFFFFF` | Sobre crema `#FAF6ED` | Sobre card `#FFFDF6` | Umbral AA |
| :--- | ---: | ---: | ---: | :--- |
| `#F5A623` (ámbar) | **2.03:1** ❌ | 1.97:1 ❌ | 2.02:1 ❌ | 3:1 foco / 4.5:1 texto |
| `#27AE60` (verde) | **2.87:1** ❌ | 2.79:1 ❌ | 2.86:1 ❌ | 4.5:1 |
| `#E74C3C` (rojo) | **3.82:1** ❌ | 3.72:1 ❌ | 3.81:1 ❌ | 4.5:1 |
| `#94A3B8` (slate-400) | **2.56:1** ❌ | 2.49:1 ❌ | 2.55:1 ❌ | 4.5:1 |
| `#64748B` (slate-500) | **4.76:1** ✅ | 4.63:1 ✅ | 4.74:1 ✅ | 4.5:1 |
| `#2B4FA0` (azul) | **7.70:1** ✅ | 7.49:1 ✅ | 7.67:1 ✅ | 4.5:1 |

Los ratios del informe previo se confirman. Nota nueva: sobre la crema del tema todos bajan
~3 %, lo que deja `slate-500` en 4.63:1 — pasa, pero sin margen.

#### Inventario de `#F5A623` (38 ocurrencias)

**Como color de TEXTO → falla 1.4.3:**

| Archivo:línea | Uso | Tamaño | Ratio |
| :--- | :--- | :--- | ---: |
| `(dashboard)/cursos/[id]/modulos/[moduleId]/quiz/QuizClient.tsx:289` | `bg-[#F5A623]/10 text-[#F5A623]` badge "Intento N de M" | 14px | 1.9:1 ❌ |
| `QuizClient.tsx:290` | `text-[var(--ambar)]`, misma badge, rama alterna | 14px | 2.0:1 ❌ |
| `QuizClient.tsx:670` | icono ⚠ `text-[#F5A623]` sobre `bg-[#F5A623]/20` | 48px | 1.7:1 ❌ (1.4.11) |
| `admin/trabajadores/[id]/page.tsx:183` | `color: 'text-[#F5A623]'` en config de estado | var. | 2.03:1 ❌ |
| `admin/trabajadores/[id]/page.tsx:249` | badge `bg-amber-50 text-[#F5A623]` | 10px bold | 1.9:1 ❌ |
| `certificado/CertificateBadge.tsx:45` | `text-xs font-bold text-[#F5A623]` eyebrow | 12px | 2.03:1 ❌ |
| `certificado/CertificateBadge.tsx:102` | `border-[#F5A623] text-[#F5A623]` botón secundario | 14px | 2.03:1 ❌ |
| `admin/CourseBuilder/CourseBuilder.tsx:284` | `text-[#F5A623]` texto de estado | 14px | 2.03:1 ❌ |
| `shared/NotificationBell.tsx:42,138` | `labelStyle: 'text-[#F5A623]'` urgencia crítica | 12px | 2.03:1 ❌ |
| `shared/WelcomeModal.tsx:120` | `color: '#F5A623'` | var. | 2.03:1 ❌ |
| `landing/ValoresSection.tsx:123` | `color: #F5A623` | var. | 2.03:1 ❌ |
| `(auth)/login/page.tsx:138` | `"Ko"` dentro de frase corrida | 13.5px | 2.03:1 ❌ |
| `login/page.tsx:97` · `nav/WorkerTopNav.tsx:61,117` · `nav/AdminSidebar.tsx:90` | `"Ko"` del logotipo KimünKo | 10–22px | 2.03:1 ⚠ |

> **Nota sobre "KimünKo":** WCAG 1.4.3 exime el texto que forma parte de un logotipo o nombre de
> marca. En `WorkerTopNav.tsx:61,117` y `AdminSidebar.tsx:90` el conjunto funciona como marca →
> **exento**. En `login/page.tsx:138` está dentro de una frase corrida ("KimünKo · plataforma de
> capacitación de ONG Alumco") → **no exento**, ahí sí incumple.

**Como FONDO o adorno sin información → aceptable:**
`login/page.tsx:64` (gradiente radial) · `certificado/[certificateId]/page.tsx:86,89,137,166` ·
`CertificateBadge.tsx:25,55` (borde izquierdo y separador) · `WelcomeModal.tsx:36,40` ·
`landing/LandingNav.tsx:39` · `landing/ValoresSection.tsx:80,132` ·
`nav/WorkerSidebar.tsx:58,77,182,193` (gota y wordmark del logo) · `globals.css:537`.

**Como fondo que SÍ porta información → falla (tratado aparte):**
`didasko.css:634` (relleno de la barra de progreso, ver A11Y-17) ·
`didasko.css:1272` (subrayado del tab activo — acompañado de texto, ✅ cumple 1.4.1) ·
`lib/utils.ts:120` (`'Nutrición': '#F5A623'`, color de área en gráficos, ver A11Y-19).

**Casos mixtos que fallan por el texto encima:**
`CertificateBadge.tsx:79` y `certificado/DownloadCertificateButton.tsx:50` →
`bg-[#F5A623] text-white` = **2.03:1** (ver A11Y-07).

#### Inventario resumido de `#27AE60` (38) y `#E74C3C` (48)

**Como texto en cuerpo pequeño → ❌ 1.4.3:**
`QuizClient.tsx:205,227,368,511,557` · `(dashboard)/perfil/ProfileClient.tsx:349,352` ·
`admin/trabajadores/SuspendidosTable.tsx:62` · `admin/trabajadores/[id]/page.tsx:131` ·
`admin/trabajadores/[id]/WorkerActions.tsx:85` · `admin/ApprovalPanel.tsx:389` ·
`admin/WorkerEditPanel.tsx:146,307` · `CourseBuilder/BannerSelector.tsx:97,247` ·
`CourseBuilder/BlockPalette.tsx:196` · `CourseBuilder/BlockPropertiesPanel.tsx:98` ·
`CourseBuilder/CourseBuilder.tsx:294,299,308` · `CourseBuilder/QuestionForm.tsx:211` ·
`certificado/DownloadCertificateButton.tsx:71` · `curso/DeadlineCalendar.tsx:143` ·
`curso/PdfViewer.tsx:156` · `curso/VideoPlayer.tsx:152` · `shared/NotificationBell.tsx:38,101` ·
`error.tsx:33`.

**Como texto grande (≥ 24px o ≥ 18.66px bold) → umbral 3:1:**
`QuizClient.tsx:640` (`text-4xl font-black text-[#27AE60]`, ~40px) → 2.87:1 **❌ falla igual** ·
`QuizClient.tsx:687,738` (`text-[#E74C3C]`, ~40px) → 3.82:1 **✅ pasa** ·
`QuizClient.tsx:508` (`text-xl font-extrabold text-[#E74C3C]`, 22.5px bold) → 3.82:1 **✅ pasa**.

**Como fondo con texto blanco encima → ❌ (ver A11Y-07):**
`QuizClient.tsx:243,495,538,580,621,649` · `curso/VideoPlayer.tsx:101` · `curso/ModuleIndex.tsx:118`.

**Como fondo puro sin texto → ✅ aceptable:**
`QuizClient.tsx:158,198,491,532,669,721` · `admin/trabajadores/[id]/page.tsx:250` ·
`CourseBuilder/BlockCard.tsx:183` · `QuestionForm.tsx:178` · `QuizQuestionsEditor.tsx:85` ·
`error.tsx:28`.

#### `#2B4FA0` (121 ocurrencias)

Cumple 7.70:1 en todos sus usos como texto y como borde. Su **único** problema aparece cuando
se usa con opacidad (`ring-[#2B4FA0]/20`, `/30`) → ver A11Y-03.

#### `slate-400` (7 ocurrencias, todas ❌) y `slate-500` (3, todas ✅)

`error.tsx:51,78` · `not-found.tsx:65` · `shared/NotificationBell.tsx:121,167` ·
`shared/SearchBar.tsx:209` · `shared/WelcomeModal.tsx:160` — todas como texto de ayuda a 10–12px
sobre blanco o `bg-slate-50`. 2.56:1.

**Impacto en el usuario**

El anillo de foco a 2.03:1 afecta a toda persona que navegue con teclado: no ve dónde está el
cursor. Para el resto del inventario, quien tenga presbicia —mayoría del rango etario del
personal ELEAM— o mire la pantalla bajo la luz de un pasillo no leerá los porcentajes del quiz,
las etiquetas de urgencia de las notificaciones ni los mensajes de error del constructor.

**Fix propuesto**

Separar el ámbar "de marca" (fondos, gráficos, adornos) del ámbar "de texto y foco", que debe
oscurecerse. Los tres tokens accesibles **ya existen** en `didasko.css:39-46`.

```css
/* ANTES — didasko.css:82 */
:focus-visible {
  outline: 3px solid var(--ambar);      /* #F5A623 → 2.03:1 ❌ */
  outline-offset: 2px;
}

/* DESPUÉS — anillo de dos tonos: núcleo oscuro + halo de marca.
   El halo ámbar conserva la identidad; el núcleo aporta el contraste. */
:focus-visible {
  outline: 3px solid var(--azul-800);              /* #1E3A8A → 8.6:1 sobre crema ✅ */
  outline-offset: 2px;
  box-shadow: 0 0 0 6px rgba(245, 166, 35, 0.55);  /* halo de marca */
}
```

```tsx
/* ANTES — QuizClient.tsx:289 */
? 'bg-[#F5A623]/10 text-[#F5A623]'

/* DESPUÉS — mismo fondo de marca, texto legible */
? 'bg-[var(--ambar-50)] text-[var(--ambar-700)]'   /* #B45309 → 5.02:1 ✅ */
```

```tsx
/* ANTES — curso/VideoPlayer.tsx:152 */
<div className="flex items-center gap-2 text-[#27AE60] font-medium">

/* DESPUÉS — el verde del sistema DIDASKO ya es accesible */
<div className="flex items-center gap-2 text-[var(--ok)] font-medium">   /* #2E7D5B → 4.85:1 ✅ */
```

```tsx
/* ANTES — admin/WorkerEditPanel.tsx:146 */
<div className="bg-red-50 border border-[#E74C3C] … text-sm text-[#E74C3C]" role="alert">

/* DESPUÉS */
<div className="bg-[var(--peligro-bg)] border border-[var(--peligro)] … text-sm text-[var(--peligro)]" role="alert">
/* #BB3A2E → 5.28:1 ✅ */
```

Tabla de sustitución mecánica:

| Literal actual | Token de reemplazo | Valor | Ratio |
| :--- | :--- | :--- | ---: |
| `#F5A623` como texto | `var(--ambar-700)` | `#B45309` | 5.02:1 ✅ |
| `#27AE60` como texto | `var(--ok)` | `#2E7D5B` | 4.85:1 ✅ |
| `#E74C3C` como texto | `var(--peligro)` | `#BB3A2E` | 5.28:1 ✅ |
| `text-slate-400` | `text-[var(--tinta-2)]` | `#4B5268` | 7.36:1 ✅ |

**Riesgo de regresión**

Bajo en lo funcional, **medio en lo visual**: el verde y el rojo se ven notoriamente más
apagados y oscuros; el ámbar de texto pasa a leerse casi como marrón. El anillo de foco de dos
tonos ocupa 9 px en vez de 5 px, lo que puede solaparse con elementos vecinos en la barra de
tabs inferior (`didasko.css:1244`) y en las filas densas de tabla — verificar `outline-offset`
en esos dos contextos.

---

### A11Y-03 — `focus:outline-none` destruye el indicador de foco en 26 controles
- **Estado:** ✅ **Cerrado** — indicador de foco recuperado (e79972c)
- **Criterio WCAG:** 2.4.7 Foco visible (Nivel AA) · 1.4.11 Contraste de elementos no textuales (Nivel AA)
- **Severidad:** Bloqueante
- **Archivo:** 9 archivos, 26 ocurrencias (tabla abajo)
- **Vistas afectadas:** creación de cursos, constructor de cursos (paleta, propiedades, preguntas), panel de aprobación, edición de trabajador, índice de módulos, barra superior del trabajador, sidebar del trabajador.

**Descripción**

El patrón repetido es:

```tsx
/* admin/cursos/nuevo/page.tsx:206 — y 25 variantes más */
className="… focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] …"
```

Dos problemas encadenados:

1. **`focus:outline-none` gana la cascada.** Vive en `@layer utilities` de Tailwind, que está
   por encima de `@layer components`, donde vive el `:focus-visible { outline: 3px solid
   var(--ambar) }` de DIDASKO. Resultado: el contorno del sistema se elimina.
2. **El reemplazo es invisible.** `ring-[#2B4FA0]/20` es el azul de marca al **20 %** de
   opacidad; compuesto sobre blanco da `#D5DCEC` → **1.24:1**. La variante `/30` de
   `(dashboard)/TopBar.tsx:61` da **1.40:1**. Ambos muy por debajo del 3:1 de 1.4.11.

Se agrava porque se usa `focus:` en vez de `focus-visible:`: el anillo (invisible) también se
dispara al hacer clic con el mouse — ruido sin beneficio.

| Archivo | Líneas | Ring | Contraste |
| :--- | :--- | :--- | ---: |
| `admin/cursos/nuevo/page.tsx` | 206, 220, 235, 249 | `/20` | 1.24:1 ❌ |
| `admin/ApprovalPanel.tsx` | 196, 244, 263 | `/20` | 1.24:1 ❌ |
| `admin/WorkerEditPanel.tsx` | 162, 178, 192, 218 | `/20` | 1.24:1 ❌ |
| `admin/CourseBuilder/BlockPalette.tsx` | 222, 243, 260, 281, 302, 325, 348, 366 | `/20` | 1.24:1 ❌ |
| `admin/CourseBuilder/BlockPropertiesPanel.tsx` | 120, 161 | `/20` | 1.24:1 ❌ |
| `admin/CourseBuilder/QuestionForm.tsx` | 123, 165 | `/20` | 1.24:1 ❌ |
| `app/(dashboard)/TopBar.tsx` | 61 | `/30` | 1.40:1 ❌ |
| `nav/WorkerSidebar.tsx` | 113 | `ring-white/20` sobre azul | ~1.2:1 ❌ |
| `curso/ModuleIndex.tsx` | 194 | **sin opacidad** | 7.70:1 ✅ |

`ModuleIndex.tsx:194` es el único que cumple: usa `focus:ring-[#2B4FA0]` a opacidad plena. Es
el patrón a replicar (aunque también debería migrar a `focus-visible:`).

A esto se suman los componentes shadcn (`ui/input.tsx:11`, `ui/button.tsx:8`,
`ui/select.tsx:47`, `ui/textarea.tsx:10`, `ui/tabs.tsx:84`, `ui/dialog.tsx:64`,
`ui/alert-dialog.tsx:61`) que combinan `outline-none` con `focus-visible:ring-ring/50`: con el
`--ring` roto de A11Y-01 eso da **1.54:1**. Se corrige solo al reparar el token.

**Impacto en el usuario**

Quien llena "Nuevo curso" con teclado —o con un conmutador, o con control por voz— no sabe en
qué campo está escribiendo. En el constructor de cursos son 8 campos seguidos sin ninguna
indicación. Es exactamente el escenario que 2.4.7 existe para prevenir.

**Fix propuesto**

```tsx
/* ANTES — admin/cursos/nuevo/page.tsx:206 */
className="w-full h-12 px-4 rounded-lg border border-input bg-background text-base
           focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0]
           transition-colors"

/* DESPUÉS — sin outline-none; anillo a opacidad plena y sólo con teclado */
className="w-full h-12 px-4 rounded-lg border border-input bg-background text-base
           focus-visible:ring-2 focus-visible:ring-[#2B4FA0] focus-visible:border-[#2B4FA0]
           transition-colors"
```

Para los componentes de `ui/` no hace falta tocar archivos (están fuera de la convención del
proyecto): basta reparar `--ring` en A11Y-01.

**Riesgo de regresión**

Bajo. El cambio hace **más** visible el foco, no menos. Único efecto colateral: en los inputs
del constructor convivirán el anillo azul opaco y el contorno del sistema; conviene elegir uno
y quitar el otro para no duplicar. Pasar de `focus:` a `focus-visible:` elimina el destello al
hacer clic con el mouse — mejora, no regresión.

---

### A11Y-04 — El menú lateral móvil del admin es enfocable estando cerrado, y no atrapa el foco estando abierto
- **Estado:** ✅ **Cerrado** — `inert` y gestión de foco en cajones móviles (e79972c)
- **Criterio WCAG:** 2.4.3 Orden del foco (Nivel A) · 2.1.2 Sin trampas de teclado (Nivel A) · 4.1.2 Nombre, rol, valor (Nivel A)
- **Severidad:** Bloqueante
- **Archivo:** `src/components/alumco/nav/AdminSidebar.tsx:156-190`
- **Vistas afectadas:** todo `/admin/**` en viewport < 1024px.

**Descripción**

El cajón se oculta desplazándolo fuera de pantalla, no retirándolo del árbol:

```tsx
/* AdminSidebar.tsx:176-183 */
<aside
  className={
    'sidebar lg:hidden fixed left-0 h-screen z-50 transform transition-transform duration-300 ' +
    (isDrawerOpen ? 'translate-x-0' : '-translate-x-full')
  }
  aria-label="Menú de navegación"
>
```

`transform: translateX(-100%)` **no** elimina los elementos del orden de tabulación ni del
árbol de accesibilidad. Con el menú visualmente cerrado, al tabular desde el logo se recorren
los 9 enlaces de navegación, el botón de vista previa y el de cerrar sesión — todos invisibles,
fuera de pantalla. Quien usa teclado o lector queda perdido en un menú que no ve.

Cuando el cajón sí está abierto faltan las tres piezas del patrón de diálogo:

- No hay `role="dialog"` ni `aria-modal="true"`, pese a que hay un overlay que bloquea el resto.
- No hay trampa de foco: se puede tabular hacia el contenido de fondo.
- No hay manejador de `Escape` ni devolución del foco al botón "Abrir menú" al cerrar.

El disparador tampoco declara su relación con el panel:

```tsx
/* AdminSidebar.tsx:156-162 — sin aria-expanded ni aria-controls */
<button onClick={() => setIsDrawerOpen(true)} className="btn btn-secondary btn-icon btn-sm"
        aria-label="Abrir menú">
```

**Impacto en el usuario**

Un administrador o profesor que use la plataforma desde el teléfono con teclado externo, o con
TalkBack/VoiceOver, no puede navegar: el foco desaparece de la pantalla al tercer tabulador y
no hay forma de saber dónde está.

**Fix propuesto**

```tsx
/* ANTES — AdminSidebar.tsx:156-183 */
<button onClick={() => setIsDrawerOpen(true)} className="btn btn-secondary btn-icon btn-sm"
        aria-label="Abrir menú">
  <Menu className="h-5 w-5" />
</button>
{/* … */}
<aside
  className={'sidebar lg:hidden fixed left-0 h-screen z-50 transform transition-transform duration-300 ' +
    (isDrawerOpen ? 'translate-x-0' : '-translate-x-full')}
  aria-label="Menú de navegación"
>

/* DESPUÉS */
<button
  ref={botonMenuRef}
  onClick={() => setIsDrawerOpen(true)}
  className="btn btn-secondary btn-icon btn-sm"
  aria-label="Abrir menú"
  aria-expanded={isDrawerOpen}
  aria-controls="menu-admin-movil"
>
  <Menu className="h-5 w-5" aria-hidden="true" />
</button>
{/* … */}
<aside
  id="menu-admin-movil"
  role="dialog"
  aria-modal="true"
  aria-label="Menú de navegación"
  inert={!isDrawerOpen || undefined}   {/* saca todo del orden de foco al cerrar */}
  className={'sidebar lg:hidden fixed left-0 h-screen z-50 transform transition-transform duration-300 ' +
    (isDrawerOpen ? 'translate-x-0' : '-translate-x-full')}
>
```

Más el manejo de foco y `Escape` (mismo patrón que ya usa `SolicitarDiasModal.tsx:32`):

```tsx
useEffect(() => {
  if (!isDrawerOpen) return
  const previo = document.activeElement as HTMLElement | null
  cerrarBtnRef.current?.focus()
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsDrawerOpen(false) }
  document.addEventListener('keydown', onKey)
  return () => {
    document.removeEventListener('keydown', onKey)
    previo?.focus({ preventScroll: true })   // devuelve el foco al botón que abrió
  }
}, [isDrawerOpen])
```

`inert` está soportado en React 19 (el proyecto usa `react@19.2.3`) y en todos los navegadores
objetivo. Alternativa sin `inert`: renderizar el `<aside>` sólo cuando `isDrawerOpen`.

**Riesgo de regresión**

Bajo-medio. Con `inert` la animación de cierre sigue funcionando (el atributo no afecta al
renderizado visual). Si se opta por el renderizado condicional **se pierde la animación de
salida de 300 ms** — cambio visual perceptible. La devolución de foco puede provocar un salto
de scroll; se mitiga con `preventScroll: true`, ya incluido arriba.

---

### A11Y-05 — El tooltip "Sistema de intentos" del quiz es inalcanzable por teclado
- **Estado:** ✅ **Cerrado** — tooltip convertido en disclosure (8c14854)
- **Criterio WCAG:** 2.1.1 Teclado (Nivel A) · 1.4.13 Contenido al pasar el cursor o al enfocar (Nivel AA) · 4.1.2 Nombre, rol, valor (Nivel A)
- **Severidad:** Bloqueante
- **Archivo:** `src/app/(dashboard)/cursos/[id]/modulos/[moduleId]/quiz/QuizClient.tsx:299-322`
- **Vistas afectadas:** pantalla previa de toda evaluación (`/cursos/[id]/modulos/[moduleId]/quiz`).

**Descripción**

```tsx
/* QuizClient.tsx:299-322 */
<div className="relative group">
  <button type="button" className="p-1 …" aria-label="Información sobre intentos">
    <svg …/>   {/* icono ⓘ */}
  </button>

  <div className="absolute bottom-full … opacity-0 group-hover:opacity-100
                  transition-opacity duration-200 pointer-events-none z-50">
    <p className="font-semibold mb-1">Sistema de intentos</p>
    <ul className="space-y-1 text-white/80">
      <li>• Tienes {maxAttempts} intentos por evaluación</li>
      <li>• Al agotar los intentos debes reiniciar el curso</li>
      <li>• Tu mejor puntaje queda registrado</li>
      <li>• El administrador puede habilitar nuevos intentos</li>
    </ul>
  </div>
</div>
```

Tres incumplimientos:

1. **2.1.1 (Teclado).** El único disparador es `group-hover`. Enfocar el botón con Tab no
   muestra nada; el contenido es inalcanzable sin mouse. El `<button>` existe pero no hace
   absolutamente nada: no tiene `onClick`, no cambia estado.
2. **1.4.13.** El popover no es *descartable* (no hay `Escape`), no es *hoverable*
   (`pointer-events-none` impide llevar el puntero encima para leerlo con calma o
   seleccionarlo) y no es *persistente* (desaparece en cuanto el puntero se mueve).
3. **4.1.2.** El botón anuncia "Información sobre intentos" pero no expone que controla un
   panel ni si está abierto: falta `aria-expanded` y `aria-controls`/`aria-describedby`. El
   contenido del tooltip nunca llega al árbol de accesibilidad como algo relacionado con él.

**Impacto en el usuario**

El tooltip contiene la única explicación de una regla con consecuencias reales: *"al agotar los
intentos debes reiniciar el curso"*. Quien no use mouse —teclado, lector de pantalla, o
simplemente un teléfono, donde `:hover` no existe— rinde la evaluación sin saber que agotar los
intentos le borra el progreso del curso completo. Dado que la plataforma se usa
mayoritariamente en móvil, esto afecta a **la mayoría** de los usuarios, no a una minoría.

**Fix propuesto**

Convertirlo en un *disclosure* con estado, disparado por clic y por foco, descartable con
`Escape` y hoverable:

```tsx
/* DESPUÉS — QuizClient.tsx:299-322 */
const [infoAbierta, setInfoAbierta] = useState(false)

<div
  className="relative"
  onMouseEnter={() => setInfoAbierta(true)}
  onMouseLeave={() => setInfoAbierta(false)}
  onKeyDown={(e) => { if (e.key === 'Escape') setInfoAbierta(false) }}
>
  <button
    type="button"
    className="p-1 text-[var(--tinta-3)] hover:text-[var(--ambar-700)] transition-colors rounded-full"
    aria-label="Información sobre intentos"
    aria-expanded={infoAbierta}
    aria-controls="info-intentos"
    onClick={() => setInfoAbierta((v) => !v)}
    onFocus={() => setInfoAbierta(true)}
    onBlur={() => setInfoAbierta(false)}
  >
    <svg aria-hidden="true" …/>
  </button>

  <div
    id="info-intentos"
    role="tooltip"
    hidden={!infoAbierta}
    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64
               bg-[var(--tinta)] text-white text-xs rounded-xl p-3 shadow-lg z-50"
  >
    <p className="font-semibold mb-1">Sistema de intentos</p>
    <ul className="space-y-1">…</ul>
  </div>
</div>
```

Cambios clave: se elimina `opacity-0`/`pointer-events-none` (que son lo que rompía
*hoverable*), el estado sustituye a `group-hover`, y `hidden` retira el contenido del árbol
cuando está cerrado. Nótese también `text-white/80` → `text-white` en la lista: el 80 % sobre
`--tinta` (`#21283B`) da 11.4:1 y pasa, pero no hay razón para degradarlo.

**Alternativa recomendada:** dado que este texto es información esencial —no un adorno—,
considerar sacarlo del tooltip y mostrarlo siempre, en un `<details>` o en un bloque plegable
bajo la badge de intentos. Es un cambio de diseño; ver la lista final.

**Riesgo de regresión**

Bajo. El popover pasa a ocupar espacio real en el árbol y a responder al foco, así que aparecerá
también al tabular (comportamiento deseado). En móvil, donde no hay `hover`, ahora se abre al
tocar — antes no se abría nunca. Verificar que el popover posicionado con `bottom-full` no
quede cortado por el borde superior del contenedor en pantallas de 320 px.

---

### A11Y-06 — Los radios del quiz y del panel de accesibilidad son `sr-only`: sin foco visible y sin agrupación
- **Estado:** ✅ **Cerrado** — `role="radiogroup"` y anillo de foco en la etiqueta (8c14854)
- **Criterio WCAG:** 2.4.7 Foco visible (Nivel AA) · 1.3.1 Información y relaciones (Nivel A) · 4.1.2 Nombre, rol, valor (Nivel A)
- **Severidad:** Bloqueante
- **Archivo:** `src/app/(dashboard)/cursos/[id]/modulos/[moduleId]/quiz/QuizClient.tsx:812-861` · `src/components/alumco/shared/AccessibilityPanel.tsx:76-95`
- **Vistas afectadas:** rendición de toda evaluación; panel de preferencias de accesibilidad (perfil trabajador y perfil admin).

**Descripción**

En el quiz, cada alternativa es un `<label>` estilizado con un `<input type="radio">` oculto:

```tsx
/* QuizClient.tsx:812-836 */
<label key={option.id} style={{ border: '2px solid ' + (sel ? 'var(--ambar)' : 'var(--borde)'),
                                background: sel ? 'var(--ambar-50)' : 'var(--blanco)', … }}>
  <input type="radio" name={question.id} value={option.id} checked={sel}
         onChange={() => onSelect(option.id)} className="sr-only" />
  <span style={{ … }}>{sel && <svg …/>}</span>
  <div className="crece">
    <span style={{ fontWeight: 700 }}>{option.id.toUpperCase()}) </span>
    <span>{option.text}</span>
  </div>
</label>
```

Tres fallos:

1. **2.4.7 — el foco es invisible.** El `<input>` es quien recibe el foco, y está en `sr-only`
   (clip a 1×1 px). El `:focus-visible` ámbar del sistema se dibuja alrededor de ese píxel, no
   alrededor del `<label>`. Al tabular por las 4 alternativas de una pregunta **no se ve nada
   moverse**. No hay ningún `:has(:focus-visible)` ni `peer-focus-visible` que traslade el
   indicador al contenedor visible.
2. **1.3.1 — no hay grupo.** El enunciado (`QuestionCard`, línea 806) es un `<p>` suelto. Los
   4 radios comparten `name={question.id}`, lo que los agrupa para el navegador pero **no** los
   asocia con la pregunta para el lector de pantalla. No hay `<fieldset>/<legend>` ni
   `role="radiogroup"` + `aria-labelledby`. Un lector anuncia "A) Cada 2 horas, botón de
   opción, 1 de 4" sin decir nunca a qué pregunta pertenece.
3. **4.1.2 — el estado seleccionado también se comunica sólo por color/borde.** El check SVG
   dentro del `<span>` sí aporta una segunda señal, así que 1.4.1 se salva; pero el borde ámbar
   (`--ambar` sobre `--borde`) da 1.7:1 entre estado seleccionado y no seleccionado → falla
   1.4.11 como indicador de estado.

En `AccessibilityPanel.tsx:76-95` el patrón se repite con un agravante irónico: es el panel de
**preferencias de accesibilidad**, y sus tres botones de tamaño de letra son radios `sr-only`
dentro de `<label className="btn btn-primary|btn-secondary">`. Ahí sí hay `<fieldset>` y
`<legend>` (líneas 73-74) → 1.3.1 cumple; pero el foco sigue siendo invisible y el estado
seleccionado se distingue sólo por el color del botón (ámbar vs blanco) → **1.4.1 falla**.

**Impacto en el usuario**

Un trabajador que rinde la evaluación con teclado no puede saber qué alternativa tiene
seleccionada ni dónde está el cursor: debe adivinar. Como el resultado de la evaluación
determina si obtiene el certificado —y agotar los intentos le reinicia el curso completo— el
costo del error no es cosmético. En el panel de accesibilidad, la persona que más necesita esas
opciones es precisamente la que no puede operarlas.

**Fix propuesto**

Trasladar el indicador de foco del input oculto al contenedor visible, y agrupar:

```tsx
/* ANTES — QuizClient.tsx:805-812 (extracto) */
<div className="crece">
  <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, lineHeight: 1.35 }}>
    {question.question_text}
  </p>
  <div className="col" style={{ gap: 10 }}>
    {options.map((option) => {
      …
      <label key={option.id} style={{ … }}>

/* DESPUÉS */
<fieldset className="crece" style={{ border: 'none', padding: 0, margin: 0 }}>
  <legend style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, lineHeight: 1.35 }}>
    Pregunta {index + 1}: {question.question_text}
  </legend>
  <div className="col" style={{ gap: 10 }}>
    {options.map((option) => {
      …
      <label key={option.id} className="opcion-quiz" data-sel={sel || undefined} style={{ … }}>
```

Y en `didasko.css`, una regla que dibuja el foco sobre la caja visible:

```css
/* NUEVO — didasko.css */
.opcion-quiz:has(input:focus-visible) {
  outline: 3px solid var(--azul-800);
  outline-offset: 2px;
}
/* Estado seleccionado con contraste suficiente (1.4.11) */
.opcion-quiz[data-sel] {
  border-color: var(--ambar-700);   /* #B45309 sobre #E8E1D4 → 3.4:1 ✅ */
  border-width: 3px;
}
```

`:has()` ya se usa en el proyecto (`globals.css:498-520`, la mascota del login), así que no
introduce una técnica nueva. Alternativa equivalente sin `:has()`: mover el `<input>` a
hermano previo del contenido y usar `peer` + `peer-focus-visible:` de Tailwind.

El mismo par de reglas resuelve `AccessibilityPanel.tsx`, añadiendo además un indicador no
cromático al botón activo:

```tsx
/* ANTES — AccessibilityPanel.tsx:77-81 */
<label className={prefs.font_scale === escala ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
       style={{ cursor: 'pointer', fontSize: 13 + i * 2 }}>

/* DESPUÉS — el ✓ comunica la selección sin depender del color */
<label className={'opcion-quiz btn btn-sm ' + (prefs.font_scale === escala ? 'btn-primary' : 'btn-secondary')}
       data-sel={prefs.font_scale === escala || undefined}
       style={{ cursor: 'pointer', fontSize: 13 + i * 2 }}>
  …
  {prefs.font_scale === escala && <span aria-hidden="true">✓ </span>}
  {FONT_SCALE_LABELS[escala]}
</label>
```

**Riesgo de regresión**

Bajo-medio. `<fieldset>` trae márgenes y bordes por defecto del navegador: hay que neutralizarlos
(`border: none; padding: 0; margin: 0`), como ya se hace en `AccessibilityPanel.tsx:73`. El
`<legend>` no acepta todos los `display` en navegadores antiguos, pero los objetivo están bien.
El borde de 3 px en el estado seleccionado desplaza 1 px el contenido de la tarjeta; usar
`outline` en lugar de `border-width` si el salto molesta.

---

### A11Y-07 — Botones principales con texto blanco sobre ámbar (2.03:1) y sobre verde (2.87:1)
- **Estado:** ✅ **Cerrado** — tinta oscura sobre ámbar, `var(--ok)` bajo blanco (8c14854)
- **Criterio WCAG:** 1.4.3 Contraste (mínimo) (Nivel AA)
- **Severidad:** Bloqueante
- **Archivo:** `QuizClient.tsx:172,243,495,538,580,621,649,695,747` · `curso/VideoPlayer.tsx:101` · `curso/ModuleIndex.tsx:118` · `certificado/CertificateBadge.tsx:79` · `certificado/DownloadCertificateButton.tsx:50`
- **Vistas afectadas:** evaluación (todos los estados), reproductor de video, índice de módulos, insignia y descarga de certificado.

**Descripción**

Conviven dos criterios opuestos para el mismo botón ámbar. El sistema DIDASKO lo resuelve bien:

```css
/* didasko.css:128-131 y 550-553 — correcto */
.btn-primary { background: var(--ambar); color: #0f172a; }         /* 8.9:1 ✅ */
body[data-tema="didasko"] .btn-primary { background: var(--ambar); color: var(--azul-950); }
```

Pero los botones escritos a mano en Tailwind ponen texto **blanco** encima:

| Archivo:línea | Clase | Ratio | Umbral |
| :--- | :--- | ---: | :--- |
| `QuizClient.tsx:172` | `bg-[var(--ambar)] text-white` — "Reiniciar curso" | **2.03:1** ❌ | 4.5:1 |
| `QuizClient.tsx:695` | `bg-[var(--ambar)] text-white` — "Reintentar evaluación" (18px) | **2.03:1** ❌ | 3:1 |
| `QuizClient.tsx:747` | `bg-[var(--ambar)] text-white` — "Reiniciar curso" (18px) | **2.03:1** ❌ | 3:1 |
| `QuizClient.tsx:582` | `bg-[var(--ambar)] text-white` — "Reintentar (N intentos)" | **2.03:1** ❌ | 4.5:1 |
| `CertificateBadge.tsx:79` | `bg-[#F5A623] text-white` — "Descargar certificado" | **2.03:1** ❌ | 4.5:1 |
| `DownloadCertificateButton.tsx:50` | `bg-[#F5A623] text-white` | **2.03:1** ❌ | 4.5:1 |
| `QuizClient.tsx:243,649` | `bg-[#27AE60] text-white` (`text-lg` semibold ≈ 20px) | **2.87:1** ❌ | 3:1 |
| `QuizClient.tsx:580` | `bg-[#27AE60] text-white` — "Continuar →" | **2.87:1** ❌ | 4.5:1 |
| `VideoPlayer.tsx:101` | `bg-[#27AE60] text-white` — "Marcar como visto" | **2.87:1** ❌ | 4.5:1 |
| `QuizClient.tsx:495,538` · `ModuleIndex.tsx:118` | icono blanco sobre `#27AE60`/`#E74C3C` | 2.87 / 3.82 | 3:1 (1.4.11) |

Los casos de `#27AE60` fallan por poco (2.87 frente a 3.0) pero fallan; los de ámbar fallan por
un factor de más del doble.

**Impacto en el usuario**

"Reintentar evaluación", "Descargar certificado" y "Marcar como visto" son los tres botones que
cierran las tareas centrales del trabajador. Con presbicia o con la pantalla al sol, el texto
blanco sobre ámbar se lee como una mancha: se sabe que hay un botón, no qué dice. El usuario
puede terminar pulsando "Reiniciar curso" creyendo que reintenta la evaluación — y ese botón
borra el progreso completo.

**Fix propuesto**

Usar las clases del sistema en vez de reimplementar el botón. `.btn.btn-primary` ya trae el
color de texto correcto, la altura mínima y el foco:

```tsx
/* ANTES — QuizClient.tsx:693-702 */
<button
  onClick={handleRetry}
  className="w-full py-4 bg-[var(--ambar)] text-white rounded-lg font-semibold
             hover:bg-[var(--ambar-600)] transition-colors flex items-center
             justify-center gap-2 text-lg min-h-[48px]"
>
  <svg className="w-5 h-5" …/>
  Reintentar evaluación
</button>

/* DESPUÉS — mismo aspecto, texto navy sobre ámbar = 8.9:1 */
<button onClick={handleRetry} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
  <svg className="w-5 h-5" aria-hidden="true" …/>
  Reintentar evaluación
</button>
```

Para los verdes, oscurecer el fondo en vez de aclarar el texto:

```tsx
/* ANTES — curso/VideoPlayer.tsx:99-106 */
className="inline-flex items-center gap-2 px-6 py-3 bg-[#27AE60] text-white font-semibold
           rounded-lg hover:bg-[#27AE60]/90 … min-h-[48px]"

/* DESPUÉS — var(--ok) = #2E7D5B → blanco encima = 5.34:1 ✅ */
className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--ok)] text-white font-semibold
           rounded-lg hover:bg-[#256a4c] … min-h-[48px]"
```

**Riesgo de regresión**

Medio y visual. El botón ámbar con texto navy se ve menos "brillante" que con texto blanco —
pero es exactamente lo que ya hacen todos los `.btn-primary` del resto de la plataforma, así
que el cambio **aumenta** la coherencia (3.2.4). El verde `#2E7D5B` es notoriamente más apagado
que `#27AE60`. Reemplazar por `.btn btn-primary` además cambia el radio de esquina de
`rounded-lg` (8 px) a `--radio-m` (9 px) y la sombra: diferencia imperceptible.

---

### A11Y-08 — El buscador global no tiene etiqueta, no expone su rol de combobox y anuncia atajos que no existen
- **Estado:** ✅ **Cerrado** — etiqueta real, `role="search"`, Escape y anuncio de resultados (8c14854)
- **Criterio WCAG:** 3.3.2 Etiquetas o instrucciones (Nivel A) · 4.1.2 Nombre, rol, valor (Nivel A) · 2.1.1 Teclado (Nivel A) · 4.1.3 Mensajes de estado (Nivel AA)
- **Severidad:** Bloqueante
- **Archivo:** `src/components/alumco/shared/SearchBar.tsx:90-214`
- **Vistas afectadas:** barra superior de admin y de trabajador (búsqueda de cursos y de trabajadores).

**Descripción**

```tsx
/* SearchBar.tsx:92-101 — el input no tiene ni <label> ni aria-label */
<input
  ref={inputRef}
  type="text"
  value={query}
  onChange={handleChange}
  onFocus={() => { if (query.trim().length >= 2) setIsOpen(true) }}
  placeholder={placeholder ?? 'Buscar...'}
/>
```

Cinco problemas:

1. **3.3.2 — el `placeholder` es el único texto.** No hay `<label>` ni `aria-label`. Un lector
   de pantalla anuncia "cuadro de edición" sin más; y el placeholder desaparece al escribir, de
   modo que quien tenga dificultades de memoria de trabajo pierde la única pista disponible.
   (Compárese con `WorkersTable.tsx:118`, donde el mismo tipo de input **sí** lleva
   `aria-label="Buscar trabajador"` — la inconsistencia es interna.)
2. **4.1.2 — no hay semántica de combobox.** El input abre una lista de resultados debajo, pero
   no declara `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete` ni
   `aria-activedescendant`. Para un lector, el desplegable simplemente no existe.
3. **2.1.1 — no se puede cerrar con teclado.** El único cierre es `mousedown` fuera
   (`SearchBar.tsx:28-37`). No hay `onKeyDown`. Quien navega con teclado abre el desplegable y
   ya no puede descartarlo sin tabular por todos los resultados.
4. **Instrucciones falsas.** El pie del desplegable dice:

   ```tsx
   /* SearchBar.tsx:209-211 */
   <p className="text-[10px] text-slate-400 text-center">
     Presiona Enter para buscar · Esc para cerrar
   </p>
   ```

   **Ninguna de las dos teclas está implementada.** No hay manejador de `Enter` ni de `Escape`
   en todo el componente. La instrucción es literalmente falsa, lo que es peor que no darla.
5. **4.1.3 — los resultados aparecen sin anuncio.** El desplegable se puebla tras un `debounce`
   de 300 ms y una llamada al servidor, sin `aria-live`. Nada informa "3 resultados" ni "sin
   resultados".

Además `text-slate-400` (líneas 209) da 2.56:1 → falla 1.4.3 (ya contabilizado en A11Y-02).

**Impacto en el usuario**

Una administradora que use lector de pantalla no puede usar el buscador en absoluto: no sabe
qué es el campo, no percibe que aparecieron resultados y no puede cerrarlos. Y a quien lee el
pie del desplegable la aplicación le miente sobre cómo operarlo.

**Fix propuesto**

```tsx
/* DESPUÉS — SearchBar.tsx:90-114 */
<div className="input-busqueda" style={{ width: '100%' }}>
  <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--tinta-3)' }} aria-hidden="true" />
  <input
    ref={inputRef}
    id="buscador-global"
    type="text"
    role="combobox"
    aria-label={placeholder ?? 'Buscar cursos y trabajadores'}
    aria-expanded={isOpen}
    aria-controls="resultados-busqueda"
    aria-autocomplete="list"
    value={query}
    onChange={handleChange}
    onKeyDown={(e) => {
      if (e.key === 'Escape') { setIsOpen(false); inputRef.current?.blur() }
    }}
    onFocus={() => { if (query.trim().length >= 2) setIsOpen(true) }}
    placeholder={placeholder ?? 'Buscar...'}
  />
  {/* … */}
</div>

{/* Anuncio de resultados para lectores de pantalla */}
<p role="status" aria-live="polite" className="sr-only">
  {isPending
    ? 'Buscando…'
    : isOpen
      ? `${results.courses.length + results.workers.length} resultados para ${query}`
      : ''}
</p>

{isOpen && (
  <div id="resultados-busqueda" role="listbox" aria-label="Resultados de búsqueda" className="absolute …">
    {/* cada <button> de resultado pasa a role="option" aria-selected={false} */}
```

Y corregir el pie para que describa lo que el componente realmente hace:

```tsx
/* ANTES — SearchBar.tsx:209-211 */
<p className="text-[10px] text-slate-400 text-center">
  Presiona Enter para buscar · Esc para cerrar
</p>

/* DESPUÉS — texto verdadero y con contraste suficiente */
<p className="text-[11px] text-[var(--tinta-2)] text-center">
  Esc para cerrar
</p>
```

**Riesgo de regresión**

Bajo. Añadir `role="combobox"` / `role="listbox"` / `role="option"` no cambia nada visualmente,
pero **sí** cambia cómo un lector recorre la lista: conviene probarlo con NVDA o VoiceOver antes
de dar por cerrado. Subir el pie de 10 px a 11 px y cambiar el color lo hace algo más presente
en el diseño. El `Escape` con `blur()` puede sorprender a quien esperaba conservar el foco en el
campo; si molesta, quitar el `blur()` y sólo cerrar la lista.

---

## Hallazgos de severidad alta

### A11Y-09 — No existe enlace "Saltar al contenido principal" (el destino sí existe)
- **Estado:** ✅ **Cerrado** — enlace de salto al contenido principal (66aa19c)
- **Criterio WCAG:** 2.4.1 Evitar bloques (Nivel A)
- **Severidad:** Alta
- **Archivo:** `src/app/(dashboard)/layout.tsx:50-53` · `src/app/admin/layout.tsx:59` · `src/app/layout.tsx:77-88`
- **Vistas afectadas:** todas.

**Descripción**

El ancla está puesta pero nadie la enlaza:

```tsx
/* (dashboard)/layout.tsx:50-53 — el id existe… */
<main
  id="main-content"
  className="relative z-10 flex-1 w-full mx-auto max-w-[1080px] px-5 pt-7 …"
>
```

```bash
$ grep -rni 'skip\|saltar al contenido\|#main-content' src --include=*.tsx
# (sin resultados)
```

…pero no hay ningún enlace hacia él. En `/admin/**` el problema es mayor: el `<main>` de
`admin/layout.tsx:59` **ni siquiera tiene `id`**, y antes de llegar a él hay un sidebar con 9
enlaces de navegación más el logo, el botón de vista previa, el avatar y el de cerrar sesión —
13 paradas de tabulación que se repiten idénticas en cada página.

**Impacto en el usuario**

Quien navega con teclado o con conmutador debe recorrer 13 controles en cada cambio de página
antes de llegar al contenido. En un flujo típico de administración (dashboard → trabajadores →
detalle → volver) son más de 50 pulsaciones de Tab sólo para atravesar menús ya conocidos.

**Fix propuesto**

Un enlace visible sólo al recibir foco, como primer hijo del `<body>`, más el `id` faltante:

```tsx
/* DESPUÉS — src/app/layout.tsx, primer hijo del <body> */
<a href="#main-content" className="skip-link">Saltar al contenido principal</a>
{children}
```

```css
/* NUEVO — didasko.css (fuera de @layer para que gane a las utilidades) */
.skip-link {
  position: absolute;
  left: 8px;
  top: -100px;              /* fuera de la vista, pero enfocable */
  z-index: 100;
  padding: 12px 20px;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  background: var(--azul-800);
  color: #fff;
  font-weight: 700;
  border-radius: var(--radio-m);
  text-decoration: none;
  transition: top 0.15s ease;
}
.skip-link:focus-visible {
  top: 8px;                 /* aparece al enfocar */
}
```

```tsx
/* ANTES — admin/layout.tsx:59 */
<main className="relative z-10 flex-1 w-full min-w-0 mx-auto max-w-[1240px] p-4 lg:px-8 lg:py-7">

/* DESPUÉS */
<main id="main-content" tabIndex={-1}
      className="relative z-10 flex-1 w-full min-w-0 mx-auto max-w-[1240px] p-4 lg:px-8 lg:py-7">
```

`tabIndex={-1}` en el `<main>` es necesario para que el foco realmente se mueva ahí al activar
el enlace (sin él, algunos navegadores mueven sólo el scroll).

**Riesgo de regresión**

Muy bajo. El enlace es invisible salvo al enfocarlo. Único punto de cuidado: `.skip-link` es un
`<a>` y por tanto hereda el `min-height: 48px` de `globals.css:79-87` (ver A11Y-16); al
posicionarlo en `absolute` no afecta al flujo. Verificar que no quede tapado por el banner de
demo (`--demo-banner-h`), que también usa `position: fixed`.

---

### A11Y-10 — El login no tiene landmarks y su `<h1>` está oculto en móvil
- **Estado:** ✅ **Cerrado** — landmarks y `<h1>` del login (66aa19c)
- **Criterio WCAG:** 1.3.1 Información y relaciones (Nivel A) · 2.4.6 Encabezados y etiquetas (Nivel AA)
- **Severidad:** Alta
- **Archivo:** `src/app/(auth)/login/page.tsx:23,26-27,98,141` · `src/app/(auth)/layout.tsx:7`
- **Vistas afectadas:** `/login` (y por herencia todo el grupo `(auth)` salvo `/registro`).

**Descripción**

El layout del grupo es un fragmento vacío:

```tsx
/* (auth)/layout.tsx:2-8 */
export default function AuthLayout({ children }) {
  return <>{children}</>
}
```

Y la página no aporta ningún landmark: la raíz es un `<div className="login-shell …">`
(`login/page.tsx:23`). No hay `<main>`, `<header>` ni `<nav>`. Un lector de pantalla que use
navegación por regiones no encuentra nada. `/registro` **sí** tiene `<main>`
(`registro/page.tsx:12`), así que la inconsistencia es interna.

El problema de encabezados es más sutil. El único `<h1>` vive en el panel de marca:

```tsx
/* login/page.tsx:26-27 — el panel entero se oculta bajo 768 px */
<div className="hidden md:flex film-grain" style={{ flex: '0 0 44%', … }}>
  …
  <h1 className="t-display" style={{ fontSize: 42, color: '#fff', marginTop: 16 }}>
    Nuestros cuidados son el reflejo de la <span …>empatía</span>.
  </h1>
```

```tsx
/* login/page.tsx:141 — lo que sí se ve en móvil es un h2 */
<h2 className="t-display login-titulo" style={{ fontSize: 27, textAlign: 'center' }}>
  Ingreso a la plataforma
</h2>
```

`hidden` de Tailwind es `display: none`, que **retira el elemento del árbol de accesibilidad**.
En móvil —el caso mayoritario— la página empieza directamente en `<h2>`: salto de jerarquía y
página sin `<h1>`. Además el `<h1>` que sí existe en escritorio ("Nuestros cuidados son el
reflejo de la empatía") es un eslogan, no describe la página: falla 2.4.6.

**Impacto en el usuario**

Quien navega por encabezados (una de las técnicas más usadas con lector de pantalla) no
encuentra el título de la página de ingreso en móvil. Y en escritorio, el primer encabezado que
oye es un eslogan institucional, no "Ingreso a la plataforma".

**Fix propuesto**

Promover el título del formulario a `<h1>` y degradar el eslogan a `<p>`; envolver el panel del
formulario en `<main>`:

```tsx
/* ANTES — login/page.tsx:98-100 */
<h1 className="t-display" style={{ fontSize: 42, color: '#fff', marginTop: 16 }}>
  Nuestros cuidados son el reflejo de la <span style={{ fontStyle: 'italic', … }}>empatía</span>.
</h1>

/* DESPUÉS — es un eslogan decorativo, no el título de la página */
<p className="t-display" style={{ fontSize: 42, color: '#fff', marginTop: 16 }}>
  Nuestros cuidados son el reflejo de la <span style={{ fontStyle: 'italic', … }}>empatía</span>.
</p>
```

```tsx
/* ANTES — login/page.tsx:114-115 y 141 */
<div className="crece login-panel-form" style={{ … }}>
  <div className="col entra entra-1" style={{ width: 430, maxWidth: '100%', gap: 0 }}>
    …
    <h2 className="t-display login-titulo" style={{ fontSize: 27, textAlign: 'center' }}>
      Ingreso a la plataforma
    </h2>

/* DESPUÉS — landmark + h1 real, visible en todos los tamaños */
<main className="crece login-panel-form" style={{ … }}>
  <div className="col entra entra-1" style={{ width: 430, maxWidth: '100%', gap: 0 }}>
    …
    <h1 className="t-display login-titulo" style={{ fontSize: 27, textAlign: 'center' }}>
      Ingreso a la plataforma
    </h1>
```

**Riesgo de regresión**

Muy bajo. `.login-titulo` fija `font-size` explícitamente (`globals.css:789`), así que cambiar
`h2`→`h1` no altera el tamaño; sí hereda `h1 { font-weight: 700 }` de `globals.css:104` en
lugar de `h2 { 600 }`, pero `.t-display` lo sobrescribe con `font-weight: 800` en el tema
DIDASKO (`didasko.css:498`). Cambiar el `<div>` exterior a `<main>` no altera estilos: la clase
`.login-panel-form` no depende del selector de elemento.

---

### A11Y-11 — "Tu recorrido": el estado del curso se comunica sólo por color, y `role="listitem"` anula el rol de enlace
- **Estado:** ✅ **Cerrado** — `role="listitem"` corregido antes; el estado del curso viaja ahora en
  texto (2026-08-14). **Matiz:** se cerró por la vía alternativa que el propio hallazgo contempla,
  sin tocar el texto visible. El nodo distingue los tres estados por **forma** (visto bueno / gota /
  punto), que ya es un canal no cromático; lo que faltaba era el equivalente textual, porque el nodo
  va `aria-hidden`. La subetiqueta añade `<span class="sr-only"> de N · Completado|En curso|
  Pendiente</span>`. Sustituir el «Curso N» visible por el estado sigue **pendiente de decisión de
  la clienta** (§ 3, decisión 4) — es una mejora de contenido, ya no un incumplimiento
- **Criterio WCAG:** 1.4.1 Uso del color (Nivel A) · 4.1.2 Nombre, rol, valor (Nivel A) · 1.3.1 Información y relaciones (Nivel A)
- **Severidad:** Alta
- **Archivo:** `src/components/alumco/curso/RecorridoCapas.tsx:25-62`
- **Vistas afectadas:** `/inicio` (pantalla de entrada del trabajador — la más visitada de la plataforma).

**Descripción**

```tsx
/* RecorridoCapas.tsx:35-59 */
const subColor = hecho ? 'var(--ok)' : actual ? 'var(--ambar-700)' : 'var(--tinta-3)'
const sub = `Curso ${i + 1}`
…
<Link href={e.href} className="recorrido-col" role="listitem" key={e.id}>
  <div className="recorrido-linea">
    <span className="recorrido-conector" style={{ background: lineaIzq }} />
    <span className={'recorrido-nodo ' + (hecho ? 'es-hecho' : actual ? 'es-actual' : 'es-seco')}
          aria-hidden="true">
      {hecho ? <Icono n="check" s={20} /> : actual ? <Gota s={20} color="#fff" /> : <span className="recorrido-punto" />}
    </span>
    <span className="recorrido-conector" style={{ background: lineaDer }} />
  </div>
  <div className="recorrido-texto">
    <div className="recorrido-titulo">{e.titulo}</div>
    <div className="recorrido-sub" style={{ color: subColor }}>{sub}</div>
  </div>
</Link>
```

Dos fallos graves:

1. **1.4.1 — el color es el único canal.** El texto de la subetiqueta es `Curso ${i+1}` para
   **los tres estados**: "Curso 1", "Curso 2", "Curso 3". Lo único que distingue completado de
   pendiente es el color del texto (`--ok` verde / `--ambar-700` / `--tinta-3` gris) y el icono
   del nodo. Y el nodo está marcado `aria-hidden="true"` (línea 44), así que para un lector de
   pantalla **no queda ninguna señal**: los tres estados se anuncian idénticos. Para alguien con
   daltronismo deutan, verde y gris a ese tamaño son indistinguibles.
2. **4.1.2 — `role="listitem"` sobre un `<a>` borra el rol de enlace.** ARIA sustituye el rol
   implícito: el elemento deja de anunciarse como enlace. La navegación por lista de enlaces
   (otra técnica habitual) no lo encuentra, y quien lo enfoca no sabe que al pulsar Enter va a
   navegar. El marcado correcto exige un `<li>` intermedio.

**Impacto en el usuario**

`/inicio` es la primera pantalla del trabajador y este componente es su mapa de avance. Un
trabajador con daltonismo o con lector de pantalla no puede saber qué cursos ya completó ni
cuál le toca — que es la única función del componente.

**Fix propuesto**

Estructura de lista real, con el estado en texto:

```tsx
/* DESPUÉS — RecorridoCapas.tsx:24-62 */
const ESTADO_TEXTO = { hecho: 'Completado', actual: 'En curso', seco: 'Pendiente' } as const
…
<ul className="recorrido-capas" aria-label="Tu recorrido de cursos">
  {estaciones.map((e, i) => {
    const hecho = e.estado === 'completado'
    const actual = i === indiceActual && !hecho
    const claveEstado = hecho ? 'hecho' : actual ? 'actual' : 'seco'
    …
    return (
      <li key={e.id}>
        <Link href={e.href} className="recorrido-col">
          <div className="recorrido-linea">
            …
          </div>
          <div className="recorrido-texto">
            <div className="recorrido-titulo">{e.titulo}</div>
            <div className="recorrido-sub" style={{ color: subColor }}>
              {ESTADO_TEXTO[claveEstado]}          {/* «Completado» / «En curso» / «Pendiente» */}
              <span className="sr-only"> · curso {i + 1} de {estaciones.length}</span>
            </div>
          </div>
        </Link>
      </li>
    )
  })}
</ul>
```

El CSS necesita dos líneas para que `<ul>`/`<li>` no rompan la retícula horizontal:

```css
/* NUEVO — didasko.css, junto a .recorrido-capas (l.1074) */
.recorrido-capas { list-style: none; margin: 0; padding: 0 0 4px; }
.recorrido-capas > li { display: contents; }   /* el <li> no interfiere con grid-auto-flow: column */
```

**Riesgo de regresión**

Medio. `display: contents` en el `<li>` mantiene intacta la retícula (`grid-auto-flow: column`,
`grid-auto-columns`) y el `scroll-snap-align` del `.recorrido-col`. Hay que verificarlo en
Safari, donde `display: contents` históricamente eliminaba semántica —hoy corregido, pero el
`role="list"` explícito en el `<ul>` puede añadirse como red de seguridad. Sustituir "Curso N"
por "Completado/En curso/Pendiente" **cambia el texto visible** de la pantalla de inicio: es una
decisión de contenido que conviene confirmar con la clienta (ver lista final).

---

### A11Y-12 — Los ocho diálogos declaran `aria-modal` pero ninguno atrapa ni devuelve el foco
- **Estado:** ✅ **Cerrado** — hook `useAccessibleDialog` en los 8 diálogos (e79972c)
- **Criterio WCAG:** 2.4.3 Orden del foco (Nivel A) · 2.1.2 Sin trampas de teclado (Nivel A)
- **Severidad:** Alta
- **Archivo:** `admin/sedes/SedesClient.tsx:69` · `admin/ApprovalPanel.tsx:134` · `admin/WorkerEditPanel.tsx:116` · `dias/SolicitarDiasModal.tsx:45` · `eventos/EditarEventoPanel.tsx:42` · `eventos/EventNotificationModal.tsx:60` · `eventos/GaleriaFotos.tsx:186` · `shared/WelcomeModal.tsx`
- **Vistas afectadas:** aprobación y edición de trabajadores, gestión de sedes, solicitud de días administrativos, edición y notificación de eventos, galería de fotos, bienvenida.

**Descripción**

El marcado ARIA está bien puesto —todos tienen `role="dialog"`, `aria-modal="true"` y un nombre
accesible— pero **el comportamiento no acompaña**:

| Componente | `Escape` | Foco inicial | Devuelve foco | Atrapa foco |
| :--- | :---: | :---: | :---: | :---: |
| `SolicitarDiasModal.tsx` | ✅ (l.32) | ❌ | ❌ | ❌ |
| `EventNotificationModal.tsx` | ✅ (l.33) | ❌ | ❌ | ❌ |
| `DuplicateCourseButton.tsx` | ✅ (l.80) | ✅ (l.74) | ❌ | ❌ |
| `AnnualTargetForm.tsx` | ✅ (l.62) | ✅ (l.57) | ❌ | ❌ |
| `ApprovalPanel.tsx` | ❌ | ❌ | ❌ | ❌ |
| `WorkerEditPanel.tsx` | ❌ | ❌ | ❌ | ❌ |
| `SedesClient.tsx` | ❌ | ❌ | ❌ | ❌ |
| `EditarEventoPanel.tsx` | ❌ | ❌ | ❌ | ❌ |
| `GaleriaFotos.tsx` | ❌ | ❌ | ❌ | ❌ |

`aria-modal="true"` sin trampa de foco es una promesa incumplida: algunos lectores ocultan el
resto del documento, pero **el Tab del navegador sigue saliendo al fondo**. El resultado es
peor que no declararlo: la persona sale del diálogo hacia contenido que su lector le está
ocultando.

Un matiz adicional: en `SolicitarDiasModal.tsx:45-51`, `EventNotificationModal.tsx:60-66`,
`EditarEventoPanel.tsx:42-46` y `GaleriaFotos.tsx:186-190` el `role="dialog"` está puesto sobre
**el overlay**, que además lleva el `onClick` de cierre. Eso mete el fondo oscuro dentro del
diálogo y, en `SolicitarDiasModal`, hace que un clic en cualquier punto del propio diálogo lo
cierre salvo que un hijo detenga la propagación.

**Impacto en el usuario**

Al abrir "Aprobar solicitud" con teclado, el foco se queda en el botón que quedó detrás del
panel. Hay que tabular a ciegas por toda la tabla de trabajadores para entrar al formulario, y
al cerrar el panel el foco se pierde en el `<body>` — el recorrido empieza otra vez desde el
principio de la página.

**Fix propuesto**

Un hook compartido, aplicado a los ocho diálogos:

```tsx
/* NUEVO — src/hooks/useDialogoAccesible.ts */
'use client'
import { useEffect, type RefObject } from 'react'

const FOCUSABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useDialogoAccesible(ref: RefObject<HTMLElement | null>, abierto: boolean, cerrar: () => void) {
  useEffect(() => {
    if (!abierto || !ref.current) return
    const panel = ref.current
    const previo = document.activeElement as HTMLElement | null

    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLES))
    focusables()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { cerrar(); return }
      if (e.key !== 'Tab') return
      const f = focusables()
      if (f.length === 0) return
      const primero = f[0], ultimo = f[f.length - 1]
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus() }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus() }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previo?.focus({ preventScroll: true })
    }
  }, [abierto, cerrar, ref])
}
```

```tsx
/* DESPUÉS — admin/WorkerEditPanel.tsx:114-120 */
const panelRef = useRef<HTMLDivElement>(null)
useDialogoAccesible(panelRef, true, onClose)
…
<div
  ref={panelRef}
  role="dialog"
  aria-modal="true"
  aria-label={`Editar trabajador ${fullName}`}
  className="fixed right-0 top-0 h-screen w-full sm:w-[480px] md:w-[520px] bg-white z-[70] …"
>
```

Y mover `role="dialog"` del overlay al panel donde hoy está mal ubicado:

```tsx
/* ANTES — dias/SolicitarDiasModal.tsx:45-51 */
<div role="dialog" aria-modal="true" aria-label="Solicitar días administrativos"
     className="fixed inset-0 z-[100] flex items-center justify-center p-4"
     style={{ background: 'rgba(15,31,77,0.45)' }}
     onClick={() => setOpen(false)}>

/* DESPUÉS — el overlay es sólo overlay; el diálogo es el panel */
<div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
     style={{ background: 'rgba(15,31,77,0.45)' }}
     onClick={() => setOpen(false)}>
  <div ref={panelRef} role="dialog" aria-modal="true"
       aria-label="Solicitar días administrativos"
       onClick={(e) => e.stopPropagation()}>
```

**Riesgo de regresión**

Medio. La trampa de foco cambia el comportamiento del Tab dentro de los diálogos — es el
objetivo, pero conviene probar cada uno, sobre todo `GaleriaFotos` (que tiene navegación con
flechas) y `WizardEvento` (multi-paso: el foco debe reposicionarse en cada paso, no sólo al
abrir). El `stopPropagation` en `SolicitarDiasModal` **corrige de paso un bug funcional**:
hoy un clic dentro del modal puede cerrarlo. Mover `role="dialog"` no altera nada visual.

---

### A11Y-13 — La campana de notificaciones no expone su estado ni su conteo, y no se cierra con teclado
- **Estado:** ✅ **Cerrado** — insignia numérica, nombre accesible con conteo, `aria-expanded` y
  cierre con `Escape` (2026-08-14). Se aplicaron los cuatro puntos: el punto de 8 px pasó a insignia
  con el número (1.4.1); el `aria-label` incluye el conteo y se añadieron `aria-expanded`,
  `aria-haspopup="dialog"` y `aria-controls` (4.1.2); `Escape` cierra y devuelve el foco a la campana
  (2.1.1); y los dos `text-slate-400` (2.56:1) pasaron a `--tinta-3` y `--tinta-2` (1.4.3). De paso,
  el panel declara `role="dialog"` con `aria-labelledby`, la lista de alertas es un `<ul role="list">`
  con `<li>` reales, y el punto de color, el separador «·» y la barra de progreso de cada alerta van
  `aria-hidden` por ser redundantes con su texto
- **Criterio WCAG:** 4.1.2 Nombre, rol, valor (Nivel A) · 1.4.1 Uso del color (Nivel A) · 2.1.1 Teclado (Nivel A)
- **Severidad:** Alta
- **Archivo:** `src/components/alumco/shared/NotificationBell.tsx:55-87`
- **Vistas afectadas:** barra superior de trabajador y de admin (todas las pantallas autenticadas).

**Descripción**

```tsx
/* NotificationBell.tsx:72-87 */
<button
  onClick={() => { setIsOpen(!isOpen); setSeen(true) }}
  className="relative p-2 text-slate-500 hover:text-[#2B4FA0] transition-colors"
  aria-label="Notificaciones"
>
  <svg width="24" height="24" …>…</svg>
  {hasUnseen && (
    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full
                     bg-[#E74C3C] ring-2 ring-white animate-pulse" />
  )}
</button>
```

- **1.4.1** — la existencia de alertas pendientes se señala con **un punto rojo de 8 px y nada
  más**: sin número, sin texto, sin `sr-only`. Es color puro (más una animación). Quien no
  distingue el rojo sobre el gris del icono no percibe que hay avisos.
- **4.1.2** — el nombre accesible es "Notificaciones" a secas: no incluye el conteo (`totalCount`
  está calculado en la línea 65 y sólo se usa para pintar) ni el estado del desplegable. Faltan
  `aria-expanded` y `aria-haspopup`.
- **2.1.1** — el desplegable se cierra únicamente con `mousedown` fuera (líneas 55-63). Sin
  `Escape`, sin devolución de foco. Idéntico patrón al de A11Y-08.
- **1.4.3** — `text-[#F5A623]` para la urgencia "critical" (líneas 42, 138) da 2.03:1 y
  `text-slate-400` (líneas 121, 167) da 2.56:1. Ya contabilizado en A11Y-02.

Nota positiva: la urgencia de cada alerta **sí** lleva texto además del punto de color
(`urgencyLabel` en la línea 145: "Vencido" / "3d restantes"), así que las filas individuales
cumplen 1.4.1. El fallo está sólo en el indicador del botón.

**Impacto en el usuario**

Un trabajador con daltonismo protán no ve el punto rojo y no se entera de que tiene un curso
obligatorio vencido — el mismo aviso que la plataforma existe para entregar. Con lector de
pantalla, la campana suena idéntica con 0 alertas y con 9.

**Fix propuesto**

```tsx
/* DESPUÉS — NotificationBell.tsx:72-87 */
<button
  onClick={() => { setIsOpen(!isOpen); setSeen(true) }}
  className="relative p-2 text-[var(--tinta-2)] hover:text-[#2B4FA0] transition-colors"
  aria-label={
    totalCount > 0
      ? `Notificaciones: ${totalCount} alerta${totalCount === 1 ? '' : 's'} pendiente${totalCount === 1 ? '' : 's'}`
      : 'Notificaciones: sin alertas'
  }
  aria-expanded={isOpen}
  aria-haspopup="dialog"
  aria-controls="panel-notificaciones"
>
  <svg width="24" height="24" aria-hidden="true" …>…</svg>
  {hasUnseen && (
    /* El conteo visible sustituye al punto: número + color, no sólo color */
    <span
      aria-hidden="true"
      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full
                 bg-[var(--peligro)] text-white text-[11px] font-bold leading-[18px]
                 text-center ring-2 ring-white"
    >
      {totalCount > 9 ? '9+' : totalCount}
    </span>
  )}
</button>
```

Más el cierre por teclado, junto al `useEffect` existente de la línea 55:

```tsx
useEffect(() => {
  if (!isOpen) return
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { setIsOpen(false); botonRef.current?.focus() }
  }
  document.addEventListener('keydown', onKey)
  return () => document.removeEventListener('keydown', onKey)
}, [isOpen])
```

**Riesgo de regresión**

Bajo-medio y **visual**: el punto de 8 px pasa a ser una insignia numérica de 18 px, que ocupa
más y puede empujar el layout de la barra superior en móvil (`WorkerTopNav.tsx:121`, donde la
campana convive con el botón de cerrar sesión en 375 px). Se posiciona en `absolute`, así que no
debería desplazar nada, pero conviene medirlo. El texto blanco sobre `--peligro` (`#BB3A2E`) da
6.4:1 ✅.

---

### A11Y-14 — El resultado de la evaluación y el progreso guardado no se anuncian
- **Estado:** ✅ **Cerrado** — `role="status"` en resultado de quiz y progreso (e79972c)
- **Criterio WCAG:** 4.1.3 Mensajes de estado (Nivel AA)
- **Severidad:** Alta
- **Archivo:** `QuizClient.tsx:79-89,479-516,610-767` · `curso/VideoPlayer.tsx:151-158` · `curso/PdfViewer.tsx:156`
- **Vistas afectadas:** evaluación de módulo, reproductor de video, visor de PDF.

**Descripción**

`submitQuizAction` devuelve, se cambia el estado y se repinta media pantalla:

```tsx
/* QuizClient.tsx:79-89 */
const handleSubmit = async () => {
  if (!quizId) return
  setIsSubmitting(true)
  const result = await submitQuizAction(quizId, moduleId, courseId, answers)
  setQuizResult(result)
  setQuizState('summary')      // ← se reemplaza todo el contenido, sin aviso
  setIsSubmitting(false)
}
```

No hay `role="status"`, no hay `aria-live`, y **el foco no se mueve**: sigue en el botón "Enviar
evaluación", que ya no existe en el DOM. Un lector de pantalla no dice nada. La persona queda
en silencio sin saber si aprobó, si reprobó o si algo falló.

Lo mismo ocurre en:

```tsx
/* curso/VideoPlayer.tsx:151-158 — aparece de la nada tras markModuleCompleteAction */
{localCompleted && (
  <div className="flex items-center gap-2 text-[#27AE60] font-medium">
    <svg …/>
    Módulo completado
  </div>
)}
```

y en `PdfViewer.tsx:156` (mismo patrón). En cambio `LoginForm.tsx:41-43` y
`RegisterForm.tsx:30-32` **sí** lo hacen bien (`role="alert" aria-live="assertive"`), y
`ui/alert.tsx`, `DemoBanner`, `TaskChecklist` y los componentes de eventos también: la técnica
está en el proyecto, sólo falta aplicarla en el flujo principal del trabajador.

**Impacto en el usuario**

La evaluación es el punto donde se decide el certificado. Quien la rinde con lector de pantalla
la envía y no recibe respuesta alguna: tiene que explorar la página a ciegas para descubrir si
aprobó, con la presión de saber que agotar los intentos reinicia el curso.

**Fix propuesto**

Anuncio por región viva **y** traslado de foco al encabezado del resultado, que es lo que
recomienda la técnica para cambios de contenido tan grandes:

```tsx
/* DESPUÉS — QuizClient.tsx, en el bloque de resumen (l.485) */
const encabezadoResultadoRef = useRef<HTMLHeadingElement>(null)
useEffect(() => {
  if (quizState === 'summary') encabezadoResultadoRef.current?.focus()
}, [quizState])
…
<div className={`rounded-2xl p-5 sm:p-6 text-center ${passed ? '…' : '…'}`}>
  …
  <h2
    ref={encabezadoResultadoRef}
    tabIndex={-1}
    role="status"
    aria-live="polite"
    className={`text-xl font-extrabold mb-1 ${passed ? 'text-[#27500A]' : 'text-[var(--peligro)]'}`}
  >
    {passed ? '¡Aprobaste!' : 'No aprobaste esta vez'}
  </h2>
  <p className={`text-sm ${passed ? 'text-[#27500A]' : 'text-[var(--peligro)]'}`}>
    Obtuviste <span className="font-extrabold text-lg">{quizResult.score}%</span>
    {' '}— {correctCount} de {totalCount} respuestas correctas
  </p>
</div>
```

Y para los dos reproductores, un anuncio simple:

```tsx
/* ANTES — curso/VideoPlayer.tsx:151-158 */
{localCompleted && (
  <div className="flex items-center gap-2 text-[#27AE60] font-medium">

/* DESPUÉS */
{localCompleted && (
  <div role="status" aria-live="polite"
       className="flex items-center gap-2 text-[var(--ok)] font-medium">
```

**Riesgo de regresión**

Bajo. `role="status"` sobre un `<h2>` conserva la semántica de encabezado en los lectores
actuales; si preocupa, separar el anuncio en un `<p className="sr-only" role="status">`
paralelo. `tabIndex={-1}` no añade el encabezado al orden de tabulación, sólo lo hace
enfocable programáticamente. Nota: el `text-[#27500A]/70` y `text-[#E74C3C]/80` de la línea 511
se sustituyen por el color pleno — sube el contraste, cambia levemente el tono.

---

### A11Y-15 — Cinco de siete tablas no declaran `scope` ni `caption`, y el ordenamiento no expone `aria-sort`
- **Estado:** ✅ **Cerrado** — `caption`, `scope="col"` y `aria-sort` en todas las tablas
  (2026-08-14). `admin/trabajadores/[id]/page.tsx` ya se había corregido en una pasada anterior;
  quedaban `WorkersTable`, solicitudes (`admin/trabajadores/page.tsx`), `SuspendedTable`,
  `SuspendidosTable`, `CertificadosClient` y `TablaDatos` (esta última recibe ahora un prop `titulo`
  obligatorio, que ambos gráficos rellenan). En `WorkersTable`, las cinco columnas ordenables
  exponen `aria-sort` vía la función `ariaSort()`, el indicador de flechas sube de `opacity-40` a
  `opacity-70` y va `aria-hidden` (el estado lo da `aria-sort`), y se eliminó el `cursor-pointer`
  del `<th>`, que prometía un área clicable mayor que el `<button>` real. Se añadió además un
  `role="status"` que anuncia el recuento al filtrar
- **Criterio WCAG:** 1.3.1 Información y relaciones (Nivel A) · 4.1.2 Nombre, rol, valor (Nivel A)
- **Severidad:** Alta
- **Archivo:** `admin/trabajadores/WorkersTable.tsx:138-188` · `admin/trabajadores/page.tsx:92-99` · `admin/trabajadores/SuspendedTable.tsx:95-102` · `admin/trabajadores/SuspendidosTable.tsx:93-101` · `admin/trabajadores/[id]/page.tsx:219-224` · `admin/certificados/CertificadosClient.tsx:118-126`
- **Vistas afectadas:** gestión de trabajadores (activos, suspendidos, solicitudes), detalle de trabajador, certificados emitidos.

**Descripción**

| Tabla | `<caption>` | `scope="col"` | `aria-sort` |
| :--- | :---: | :---: | :---: |
| `admin/dashboard/page.tsx:320-327` | ✅ (sr-only) | ✅ | n/a |
| `dashboard/ChartTooltip.tsx:76-80` | ❌ | ✅ | n/a |
| `WorkersTable.tsx:138-188` | ❌ | ❌ | ❌ (5 columnas ordenables) |
| `admin/trabajadores/page.tsx:92-99` | ❌ | ❌ | n/a |
| `SuspendedTable.tsx:95-102` | ❌ | ❌ | n/a |
| `SuspendidosTable.tsx:93-101` | ❌ | ❌ | n/a |
| `admin/trabajadores/[id]/page.tsx:219-224` | ❌ | ❌ | n/a |
| `CertificadosClient.tsx:118-126` | ❌ | ❌ | n/a |

`admin/dashboard/page.tsx` es el único ejemplar correcto y sirve de plantilla.

Sobre el ordenamiento: los encabezados ordenables sí usan `<button>` real dentro del `<th>`
(bien), pero el estado de orden vive sólo en dos flechas SVG:

```tsx
/* WorkersTable.tsx:141-149 y 270-283 */
<th className="px-5 lg:px-6 py-3 cursor-pointer select-none">
  <button onClick={() => handleSort('full_name')} className="flex items-center gap-1 group …">
    Trabajador
    <SortIcon field="full_name" currentField={sortField} direction={sortDir} />
  </button>
</th>
…
<span className="inline-flex flex-col ml-1 opacity-40 group-hover:opacity-100 transition-opacity">
  <svg className={`h-3 w-3 -mb-1 ${isActive && direction === 'asc' ? 'text-[#2B4FA0] opacity-100' : ''}`} …/>
  <svg className={`h-3 w-3 ${isActive && direction === 'desc' ? 'text-[#2B4FA0] opacity-100' : ''}`} …/>
</span>
```

Falta `aria-sort` en el `<th>`, así que un lector no anuncia por qué columna está ordenada la
tabla ni en qué dirección. Además el indicador reposa en `opacity-40` + color: a 12 px, con el
gris al 40 %, el contraste ronda 1.5:1 → falla 1.4.11 como indicador de estado.

**Impacto en el usuario**

Con lector de pantalla, en una tabla de 60 trabajadores sin `scope`, cada celda se lee sin su
encabezado: "Hualpén", "Enfermería", "Activo" sin saber a qué columna corresponde cada dato. Y
al pulsar el botón de ordenar no hay confirmación de que algo cambió.

**Fix propuesto**

```tsx
/* ANTES — WorkersTable.tsx:138-149 */
<table className="tabla">
  <thead>
    <tr>
      <th className="px-5 lg:px-6 py-3 cursor-pointer select-none">
        <button onClick={() => handleSort('full_name')} className="flex items-center gap-1 group …">
          Trabajador
          <SortIcon field="full_name" currentField={sortField} direction={sortDir} />
        </button>
      </th>

/* DESPUÉS */
<table className="tabla">
  <caption className="sr-only">
    Trabajadores activos. {sorted.length} resultados con los filtros aplicados.
  </caption>
  <thead>
    <tr>
      <th
        scope="col"
        aria-sort={sortField === 'full_name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
        className="px-5 lg:px-6 py-3 select-none"
      >
        <button onClick={() => handleSort('full_name')} className="flex items-center gap-1 group …">
          Trabajador
          <SortIcon field="full_name" currentField={sortField} direction={sortDir} />
        </button>
      </th>
```

Y subir el contraste del indicador:

```tsx
/* ANTES — WorkersTable.tsx:270 */
<span className="inline-flex flex-col ml-1 opacity-40 group-hover:opacity-100 transition-opacity">

/* DESPUÉS — 40 % → 70 %: 3.1:1 sobre blanco ✅ */
<span aria-hidden="true"
      className="inline-flex flex-col ml-1 opacity-70 group-hover:opacity-100 transition-opacity">
```

Las cinco tablas restantes sólo necesitan `scope="col"` en cada `<th>` y un `<caption
className="sr-only">` descriptivo. `cursor-pointer` en el `<th>` puede eliminarse: el área
clicable real es el `<button>`, y el cursor de mano sobre toda la celda promete algo que no
cumple.

**Riesgo de regresión**

Muy bajo. `scope` y `aria-sort` no tienen efecto visual. `<caption>` sí es un elemento con
layout propio, por eso va con `sr-only`. Subir la opacidad de 40 % a 70 % hace las flechas más
visibles — cambio menor y deseable.

---

### A11Y-16 — `min-height/min-width: 48px` aplicado a **todo** `<a>`, incluidos los enlaces dentro de párrafos
- **Estado:** ✅ **Cerrado** — objetivos táctiles fuera de los enlaces en línea (66aa19c)
- **Criterio WCAG:** 1.4.10 Reflujo (Nivel AA) · 1.4.12 Espaciado del texto (Nivel AA) · 2.5.8 Tamaño del objetivo (mínimo) (Nivel AA — cumplido en exceso)
- **Severidad:** Alta
- **Archivo:** `src/app/globals.css:78-94`
- **Vistas afectadas:** todas, con impacto visible en textos de módulo (`.contenido-modulo`), el pie del login y los avisos con enlace embebido.

**Descripción**

```css
/* globals.css:78-87 */
/* ── Targets táctiles mínimos 48x48px (WCAG 2.5.5) ── */
button,
[role="button"],
a,
input[type="checkbox"],
input[type="radio"],
select {
  min-height: 48px;
  min-width: 48px;
}
```

Tres problemas:

1. **El criterio citado es el equivocado.** El comentario invoca **2.5.5 Tamaño del objetivo
   (mejorado)**, que es **nivel AAA** y pide 44×44 px. El criterio aplicable a este proyecto es
   **2.5.8 Tamaño del objetivo (mínimo)**, nivel AA, que pide **24×24 px** y —clave— **exime
   explícitamente los enlaces en línea dentro de un bloque de texto** ("Inline: el objetivo está
   en una oración o en un bloque de texto"). La regla actual no es necesaria para AA.
2. **Rompe el flujo del texto.** Un `<a>` es `display: inline` por defecto, y `min-height` no
   se aplica a cajas en línea; pero `min-width: 48px` **sí** afecta cuando el elemento pasa a
   `inline-flex`/`inline-block`, que es justo lo que hacen `.btn`, `.chip`, `.tab-inferior` y
   varios enlaces con `style={{ display: 'inline-flex' }}` (p. ej. `login/page.tsx:119`). En
   `.contenido-modulo a` (`didasko.css:1470`) los enlaces cortos —"aquí", "ver", una sigla— se
   estiran a 48 px y descuadran la línea.
3. **Reflujo a 320 px (1.4.10).** El `min-width: 48px` sobre `a`, combinado con enlaces
   consecutivos en una fila, empuja el ancho mínimo del contenedor. Es contribuyente —no la
   única causa— del desbordamiento horizontal que se documenta en A11Y-25.

La excepción que ya existe sólo cubre los iconos:

```css
/* globals.css:89-94 — sólo neutraliza los <svg>, no los enlaces de texto */
button svg,
a svg { min-height: unset; min-width: unset; }
```

**Impacto en el usuario**

Un párrafo del contenido de un módulo con dos o tres enlaces embebidos se ve con huecos
irregulares y saltos de línea extraños, lo que dificulta la lectura precisamente a quien tiene
baja alfabetización digital o dislexia. Además, cuando el usuario aplica el espaciado de texto
de 1.4.12 (interlineado 1.5, letra 0.12em), esos enlaces estirados desbordan su contenedor.

**Fix propuesto**

Limitar la regla a los elementos que **son** controles, y dejar los enlaces en línea fuera:

```css
/* ANTES — globals.css:78-94 */
/* ── Targets táctiles mínimos 48x48px (WCAG 2.5.5) ── */
button,
[role="button"],
a,
input[type="checkbox"],
input[type="radio"],
select {
  min-height: 48px;
  min-width: 48px;
}
button svg,
a svg { min-height: unset; min-width: unset; }

/* DESPUÉS — 2.5.8 (AA) pide 24px y exime los enlaces en línea.
   Se mantienen 48px, más generosos, pero sólo donde el <a> ES un control. */
button,
[role="button"],
input[type="checkbox"],
input[type="radio"],
select,
a.btn,
a.chip,
a.nav-item,
a.tab-inferior,
a.card,
a.recorrido-col,
a.cauce-card,
nav a {
  min-height: 48px;
}
button,
[role="button"],
input[type="checkbox"],
input[type="radio"],
a.btn-icon {
  min-width: 48px;      /* min-width sólo donde el ancho también es área táctil */
}
button svg,
a svg { min-height: unset; min-width: unset; }
```

La lista de selectores de enlace-como-control ya está definida en `didasko.css:1157-1160` para
el subrayado; conviene extraerla a una variable o duplicarla con el mismo criterio para que las
dos reglas no se desincronicen.

**Riesgo de regresión**

Medio. Los enlaces de texto sueltos que hoy miden 48 px de alto pasan a medir lo que dicta la
línea: es el objetivo, pero cambia el espaciado vertical en el pie del login
(`login/page.tsx:154-156`), en `RegisterForm.tsx:22` ("Volver al inicio de sesión") y en los
enlaces del contenido de módulo. Hay que **verificar que ningún enlace que sí es un control
quede fuera de la lista de selectores** — si se olvida uno, su área táctil baja de 48 px (aunque
seguiría cumpliendo 2.5.8 si supera 24 px).

---

### A11Y-17 — La barra de progreso no tiene nombre accesible y su relleno contrasta 1.54:1 con el riel
- **Estado:** ✅ **Cerrado** — nombre accesible ya resuelto; el relleno se delimita con un anillo
  de `--ambar-700` (2026-08-14). **El fix propuesto más abajo está mal calculado y no se aplicó:**
  `#C9BB99` sobre `#F5A623` da **1.07:1**, no 3.05:1. Oscurecer el riel hacia la arena *acerca* su
  luminancia a la del ámbar (L=0.468) en vez de alejarla; para llegar a 3:1 por esa vía haría falta
  un marrón oscuro (~`#6B6045`, 3.06:1), que convierte la barra en otra cosa. La opción (b) de § 3
  —oscurecer el relleno a `--ambar-700`— sí cumple (4.01:1) pero pierde el ámbar de marca en toda
  la plataforma. Vía elegida: `box-shadow: inset 0 0 0 1.5px var(--ambar-700)` sobre el relleno. El
  borde que porta la información —dónde termina el avance— contrasta **4.01:1** con el riel base
  (`#ece5d8`), 3.82:1 con el de la paleta con scope (`#E9E0CA`) y 4.93:1 con el riel blanco del
  tema DIDASKO, y el ámbar se conserva. Con `pct=0` la caja no tiene ancho y no se pinta. El
  relleno azul (`.progreso-azul`) ya daba 4.28:1 y se excluye del anillo
- **Criterio WCAG:** 4.1.2 Nombre, rol, valor (Nivel A) · 1.4.11 Contraste de elementos no textuales (Nivel AA)
- **Severidad:** Alta
- **Archivo:** `src/components/alumco/ds/index.tsx:132-145` · `src/app/didasko.css:300-312,630-640`
- **Vistas afectadas:** ficha de curso, tarjetas de curso, inicio, notificaciones, reportes — en todas partes donde se muestra avance.

**Descripción**

```tsx
/* ds/index.tsx:132-145 */
export function Progreso({ pct, azul = false, alto = 8 }) {
  return (
    <div
      className={'progreso' + (azul ? ' progreso-azul' : '')}
      style={{ height: alto }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div style={{ width: pct + '%' }}></div>
    </div>
  )
}
```

- **4.1.2** — `role="progressbar"` **exige** un nombre accesible. No hay `aria-label` ni
  `aria-labelledby`. Un lector anuncia "barra de progreso, 40" sin decir de qué ni de qué
  unidad. Falta también `aria-valuetext` para que diga "40 por ciento".
- **1.4.11** — el relleno ámbar sobre el riel:

  ```css
  /* didasko.css:301-311 + 630-634 */
  .progreso { background: var(--arena-200); }                    /* #E9E0CA */
  .progreso > div { background: var(--ambar); }                  /* #F5A623 */
  body[data-tema="didasko"] .progreso { border: 1.5px solid var(--azul-800); background: var(--blanco); }
  ```

  En el tema por defecto, `#F5A623` sobre `#E9E0CA` da **1.54:1** — el usuario no distingue
  dónde termina el avance. En el tema DIDASKO el riel pasa a blanco `#FFFDF6`, lo que da
  **2.02:1**: mejor, pero sigue por debajo de 3:1. El borde navy de 1.5 px delimita la barra
  completa, no el nivel de llenado, así que no rescata el criterio.

**Impacto en el usuario**

El porcentaje de avance de un curso es la información que el trabajador consulta para saber
cuánto le falta. Con visión reducida ve una barra clara sobre otra barra clara: no puede leer
el avance. Con lector de pantalla oye un número sin contexto.

**Fix propuesto**

```tsx
/* DESPUÉS — ds/index.tsx:132-145 */
export function Progreso({
  pct, azul = false, alto = 8, etiqueta,
}: { pct: number; azul?: boolean; alto?: number; etiqueta?: string }) {
  return (
    <div
      className={'progreso' + (azul ? ' progreso-azul' : '')}
      style={{ height: alto }}
      role="progressbar"
      aria-label={etiqueta ?? 'Avance del curso'}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${pct} por ciento completado`}
    >
      <div style={{ width: pct + '%' }}></div>
    </div>
  )
}
```

> `etiqueta` es un prop **nuevo y opcional**: no rompe ninguna llamada existente ni cambia la
> firma pública de las props actuales.

```css
/* ANTES — didasko.css:300-312 */
.progreso { height: 8px; border-radius: 999px; background: var(--arena-200); overflow: hidden; }
.progreso > div { height: 100%; border-radius: 999px; background: var(--ambar); … }

/* DESPUÉS — riel más oscuro: #F5A623 sobre #C9BB99 → 3.05:1 ✅ */
.progreso { height: 8px; border-radius: 999px; background: #C9BB99; overflow: hidden; }
.progreso > div { height: 100%; border-radius: 999px; background: var(--ambar); … }
```

```css
/* ANTES — didasko.css:630-634 */
body[data-tema="didasko"] .progreso { border: 1.5px solid var(--azul-800); background: var(--blanco); }

/* DESPUÉS — el riel blanco no da 3:1 contra el ámbar; se oscurece */
body[data-tema="didasko"] .progreso { border: 1.5px solid var(--azul-800); background: #E3D5B4; }
```

**Riesgo de regresión**

Medio y visual: el riel deja de ser casi blanco y la barra se lee como dos tonos de arena. Es
un cambio estético perceptible en las tarjetas de curso y en `/inicio`. **Alternativa sin
tocar el riel:** mantener el fondo claro y oscurecer el relleno a `var(--ambar-700)`
(`#B45309`), que sobre `#FFFDF6` da 5.02:1 — pero eso cambia el color de marca de la barra, que
es más visible aún. Ambas opciones requieren decisión de diseño (ver lista final).

---

### A11Y-18 — Los módulos bloqueados usan `opacity-50`: el texto queda en ~3:1
- **Estado:** ✅ **Cerrado** — se atenúa el fondo, no la tinta (2026-08-14). Aplicado el fix
  propuesto en sus dos partes: `opacity-50` sobre la fila bloqueada sustituido por
  `bg-[var(--md-surface-container-low)]`, conservando la opacidad sólo en el icono del candado
  (`opacity-70`), y retirado el `/70` del subtexto de la fila activa, que dejaba `#334C9D` sobre
  `#DCE1FF` en 3.25:1 a 12 px — a opacidad plena son **6.11:1**. El estado sigue comunicándose con
  el candado y la palabra «Bloqueado», así que 1.4.1 no se toca
- **Criterio WCAG:** 1.4.3 Contraste (mínimo) (Nivel AA)
- **Severidad:** Alta
- **Archivo:** `src/components/alumco/curso/ModuleIndex.tsx:103-113,153-175`
- **Vistas afectadas:** índice de módulos (barra lateral de la ficha de curso y del reproductor).

**Descripción**

```tsx
/* ModuleIndex.tsx:105-112 */
${status === 'active'
  ? 'bg-[var(--md-primary-container)]'
  : status === 'completed'
    ? 'bg-[var(--md-surface-container-low)]'
    : status === 'locked'
      ? 'opacity-50'                 /* ← aplica a TODO el contenido de la fila */
      : 'hover:bg-[var(--md-surface-container-low)]'
}
```

`opacity-50` afecta a todo el subárbol. El título del módulo, que usa
`text-[var(--md-on-surface)]` (`#2A3439`, 12.9:1 a opacidad plena), compuesto al 50 % sobre
blanco queda en ≈ `#949A9C` → **3.02:1**. El texto "Bloqueado" (línea 180) usa
`text-[var(--md-on-surface-variant)]` (`#566166`, 6.37:1), que al 50 % cae a **2.33:1**.

Hay además un segundo caso de contraste en el mismo archivo, no relacionado con la opacidad:

```tsx
/* ModuleIndex.tsx:154-160 y 166-172 — subtexto de la fila activa */
${status === 'active' ? 'text-[var(--md-on-primary-container)]/70' : '…'}
```

`#334C9D` al 70 % sobre `#DCE1FF` da **3.25:1** para texto de 12 px → falla.

Nota positiva: el comentario de las líneas 177-178 muestra que el estado bloqueado ya se
comunica también con la palabra "Bloqueado" — **1.4.1 cumple**. El problema aquí es sólo de
contraste.

**Impacto en el usuario**

El índice de módulos es el mapa del curso. Con presbicia, los módulos bloqueados —que suelen ser
la mayoría al empezar— se vuelven ilegibles: el trabajador no sabe qué contenidos vienen ni
cómo se llaman.

**Fix propuesto**

Sustituir la opacidad global por un color de texto atenuado pero conforme:

```tsx
/* ANTES — ModuleIndex.tsx:109-111 */
: status === 'locked'
  ? 'opacity-50'

/* DESPUÉS — se atenúa el fondo, no el texto */
: status === 'locked'
  ? 'bg-[var(--md-surface-container-low)] [&_p]:text-[var(--md-on-surface-variant)]'
```

```tsx
/* ANTES — ModuleIndex.tsx:156-158 */
${status === 'active'
  ? 'text-[var(--md-on-primary-container)]/70'

/* DESPUÉS — sin opacidad: #334C9D sobre #DCE1FF = 6.11:1 ✅ */
${status === 'active'
  ? 'text-[var(--md-on-primary-container)]'
```

Si se quiere conservar la sensación de "apagado", aplicar la opacidad **sólo al icono de
estado**, que ya es redundante con la palabra "Bloqueado":

```tsx
<div className={'shrink-0 mt-0.5' + (status === 'locked' ? ' opacity-60' : '')}>
```

**Riesgo de regresión**

Bajo. Los módulos bloqueados dejan de verse "grises" y pasan a distinguirse por el fondo y por
la etiqueta textual. Es un cambio visual perceptible en la barra lateral del curso, pero no
altera el layout. Verificar que el `[&_p]:` de Tailwind alcance ambos párrafos de la fila
(título y metadatos); si no, aplicar la clase directamente en cada `<p>`.

---

### A11Y-19 — Objetivos táctiles bajo 24 px y áreas de gráfico identificadas sólo por color
- **Estado:** ✅ **Cerrado** — píldoras del calendario a 24 px y gráficos con canal no cromático
  (2026-08-14). **La mitad de gráficos ya no aplicaba:** los charts se reescribieron después de la
  auditoría y hoy no usan color como clave de serie —`ComplianceByAreaChart` es de un solo tono con
  el área rotulada en el eje Y y el porcentaje impreso junto a cada barra, más un resumen en texto y
  una `TablaDatos` alternativa—; `AREA_COLORS` de `lib/utils.ts` sólo alimenta ya los degradados
  decorativos de las tarjetas de curso (`getCourseGradient`), donde no identifica nada.
  **Calendario:** se tomó la opción (a) de § 3 —celda de 60 → 76 px (88 px en `sm`)— en vez de la
  (b), porque ocultar una píldora en móvil esconde un vencimiento. Píldora a `min-h-[24px]` con
  `py-1` y separación `space-y-1` (4 px). Además cada píldora lleva `aria-label` con el nombre
  completo y el estado del plazo en texto —cierra también el `title` como tooltip (A11Y-27) en este
  componente— y el rótulo de mes es `aria-live="polite"`, porque al navegar de mes no cambia nada
  más en pantalla
- **Criterio WCAG:** 2.5.8 Tamaño del objetivo (mínimo) (Nivel AA) · 1.4.1 Uso del color (Nivel A)
- **Severidad:** Alta
- **Archivo:** `curso/DeadlineCalendar.tsx:149-158,176-187` · `lib/utils.ts:114-125` · `dashboard/ComplianceByAreaChart.tsx` · `dashboard/CertificatesMonthlyChart.tsx`
- **Vistas afectadas:** calendario de plazos (`/inicio`), gráficos del dashboard admin y de reportes.

**Descripción**

**2.5.8 — píldoras del calendario.** Cada vencimiento del calendario es un enlace de 20 px de
alto:

```tsx
/* DeadlineCalendar.tsx:149-156 */
<Link
  key={course.id}
  href={`/cursos/${course.id}`}
  className={`block text-[11px] sm:text-[10px] font-medium px-1 sm:px-1.5 py-0.5 rounded
              border truncate leading-tight ${color} hover:opacity-80 transition-opacity
              min-h-[20px]`}
  title={course.title}
>
  {course.title}
</Link>
```

`min-h-[20px]` está por debajo de los 24 px de 2.5.8, y las píldoras se apilan con
`space-y-0.5` (2 px), así que tampoco aplica la excepción por espaciado —que exige que un
círculo de 24 px centrado en el objetivo no toque el de otro—. En escritorio el `<a>` recibe el
`min-height: 48px` de `globals.css:79` y el problema desaparece; en móvil, con `sm:text-[10px]`
y la celda de 60 px de alto, las dos píldoras más el número del día no caben en 48 px, así que
la regla se ve forzada y el resultado es impredecible. **Falla en móvil**, que es el contexto
principal de uso.

**1.4.1 — leyendas de gráfico.** `lib/utils.ts:114-125` asigna un color por área de trabajo
(`'Nutrición': '#F5A623'`, etc.) y los gráficos de Recharts los usan como única clave de
identificación de serie. Si la leyenda es sólo un cuadrito de color junto a un nombre, el
criterio se cumple (hay texto); pero dentro del gráfico —barras apiladas, sectores— la
correspondencia dato↔área se establece exclusivamente por color. Además varios de esos colores
no alcanzan 3:1 entre sí ni contra el fondo (`#F5A623` a 2.03:1 contra blanco), lo que también
compromete 1.4.11.

La leyenda del calendario sí está bien resuelta (`DeadlineCalendar.tsx:176-187`): cada muestra
de color va acompañada del texto "Vencido" / "Por vencer" / "A tiempo".

**Impacto en el usuario**

En un teléfono, tocar el vencimiento correcto entre dos píldoras de 20 px separadas por 2 px es
difícil para cualquiera y prácticamente imposible con temblor esencial o artritis —frecuentes
en el rango etario del personal. En los reportes, una jefatura con daltonismo no puede leer qué
área corresponde a cada barra.

**Fix propuesto**

```tsx
/* ANTES — DeadlineCalendar.tsx:152 */
className={`block text-[11px] sm:text-[10px] font-medium px-1 sm:px-1.5 py-0.5 rounded
            border truncate leading-tight ${color} hover:opacity-80 transition-opacity min-h-[20px]`}

/* DESPUÉS — 24px reales + separación de 4px entre píldoras */
className={`flex items-center text-[11px] font-medium px-1.5 py-1 rounded
            border truncate leading-tight ${color} hover:opacity-80 transition-opacity min-h-[24px]`}
```

```tsx
/* ANTES — DeadlineCalendar.tsx:139 */
<div className="space-y-0.5">

/* DESPUÉS */
<div className="space-y-1">
```

Con celdas de 60 px eso permite **una** píldora cómoda más el contador "+N más"; conviene
reducir `deadlines.slice(0, 2)` a `slice(0, 1)` en móvil, o subir `min-h` de la celda a 76 px.
Es un ajuste de diseño (ver lista final).

Para los gráficos, añadir un segundo canal —patrón de relleno o etiqueta directa— y usar una
paleta con separación suficiente:

```tsx
/* DESPUÉS — ComplianceByAreaChart.tsx, patrón + color */
<defs>
  <pattern id="trama-nutricion" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="3" height="6" fill="#B45309" />
  </pattern>
</defs>
<Bar dataKey="nutricion" fill="url(#trama-nutricion)" name="Nutrición" />
```

**Riesgo de regresión**

Medio. Subir las píldoras a 24 px y el espaciado a 4 px **desborda las celdas actuales del
calendario**: hay que subir `min-h-[60px]` a `min-h-[76px]` o mostrar una sola píldora por día
en móvil. Es un cambio de layout visible en `/inicio`. Los patrones en los gráficos alteran su
aspecto de forma notoria; una alternativa menos invasiva es etiquetar las series directamente
sobre el gráfico y verificar que la paleta de `lib/utils.ts` mantenga 3:1 entre colores
adyacentes.

---

## Hallazgos de severidad media

### A11Y-20 — Quince páginas no tienen `<h1>`
- **Estado:** ✅ **Cerrado** — verificado página a página; el hueco real era el quiz (2026-08-14).
  **La cifra de 15 era un falso positivo en su mayor parte**, tal como este hallazgo anticipaba al
  pedir "verificar cuáles usan `EncabezadoPagina`": 13 de las 15 sí emiten `<h1>`, en unos casos vía
  `EncabezadoPagina` (`ds/index.tsx`), en otros desde el componente cliente al que delegan
  (`SoporteClient`, `ReportesClient`, `CertificadosClient`, `CourseBuilder`, `HeroSection`). El
  incumplimiento real estaba en el flujo de evaluación: **siete estados** arrancaban la jerarquía en
  `<h2>` —bloqueado, ya aprobado, revisión de respuestas y los tres de resultado en `QuizClient`,
  más «Acceso no permitido» y «Evaluación bloqueada» en `quiz/page.tsx`—. Todos promovidos a `<h1>`,
  y los `<h3>` que colgaban de ellos bajados a `<h2>` para no dejar saltos de nivel. Los dos estados
  de carga de `QuizClient`, que no tenían ningún encabezado, llevan `<h1 className="sr-only">` y
  `aria-busy="true"`
- **Criterio WCAG:** 1.3.1 Información y relaciones (Nivel A) · 2.4.6 Encabezados y etiquetas (Nivel AA)
- **Severidad:** Media
- **Archivo:** ver lista
- **Vistas afectadas:** eventos (trabajador y admin), soporte, certificados admin, cursos admin, editor de curso, reportes, sedes, trabajadores, quiz, landing.

**Descripción**

```
(dashboard)/cursos/[id]/modulos/[moduleId]/quiz/page.tsx    admin/eventos/nuevo/page.tsx
(dashboard)/eventos/page.tsx                                admin/eventos/page.tsx
(dashboard)/eventos/[id]/page.tsx                           admin/eventos/[id]/page.tsx
(dashboard)/soporte/page.tsx                                admin/reportes/page.tsx
admin/certificados/page.tsx                                 admin/sedes/page.tsx
admin/cursos/page.tsx                                       admin/soporte/page.tsx
admin/cursos/[id]/editar/page.tsx                           admin/trabajadores/page.tsx
app/page.tsx (landing)
```

Casos con matiz:

- `(dashboard)/soporte/page.tsx` delega en `SoporteClient.tsx`, que **sí** tiene `<h1>` → falso
  positivo, **cumple**.
- `quiz/page.tsx` delega en `QuizClient.tsx`, que tiene **dos** `<h1>` (líneas 280 y 407) en
  ramas mutuamente excluyentes → correcto en runtime. Pero los estados "bloqueado" (línea 164),
  "ya aprobaste" (línea 203) y los tres de resultado (líneas 630, 677, 728) usan `<h2>` **sin
  `<h1>` en la página**: en esos cinco estados la jerarquía arranca en h2.
- El resto usa `EncabezadoPagina` (`ds/index.tsx:276-286`), que sí emite `<h1 className="t-display">`
  — conviene verificar cuáles de los 15 lo utilizan y cuáles arrancan directamente en `<h2>`.

**Impacto en el usuario**

La navegación por encabezados es la forma más rápida de orientarse con lector de pantalla. Sin
`<h1>`, la persona no sabe en qué página está sin leer el título del navegador.

**Fix propuesto**

Para las páginas que ya tienen un `<h2>` de título, promoverlo:

```tsx
/* ANTES — QuizClient.tsx:164 (estado «bloqueado») */
<h2 className="text-lg sm:text-xl font-bold text-[var(--md-on-surface)] mb-3">Evaluación bloqueada</h2>

/* DESPUÉS — es el título de la pantalla, no una sección de ella */
<h1 className="text-lg sm:text-xl font-bold text-[var(--md-on-surface)] mb-3">Evaluación bloqueada</h1>
```

Para las que no tienen título visible, usar `EncabezadoPagina` (ya existe) o un `<h1
className="sr-only">`.

**Riesgo de regresión**

Bajo. `h1` hereda `font-size: 1.875rem; font-weight: 700` de `globals.css:104`, pero en todos
estos casos hay clases de Tailwind o `.t-display` que lo sobrescriben. Verificar los que no
tengan clase de tamaño explícita.

---

### A11Y-21 — El `<title>` sale duplicado en 20 páginas por interacción con la plantilla de Next
- **Estado:** ✅ **Cerrado** — títulos de página únicos, sin sufijo duplicado (66aa19c)
- **Criterio WCAG:** 2.4.2 Titulado de páginas (Nivel AA)
- **Severidad:** Media
- **Archivo:** `src/app/layout.tsx:40-43` + 20 `page.tsx`
- **Vistas afectadas:** casi todas.

**Descripción**

```tsx
/* layout.tsx:39-44 */
export const metadata: Metadata = {
  title: { default: 'Alumco LMS', template: '%s | Alumco LMS' },
  …
}
```

```tsx
/* (dashboard)/cursos/page.tsx:8 */
export const metadata: Metadata = { title: 'Mis Cursos | Alumco LMS' }
```

Next.js aplica la `template` del layout a cualquier `title` de tipo cadena en un segmento hijo.
Como el hijo **ya incluye** el sufijo, el resultado es:

> `Mis Cursos | Alumco LMS | Alumco LMS`

Afecta a todas las páginas que repiten el sufijo: `cursos`, `inicio`, `mis-certificados`,
`perfil`, `soporte`, `soporte/[id]`, `eventos`, `eventos/[id]`, `dias-administrativos`,
`login`, `admin/certificados`, `admin/cursos`, `admin/cursos/[id]/editar`,
`admin/cursos/[id]/feedback`, `admin/dashboard`, `admin/eventos*`, `admin/perfil`,
`admin/reportes`, `admin/sedes`, `admin/soporte*`, `admin/trabajadores*`,
`certificado/[certificateId]`.

No impide la conformidad estricta —el título sigue siendo único y descriptivo— pero degrada la
experiencia: en una pestaña estrecha, el nombre útil queda cortado por el sufijo repetido.

**Fix propuesto**

Quitar el sufijo de cada página y dejar que la plantilla lo añada:

```tsx
/* ANTES — (dashboard)/cursos/page.tsx:8 */
export const metadata: Metadata = { title: 'Mis Cursos | Alumco LMS' }

/* DESPUÉS — la template del layout añade « | Alumco LMS » */
export const metadata: Metadata = { title: 'Mis cursos' }
```

`(auth)/registro/page.tsx:7` ya lo hace bien (`title: 'Solicitar acceso'`) y sirve de patrón.
Para los pocos títulos que deban ignorar la plantilla, usar `{ absolute: '…' }`.

**Riesgo de regresión**

Ninguno visual. Cambia el texto de la pestaña del navegador y el nombre con que se guarda un
marcador.

---

### A11Y-22 — El `<iframe>` del video se titula "Video player", en inglés y sin identificar el módulo
- **Estado:** ✅ **Cerrado** — `title` en español y con el nombre del módulo (2026-08-14). Se aplicó
  el fix propuesto, con `moduleTitle` **obligatorio** en vez de opcional: sólo hay una llamada y así
  `tsc` impide que un futuro consumidor deje el `<iframe>` sin identificar. Por paridad, el
  `<iframe>` de `PdfViewer` pasa de anunciar sólo el título a «Documento del módulo: …». **La nota
  sobre subtítulos (1.2.2) sigue vigente y no se cierra con esto** — ver § 6 de la declaración
- **Criterio WCAG:** 4.1.2 Nombre, rol, valor (Nivel A) · 2.4.6 Encabezados y etiquetas (Nivel AA)
- **Severidad:** Media
- **Archivo:** `src/components/alumco/curso/VideoPlayer.tsx:67-73`
- **Vistas afectadas:** todo módulo de tipo video.

**Descripción**

```tsx
/* VideoPlayer.tsx:67-73 */
<iframe
  src={embedUrl}
  title="Video player"
  className="absolute inset-0 w-full h-full rounded-lg"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

El `title` de un `<iframe>` es su nombre accesible y es lo que un lector anuncia al entrar en la
región. "Video player" está en inglés —en una interfaz íntegramente en español— y no dice de
qué video se trata. En un curso de 6 módulos de video, los 6 iframes se anuncian idénticos.

**Fix propuesto**

`VideoPlayer` no recibe hoy el título del módulo. Añadir un prop **opcional** mantiene la firma
compatible:

```tsx
/* DESPUÉS — VideoPlayer.tsx */
interface VideoPlayerProps {
  videoUrl: string
  moduleId: string
  courseId: string
  isCompleted: boolean
  thumbnailUrl?: string | null
  moduleTitle?: string          /* nuevo, opcional */
}
…
<iframe
  src={embedUrl}
  title={moduleTitle ? `Video del módulo: ${moduleTitle}` : 'Reproductor de video del módulo'}
  …
/>
```

Y pasarlo desde `(dashboard)/cursos/[id]/modulos/[moduleId]/page.tsx`, que ya dispone de
`module.title`.

**Nota fuera del listado de criterios solicitado:** el contenido se sirve vía YouTube embebido.
**1.2.2 Subtítulos (pregrabados)** es Nivel A y forma parte de la conformidad AA. La plataforma
no puede garantizarlo desde el código —depende de que cada video subido tenga subtítulos—, pero
sí debería exigirlo en el flujo de carga del constructor de cursos. Se deja anotado como
requisito de proceso, no como defecto de código.

**Riesgo de regresión**

Ninguno. Prop opcional con valor por defecto; ninguna llamada existente se rompe.

---

### A11Y-23 — `--tinta-3` cumple sobre las tarjetas pero falla sobre el fondo crema (4.31:1)
- **Estado:** ✅ **Cerrado** — `--tinta-3` de `#6e7488` a `#666c80` (2026-08-14). Medido:
  **4.84:1** sobre la crema de página `#FAF6ED`, **5.13:1** sobre la tarjeta `#FFFDF6` y 5.22:1
  sobre blanco. Verificado que **ninguna paleta con scope lo re-sobrescribe** —la trampa que hizo
  fallar la primera corrección de `--ambar-700` en A11Y-01—: sólo existen la declaración base y el
  override de alto contraste (`#454b60`). De paso arregla el rótulo de sección del sidebar
  (`.nav-seccion`, que en el tema activo usa este token sobre fondo blanco)
- **Criterio WCAG:** 1.4.3 Contraste (mínimo) (Nivel AA)
- **Severidad:** Media
- **Archivo:** `src/app/didasko.css:36` · usos vía `.silencio-3`, `.ayuda`, `.tabla th`, `::placeholder`, `.tab-inferior`
- **Vistas afectadas:** texto auxiliar en todas las pantallas; con especial impacto en el pie del login, las etiquetas de la barra de tabs inferior y los textos de ayuda de formulario.

**Descripción**

```css
/* didasko.css:36 */
--tinta-3: #6e7488; /* AA: 4.6:1 sobre blanco (antes #7c8198 = 3.85:1, fallaba) */
```

El comentario es correcto **sobre blanco puro**, pero ese no es el fondo real de la plataforma:

| Fondo | Color | Contraste con `#6E7488` | Veredicto |
| :--- | :--- | ---: | :--- |
| Blanco puro | `#FFFFFF` | 4.65:1 | ✅ |
| Tarjeta DIDASKO (`--blanco`) | `#FFFDF6` | 4.57:1 | ✅ (justo) |
| **Fondo de página (`--crema`)** | `#FAF6ED` | **4.31:1** | ❌ |
| Fondo DIDASKO (`--crema` didasko) | `#FAF6ED` | **4.31:1** | ❌ |

Todo texto `.silencio-3` que no esté dentro de una `.card` —el pie del login
(`login/page.tsx:118,137,155`), los textos de ayuda entre secciones, los subtítulos de
`AdminSidebar.tsx:89,125`— cae sobre la crema y falla. Dentro de tarjetas pasa por 0.07 puntos.

El modo de alto contraste **sí** lo resuelve (`didasko.css:1392`: `--tinta-3: #454B60`, 7.4:1),
pero es opt-in: la conformidad debe cumplirse en el estado por defecto.

**Fix propuesto**

```css
/* ANTES — didasko.css:36 */
--tinta-3:   #6e7488; /* AA: 4.6:1 sobre blanco */

/* DESPUÉS — 4.5:1 sobre la crema, que es el fondo real de la página */
--tinta-3:   #666C80; /* 5.02:1 sobre #FFFDF6 · 4.74:1 sobre #FAF6ED ✅ */
```

Un oscurecimiento de 8 unidades por canal, imperceptible salvo en comparación directa, que
lleva el token por encima del umbral en los dos fondos de la plataforma.

**Riesgo de regresión**

Muy bajo. Cambio de un token; el texto auxiliar se ve marginalmente más oscuro. Afecta también a
`::placeholder` (`didasko.css:217`) — deseable, ya que ahí el contraste importa igual.

---

### A11Y-24 — Los requisitos de los campos viven sólo en el `placeholder` y los errores no dicen cómo corregir
- **Estado:** ✅ **Cerrado** — ayuda persistente, obligatoriedad en texto y errores asociados al
  campo (2026-08-14). **3.3.2:** `.ayuda` persistente con `aria-describedby` en RUT («Con puntos y
  guion, por ejemplo 12.345.678-9.») y contraseña («Mínimo 8 caracteres.») —sólo esos dos, como
  recomendaba el apartado de riesgo, para no añadir ~90 px al formulario—, y una línea «Todos los
  campos son obligatorios» en registro y login, porque `required` sin indicación textual no basta.
  **3.3.3:** reescritos los mensajes de los tres schemas Zod para que digan **cómo** corregir, no
  sólo qué falló; el rechazo de credenciales del login no revela cuál de los dos campos falló —sería
  un oráculo de cuentas— pero sí remite a «¿Olvidó su clave?». **3.3.1:** `ActionResult` gana un
  campo `field?: string` opcional —los schemas ya lo tienen en `issue.path[0]`— y los cuatro
  formularios de autenticación marcan con `aria-invalid` y apuntan el `aria-describedby` sólo al
  control culpable. Esto corrige de paso un defecto de `ResetPasswordForm`, que marcaba inválidos
  **los dos** campos ante cualquier error. Nota de alcance: el hallazgo declaraba
  `src/lib/actions/**` fuera del alcance modificable de la auditoría original; asociar el error a su
  campo exige tocar el tipo de retorno, así que se hizo con un campo opcional que no rompe ningún
  consumidor
- **Criterio WCAG:** 3.3.2 Etiquetas o instrucciones (Nivel A) · 3.3.3 Sugerencia ante errores (Nivel AA)
- **Severidad:** Media
- **Archivo:** `src/components/alumco/auth/RegisterForm.tsx:43-63` · `src/components/alumco/auth/LoginForm.tsx:40-60`
- **Vistas afectadas:** `/registro`, `/login`.

**Descripción**

Todos los campos del registro tienen `<label>` asociado correctamente (`htmlFor` + `id`) y
`autoComplete` correcto — **1.3.5 y 3.3.2 se cumplen en lo esencial**. El problema es más fino:

```tsx
/* RegisterForm.tsx:56-59 */
<div className="campo">
  <label htmlFor="password">Contraseña</label>
  <input id="password" name="password" type="password" autoComplete="new-password"
         required disabled={isPending} placeholder="Mínimo 8 caracteres" className="input" />
</div>
```

El requisito "Mínimo 8 caracteres" vive **sólo** en el `placeholder`, que desaparece en cuanto
la persona empieza a escribir. Igual con "12.345.678-9" para el formato del RUT: es la única
indicación del formato esperado y se esfuma al primer carácter. `didasko.css:196` ya define una
clase `.campo .ayuda` para texto de apoyo persistente — existe, pero no se usa aquí.

Sobre 3.3.3: los errores llegan del servidor como cadena y se pintan en un `role="alert"`
(correcto en cuanto a 3.3.1 y 4.1.3), pero **no se asocian al campo** que los originó
(`aria-describedby` / `aria-invalid`), así que quien navega por campos con lector no sabe cuál
corregir. La calidad del mensaje depende de la Server Action y no se auditó (los archivos de
`src/lib/actions/**` están fuera del alcance permitido para modificar, pero sí se revisó su
consumo).

**Fix propuesto**

```tsx
/* ANTES — RegisterForm.tsx:56-59 */
<div className="campo">
  <label htmlFor="password">Contraseña</label>
  <input id="password" name="password" type="password" autoComplete="new-password"
         required disabled={isPending} placeholder="Mínimo 8 caracteres" className="input" />
</div>

/* DESPUÉS — el requisito persiste y queda asociado al campo */
<div className="campo">
  <label htmlFor="password">Contraseña</label>
  <input id="password" name="password" type="password" autoComplete="new-password"
         required disabled={isPending} className="input"
         aria-describedby="password-ayuda" />
  <p id="password-ayuda" className="ayuda">Mínimo 8 caracteres.</p>
</div>
```

```tsx
/* DESPUÉS — RegisterForm.tsx:46-49, formato del RUT persistente */
<div className="campo">
  <label htmlFor="rut">RUT</label>
  <input id="rut" name="rut" type="text" autoComplete="off" required disabled={isPending}
         className="input" aria-describedby="rut-ayuda" />
  <p id="rut-ayuda" className="ayuda">Con puntos y guion, por ejemplo 12.345.678-9.</p>
</div>
```

**Riesgo de regresión**

Bajo, pero **el formulario crece verticalmente**: cinco líneas de ayuda añaden ~90 px. En el
card del registro, con `login-shell` a `100dvh`, eso puede introducir scroll en pantallas
pequeñas — precisamente lo que `globals.css:768-792` intenta evitar. Considerar mostrar la ayuda
sólo en los dos campos donde el formato importa (RUT y contraseña).

---

### A11Y-25 — El desplegable del buscador fuerza 320 px de ancho mínimo y desborda en pantallas de 320 px
- **Estado:** ✅ **Cerrado** — `min-w-[320px]` eliminado del desplegable (8c14854)
- **Criterio WCAG:** 1.4.10 Reflujo (Nivel AA)
- **Severidad:** Media
- **Archivo:** `src/components/alumco/shared/SearchBar.tsx:118` · `src/app/admin/layout.tsx:53`
- **Vistas afectadas:** barra superior con buscador, en viewport de 320 px.

**Descripción**

```tsx
/* SearchBar.tsx:118 */
<div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl
                shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-slate-100 z-50
                overflow-hidden min-w-[320px]">
```

`min-w-[320px]` sobre un contenedor posicionado con `left-0 right-0`: en un viewport de 320 px,
con el padding lateral del layout (`p-4` = 16 px por lado en `admin/layout.tsx:59`), el espacio
disponible es 288 px. El `min-width` gana y el panel se sale 32 px, generando scroll horizontal
en toda la página.

`NotificationBell.tsx:91` resuelve el mismo problema correctamente:
`w-[calc(100vw-2rem)] sm:w-80 max-w-sm min-w-[280px]` — 288 px disponibles ≥ 280 px de mínimo.

El `overflow-x-hidden` de `admin/layout.tsx:53` **oculta** el desbordamiento en lugar de
resolverlo: el contenido queda recortado, que es otra forma de incumplir 1.4.10.

**Fix propuesto**

```tsx
/* ANTES — SearchBar.tsx:118 */
className="absolute top-full left-0 right-0 mt-2 … overflow-hidden min-w-[320px]"

/* DESPUÉS — mismo patrón que NotificationBell */
className="absolute top-full left-0 right-0 mt-2 … overflow-hidden
           w-[calc(100vw-2rem)] sm:w-auto max-w-sm min-w-[260px]"
```

**Riesgo de regresión**

Bajo. En escritorio el desplegable pasa a heredar el ancho del input en lugar de tener un piso
de 320 px; si el buscador es estrecho, los resultados se ven más apretados. `max-w-sm` evita
que se desborde al otro extremo.

---

### A11Y-26 — `white-space: nowrap`, `truncate` y alturas fijas rompen con el espaciado de texto de 1.4.12
- **Estado:** ✅ **Cerrado** — `.tabla th` era el último `nowrap` sobre texto de interfaz
  (2026-08-14). `.btn`, `.badge` y `.tab-inferior-label` ya se habían corregido en `globals.css`,
  en una capa posterior que gana a las reglas de didasko. Ahora `.tabla th` también permite el
  salto: no llegaba a incumplir —`.tabla-envoltura` tiene `overflow-x: auto`, así que con más
  espaciado la tabla se desplaza en vez de recortar—, pero empujaba a scroll horizontal por una
  preferencia de lectura. **Los `truncate` y `.recorte` sobre valores de dato se aceptan como
  residual**, con el criterio que fija este mismo hallazgo («es aceptable siempre que exista una
  forma de acceder al texto completo»), ahora verificado: el `text-overflow: ellipsis` es puramente
  visual —la cadena completa sigue en el DOM, así que **el lector de pantalla la lee entera**— y
  cada valor truncado cuelga de un enlace o fila que abre el registro completo. La única excepción
  que dependía del `title` era el calendario de plazos, resuelta en A11Y-19 con `aria-label`.
  Verificación pendiente: el bookmarklet de espaciado de texto de WCAG sobre `/inicio`, `/cursos` y
  `/admin/trabajadores` — es prueba en navegador, no revisión de código (§ 4.2 de la declaración)
- **Criterio WCAG:** 1.4.12 Espaciado del texto (Nivel AA)
- **Severidad:** Media
- **Archivo:** `didasko.css:124,184,276,458,1274-1281` · 20 componentes con `truncate` / `line-clamp`
- **Vistas afectadas:** barra de tabs inferior (móvil), badges de estado, encabezados de tabla, tarjetas de curso, resultados de búsqueda.

**Descripción**

1.4.12 exige que, si el usuario fuerza interlineado 1.5, espaciado entre letras 0.12em, entre
palabras 0.16em y entre párrafos 2em, no se pierda contenido ni funcionalidad. Los puntos de
riesgo:

```css
/* didasko.css:124  */ .btn { white-space: nowrap; }
/* didasko.css:184  */ .badge { white-space: nowrap; }
/* didasko.css:276  */ .tabla th { white-space: nowrap; }
/* didasko.css:458  */ .recorte { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

```css
/* didasko.css:1274-1285 — el caso más comprometido */
.tab-inferior-label {
  font-size: 12.5px;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* Comentario del propio código: «Medido a 375px: la etiqueta más larga
   («Certificados») ocupa 70px de los 75 disponibles» */
```

Con `letter-spacing: 0.12em` sobre 12.5 px, "Certificados" pasa de ~70 px a ~88 px sobre 75 px
disponibles: **se trunca con puntos suspensivos**. El propio comentario documenta que sólo hay
5 px de margen. El `text-overflow: ellipsis` evita el desbordamiento pero **pierde contenido**,
que es exactamente lo que 1.4.12 prohíbe.

Riesgo similar en `.btn` con `white-space: nowrap` y `min-height` fijo: el texto no puede pasar
a dos líneas y se sale de la caja o se recorta.

Los `truncate` de tarjetas y tablas son un caso distinto: truncar un título largo de dato es
aceptable (el texto completo sigue disponible al abrir el elemento), siempre que exista una
forma de acceder a él. Ver A11Y-27 sobre el uso de `title=` para eso.

**Fix propuesto**

Permitir el salto de línea donde el contenido es una etiqueta de UI (no un dato):

```css
/* ANTES — didasko.css:1274-1281 */
.tab-inferior-label {
  font-size: 12.5px;
  line-height: 1.1;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* DESPUÉS — se permite el salto y se sube el alto del tab para acomodarlo */
.tab-inferior-label {
  font-size: 12.5px;
  line-height: 1.15;
  max-width: 100%;
  overflow-wrap: anywhere;
  hyphens: auto;
}
.tab-inferior { min-height: 60px; }   /* antes 56px */
```

```css
/* ANTES — didasko.css:124 */
.btn { … white-space: nowrap; }

/* DESPUÉS — el botón puede crecer a dos líneas antes que recortar */
.btn { … white-space: normal; text-wrap: balance; }
```

Verificación recomendada: aplicar el bookmarklet de espaciado de texto de WCAG sobre `/inicio`,
`/cursos` y `/admin/trabajadores`, y comprobar que no se pierda texto.

**Riesgo de regresión**

Medio y visual. Permitir dos líneas en los tabs sube la barra inferior 4 px y puede desalinear
los iconos si una etiqueta salta y otra no. En `.btn`, quitar `nowrap` hace que botones con
texto largo cambien de altura en contenedores estrechos, lo que puede descuadrar filas de
acciones (`cabecera-seccion-acciones`, `didasko.css:1308`). Requiere revisión visual pantalla
por pantalla.

---

### A11Y-27 — El atributo `title` se usa como tooltip informativo sobre texto truncado
- **Estado:** ✅ **Cerrado** — no queda ningún `title` usado como tooltip (2026-08-14). En
  `DeadlineCalendar`, sustituido por `aria-label` con el nombre completo y el estado del plazo: ahí
  no cabía un disclosure —son celdas de 76 px— y el destino del enlace ya da el contexto. En
  `WorkersTable`, eliminados los `title="Ver detalle"` y `title="Editar"`: eran redundantes con un
  `aria-label` más específico e introducían una segunda cadena distinta, que es lo que confunde al
  control por voz. En `WorkerTopNav`, el `title="Mi perfil"` pasa a un prefijo `<span class="sr-only">`
  dentro del enlace y **no** a un `aria-label`: el nombre accesible tiene que seguir conteniendo el
  texto visible —el nombre de pila— o se incumpliría 2.5.3. Verificado: los únicos `title` que
  quedan en el repositorio son los dos `<iframe>`, donde el atributo **sí** es el nombre accesible
  del elemento y no genera tooltip
- **Criterio WCAG:** 1.4.13 Contenido al pasar el cursor o al enfocar (Nivel AA)
- **Severidad:** Media
- **Archivo:** `curso/DeadlineCalendar.tsx:153` · `nav/WorkerTopNav.tsx:88` · `admin/trabajadores/WorkersTable.tsx:234,242`
- **Vistas afectadas:** calendario de plazos, barra superior del trabajador, tabla de trabajadores.

**Descripción**

```tsx
/* DeadlineCalendar.tsx:149-156 — el título se trunca y el title= es la única vía al texto completo */
<Link href={`/cursos/${course.id}`} className="… truncate …" title={course.title}>
  {course.title}
</Link>
```

El tooltip nativo del navegador no es **descartable** (no responde a `Escape`), no es
**hoverable** de forma fiable (desaparece al mover el puntero) y no es **persistente** (se
oculta solo a los pocos segundos). Además no aparece nunca en dispositivos táctiles, que es el
contexto principal de uso. En el calendario, donde el texto **está truncado**, el `title` es la
única forma de saber de qué curso se trata — y en móvil no existe.

Casos menos graves: `WorkerTopNav.tsx:88` (`title="Mi perfil"` sobre un enlace que ya muestra el
nombre) y `WorkersTable.tsx:234,242` (`title="Ver detalle"` / `"Editar"` sobre botones que ya
tienen `aria-label` más específico). Ahí el `title` es redundante, no la única fuente — pero
introduce una tercera cadena distinta del `aria-label`, lo que confunde al software de control
por voz.

**Fix propuesto**

En el calendario, dejar de truncar en móvil y permitir dos líneas:

```tsx
/* ANTES — DeadlineCalendar.tsx:149-156 */
<Link href={`/cursos/${course.id}`}
      className="block text-[11px] sm:text-[10px] … truncate leading-tight … min-h-[20px]"
      title={course.title}>
  {course.title}
</Link>

/* DESPUÉS — texto completo en dos líneas; sin dependencia del tooltip nativo */
<Link href={`/cursos/${course.id}`}
      className="flex items-center text-[11px] … leading-tight line-clamp-2 … min-h-[24px]">
  <span className="sr-only">Vence: </span>{course.title}
</Link>
```

En los botones de la tabla, eliminar el `title` redundante y quedarse con el `aria-label`:

```tsx
/* ANTES — WorkersTable.tsx:230-237 */
<Link href={`/admin/trabajadores/${worker.id}`} className="btn btn-ghost btn-sm"
      aria-label={`Ver detalle de ${worker.full_name}`} title="Ver detalle">

/* DESPUÉS — una sola cadena, la accesible */
<Link href={`/admin/trabajadores/${worker.id}`} className="btn btn-ghost btn-sm"
      aria-label={`Ver detalle de ${worker.full_name}`}>
```

**Riesgo de regresión**

Bajo-medio. Quitar los `title` elimina el tooltip al pasar el mouse en escritorio: algunos
administradores pueden echarlo en falta. Permitir dos líneas en el calendario aumenta la altura
de las celdas (mismo efecto que en A11Y-19; conviene abordarlos juntos).

---

## Hallazgos de severidad baja

### A11Y-28 — Glifos decorativos (`◆`, `←`, `→`) leídos como texto
- **Estado:** ✅ **Cerrado** — glifos decorativos en `<span aria-hidden>` (8c14854)
- **Criterio WCAG:** 1.1.1 Contenido no textual (Nivel A)
- **Severidad:** Baja
- **Archivo:** `(dashboard)/inicio/page.tsx:153,200` · `(auth)/login/page.tsx:97` · `landing/ValoresSection.tsx:80` · `shared/NotificationBell.tsx:111` · `QuizClient.tsx:587`
- **Vistas afectadas:** inicio, login, notificaciones, evaluación, landing.

**Descripción**

```tsx
/* inicio/page.tsx:153 */
<span className="t-eyebrow">◆ {fechaHoy}</span>
/* inicio/page.tsx:200 */
<span className="t-eyebrow">◆ Tu recorrido · {totalCourses} cursos</span>
/* NotificationBell.tsx:111 */
<a href="/admin/reportes" className="…">Ver reporte →</a>
/* QuizClient.tsx:587 */
{passed ? 'Continuar →' : …}
```

NVDA y VoiceOver leen `◆` como "rombo negro" y `→` como "flecha hacia la derecha". En
`/inicio` eso significa oír "rombo negro, lunes 10 de agosto" y "rombo negro, tu recorrido".
`login/page.tsx:121` **sí** lo hace bien (`<span aria-hidden="true">←</span>`) y sirve de
patrón.

**Fix propuesto**

```tsx
/* ANTES — inicio/page.tsx:153 */
<span className="t-eyebrow">◆ {fechaHoy}</span>

/* DESPUÉS */
<span className="t-eyebrow"><span aria-hidden="true">◆ </span>{fechaHoy}</span>
```

```tsx
/* ANTES — QuizClient.tsx:587 */
{passed ? 'Continuar →' : …}

/* DESPUÉS — la flecha es adorno; el icono ya existe en otros botones */
{passed ? <>Continuar<span aria-hidden="true"> →</span></> : …}
```

**Riesgo de regresión:** ninguno. No cambia nada visualmente.

---

### A11Y-29 — SVG inline sin `aria-hidden` fuera del componente `Icono`
- **Estado:** ✅ **Cerrado** — 70 SVG inline marcados en 16 archivos (2026-08-14). Barrido sobre
  todo `src/**/*.tsx`: se añadió `aria-hidden="true"` a **todo `<svg>` que no declarase ya
  `aria-hidden`, `role` o `aria-label`** — el criterio de exclusión evita tocar los que sí son
  significativos. Verificado después: **0 SVG sin marcar** en el repositorio. Nota operativa: el
  script normalizó los saltos de línea a LF en los archivos tocados y hubo que devolverlos a CRLF,
  que es lo que usa el repositorio
- **Criterio WCAG:** 1.1.1 Contenido no textual (Nivel A)
- **Severidad:** Baja
- **Archivo:** `curso/ModuleIndex.tsx:33-64,119,129` · `QuizClient.tsx:128,144,174,184,247,255,293,305,333,340,383,414,421,453,461` · `curso/VideoPlayer.tsx:77,110,134,153` · `shared/NotificationBell.tsx:77`
- **Vistas afectadas:** índice de módulos, evaluación, reproductores, campana.

**Descripción**

El componente central `ds/Icono.tsx:57` aplica `aria-hidden="true"` correctamente a todos sus
iconos, y `CourseBuilder/BlockCard.tsx` también lo hace en cada `<svg>`. Pero los SVG escritos
a mano en el reproductor de módulos y en el quiz no lo llevan. En la práctica un `<svg>` sin
`role` ni `<title>` ya es ignorado por los lectores modernos, así que el impacto real es
mínimo; aun así es la convención del propio proyecto y conviene unificarla, sobre todo porque
algunas herramientas de auditoría automatizada (axe, Lighthouse) lo marcan.

Caso con impacto real: `NotificationBell.tsx:77`, donde el `<svg>` de la campana es el único
contenido de un botón cuyo nombre viene de `aria-label` — si el SVG llegara a exponer texto,
competiría con la etiqueta.

**Fix propuesto**

```tsx
/* ANTES — curso/VideoPlayer.tsx:134-142 */
<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <polyline points="20,6 9,17 4,12" />
</svg>

/* DESPUÉS */
<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
     aria-hidden="true">
  <polyline points="20,6 9,17 4,12" />
</svg>
```

**Riesgo de regresión:** ninguno.

---

### A11Y-30 — El foco puede quedar bajo la barra superior fija y la barra de tabs inferior
- **Estado:** ✅ **Cerrado** — regla global de `scroll-margin` (2026-08-14). Aplicado el fix
  propuesto, con `env(safe-area-inset-bottom)` sumado al margen inferior en vez de un valor fijo:
  en iPhone con barra de gestos el alto real de la tab bar depende del área segura, y el
  `(dashboard)/layout.tsx` ya usa ese mismo `env()` para su relleno
- **Criterio WCAG:** 2.4.11 Foco no oscurecido (mínimo) (Nivel AA)
- **Severidad:** Baja
- **Archivo:** `nav/WorkerTopNav.tsx:56,110,126-143` · `didasko.css:394-403` · `admin/layout.tsx:56`
- **Vistas afectadas:** todas las pantallas autenticadas, al tabular tras hacer scroll.

**Descripción**

Tres capas fijas se superponen al contenido:

```tsx
/* WorkerTopNav.tsx:56 — cabecera sticky, 68px aprox. */
<header className="topbar hidden lg:flex" style={{ position: 'sticky', top: 'var(--demo-banner-h, 0px)', zIndex: 30 }}>
/* WorkerTopNav.tsx:126-143 — tab bar fija inferior, 56px + safe-area */
<nav className="flex lg:hidden" style={{ position: 'fixed', bottom: 0, …, zIndex: 40 }}>
```

Cuando el navegador desplaza un elemento hasta el borde de la ventana para enfocarlo, el
elemento puede quedar total o parcialmente debajo de estas barras. 2.4.11 exige que el elemento
enfocado **no quede completamente oculto**.

Hay mitigaciones parciales ya presentes: `admin/layout.tsx:56` añade un espaciador de 73 px
para el header fijo, y el `<main>` del dashboard reserva
`pb-[calc(7rem+env(safe-area-inset-bottom,0px))]` (`(dashboard)/layout.tsx:52`) para la barra
inferior. Eso protege el **final** del contenido, no un elemento cualquiera alcanzado por
scroll a media página. `section[id] { scroll-margin-top: 80px }` (`globals.css:685`) sólo aplica
a secciones de la landing.

**Fix propuesto**

Una regla global de `scroll-margin` que reserve el alto de ambas barras para cualquier elemento
enfocable:

```css
/* NUEVO — didasko.css */
:is(a, button, input, select, textarea, summary, [tabindex]) {
  scroll-margin-top: 88px;      /* topbar sticky + holgura */
  scroll-margin-bottom: 96px;   /* tab bar inferior + safe-area */
}
@media (min-width: 1024px) {
  :is(a, button, input, select, textarea, summary, [tabindex]) {
    scroll-margin-bottom: 24px; /* en escritorio no hay tab bar */
  }
}
```

**Riesgo de regresión**

Muy bajo. `scroll-margin` sólo influye cuando el navegador desplaza para revelar un elemento;
no afecta al layout. Puede notarse como un desplazamiento algo más generoso al tabular.

---

### A11Y-31 — Encabezados de sección del sidebar sin semántica, y dos landmarks de navegación duplicados
- **Estado:** ✅ **Cerrado** — grupos con nombre accesible y un solo landmark de navegación
  (2026-08-14). **Dos desviaciones del fix propuesto, ambas deliberadas:** (1) el rótulo del grupo
  se deja como `<div>` referenciado por `aria-labelledby`, no como `<h2>` — un `<h2>` en el sidebar
  se cuela en el esquema de encabezados de **todas** las páginas de administración, y el rol de
  grupo no lo necesita; (2) los `id` se generan con `useId()`, porque `SidebarContent` se monta dos
  veces —barra de escritorio y cajón móvil— y con literales habría `id` duplicados en el DOM.
  Replicado `display:flex; flex-direction:column; gap:4px` en `.nav-grupo`, y dejado sin
  `position` para no cambiar el `offsetParent` del que depende la gota indicadora, tal como
  advertía el apartado de riesgo. **Landmarks:** el contenedor de escritorio era un
  `<aside aria-label="Navegación principal">` — `<aside>` mapea a `complementary`, no a
  `navigation`, así que el rótulo prometía un landmark que no era y encima duplicaba el del `<nav>`
  interno. Pasa a `<div>` sin rótulo; el cajón móvil, que ya llevaba `role="dialog"` sustituyendo
  el rol implícito de `<aside>`, pasa también a `<div>`. Queda un único landmark de navegación
- **Criterio WCAG:** 1.3.1 Información y relaciones (Nivel A)
- **Severidad:** Baja
- **Archivo:** `nav/AdminSidebar.tsx:109,111,140-146,176-183` · `didasko.css:387-391`
- **Vistas afectadas:** todo `/admin/**`.

**Descripción**

```tsx
/* AdminSidebar.tsx:109-112 */
<div className="nav-seccion">Gestión</div>
{gestion.filter((i) => i.show).map(renderItem)}
<div className="nav-seccion">Cuenta</div>
{cuenta.filter((i) => i.show).map(renderItem)}
```

"Gestión" y "Cuenta" agrupan visualmente los enlaces (mayúsculas, `letter-spacing`, color
atenuado — `didasko.css:387-391`) pero son `<div>` sin rol: la agrupación existe para la vista
y no para el árbol de accesibilidad. Un lector recorre 9 enlaces seguidos sin saber que hay dos
bloques.

Adicionalmente, el sidebar de escritorio (`aria-label="Navegación principal"`, línea 143) y el
cajón móvil (`aria-label="Menú de navegación"`, línea 182) **coexisten siempre en el DOM**;
sólo se ocultan con `hidden lg:flex` / `lg:hidden`. En el viewport de escritorio el cajón está
en `display: none` (fuera del árbol, correcto), pero en móvil el de escritorio también lo está,
así que en la práctica sólo hay uno activo por vez. El `<nav aria-label="Navegación de
administración">` interno (línea 103) se renderiza **dos veces** en el DOM por el mismo motivo:
duplicado inofensivo, pero ruidoso si en algún breakpoint intermedio ambos quedaran visibles.

**Fix propuesto**

```tsx
/* ANTES — AdminSidebar.tsx:103-113 */
<nav ref={navRef} className="sidebar-nav" aria-label="Navegación de administración">
  …
  <div className="nav-seccion">Gestión</div>
  {gestion.filter((i) => i.show).map(renderItem)}
  <div className="nav-seccion">Cuenta</div>
  {cuenta.filter((i) => i.show).map(renderItem)}
</nav>

/* DESPUÉS — grupos reales con nombre accesible */
<nav ref={navRef} className="sidebar-nav" aria-label="Navegación de administración">
  …
  <div role="group" aria-labelledby="nav-grupo-gestion">
    <h2 id="nav-grupo-gestion" className="nav-seccion">Gestión</h2>
    {gestion.filter((i) => i.show).map(renderItem)}
  </div>
  <div role="group" aria-labelledby="nav-grupo-cuenta">
    <h2 id="nav-grupo-cuenta" className="nav-seccion">Cuenta</h2>
    {cuenta.filter((i) => i.show).map(renderItem)}
  </div>
</nav>
```

**Riesgo de regresión**

Bajo-medio. El `<div role="group">` introduce un contenedor nuevo entre `.sidebar-nav` (que es
`display: flex; flex-direction: column; gap: 4px`) y los `.nav-item`: **el `gap` dejaría de
aplicarse entre elementos de grupos distintos** y los ítems se apilarían sin separación. Hay que
replicar `display: flex; flex-direction: column; gap: 4px` en el grupo. Además, `.gota-indicador`
(`didasko.css:886`) se posiciona con `el.offsetTop` relativo al nav: el contenedor nuevo cambia
el `offsetParent` sólo si tiene `position` distinto de `static`, así que dejándolo estático no
se rompe — **verificar la posición de la gota indicadora tras el cambio**.

---

## Hallazgos de las pasadas de verificación del 2026-08-14

Estos siete **no** proceden de la auditoría del 2026-08-10. Salieron de tres barridos posteriores:

1. **A11Y-32, A11Y-33** — al responder a "¿queda algo más de código?" una vez cerrados los 31.
2. **A11Y-34, A11Y-35** — al revisar **regla a regla las paletas con scope**, que es donde se
   habían escondido los dos anteriores.
3. **A11Y-36, A11Y-37, A11Y-38** — al revisar **regla a regla la landing**, cuyo grueso no vive en
   CSS con scope sino en estilos en línea y bloques `<style jsx>` de nueve componentes.

Se numeran a continuación de los originales y se documentan con el mismo formato. Hay un anexo por
barrido con lo que se midió y no presentó hallazgo, para no repetir el trabajo.

**Lo que enseña la progresión.** Cada barrido encontró cosas que el anterior no podía ver, porque
cada uno miraba un sitio distinto: primero las reglas base de CSS, luego los scopes, luego los
estilos en línea. Y el tercero encontró además un **criterio que no estaba en la lista** (2.2.2),
lo que significa que el recuento de "40 criterios aplicables" era incompleto.

**Los cuatro comparten causa raíz y conviene leerlos juntos:** todos sobreviven dentro de las
paletas con scope (`.paleta-oliva`, `.paleta-azul`), donde una re-declaración de token o una regla
con `!important` anula la corrección global. Es el mismo mecanismo que hizo fallar la primera
corrección de `--ambar-700` (ver el registro del 2026-08-13), y **los cuatro corresponden a
hallazgos ya dados por cerrados** — A11Y-03, A11Y-02 y A11Y-01 respectivamente—, cuyo alcance
cubría los literales de JSX y los tokens de shadcn pero no las reglas base de didasko ni sus
scopes. **Toda corrección de color o de foco debe verificarse dentro de las paletas con scope y
sobre el bundle compilado, no sobre el fuente.**

### A11Y-32 — `.input:focus` anula el anillo del sistema en todos los campos de formulario
- **Estado:** ✅ **Cerrado** — retirados `outline: none` y los halos de baja opacidad (2026-08-14)
- **Criterio WCAG:** 1.4.11 Contraste no textual (Nivel AA) · 2.4.7 Foco visible (Nivel AA)
- **Severidad:** Alta
- **Archivo:** `didasko.css:222,265,269,647-652,900-903,780,810`
- **Vistas afectadas:** todos los formularios de la plataforma — login, registro, recuperación y
  restablecimiento de clave, buscador global, filtros de reportes y de trabajadores, constructor de
  cursos, ficha de trabajador, soporte, panel de accesibilidad.

**Descripción**

```css
/* didasko.css:222 */
.input:focus, .select:focus, .textarea:focus {
  outline: none;                                    /* ← anula el anillo del sistema */
  border-color: var(--ambar);
  box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.22);   /* ← el sustituto, al 22 % */
}
```

El comentario de `globals.css:381` daba por hecho que el anillo del sistema ganaba por "posición
posterior". **La posición sólo desempata a igual especificidad:** `.input:focus` es (0,2,0) y
`:focus-visible` es (0,1,0), y ambos viven en `@layer components` —`didasko.css` se importa con
`layer(components)`—, así que gana `outline: none`. Verificado en el bundle compilado.

Lo que quedaba como indicador, medido en las paletas reales:

| Elemento del indicador | Ratio | AA exige |
| :--- | ---: | ---: |
| Borde ámbar vs interior del campo `#FFFDF6` | 1.99:1 | 3:1 |
| Borde ámbar vs fondo de página `#FAF6ED` | 1.88:1 | 3:1 |
| Cambio entre borde normal y enfocado (`#ded7c8` → ámbar) | 1.41:1 | 3:1 |
| Cambio entre borde normal y enfocado (`#DCE2EC` → ámbar) | 1.56:1 | 3:1 |
| Halo de 3 px `rgba(245,166,35,0.22)` sobre crema | **1.15:1** | 3:1 |

Ninguno alcanza el umbral. Hay tres capas que repiten el patrón: la regla base, la del tema
DIDASKO (`box-shadow: 3px 3px 0 var(--ambar)`) y la de las paletas con scope
(`box-shadow: 0 0 0 3px var(--foco-glow)`, siendo `--foco-glow` el mismo ámbar al 22 %). Además,
`.input-busqueda input` declara `outline: none` **sin condicionar a `:focus`** y con especificidad
(0,1,1), que también gana a `:focus-visible`.

**Relación con A11Y-03.** Es el mismo defecto, y A11Y-03 se dio por cerrado. Aquel hallazgo
enumeraba las 26 ocurrencias de `focus:outline-none` escritas como utilidad de Tailwind en JSX;
**estas reglas base de CSS nunca estuvieron en su alcance**. El halo al 22 % es, además,
exactamente lo que prohíbe la norma del proyecto en `CLAUDE.md` ("si hace falta uno propio, va a
opacidad plena, nunca `/20`, `/30`").

**Impacto en el usuario**

Quien navega con teclado no ve dónde está al tabular por un formulario. En el registro son cinco
campos seguidos; en el constructor de cursos, más. Es el criterio que separa "se puede usar sin
ratón" de "no se puede".

**Fix aplicado**

Las reglas de foco dejan de declarar `outline` y `box-shadow`, así que manda el anillo de doble
contorno de `globals.css` (7.14:1 sobre crema). Se conserva el cambio de borde como señal
secundaria, migrado a `--ambar-700`, que además **cumple por sí solo**: 4.93:1 contra el interior
del campo, 4.66:1 contra la crema, y 3.51:1 / 3.86:1 de contraste entre el estado normal y el
enfocado en cada paleta. El token `--foco-glow` se retira para que no vuelva a usarse.

**Riesgo de regresión**

Medio y **visual en toda la plataforma**: el foco de los campos pasa de un halo ámbar difuso al
anillo navy de doble contorno que ya usa el resto de controles. Es más visible y más coherente,
pero cambia el aspecto de cada formulario. Pendiente de validación con la clienta.

---

### A11Y-33 — El ámbar de marca sigue como color de texto en el `<em>` del display
- **Estado:** ✅ **Cerrado** — `#F5A623` → `var(--ambar-700)` (2026-08-14)
- **Criterio WCAG:** 1.4.3 Contraste (mínimo) (Nivel AA)
- **Severidad:** Media
- **Archivo:** `didasko.css:880-888`
- **Vistas afectadas:** `/inicio` — el `<h1>` de bienvenida del trabajador.

**Descripción**

```css
body[data-tema="didasko"] :is(.paleta-oliva, .paleta-azul) .t-display em {
  color: #F5A623 !important;
}
```

Es el `<em>` de `«Hola {nombre}, sigamos aprendiendo.»` (`inicio/page.tsx:155`). `#F5A623` sobre la
crema da **1.88:1**: falla incluso el umbral de 3:1 reservado a texto grande, y con más razón el
de 4.5:1 si el display baja de tamaño en móvil (`clamp(25px, 6.6vw, 34px)`).

**Relación con A11Y-02.** Mismo defecto, y A11Y-02 se dio por cerrado. Aquel barrido migró los
~120 literales escritos en JSX y los tokens base, pero **no esta regla, que vive dentro de las
paletas con scope y lleva `!important`**, así que ninguna corrección global podía alcanzarla.

**Fix aplicado**

`var(--ambar-700)` (#b45309): **4.66:1** sobre crema y 4.93:1 sobre tarjeta. Cumple también como
texto normal, no sólo como texto grande.

**Riesgo de regresión**

Bajo y visual: la palabra destacada del saludo pasa de ámbar brillante a ámbar tostado, el mismo
tono que ya usa `.landing-page .t-display em`. Aumenta la coherencia entre landing y app.

---

### A11Y-34 — El borde de los campos y controles es imperceptible en las dos paletas de la app
- **Estado:** ✅ **Cerrado** — token `--borde-control` a 3:1 (2026-08-14)
- **Criterio WCAG:** 1.4.11 Contraste no textual (Nivel AA)
- **Severidad:** Alta
- **Archivo:** `didasko.css:791,832` (tokens) · `911,928,929-932` (reglas)
- **Vistas afectadas:** todos los formularios y controles de `/admin/**` y de la vista de
  trabajador — campos, desplegables, áreas de texto, buscadores, botones secundarios y chips.

**Descripción**

```css
body[data-tema="didasko"] :is(.paleta-oliva, .paleta-azul) .input,
… .select, … .textarea, … .input-busqueda { border: 1px solid var(--borde); }
/* --borde: #ded7c8 en .paleta-oliva · #dce2ec en .paleta-azul */
```

El relleno del campo es `--blanco` (#FFFDF6) y el fondo de página es `--crema` (#FAF6ED): se
diferencian en **1.02:1**, o sea nada. El contorno es, por tanto, **la única señal de dónde
empieza y acaba el control**, y es exactamente el caso que 1.4.11 exige a 3:1.

| Paleta | `--borde` | vs interior del campo | vs fondo de página |
| :--- | :--- | ---: | ---: |
| `.paleta-oliva` (admin) | `#ded7c8` | **1.41:1** | **1.33:1** |
| `.paleta-azul` (trabajador) | `#dce2ec` | **1.28:1** | **1.21:1** |

Lo mismo en `.btn-secondary` —que es `--blanco` sobre `--crema`, sin más señal que el borde— y
en `.chip`.

**Relación con A11Y-01.** A11Y-01 dio por corregidos los bordes de campo, de 1.26:1 a **3.34:1**.
Pero lo que arregló fueron los tokens **de shadcn** (`--border` / `--input`) en `globals.css`. Los
campos que ve el usuario en admin y en la vista de trabajador no usan esos tokens: usan la clase
`.input` de didasko con `var(--borde)`, y las paletas con scope lo re-declaran a un tono casi
invisible. **Es la quinta vez que una corrección global no llega a ninguna vista real por este
mismo mecanismo.**

**Impacto en el usuario**

Con visión reducida o en una pantalla con brillo alto —un ELEAM con ventanales, por ejemplo— no
se distingue dónde hay un campo que rellenar. Es el defecto que A11Y-01 describía como "un borde
a 1.26:1 es literalmente invisible", vigente durante toda la fase pese a darse por cerrado.

**Fix aplicado**

La **opción (b)** que recomendaba el § 3 de esta misma auditoría: un token aparte para el
contorno de los controles, en vez de oscurecer `--borde` y engrosar visualmente el hairline de
las tarjetas. `--borde` queda para lo decorativo —contorno de tarjeta, separadores de sidebar y
topbar—, donde 1.4.11 no aplica.

| Paleta | `--borde-control` | vs campo | vs crema | vs `--arena-100` |
| :--- | :--- | ---: | ---: | ---: |
| `.paleta-oliva` | `#8f8369` | 3.67:1 | 3.47:1 | 3.18:1 |
| `.paleta-azul` | `#7c8699` | 3.60:1 | 3.40:1 | 3.12:1 |

**Riesgo de regresión**

Medio y **visual en toda la aplicación**: los campos, botones secundarios y chips pasan de un
contorno casi invisible a uno gris medio claramente perceptible. Es el cambio que hace que un
formulario se lea como un formulario. Pendiente de validación con la clienta.

---

### A11Y-35 — `.t-eyebrow` se pinta con el ámbar claro de los bloques navy también sobre fondo claro
- **Estado:** ✅ **Cerrado** — el color claro se aplica sólo dentro de `.bloque-marca` (2026-08-14)
- **Criterio WCAG:** 1.4.3 Contraste (mínimo) (Nivel AA)
- **Severidad:** Media
- **Archivo:** `didasko.css:885-891` · `(auth)/login/page.tsx:27,97` · `(dashboard)/inicio/page.tsx:173`
- **Vistas afectadas:** `/inicio`, `/dias-administrativos`, `/admin/dias-administrativos`, tarjetas
  y modal de evento — es decir, casi todas las cabeceras de sección de la app.

**Descripción**

```css
body[data-tema="didasko"] :is(.paleta-oliva, .paleta-azul) .t-eyebrow {
  color: var(--oliva-clara) !important;   /* #F5C26B */
}
```

`--oliva-clara` está pensado para los bloques navy, donde da **8.24:1**. La regla lo aplicaba a
**todo** `.t-eyebrow` de la aplicación, incluidos los que están sobre crema (**1.52:1**) y sobre
tarjeta (**1.61:1**): la fecha del saludo de `/inicio`, «Tu recorrido», «Beneficios», «Gestión»,
las tarjetas de evento y el modal de evento.

**El agravante.** Al llevar `!important`, la regla **anulaba los `style` en línea con
`var(--ambar-700)`** que ya se habían escrito en el login y en «Continúa donde quedaste» — una
declaración `!important` de autor gana a un estilo en línea normal. Esos dos arreglos existían en
el código y no llegaban a pintarse nunca.

Al desactivarlos salió a la luz el problema inverso: el `style` en línea de «Continúa donde
quedaste» pedía `--ambar-700` **sobre un bloque navy**, que da 2.69:1. El `!important` que causaba
el fallo general estaba tapando ese otro fallo. Lo mismo en el panel de marca del login.

**Fix aplicado**

La regla base pasa a `--ambar-700` (4.66:1 sobre crema) y el ámbar claro se reserva a
`.bloque-marca .t-eyebrow`. Se retiran los dos `style` en línea, que ahora sobran y apuntaban al
color equivocado. Al panel de marca del login se le añade `bloque-marca`, que es lo que ya era:
así la regla de "fondo oscuro" es declarativa y no depende de enumerar contenedores.

**Riesgo de regresión**

Bajo y visual: los rótulos de sección de la app pasan de ámbar claro a ámbar tostado, que es el
tono que ya usan la landing y el resto de la interfaz. Verificado que los cuatro `.t-eyebrow`
sobre fondo oscuro —login, «Continúa donde quedaste», y los dos del dashboard admin— siguen
recibiendo el claro.

---

### A11Y-36 — El texto blanco del héroe va sobre fotografía con un velo insuficiente
- **Estado:** ✅ **Cerrado** — velo radial de 0.38 a 0.55 (2026-08-14)
- **Criterio WCAG:** 1.4.3 Contraste (mínimo) (Nivel AA)
- **Severidad:** Alta
- **Archivo:** `landing/HeroSection.tsx:82-91,118-127`
- **Vistas afectadas:** `/` — la portada pública, primera pantalla de la plataforma.

**Descripción**

El héroe rota cuatro fotografías de fondo con `objectFit: cover` y `blur(2px)`, y encima pone el
`<h1>` y un párrafo en `#fff`. La legibilidad la sostenía un halo radial
`rgba(8,14,35,0.38)`. **Con fondo fotográfico el contraste no es un valor fijo: depende del
píxel**, así que se midieron las cuatro imágenes reales aplicando el mismo desenfoque y
composición que hace el navegador, sobre la banda vertical donde vive el texto.

| Slide | `<h1>` ≥44 px (umbral 3:1) | Párrafo 16 px (umbral 4.5:1) |
| :--- | ---: | ---: |
| `hero-home.webp` | 3.78 ✅ | **3.52** ❌ |
| `hero-2.jpg` | **2.72** ❌ | 6.67 ✅ |
| `hero-3.jpg` | 3.86 ✅ | **3.94** ❌ |
| `hero-4.jpg` | 4.24 ✅ | **4.11** ❌ |

*(percentil 5 del área tras el texto; el peor píxel baja hasta 2.52:1)*

El párrafo falla en tres de las cuatro slides y el `<h1>` en una. El criterio se incumple en
cuanto una sola slide falla, porque el carrusel las muestra todas.

**Fix aplicado**

Velo al **0.55**. Verificado sobre las cuatro imágenes: el peor percentil 5 pasa de 2.99:1 a
**4.96:1**, y el peor píxel absoluto a 4.27:1 — cumple el umbral de texto normal en las cuatro.

**Riesgo de regresión**

Visual y notorio: la fotografía del héroe se ve más oscura. Es el precio de poner texto encima.
La alternativa —una caja sólida tras el texto— cambia más el diseño. Pendiente de validación.

---

### A11Y-37 — Controles y estructura de la landing: campo sin nombre, foco anulado, objetivo de 7 px, borde invisible
- **Estado:** ✅ **Cerrado** (2026-08-14)
- **Criterio WCAG:** 4.1.2 · 3.3.2 · 2.4.7 · 1.4.11 · 2.5.8 · 1.3.1
- **Severidad:** Alta
- **Archivo:** `landing/LandingFooter.tsx:38-51` · `landing/HeroSection.tsx:149-169` ·
  `landing/ContactoSection.tsx:8-17` · `landing/MisionVision.tsx:30-41` · `globals.css:791`
- **Vistas afectadas:** `/`.

**Descripción**

Cinco defectos agrupados por ser todos de la portada:

1. **Campo de novedades sin nombre accesible** (`LandingFooter`). Sólo `placeholder`, que no es
   etiqueta y desaparece al escribir. Sin `id`, sin `name`, sin `autoComplete`.
2. **`outline: none` en ese mismo campo**, que anula el indicador de foco — el mismo defecto que
   A11Y-32 corrigió en la aplicación, aquí escrito como estilo en línea.
3. **Puntos del carrusel de 7×7 px**, con `minWidth: 0; minHeight: 0` anulando cualquier mínimo
   heredado. Muy por debajo de los 24×24 de 2.5.8, y con `gap: 10` tampoco aplica la excepción
   por separación.
4. **Punto inactivo a `rgba(255,255,255,0.32)`** = **2.83:1** contra el fondo: por debajo del 3:1
   que 1.4.11 exige a un control.
5. **Borde de los campos del formulario de contacto** con `var(--borde)` = `#DCE2EC`, que da
   **1.28:1** contra el relleno. Es el gemelo de A11Y-34 en el scope de la landing, que la
   corrección de aquél no alcanzaba.

Y una sexta, estructural: **«Nuestra misión» era un `<span>`** mientras su sección hermana rotula
«Nuestra visión» con un `<h2>`. La sección de misión quedaba fuera del esquema de encabezados,
que es la vía principal para recorrer una página larga con lector de pantalla.

**Fix aplicado**

`<label class="sr-only">` + `id`/`name`/`autoComplete` en el campo, y fuera el `outline: none`.
Los puntos del carrusel pasan a un área de 24×24 con relleno transparente y el punto visible
dentro de un `<span aria-hidden>`, así que **el diseño no cambia**; el inactivo sube a `0.45`
(4.25:1). Se añade `--borde-control` a `.landing-page` (#7c8699: 3.60:1 contra el campo, 3.54:1
contra la crema, 3.24:1 contra `--arena-100`) y el formulario lo usa. «Nuestra misión» pasa a
`<h2>` conservando sus estilos explícitos.

**Riesgo de regresión**

Bajo. El único cambio perceptible es el contorno de los tres campos del formulario de contacto y
el punto inactivo del carrusel, algo más visible.

---

### A11Y-38 — El carrusel del héroe se mueve solo y no se puede detener
- **Estado:** ✅ **Cerrado** — botón de pausa (2026-08-14)
- **Criterio WCAG:** **2.2.2 Poner en pausa, detener, ocultar (Nivel A)**
- **Severidad:** Alta
- **Archivo:** `landing/HeroSection.tsx:16-29,170-195`
- **Vistas afectadas:** `/`.

**Descripción**

El héroe cambia de imagen con `setInterval` cada 5 s, en cross-fade, indefinidamente y en
paralelo con el texto de la portada. 2.2.2 exige un mecanismo para pausar, detener u ocultar todo
movimiento automático que arranque solo, dure más de 5 segundos y conviva con otro contenido.

El componente respeta `prefers-reduced-motion` —si está activo no arranca el intervalo—, y eso es
correcto, pero **no satisface 2.2.2**: el criterio pide un mecanismo *en la página*, disponible
para quien no tiene esa preferencia configurada. Los puntos del carrusel tampoco servían: cambian
de slide pero no detienen la rotación, que vuelve a avanzar 5 s después.

**Nota de alcance — este criterio no estaba en la declaración.** El § 5 de `CONFORMIDAD_A11Y.md`
enumeraba 2.2.1 (Tiempo ajustable) y anotaba de pasada que "el único `setInterval` del repositorio
está en el carrusel de la landing, que no impone plazos". Eso resuelve 2.2.1, pero **2.2.2 es un
criterio distinto, de nivel A, y no figuraba en la lista de 40 aplicables**. El recuento pasa a
41.

**Fix aplicado**

Estado `enPausa` que corta el intervalo, y un botón junto a los puntos con `aria-label` que
describe la acción concreta y cambia según el estado. Se conserva el respeto a
`prefers-reduced-motion`.

**Riesgo de regresión**

Bajo. Un control más de 24×24 px en la fila de puntos del héroe.

---

## Anexo · Barrido regla a regla de la landing (2026-08-14)

Se revisaron los nueve componentes de `landing/` más `IntroSplash`, midiendo cada color de texto
sobre su fondo real —incluidas las fotografías— y cada control. Resultado: 3 incumplimientos
(A11Y-36 a A11Y-38). Lo que se midió y **no** presentó hallazgo:

| Elemento | Medición | Veredicto |
| :--- | :--- | :--- |
| `LandingFooter` — texto base, descripción, enlaces y legal, en blanco al 50–72 % sobre `#0b1838` | 5.18 – 9.40:1 | ✅ |
| `MisionVision` — párrafo del héroe y texto de tarjeta, blanco al 70–82 % sobre `#0f1f4d` | 8.36 y 11.02:1 | ✅ |
| `ValoresSection` — bajada, destacada, texto de tarjeta y pie, blanco al 62–78 % | 6.94 – 9.69:1 | ✅ |
| `ContactoSection` — párrafo blanco al 82 % sobre el velo navy | 11.38:1 | ✅ |
| `MisionVision` — `#E2B673` sobre `#0f1f4d` | 8.44:1 | ✅ |
| `LandingNav` — `#1A1A2E` sobre la crema de la landing | 16.46:1 | ✅ |
| `ContactoSection` — los tres campos del formulario | `<label>` envolvente: asociación implícita válida | ✅ |
| `ValoresSection` — badge ámbar `#F5A623` | icono decorativo con `aria-hidden`; 1.4.11 no aplica | ✅ |
| Punto **activo** del carrusel y distinción activo/inactivo | 11.69:1 contra el fondo; 4.14:1 entre estados, más la diferencia de ancho | ✅ |
| Jerarquía de encabezados | `h1` → `h2` → `h3` sin saltos, una vez promovida «Nuestra misión» | ✅ |
| `LandingNav` | `<nav aria-label="Navegación principal">`, enlaces con `href` real | ✅ |

**Observación que no es incumplimiento.** Los dos formularios de la landing —contacto y
novedades— son **sólo visuales**: su `onSubmit` hace `preventDefault()` y no envían nada, sin
mensaje alguno al usuario. No viola ningún criterio WCAG (no hay error que identificar), pero
quien rellene y envíe no recibe respuesta. Conviene resolverlo como producto, o retirarlos.

---

## Anexo · Barrido regla a regla de las paletas con scope (2026-08-14)

Se revisaron las **50 reglas** que el bundle compilado emite bajo `.paleta-oliva`, `.paleta-azul`
y `.landing-page`, más sus tokens. Resultado: 2 incumplimientos (A11Y-34 y A11Y-35) y el resto
conforme. Lo que se midió y **no** presentó hallazgo, para que no se vuelva a revisar:

| Regla | Medición | Veredicto |
| :--- | :--- | :--- |
| `.tabla th { color: var(--tinta-3) }` | 5.13:1 sobre tarjeta | ✅ |
| `.nav-item.activo { background: #1e3a8ab3 }` con texto blanco | compuesto `#6274aa` → 4.57:1 | ✅ ajustado pero cumple |
| `.card { border: 1px solid #ece7dd }` | decorativo, 1.4.11 no aplica (decisión (b) del § 3) | ✅ |
| `.sidebar` / `.topbar` `border: var(--borde-suave)` | separadores decorativos | ✅ |
| `.landing-page .t-eyebrow { color: var(--ambar-700) }` | 4.85:1 sobre `#fafbfc` | ✅ |
| `.landing-page .t-eyebrow.claro { color: #f5c26b }` | 9.68:1 sobre el navy de sus dos secciones | ✅ |
| `.landing-page .t-display em { color: var(--ambar-700) }` | 4.85:1 | ✅ |
| `--ok` / `--ok-bg` en `.paleta-oliva` | 4.67:1 | ✅ |
| `.badge { border: none }` | el color va sobre `--*-bg` propio, ya verificado en A11Y-01 | ✅ |
| `.paleta-*/.acento-claro { color: var(--oliva-clara) }` | **sin consumidores en el código**: CSS muerto | n/a |
| Reglas de tipografía, tamaño mínimo de objetivo y `text-decoration` | sin implicación de contraste | n/a |

**Conclusión del barrido.** Las paletas con scope han producido **cinco** incumplimientos que
sobrevivieron a correcciones dadas por cerradas: `--ambar-700` (2026-08-13), A11Y-32, A11Y-33,
A11Y-34 y A11Y-35. El mecanismo es siempre el mismo —re-declaración de token o regla con
`!important` dentro del scope— y la lección operativa está recogida en `CLAUDE.md`.

---

## 1 · Tabla resumen por criterio

Leyenda: **Conforme** = no se encontraron incumplimientos · **No conforme** = ≥ 1 hallazgo ·
**N/A** = el criterio no tiene contenido aplicable en la plataforma.

### Percepción

| Criterio | Nivel | Conforme | No conforme | Hallazgos |
| :--- | :---: | :---: | :---: | :--- |
| 1.1.1 Contenido no textual | A | | ❌ | A11Y-28, A11Y-29 |
| 1.3.1 Información y relaciones | A | | ❌ | A11Y-06, 10, 11, 15, 20, 31 |
| 1.3.2 Secuencia significativa | A | ✅ | | orden DOM = orden visual en todas las vistas revisadas |
| 1.3.4 Orientación | AA | ✅ | | `manifest.ts` no fija `orientation`; sin bloqueos en CSS |
| 1.3.5 Identificar propósito de entrada | AA | ✅ | | `autoComplete` correcto en login, registro y recuperación |
| 1.4.1 Uso del color | A | | ❌ | A11Y-06, 11, 13, 19 |
| 1.4.3 Contraste (mínimo) | AA | | ❌ | A11Y-01, 02, 07, 18, 23 |
| 1.4.4 Cambio de tamaño del texto | AA | ⚠ | | funciona, pero todo el sistema mide en `px`: ver nota |
| 1.4.10 Reflujo | AA | | ❌ | A11Y-16, A11Y-25 |
| 1.4.11 Contraste no textual | AA | | ❌ | A11Y-01, 02, 03, 06, 17, 19 |
| 1.4.12 Espaciado del texto | AA | | ❌ | A11Y-26 |
| 1.4.13 Contenido al pasar el cursor | AA | | ❌ | A11Y-05, A11Y-27 |

> **Nota sobre 1.4.4.** El criterio se cumple: el zoom del navegador al 200 % escala los `px` y
> el layout responde. Además `didasko.css:1382-1383` ofrece escalado propio por preferencia de
> usuario (`zoom: 1.12` / `1.28`). Pero `html { font-size: 18px }` (`globals.css:66`) queda
> anulado por `body { font-size: 16px }` (`didasko.css:68`), y prácticamente todos los tamaños
> están en `px` —muchos inline—, así que **la plataforma ignora el tamaño de fuente configurado
> en el navegador**. No es un incumplimiento de 1.4.4, pero contradice la norma del proyecto
> ("Font-size base 18px") y perjudica al mismo público que la motivó.

### Operabilidad

| Criterio | Nivel | Conforme | No conforme | Hallazgos |
| :--- | :---: | :---: | :---: | :--- |
| 2.1.1 Teclado | A | | ❌ | A11Y-05, 08, 13 |
| 2.1.2 Sin trampas de teclado | A | | ❌ | A11Y-04, A11Y-12 |
| 2.4.1 Evitar bloques | A | | ❌ | A11Y-09 |
| 2.4.2 Titulado de páginas | AA | | ❌ | A11Y-21 (títulos únicos ✅, formato degradado) |
| 2.4.3 Orden del foco | A | | ❌ | A11Y-04, A11Y-12 |
| 2.4.4 Propósito del enlace (en contexto) | A | ✅ | | sin `href="#"`; H5 cerrado. "Ver todos" / "Ver reporte" quedan claros en contexto |
| 2.4.6 Encabezados y etiquetas | AA | | ❌ | A11Y-10, 20, 22 |
| 2.4.7 Foco visible | AA | | ❌ | A11Y-01, 02, 03, 06 |
| 2.4.11 Foco no oscurecido (mínimo) | AA | | ❌ | A11Y-30 |
| 2.5.3 Etiqueta en el nombre | A | ⚠ | | controles sólo-icono → N/A. `title` ≠ `aria-label` en `WorkersTable` (A11Y-27) |
| 2.5.8 Tamaño del objetivo (mínimo) | AA | | ❌ | A11Y-19 (y A11Y-16 lo cumple en exceso) |

### Comprensión

| Criterio | Nivel | Conforme | No conforme | Hallazgos |
| :--- | :---: | :---: | :---: | :--- |
| 3.1.1 Idioma de la página | A | ✅ | | `<html lang="es">` en `layout.tsx:78` |
| 3.2.1 Al recibir el foco | A | ✅ | | ningún control cambia de contexto al enfocarse |
| 3.2.2 Al recibir entradas | A | ✅ | | los `<select>` filtran, no navegan; el panel de accesibilidad exige "Guardar" |
| 3.2.3 Navegación consistente | AA | ✅ | | sidebar admin y tab bar del trabajador estables en todas las vistas |
| 3.2.4 Identificación consistente | AA | ⚠ | | dos tablas de suspendidos duplicadas (`SuspendedTable` / `SuspendidosTable`); `aria-label` en un buscador sí y en otro no (A11Y-08) |
| 3.3.1 Identificación de errores | A | ✅ | | errores en texto con `role="alert"` en login, registro y paneles admin |
| 3.3.2 Etiquetas o instrucciones | A | | ❌ | A11Y-08, A11Y-24 |
| 3.3.3 Sugerencia ante errores | AA | | ❌ | A11Y-24 |
| 3.3.7 Entrada redundante | A | ✅ | | sólo se repite la contraseña, exención explícita del criterio |
| 3.3.8 Autenticación accesible (mínimo) | AA | ✅ | | sin captcha ni acertijos; `autoComplete` permite gestores de contraseñas; hay acceso demo de un clic |

### Robustez

| Criterio | Nivel | Conforme | No conforme | Hallazgos |
| :--- | :---: | :---: | :---: | :--- |
| 4.1.2 Nombre, rol, valor | A | | ❌ | A11Y-04, 05, 06, 08, 11, 13, 15, 17, 22 |
| 4.1.3 Mensajes de estado | AA | | ❌ | A11Y-08, A11Y-14 |

### Totales

| | Conformes | No conformes | Conformes con observación | N/A |
| :--- | ---: | ---: | ---: | ---: |
| Percepción (12) | 3 | 8 | 1 | 0 |
| Operabilidad (11) | 1 | 9 | 1 | 0 |
| Comprensión (10) | 7 | 2 | 1 | 0 |
| Robustez (2) | 0 | 2 | 0 | 0 |
| **Total (35)** | **11** | **21** | **3** | **0** |

---

## 2 · Ranking: los 10 fixes de mayor impacto por esfuerzo

Orden por relación beneficio/coste, no por severidad. "Esfuerzo" en jornadas de una persona.

| # | Hallazgo | Qué desbloquea | Esfuerzo | Riesgo visual |
| :-: | :--- | :--- | :---: | :---: |
| 1 | **A11Y-09** — añadir skip link | 2.4.1 completo. Un archivo, ~20 líneas de CSS. Ahorra 13 tabulaciones por página a todo usuario de teclado. | 0,25 d | Ninguno |
| 2 | **A11Y-03** — quitar `focus:outline-none` | 26 controles recuperan foco visible. Búsqueda y reemplazo mecánico. Cierra la mitad de 2.4.7. | 0,5 d | Ninguno |
| 3 | **A11Y-01** — unificar tokens de `globals.css` | Arregla en cascada bordes de input (1.26:1), anillos shadcn (1.54:1) y dos declaraciones inválidas. Un solo archivo. | 0,5 d | **Alto** |
| 4 | **A11Y-02** — sustituir literales por tokens accesibles | ~120 sustituciones mecánicas usando tokens que ya existen. Cierra la mayor parte de 1.4.3. | 1,5 d | Medio |
| 5 | **A11Y-14** — `role="status"` en resultados de quiz y módulos | 3 componentes, ~15 líneas. El trabajador con lector por fin sabe si aprobó. | 0,25 d | Ninguno |
| 6 | **A11Y-04** — `inert` + foco en el cajón móvil admin | Un archivo. Elimina 12 paradas de foco fantasma en todo `/admin` móvil. | 0,5 d | Bajo |
| 7 | **A11Y-15** — `scope`, `caption` y `aria-sort` en 6 tablas | Sin efecto visual, alto retorno para lector de pantalla. Plantilla ya existe en `admin/dashboard`. | 0,5 d | Ninguno |
| 8 | **A11Y-05** — convertir el tooltip del quiz en disclosure | Un componente. Hace accesible en móvil una regla que hoy nadie ve en teléfono. | 0,25 d | Bajo |
| 9 | **A11Y-12** — hook `useDialogoAccesible` en 8 diálogos | Un hook nuevo + 8 llamadas de 2 líneas. Cierra 2.1.2 y buena parte de 2.4.3. | 1 d | Bajo |
| 10 | **A11Y-23** — oscurecer `--tinta-3` a `#666C80` | **Un token.** Corrige el texto auxiliar de toda la plataforma sobre el fondo crema. | 0,1 d | Muy bajo |

**Total estimado del top 10: ~5,4 jornadas.** Cubre 2.4.1, 2.4.7, 4.1.3, 2.1.2 y la mayoría de
1.4.3 y 1.4.11 — es decir, la mayor parte de la superficie de no conformidad.

Fuera del top 10 pero de coste bajo y sin riesgo: **A11Y-21** (títulos, 0,25 d), **A11Y-28** y
**A11Y-29** (`aria-hidden`, 0,25 d juntos), **A11Y-22** (título del iframe, 0,1 d),
**A11Y-30** (`scroll-margin`, 0,1 d).

---

## 3 · Fixes que requieren decisión de diseño — no aplicar en solitario

Estos siete cambian el aspecto o el contenido de la interfaz. **No deben aplicarse sin
validación con la clienta**, porque alteran mockups ya aprobados o textos visibles.

| # | Hallazgo | La decisión que hay que tomar |
| :-: | :--- | :--- |
| 1 | **A11Y-01** — `--primary` y `--border` | Reparar los tokens cambia los componentes shadcn de negro a azul Alumco y engrosa visualmente los bordes hairline. Contradice de frente la intención declarada en `didasko.css:804-808` ("las tarjetas se leen por espacio en blanco, no por contorno navy"). **Opciones:** (a) reparar el token y aceptar el cambio; (b) reparar el token y compensar puntualmente el borde de `.card` para conservar el hairline, subiéndolo sólo en inputs y controles. La opción (b) cumple igual —1.4.11 aplica a componentes de interfaz, no a bordes decorativos de tarjeta— y preserva la estética. **Recomendación: (b).** |
| 2 | **A11Y-02** — anillo de foco | El anillo de dos tonos (núcleo navy + halo ámbar) pasa de 5 px a 9 px de grosor total. Alternativa más discreta: anillo navy simple de 3 px, que cumple igual pero pierde el ámbar de marca en el foco. **Decisión: identidad de marca vs. sobriedad.** |
| 3 | **A11Y-07** — color de texto de los botones ámbar | Pasar de blanco a navy sobre ámbar es lo que ya hace `.btn-primary` en el resto de la plataforma, así que **aumenta** la coherencia; pero cambia el aspecto de 6 CTA del flujo del quiz y de los certificados, que están en los mockups aprobados. |
| 4 | **A11Y-11** — texto de "Tu recorrido" | Sustituir "Curso 1 / Curso 2 / Curso 3" por "Completado / En curso / Pendiente" **cambia texto visible en `/inicio`**, la pantalla principal del trabajador. Es la única forma de cumplir 1.4.1 sin añadir iconografía nueva. Alternativa: conservar "Curso N" y añadir debajo una segunda línea con el estado — ocupa más alto en el carril horizontal. |
| 5 | **A11Y-17** — riel de la barra de progreso | Para llegar a 3:1 hay que oscurecer el riel (la barra se lee como dos tonos de arena) **o** oscurecer el relleno a `--ambar-700` (pierde el ámbar de marca). Ninguna de las dos es neutra. **Recomendación: oscurecer el riel**, que es el elemento no protagonista. |
| 6 | **A11Y-19 + A11Y-27** — celdas del calendario de plazos | Subir las píldoras a 24 px y separarlas 4 px no cabe en las celdas actuales de 60 px. Hay que elegir: (a) subir las celdas a 76 px —el calendario crece ~112 px en total—; (b) mostrar una sola píldora por día en móvil y un contador "+N"; (c) reemplazar el calendario por una lista de plazos en móvil. **Recomendación: (b).** |
| 7 | **A11Y-26** — barra de tabs a dos líneas | Permitir el salto de línea en las etiquetas del tab bar sube la barra de 56 px a 60 px y puede desalinear iconos si una etiqueta salta y otra no. Alternativa: acortar "Certificados" a "Certif." — pero eso degrada 2.4.6. **Recomendación: subir la barra y aceptar el salto.** |

Además, dos puntos que **no son defectos de código** y necesitan decisión de proceso, no de
diseño:

- **Subtítulos de video (1.2.2, Nivel A).** Los videos se sirven desde YouTube. La conformidad
  AA exige subtítulos en todo video pregrabado con audio. El código no puede garantizarlo:
  debe convertirse en un requisito del flujo de carga de cursos (campo obligatorio "video con
  subtítulos verificados" en el constructor). Ver A11Y-22.
- **Tamaño base en `px` (1.4.4).** La norma del proyecto dice "font-size base 18px", pero
  `didasko.css:68` lo baja a 16px y todo el sistema mide en `px`, ignorando la configuración de
  fuente del navegador. Migrar a `rem` es un refactor grande con alto riesgo visual; se propone
  evaluarlo como trabajo aparte, no dentro de esta fase.

---

## Anexo · Qué se verificó y no presentó hallazgos

Para dejar constancia del alcance revisado:

- **`<html lang="es">`** — `layout.tsx:78`. Correcto.
- **Orientación** — sin `orientation` en `manifest.ts` ni bloqueos en CSS. Funciona en portrait
  y landscape.
- **`autocomplete`** — `LoginForm.tsx:68,95`, `RegisterForm.tsx:43,53,58,63`,
  `ForgotPasswordForm.tsx:83`. Tokens correctos. `rut` usa `autoComplete="off"` porque no
  existe token HTML para el identificador chileno: aceptable.
- **Movimiento reducido** — `didasko.css:1416-1436` y `globals.css:110-115,389-396,612-645`
  respetan `prefers-reduced-motion` y ofrecen preferencia por usuario. Bien resuelto.
- **Errores en texto (3.3.1)** — `LoginForm.tsx:40-60` y `RegisterForm.tsx:29-39` usan
  `role="alert" aria-live="assertive"` con icono `aria-hidden` y texto. Modelo a replicar.
- **`href="#"`** — cero ocurrencias en todo `src/`. H5 cerrado.
- **Drag & drop del constructor de cursos** — `BlockCanvas.tsx:39-41` registra `KeyboardSensor`
  junto a `PointerSensor`, y `BlockCard.tsx:120-125` expone el handle como `<button>` con
  `aria-label`. **El reordenamiento por teclado funciona.** Recomendación menor: añadir
  `announcements` personalizados en español al `DndContext` (dnd-kit los emite en inglés por
  defecto).
- **Barra de tabs inferior (1.4.1)** — `didasko.css:1259-1273` marca el tab activo con color
  **más** una barra superior de 3 px y `font-weight: 600`, y `WorkerTopNav.tsx:151` añade
  `aria-current="page"`. Correctamente resuelto con canal no cromático.
- **Estado "Bloqueado" del índice de módulos (1.4.1)** — `ModuleIndex.tsx:177-183` acompaña el
  candado con la palabra "Bloqueado". Correcto (su problema es de contraste, A11Y-18).
- **Leyenda del calendario (1.4.1)** — `DeadlineCalendar.tsx:176-187` acompaña cada muestra de
  color con texto. Correcto.

---

*Fin del informe de auditoría. Ningún archivo del código fue modificado en esa fase.*

---
---

# Corrección de la base de estilos

**Fecha:** 2026-08-10 · **Archivo modificado:** `src/app/globals.css` (único)
**Build:** `npm run build` → ✅ *Compiled successfully in 5.1s*, 12/12 páginas estáticas generadas.

Corrige A11Y-01 (tokens en conflicto), A11Y-16 (targets táctiles), la mitad de A11Y-02
(anillo de foco) y parte de A11Y-26 (espaciado del texto). No toca componentes, Server
Actions, Supabase ni el esquema.

## Decisión de sistema de color: oklch

Se elimina el `:root` sin capa y queda **un solo set canónico en oklch dentro de
`@layer base`**. Motivos, en orden de peso:

1. Tailwind v4 consume los tokens tal cual desde `@theme inline`
   (`--color-primary: var(--primary)`). Un token con componentes HSL sueltos
   (`213 90% 35%`) sólo funciona si **cada** consumidor lo envuelve en `hsl()` — y eso
   es exactamente lo que se rompió. Con oklch el token guarda un color completo y no
   se envuelve nunca.
2. oklch es perceptualmente uniforme: mover la L cambia el contraste de forma
   predecible, que es la operación que hubo que hacer 24 veces.
3. shadcn/ui v4 ya emite oklch, así que `src/components/ui/**` sigue funcionando sin
   tocarlo.

También se corrigieron las dos declaraciones inválidas (`hsl(var(--background))`,
`hsl(var(--ring))`) y se fusionaron los dos `@layer base`. **`@import "tailwindcss"`
aparecía una sola vez**: el duplicado que reportaba H1 no existía.

> **Nota de compilación relevante.** Lightning CSS (el minificador de Turbopack)
> convierte todo `oklch()` a hex según el browserslist del proyecto: **el bundle no
> contiene ni un solo `oklch`** (verificado: `grep -c oklch` = 0). Por eso los ratios
> de las tablas siguientes están calculados sobre los **hex realmente enviados al
> navegador**, extraídos del bundle compilado, no sobre los valores de origen.
>
> Esto importó: en tres tonos que caían fuera del gamut sRGB (los verdes y el ámbar
> oscuro), el mapeo de gamut de Lightning CSS difiere del cálculo de origen y el color
> final no era el previsto — `--success` se quedaba en 4.56:1 en vez de 4.73:1. Se
> resolvió declarando esos tres tokens con el **croma máximo dentro de gamut**, de modo
> que el oklch de origen y el hex compilado describen el mismo color. Los rojos
> conservan el croma de marca porque ya estaban dentro del gamut.

## Tabla de pares token/fondo — tema claro

Valores tomados del bundle compilado. Mínimo 4.5:1 para texto, 3:1 para bordes.

| Par foreground / background | fg | bg | Ratio | Mín | |
| :--- | :--- | :--- | ---: | ---: | :-: |
| `--foreground` / `--background` | `#21283b` | `#ffffff` | **14.67:1** | 4.5 | ✅ |
| `--card-foreground` / `--card` | `#21283b` | `#ffffff` | **14.67:1** | 4.5 | ✅ |
| `--muted-foreground` / `--muted` | `#5d6471` | `#f2f3f7` | **5.37:1** | 4.5 | ✅ |
| `--muted-foreground` / `--background` | `#5d6471` | `#ffffff` | **5.95:1** | 4.5 | ✅ |
| `--primary-foreground` / `--primary` | `#ffffff` | `#2b4fa0` | **7.70:1** | 4.5 | ✅ |
| `--secondary-foreground` / `--secondary` | `#21283b` | `#eef0f4` | **12.86:1** | 4.5 | ✅ |
| `--destructive-foreground` / `--destructive` | `#ffffff` | `#d63b2d` | **4.64:1** | 4.5 | ✅ |
| `--success-foreground` / `--success` | `#ffffff` | `#008644` | **4.67:1** | 4.5 | ✅ |
| `--warning-foreground` / `--warning` | `#0f172a` | `#f5a623` | **8.81:1** | 4.5 | ✅ |
| `--border` / `--background` | `#868d9a` | `#ffffff` | **3.34:1** | 3.0 | ✅ |
| `--input` / `--background` | `#868d9a` | `#ffffff` | **3.34:1** | 3.0 | ✅ |
| `--ring` / `--background` | `#2b4fa0` | `#ffffff` | **7.70:1** | 3.0 | ✅ |

## Tabla de pares token/fondo — tema oscuro

| Par foreground / background | fg | bg | Ratio | Mín | |
| :--- | :--- | :--- | ---: | ---: | :-: |
| `--foreground` / `--background` | `#f4f5f8` | `#10141c` | **16.91:1** | 4.5 | ✅ |
| `--card-foreground` / `--card` | `#f4f5f8` | `#1b1f29` | **15.11:1** | 4.5 | ✅ |
| `--muted-foreground` / `--muted` | `#9fa5b0` | `#262b36` | **5.73:1** | 4.5 | ✅ |
| `--muted-foreground` / `--background` | `#9fa5b0` | `#10141c` | **7.45:1** | 4.5 | ✅ |
| `--primary-foreground` / `--primary` | `#10141c` | `#77a2fb` | **7.33:1** | 4.5 | ✅ |
| `--secondary-foreground` / `--secondary` | `#f4f5f8` | `#2b303c` | **12.11:1** | 4.5 | ✅ |
| `--destructive-foreground` / `--destructive` | `#10141c` | `#ff6856` | **6.47:1** | 4.5 | ✅ |
| `--success-foreground` / `--success` | `#10141c` | `#4cca7a` | **8.81:1** | 4.5 | ✅ |
| `--warning-foreground` / `--warning` | `#10141c` | `#f5a623` | **9.10:1** | 4.5 | ✅ |
| `--border` / `--background` | `#6b727f` | `#10141c` | **3.81:1** | 3.0 | ✅ |
| `--input` / `--background` | `#6b727f` | `#10141c` | **3.81:1** | 3.0 | ✅ |
| `--ring` / `--background` | `#77a2fb` | `#10141c` | **7.33:1** | 3.0 | ✅ |

**24 de 24 pares conformes, 0 fallos.**

> El tema oscuro **no está cableado** en la aplicación: ningún componente aplica la
> clase `.dark` (sólo `ui/sonner.tsx` lee `useTheme`). Los tokens quedan correctos por
> si se activa, pero hoy son código latente.

## Variantes de estado como color de texto

Resueltas conservando el **hue exacto** del color de marca y bajando la L. El objetivo
se fijó contra `#F3ECDC` (`--arena-100`, la superficie clara más oscura del sistema),
no contra blanco puro, para que sirvan sobre cualquier fondo claro de la plataforma.

| Token | Valor | Origen | blanco | tarjeta `#FFFDF6` | crema `#FAF6ED` | `#F0F4F7` | arena `#F3ECDC` |
| :--- | :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| `--success-text` | `#007a3e` | `#27AE60` (2.87:1) | 5.45 | 5.35 | 5.05 | 4.93 | **4.63** ✅ |
| `--error-text` | `#c92c20` | `#E74C3C` (3.82:1) | 5.43 | 5.34 | 5.04 | 4.91 | **4.62** ✅ |
| `--warning-text` | `#925f00` | `#F5A623` (2.03:1) | 5.44 | 5.35 | 5.05 | 4.92 | **4.62** ✅ |

Los originales `#27AE60`, `#E74C3C` y `#F5A623` quedan permitidos **sólo como fondo de
badge o relleno decorativo**, nunca como color de texto.

Caso aparte, `--warning`: en vez de oscurecer el ámbar se **conservó `#F5A623` intacto
como fondo** y se puso tinta oscura encima (8.81:1). Es el mismo patrón que
`.btn-primary` de didasko, así que preserva la identidad mejor que oscurecer el fondo y
además aumenta la coherencia con el resto de la plataforma.

## Anillo de foco de doble contorno

`outline: 3px solid var(--ring)` + `box-shadow: 0 0 0 2px var(--background)`. El
contorno interior usa el color de superficie y el exterior el azul de marca, de modo que
**siempre uno de los dos contrasta ≥3:1** con lo que tenga al lado. Medido sobre las
superficies reales:

| Superficie | Anillo `#2b4fa0` | Separador `#ffffff` | Mejor | |
| :--- | ---: | ---: | ---: | :-: |
| Página crema `#FAF6ED` | **7.14:1** | 1.08:1 | 7.14:1 | ✅ |
| Tarjeta `#FFFDF6` | **7.56:1** | 1.02:1 | 7.56:1 | ✅ |
| Blanco puro | **7.70:1** | 1.00:1 | 7.70:1 | ✅ |
| Sidebar navy `#152A66` | 1.75:1 | **13.51:1** | 13.51:1 | ✅ |
| Hero de marca `#1E3A8A` | 1.35:1 | **10.36:1** | 10.36:1 | ✅ |
| Botón ámbar `#F5A623` | **3.80:1** | 2.03:1 | 3.80:1 | ✅ |
| Navy oscuro `#0F1F4D` | 2.06:1 | **15.87:1** | 15.87:1 | ✅ |
| Arena `#F3ECDC` | **6.54:1** | 1.18:1 | 6.54:1 | ✅ |
| Fondo destructive `#d63b2d` | 1.66:1 | **4.64:1** | 4.64:1 | ✅ |

Sustituye al `outline: 3px solid var(--ambar)` de didasko (2.03:1). Se verificó en el
bundle que la regla nueva se emite **después** de la de didasko, en la misma capa y con
la misma especificidad, así que gana la cascada.

## Tokens derivados

`--md-*` y `--alumco-*` dejan de competir con el set canónico: los que tienen
equivalente pasan a ser alias (`--md-primary: var(--primary)`, `--md-on-surface:
var(--foreground)`, `--md-outline: var(--border)`, `--alumco-gold: var(--warning)`…), y
sólo se conservan como literales los pasos de la escala tonal MD3 que no tienen twin
canónico. Los pares MD3 realmente usados en componentes quedan así:

| Par | Ratio | |
| :--- | ---: | :-: |
| `--md-on-surface` / `--md-surface-container-lowest` | 14.67:1 | ✅ |
| `--md-on-surface-variant` / `--md-surface-container-lowest` | 5.95:1 | ✅ |
| `--md-on-surface-variant` / `--md-surface-container-high` | 4.85:1 | ✅ |
| `--md-on-surface-variant` / `--md-surface-container-highest` | 4.60:1 | ✅ |
| `--md-primary` / `--md-surface-container-high` | 6.26:1 | ✅ |
| `--md-on-primary-container` / `--md-primary-container` | 6.11:1 | ✅ |
| `--md-on-tertiary-container` / `--md-tertiary-container` | 6.05:1 | ✅ |
| `--md-error` / `--md-surface-container-lowest` | 4.64:1 | ✅ |
| `--md-outline` / `--md-surface` | 3.16:1 | ✅ |

## Corrección de tres ratios del informe de auditoría

Al calcular con la implementación verificada aparecieron tres cifras mal en la primera
fase. **Ninguna cambia una conclusión** —lo que pasaba sigue pasando y lo que fallaba
sigue fallando—, pero quedan corregidas:

| Dónde | Decía | Correcto | Efecto |
| :--- | ---: | ---: | :--- |
| A11Y-02, `--ok` `#2E7D5B` | 4.85:1 | **5.00:1** | Ninguno: pasaba y pasa |
| A11Y-02, `--peligro` `#BB3A2E` | 5.28:1 | **5.59:1** | Ninguno: pasaba y pasa |
| A11Y-01, `oklch(0.922 0 0)` | "≈ `#EBEBEB`" | `#E5E5E5` | El ratio 1.26:1 era correcto |

Los otros ocho valores de referencia se validaron exactos, incluidos los tres centrales
del informe: `#F5A623` = 2.03:1, `#2B4FA0` = 7.70:1 y el anillo `ring/50` = 1.54:1.

## Qué cambió visualmente

Menos de lo que la auditoría anticipaba, y el riesgo de diseño número 1 se disolvió:

- **La hairline de las tarjetas NO se toca.** `.card` de didasko usa
  `border: 1px solid var(--borde-suave)` en shorthand, así que no depende de `--border`.
  El dilema estético que A11Y-01 planteaba como decisión de diseño **no existe**: se
  puede subir `--border` a 3.34:1 conservando el look de "tarjeta sin contorno".
- **Bordes de campo visibles.** Los 30 usos de `border-input`/`border-border` pasan de
  `#e5e5e5` (1.26:1) a `#868d9a` (3.34:1). Se concentran en `admin/cursos/nuevo` y los
  seis archivos de `CourseBuilder/` — justo las pantallas que la auditoría señalaba.
  **Este es el cambio visible más notorio y es el objetivo del fix.**
- **`--primary` de negro a azul Alumco: sin efecto visible.** Los primitivos shadcn
  están prácticamente sin usar (`Badge`, `Avatar`, `Progress`, `Card`, `Dialog`,
  `Select`, `Input`, `Table`, `Tabs`: cero importaciones fuera de `ui/`). El único
  `<Button>` del proyecto está en `ApprovalPanel.tsx:365` y sobrescribe el fondo con
  `bg-[#b9740f]`. El cambio es correcto pero no se ve.
- **Anillo de foco ámbar → azul con halo blanco.** Es el cambio perceptible en toda la
  aplicación, y es intencional.
- **Enlaces en línea recuperan su altura natural.** La regla de 48 px dejó de aplicarse
  a todo `<a>`; ahora sólo alcanza controles reales, a 44 px. Afecta al pie del login,
  a "Volver al inicio de sesión" del registro y a los enlaces dentro del contenido de
  módulo, que dejan de tener huecos verticales.
- **Botones y badges pueden ocupar dos líneas** (`white-space: normal`): con textos
  largos o con el espaciado de 1.4.12 crecen en alto en vez de desbordar.
- **La barra de tabs inferior sube de 56 px a 60 px** y sus etiquetas ya no se truncan
  con puntos suspensivos.
- **`html` pasa de `18px` fijo a `112.5%`**: renderiza idéntico con la configuración por
  defecto (16 × 1.125 = 18 px) pero ahora respeta el tamaño de fuente del navegador
  (1.4.4). Sin cambio visual salvo para quien ya había subido esa preferencia.

## Qué sigue pendiente

- **A11Y-03 no queda resuelto por este cambio.** Las 26 ocurrencias de
  `focus:outline-none` viven en la capa `utilities` de Tailwind, que gana a la capa
  `components` donde está el anillo nuevo. Se verificó en el bundle:
  `.focus-visible\:outline-none:focus-visible{outline-style:none}` sigue anulando el
  contorno en esos controles. Es un fix de componentes (9 archivos), fuera del alcance
  de esta fase.
- **Los literales `#F5A623` / `#27AE60` / `#E74C3C` usados como color de texto siguen
  ahí** (unas 120 ocurrencias). Los tokens `--success-text`, `--error-text` y
  `--warning-text` ya existen y están verificados, pero migrar los consumidores es la
  fase de componentes.
- **`didasko.css` conserva su propio `:focus-visible` ámbar y sus tokens `--ok` /
  `--peligro` / `--aviso`.** Hoy no hay conflicto —el anillo nuevo gana la cascada— pero
  quedan dos orígenes de verdad para el color semántico. Conviene unificarlos cuando se
  toquen los componentes.
- **`.recorte` y los `truncate` de datos** (nombres, títulos de curso) siguen recortando
  con elipsis. La auditoría los consideró aceptables por tratarse de valores de dato con
  vía alternativa de acceso, no de etiquetas de interfaz.

*Fin. El único archivo de código modificado es `src/app/globals.css`.*

