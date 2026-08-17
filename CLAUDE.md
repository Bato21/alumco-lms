# **Alumco LMS — Contexto completo del proyecto**

## **Rol**

Actúa como Senior Full-Stack Tech Lead de este proyecto. Estamos

construyendo una plataforma LMS (Learning Management System) para la

ONG Alumco, dedicada al cuidado de adultos mayores en ELEAMs (Chile).

El objetivo es capacitar continuamente a sus trabajadores de forma

asíncrona, homologando conocimientos en 2 sedes.

## **Stack tecnológico**

| Capa | Tecnología |
| :---- | :---- |
| Framework | Next.js 16 (App Router, NO Pages Router) |
| Lenguaje | TypeScript estricto — cero any |
| UI | shadcn/ui \+ Tailwind CSS |
| BaaS | Supabase (Auth \+ PostgreSQL \+ Storage \+ Edge Functions) |
| Estado servidor | Server Components \+ Server Actions |
| Estado cliente | useActionState, useTransition |
| Validación | Zod |
| Formularios | react-hook-form \+ @hookform/resolvers |
| PDF | pdf-lib |
| Deploy target | Vercel (frontend) \+ Supabase Cloud |
| Proxy/Middleware | src/middleware.ts → src/proxy.ts → src/lib/supabase/middleware.ts |

## **Normativas de código estrictas**

1. **Accesibilidad (A11y)**: WCAG 2.2 nivel AA. Ver la sección  
   "**Normas de accesibilidad**" más abajo — es obligatoria y `npm run lint`  
   la hace cumplir. Nota: la afirmación original "100% web de escritorio,  
   NO móvil" quedó obsoleta; la plataforma se usa mayoritariamente en  
   teléfono y se instala como PWA.  
2. **TypeScript estricto**: Sin any. Tipado fuerte con interfaces  
   definidas en src/lib/types/database.ts.  
3. **Modularidad Server/Client**:  
   * 'use server' en PRIMERA línea de Server Actions (sin comentarios antes)  
   * 'use client' en PRIMERA línea de Client Components (sin comentarios antes)  
   * Nunca importar next/headers o server.ts desde un Client Component  
   * Nunca importar client.ts desde un Server Component  
4. **Paleta de colores Alumco** (extraída de ongalumco.cl):  
   * Primary blue: \#2B4FA0  
   * Accent yellow/gold: \#F5A623  
   * Success green: \#27AE60  
   * Error red: \#E74C3C  
   * Background: \#F5F5F5  
   * Dark text: \#1A1A2E

## **Normas de accesibilidad**

**Estándar obligatorio: WCAG 2.2 nivel AA.** No es una aspiración: es un
compromiso contractual registrado en la Matriz RACI del proyecto (actividad 9,
"Pruebas de Calidad y Accesibilidad — WCAG AA"). El público son trabajadores de
ELEAM con rango etario amplio, mayoría en móvil y alfabetización digital
variable.

**Antes de escribir código nuevo**, leer `docs/CONFORMIDAD_A11Y.md` (estado
verificado) y `docs/AUDITORIA_A11Y.md` (los 31 hallazgos con su fix propuesto).
Estas reglas existen para que no se reintroduzca lo que ya se corrigió.

### Verificación automática

`npm run lint` corre `eslint-plugin-jsx-a11y` en preset **`strict`, con todas
las reglas elevadas a `error`**. Un incumplimiento rompe el build. Tres reglas
están desactivadas o ajustadas con justificación escrita en
`eslint.config.mjs` — **no tocar esos overrides sin leer el comentario**.

Un `eslint-disable` de una regla `jsx-a11y/*` **siempre** va acompañado de un
comentario que explique por qué es un falso positivo y dónde está la vía
accesible equivalente. Sin ese comentario, no pasa revisión.

### Reglas para todo componente nuevo

**Semántica y estructura**
- Acciones: `<button type="button">`. **Nunca** `<div>`/`<span>` con `onClick`.
  Si el diseño pide apariencia de enlace, usar `<button>` con estilo de enlace.
- Navegación: `<a>` / `<Link>` con `href` real. Cero `href="#"`.
- Cada página cuelga de un `<main id="contenido-principal" tabIndex={-1}>`
  (lo aportan los layouts de grupo; las páginas fuera de grupo lo declaran
  ellas). El enlace de salto del layout raíz apunta ahí.
- Un solo `<h1>` por página y sin saltos de nivel. Si el título visible es un
  `<h2>`, promoverlo; si no hay título visible, `<h1 className="sr-only">`.
- Cada `page.tsx` exporta `metadata.title` **sin** el sufijo `| Alumco LMS`:
  la `template` del layout raíz lo añade. Títulos únicos entre vista de
  trabajador y vista admin.
- Listas: `<ul>`/`<li>` reales. Mantener `role="list"` explícito en el `<ul>`
  (con `list-style: none`, Safari/VoiceOver pierde la semántica de lista).
  Nunca poner `role="listitem"` sobre un `<Link>`: anula su rol de enlace.

**Formularios**
- `<label htmlFor>` asociado a cada control. El `placeholder` **nunca**
  sustituye a la etiqueta: desaparece al escribir.
- Si el control no es un `<input>` (un `<button>` que abre un desplegable,
  p. ej.), enlazar el rótulo con `aria-labelledby`, no con un `<label>` suelto.
- Un rótulo que nombra un *conjunto* de campos va en `<fieldset>/<legend>` o en
  `role="group" aria-labelledby`.
- `autoComplete` correcto: `email`, `current-password`, `new-password`, `name`,
  `tel`. (`rut` usa `off`: no existe token HTML para el identificador chileno.)
- Campos obligatorios: `required` **más** indicación textual. Un asterisco rojo
  no basta.
- Errores: `aria-invalid` en el control + `aria-describedby` apuntando al
  mensaje + el mensaje dentro de `role="alert"`.
- Nada de `autoFocus`. Si hay que mover el foco al abrir un panel, hacerlo con
  `ref` + `useEffect` — es gestión de foco explícita (2.4.3), y así se lee.

**Color y contraste** (los tokens ya están verificados en `globals.css`)
- Texto normal ≥ 4.5:1; texto grande, bordes de campo e indicadores ≥ 3:1.
- Como **color de texto** usar `var(--success-text)`, `var(--error-text)`,
  `var(--warning-text)`. Los literales `#27AE60`, `#E74C3C` y `#F5A623` valen
  **solo como fondo** de badge o relleno decorativo — nunca como texto.
- Sobre fondo ámbar va tinta oscura, nunca blanco (blanco sobre `#F5A623` =
  2.03:1).
- Ninguna información se transmite solo por color: acompañar siempre con texto
  o icono (1.4.1).
- **Verificar dentro de las paletas con scope, y sobre el bundle compilado.**
  `.paleta-oliva` (admin), `.paleta-azul` (trabajador) y `.landing-page`
  re-declaran tokens y añaden reglas con `!important`. **Cinco veces ya** una
  corrección "global" no llegó a ninguna vista real por esto: `--ambar-700`
  (2026-08-13) y los hallazgos A11Y-32 a A11Y-35 (anillo de foco de los campos,
  ámbar del `<em>` del display, borde de los controles y color del
  `.t-eyebrow`). Medir el fuente da falsos positivos: leer el CSS emitido en
  `.next/static/chunks/*.css` tras `npm run build`.
- **Distinguir borde decorativo de borde de control.** `--borde` y
  `--borde-suave` son decorativos (contorno de tarjeta, separadores) y 1.4.11 no
  les aplica. Todo contorno que delimite un control —campo, desplegable, área de
  texto, buscador, botón secundario, chip— usa **`--borde-control`**, que está
  medido a ≥3:1 contra el relleno del control y contra las superficies de
  página. No usar `--borde` para un control.
- **Un color claro de acento (`--oliva-clara`) es para fondo oscuro.** Si una
  regla lo aplica a una clase genérica, restringirla a `.bloque-marca`. Un
  contenedor con fondo navy debe llevar esa clase, para que la regla sea
  declarativa y no dependa de enumerar contenedores.
- **El contraste sobre imagen no se calcula, se mide.** Si hay texto encima de
  una fotografía, el ratio depende del píxel: no basta con el token del velo.
  Hay que componer el velo sobre los píxeles reales de la imagen —con el mismo
  desenfoque que aplica el CSS— y medir el percentil bajo del área tras el
  texto, no la media. El héroe de la landing pasó por esto (A11Y-36): un velo
  del 38 % dejaba el párrafo en 3.5:1.
- **La landing no se rige por el CSS de la app.** Su estilo vive en `style` en
  línea y bloques `<style jsx>` de `src/components/alumco/landing/**`. Un
  barrido del CSS no la cubre; hay que revisarla componente a componente.

**Foco y teclado**
- **Prohibido `focus:outline-none`.** El anillo de doble contorno de
  `globals.css` es el indicador del sistema; si hace falta uno propio, va a
  opacidad plena (nunca `/20`, `/30`) y con `focus-visible:`, no `focus:`.
- **La prohibición vale igual en CSS, no solo en utilidades de Tailwind.** Una
  regla como `.input:focus { outline: none }` es (0,2,0) y gana a
  `:focus-visible` (0,1,0) **aunque esté antes en el archivo**: dentro de una
  misma capa, la posición solo desempata a igual especificidad. Fue el hallazgo
  A11Y-32, que dejó todos los campos de la plataforma sin indicador de foco.
  Regla práctica: no declarar `outline` ni `box-shadow` en un selector `:focus`
  de un control; dejar que mande el anillo del sistema.
- Todo lo operable con ratón debe serlo con teclado. Los tooltips solo-hover no
  se aceptan: usar un disclosure con estado que abra por foco y por clic, se
  cierre con `Escape` y cuyo contenido sea hoverable (1.4.13).
- Diálogos: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` al
  título; foco atrapado dentro mientras esté abierto; `Escape` cierra; al
  cerrar, el foco vuelve al elemento que lo abrió.
- El telón de un modal es decorativo: `aria-hidden="true"` y separado del
  contenedor del diálogo. Cerrar al hacer clic fuera es una comodidad de ratón,
  no la vía de escape accesible.
- Un panel oculto por `translate`/`opacity` sigue siendo tabulable: usar
  `inert` o no renderizarlo.

**Iconografía y contenido no textual**
- Todo SVG decorativo: `aria-hidden="true"`. Todo SVG con significado:
  `role="img"` + `aria-label`.
- Todo botón solo-icono: `aria-label` descriptivo (en español, y que diga la
  acción concreta: "Ver cursos pendientes de Ana", no "Ver").
- `<iframe>` con `title` en español que identifique el contenido.
- Glifos decorativos (`◆`, `←`, `→`) dentro de un `<span aria-hidden="true">`.

**Mensajes de estado (4.1.3)**
- Toda respuesta de Server Action que se renderice va en `role="status"`
  (éxito) o `role="alert"` (error).
- Skeletons de carga: `aria-busy="true"` en el contenedor + texto para lector
  ("Cargando cursos…").
- Barras de progreso: `role="progressbar"` con `aria-valuenow/min/max`,
  `aria-valuetext` y **nombre accesible** (el componente `Progreso` acepta
  `etiqueta`).

**Tablas de datos**
- `<caption>`, `<thead>`, `<th scope="col">`.
- Ordenamiento: `aria-sort` en el `<th>` y el control de orden como `<button>`
  dentro del `<th>` — nunca el `<th>` con `onClick`.
- Filtros: anunciar el número de resultados con `aria-live`.

**Objetivos táctiles**
- Mínimo AA es 2.5.8 (24×24 px). El proyecto usa 44 px en controles reales, que
  además cumple 2.5.5 (AAA). **No** aplicar mínimos a `<a>` en línea dentro de
  un párrafo: rompe el flujo del texto y el criterio los exime.

## **Branding**

### **Logo**

URL: https://ongalumco.cl/wp-content/uploads/2023/11/logo-alumco-completoccc-300x102.png

Dimensiones originales: 300x102px

Formato: PNG con fondo transparente

Uso: Header del sidebar admin, página de login, certificados

### **Referencia visual (mockups aprobados por la clienta)**

Los siguientes archivos HTML fueron generados en Stitch y aprobados.

Úsalos como referencia de estilo, layout y UX al implementar:

* Registro: registro.html (formulario de solicitud de acceso)  
* Gestión trabajadores: trabajadores.html (tabla \+ panel de aprobación unificado)  
* Calendario: calendario.html (vista admin con métricas y eventos)

## **Estructura de carpetas actual**

src/
├── app/
│ ├── (auth)/
│ │ ├── login/page.tsx ✅ Completo
│ │ ├── registro/page.tsx ✅ Completo
│ │ └── layout.tsx ✅ Completo
│ ├── (dashboard)/
│ │ ├── layout.tsx ✅ Completo
│ │ ├── cursos/
│ │ │ ├── page.tsx ✅ Completo
│ │ │ └── \[id\]/
│ │ │ ├── page.tsx ✅ Completo
│ │ │ └── modulos/
│ │ │ └── \[moduleId\]/
│ │ │ ├── page.tsx ✅ Completo
│ │ │ └── quiz/
│ │ │ ├── page.tsx ✅ Completo
│ │ │ └── QuizClient.tsx ✅ Completo
│ │ └── perfil/page.tsx ⏳ Pendiente
│ ├── admin/
│ │ ├── layout.tsx ✅ Completo
│ │ ├── dashboard/page.tsx ⏳ Pendiente — Fase 8
│ │ ├── cursos/
│ │ │ ├── page.tsx                            ✅ Completo
│ │ │ ├── nuevo/page.tsx                      ✅ Completo
│ │ │ └── [id]/editar/page.tsx                ✅ Completo
│ │ ├── trabajadores/
│ │ │ └── page.tsx ✅ Completo (Vista unificada con tabs por URL)
│ │ ├── reportes/page.tsx ⏳ Pendiente — Fase 8
│ │ └── calendario/page.tsx ⏳ Pendiente — Fase 8
│ ├── layout.tsx ✅ Completo
│ ├── page.tsx ✅ Completo
│ └── globals.css ✅ Completo
├── components/
│ ├── ui/ ✅ shadcn (no modificar)
│ └── alumco/
│     └── CourseBuilder/
│         ├── CourseBuilder.tsx               ✅ Completo
│         ├── BlockCanvas.tsx                 ✅ Completo
│         ├── BlockCard.tsx                   ✅ Completo
│         ├── BlockPalette.tsx                ✅ Completo
│         └── BlockPropertiesPanel.tsx        ✅ Completo
│ ├── LoginForm.tsx ✅ Completo
│ ├── RegisterForm.tsx ✅ Completo
│ ├── BottomNav.tsx ✅ Completo
│ ├── AdminSidebar.tsx ✅ Completo
│ ├── LogoutButton.tsx ✅ Completo
│ ├── VideoPlayer.tsx ✅ Completo
│ ├── PdfViewer.tsx ✅ Completo
│ ├── ModuleIndex.tsx ✅ Completo
│ ├── ApprovalPanel.tsx ✅ Completo
│ └── CertificateBadge.tsx ⏳ Existe sin integrar — Fase 9
├── hooks/
│ └── usePendingRequestsCount.ts ✅ Completo
├── lib/
│ ├── actions/
│ │ ├── auth.ts ✅ Completo
│ │ ├── progress.ts ✅ Completo
│ │ ├── quiz.ts ✅ Completo
│ │ ├── registro.ts ✅ Completo
│ ├── courses.ts ✅ Completo
│ ├── supabase/
│ │ ├── client.ts ✅ Completo
│ │ ├── server.ts ✅ Completo
│ │ └── middleware.ts ✅ Completo
│ ├── types/
│ │ └── database.ts ✅ Completo
│ └── utils.ts ✅ Completo
└── proxy.ts ✅ Completo

## **Esquema de base de datos (Supabase/PostgreSQL)**

### **Tablas creadas y operativas**

\-- Enums  
CREATE TYPE user\_role AS ENUM ('admin', 'trabajador');  
CREATE TYPE content\_type AS ENUM ('video', 'pdf', 'slides', 'quiz');  
CREATE TYPE attempt\_status AS ENUM ('aprobado', 'reprobado', 'en\_progreso');  
CREATE TYPE sede AS ENUM ('sede\_1', 'sede\_2');  
CREATE TYPE profile\_status AS ENUM ('pendiente', 'activo', 'suspendido');

\-- Tablas principales  
public.profiles          \-- Extiende auth.users (trigger automático)  
public.courses           \-- Cursos con order\_index y deadline  
public.modules           \-- Módulos con content\_type y order\_index  
public.quizzes           \-- Evaluaciones ligadas a módulos  
public.questions         \-- Preguntas con options JSONB tipado  
public.quiz\_attempts     \-- INMUTABLE: append-only, sin UPDATE ni DELETE  
public.certificates      \-- Generados al aprobar  
public.course\_progress   \-- Avance por usuario por curso

\-- Vista para reportes admin  
public.reporte\_avance    \-- Filtra por sede, area\_trabajo, edad

### **Cambios al esquema — ya ejecutados en Fases 5 y 6**

\-- content\_type incluye 'quiz'  
ALTER TYPE content\_type ADD VALUE IF NOT EXISTS 'quiz';

\-- course\_progress tiene columna para reset de intentos  
ALTER TABLE public.course\_progress  
ADD COLUMN IF NOT EXISTS last\_quiz\_reset\_at TIMESTAMPTZ;

\-- Sistema de solicitudes en profiles  
ALTER TABLE public.profiles  
ADD COLUMN IF NOT EXISTS status profile\_status NOT NULL DEFAULT 'pendiente',  
ADD COLUMN IF NOT EXISTS rut TEXT,  
ADD COLUMN IF NOT EXISTS requested\_at TIMESTAMPTZ DEFAULT NOW(),  
ADD COLUMN IF NOT EXISTS approved\_by UUID REFERENCES public.profiles(id),  
ADD COLUMN IF NOT EXISTS approved\_at TIMESTAMPTZ;

\-- Actualizar usuarios existentes a activo  
UPDATE public.profiles SET status \= 'activo';

### **Cambios pendientes al esquema — ejecutar en Fase 7**

\-- Fecha límite de cumplimiento por curso  
ALTER TABLE public.courses  
ADD COLUMN IF NOT EXISTS deadline DATE,  
ADD COLUMN IF NOT EXISTS deadline\_description TEXT;

### **Triggers operativos**

* on\_auth\_user\_created → crea profiles con status='pendiente'  
  automáticamente al registrar en auth.users  
* check\_attempt\_limit\_trigger → valida intentos respetando  
  last\_quiz\_reset\_at. Versión actualizada en Fase 5\.  
* set\_\*\_updated\_at → updated\_at automático en tablas principales

### **RLS (Row Level Security)**

* **profiles**: política simple auth.uid() \= id  
  SIN subqueries autorreferenciales (causa recursión infinita)  
* **courses**: trabajadores leen solo publicados, admin lee todos  
* **quiz\_attempts**: cada usuario solo ve los suyos, admin ve todos  
* **certificates**: cada usuario solo ve los suyos, admin ve todos  
* Admin accede a datos globales vía createAdminClient() (service\_role)  
  NUNCA vía políticas RLS complejas

## **Flujo de autenticación**

REGISTRO (Fase 6):

/registro → RegisterForm → registerRequestAction

→ crea usuario en auth.users con metadata

→ trigger crea profile con status='pendiente'

→ NO hay acceso a la plataforma

→ muestra pantalla "Solicitud enviada, espera aprobación"

APROBACIÓN (admin):

/admin/trabajadores?tab=solicitudes

→ admin ve lista de perfiles con status='pendiente' (bypasseando RLS con adminClient)

→ aprueba: asigna sede, area\_trabajo, role

→ UPDATE profiles SET status='activo', sede=..., role=...

→ trabajador puede hacer login

LOGIN:

/login → loginAction

→ verifica credenciales con Supabase Auth

→ verifica profiles.status \=== 'activo'

→ si status \=== 'pendiente' → error "Tu cuenta está pendiente de aprobación"

→ si status \=== 'activo' → redirect según role

proxy.ts (updateSession):

Sin sesión \+ ruta protegida → redirect /login?redirectTo=...

Con sesión \+ /login → redirect /cursos

Verificación de ROL y STATUS solo en layouts:

(dashboard)/layout.tsx:

Verifica sesión y status \=== 'activo'

Si role \=== 'admin' → redirect /admin/dashboard

admin/layout.tsx:

Verifica sesión, status \=== 'activo' y role \=== 'admin'

## **Tipos TypeScript clave**

export type UserRole \= 'admin' | 'trabajador'  
export type ContentType \= 'video' | 'pdf' | 'slides' | 'quiz'  
export type AttemptStatus \= 'aprobado' | 'reprobado' | 'en\_progreso'  
export type Sede \= 'sede\_1' | 'sede\_2'  
export type ProfileStatus \= 'pendiente' | 'activo' | 'suspendido'

export interface Profile {  
  id: string  
  full\_name: string  
  role: UserRole  
  sede: Sede  
  area\_trabajo: string  
  fecha\_nacimiento: string | null  
  avatar\_url: string | null  
  is\_active: boolean  
  status: ProfileStatus   
  rut: string | null   
  requested\_at: string | null   
  approved\_by: string | null   
  approved\_at: string | null   
  created\_at: string  
  updated\_at: string  
}

export interface QuestionOption {  
  id: 'a' | 'b' | 'c' | 'd'  
  text: string  
}

export type UserAnswers \= Record\<string, 'a' | 'b' | 'c' | 'd'\>

export interface QuizSubmitResult {  
  success: boolean  
  score: number  
  passed: boolean  
  attemptNumber: number  
  attemptsRemaining: number  
  error?: string  
}

export interface QuizStatus {  
  attemptsUsed: number  
  maxAttempts: number  
  attemptsRemaining: number  
  hasPassedBefore: boolean  
  lastScore: number | null  
  isBlocked: boolean  
}

// quiz\_attempts.Update \= never (tabla inmutable)

## **Fases del proyecto**

| Fase | Estado | Descripción |
| :---- | :---- | :---- |
| 1 | ✅ Completa | Proyecto Next.js, esquema SQL, RLS, triggers |
| 2 | ✅ Completa | Tipos TS, clientes Supabase, proxy, globals.css |
| 3 | ✅ Completa | Auth completa, layouts, navegación |
| 4 | ✅ Completa | Vista trabajador: cursos, video, PDF, progreso |
| 5 | ✅ Completa | Quiz player, intentos, reset, sincronización |
| 6 | ✅ Completa | Registro con solicitud \+ panel aprobación admin unificado |
| 7 | ✅ Completa | Constructor de rutas admin (drag & drop, dnd-kit) |
| 8 | ✅ Completa | Certificados PDF e insignia digital |
| 9 | ✅ Completa | Dashboard \+ calendario \+ reportes (admin y trabajador) |
| 10 | ✅ Completa | CRUD trabajadores activos |
| 11 | ⏳ Pendiente | Deploy Vercel, producción, PWA manifest |

## **Fase 6 — Completada: Registro y Aprobación Unificada**

Se implementó con éxito el flujo de registro asíncrono donde los usuarios quedan en estado pendiente.

**Decisiones de arquitectura aplicadas:**

1. **Unificación de Vistas:** En lugar de tener /admin/trabajadores y /admin/solicitudes, se unificó en /admin/trabajadores/page.tsx usando parámetros de URL (?tab=solicitudes o ?tab=activos) para transiciones fluidas.  
2. **Bypass de RLS:** La tabla profiles tiene RLS restrictivo. Se implementó createAdminClient en src/lib/actions/registro.ts para que approveWorkerAction y rejectWorkerAction funcionen correctamente sin arrojar "Perfil no encontrado".  
3. **Caché Reactivo:** Para evitar que la lista de solicitudes se quede pegada, se forzó export const dynamic \= 'force-dynamic' en las vistas administrativas.

## **Requerimiento clave: Constructor de rutas modular (Fase 7\)**

### **Concepto**

Los administradores crean y editan cursos mediante un constructor

visual basado en bloques arrastrables. Al crear un curso, también

se define su fecha límite de cumplimiento.

### **Campo adicional en courses**

ALTER TABLE public.courses  
ADD COLUMN IF NOT EXISTS deadline DATE,  
ADD COLUMN IF NOT EXISTS deadline\_description TEXT;

### **Tipos de bloque**

| Tipo | Ícono | Datos editables |
| :---- | :---- | :---- |
| video | Play | Título, URL YouTube, duración (min) |
| pdf | Documento | Título, archivo Supabase Storage, páginas |
| quiz | Checklist | Título, preguntas, % aprobación, max intentos |

### **Header del constructor**

Además de "Publicar curso", incluir:

* Campo "Fecha límite" (date picker)  
* Campo "Descripción del plazo" (ej: "Obligatorio antes de auditoría SENAMA")

### **Archivos a crear en Fase 7**

src/app/admin/cursos/nuevo/page.tsx

src/app/admin/cursos/\[id\]/editar/page.tsx

src/components/alumco/CourseBuilder/

├── CourseBuilder.tsx

├── BlockCanvas.tsx

├── BlockCard.tsx

├── BlockPalette.tsx

├── BlockPropertiesPanel.tsx

└── forms/

├── VideoBlockForm.tsx

├── PdfBlockForm.tsx

└── QuizBlockForm.tsx

src/lib/actions/courses.ts

### **Dependencia necesaria**

npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities  

---

## **QA — Registro de bugs (Fase fix-bugs)**

Fecha del reporte: 2026-04-24 | Fuente: `src/testing/bugs.md`

### **Alta severidad — pendientes**

| ID | Archivo(s) | Descripción |
| :---- | :---- | :---- |
| ~~BUG-01~~ | ~~`cursos/[id]/modulos/[moduleId]/page.tsx`~~ | ~~Acceso a módulo no verifica área del trabajador~~ ✅ |
| ~~BUG-02~~ | ~~`cursos/[id]/modulos/[moduleId]/quiz/page.tsx`~~ | ~~Acceso a quiz no verifica área del trabajador~~ ✅ |
| ~~BUG-03~~ | ~~`lib/actions/quiz.ts`~~ | ~~`submitQuizAction` no valida que el quiz pertenezca al módulo y curso recibidos~~ ✅ |
| ~~BUG-05~~ | ~~`lib/actions/registro.ts`~~ | ~~`approveWorkerAction` no verifica que el caller sea admin~~ ✅ |
| ~~BUG-06~~ | ~~`lib/actions/trabajadores.ts`~~ | ~~`suspendWorkerAction` y `reactivateWorkerAction` sin verificación de rol admin~~ ✅ |
| ~~BUG-07~~ | ~~`lib/actions/trabajadores.ts`~~ | ~~`updateWorkerAction` sin verificación de autenticación ni rol admin~~ ✅ |
| ~~BUG-17~~ | ~~`lib/actions/registro.ts`~~ | ~~`rejectWorkerAction` no verifica que el caller sea admin — puede eliminar cuentas arbitrarias~~ ✅ |
| ~~BUG-25~~ | ~~`src/proxy.ts`~~ | ~~Verificar si existe `middleware.ts` que importe `proxy.ts`; si no, el middleware no se ejecuta~~ ✅ |

### **Media severidad — pendientes**

*(todos resueltos)*

### **Baja severidad — pendientes**

*(todos resueltos)*

### **Resueltos**

| ID | Descripción | Commit |
| :---- | :---- | :---- |
| BUG-25 | `middleware.ts` no existía — `proxy.ts` nunca era invocado por Next.js, todas las rutas desprotegidas | Creado `src/middleware.ts` que re-exporta `proxy` como `middleware` y re-exporta `config` |
| BUG-05 | `approveWorkerAction` aceptaba cualquier usuario autenticado | Agregada verificación `role === 'admin'` vía `createClient()` antes de usar `adminClient` |
| BUG-17 | `rejectWorkerAction` sin ningún check — podía eliminar cuentas arbitrarias | Agregada verificación de autenticación y rol `admin` al inicio de la función |
| BUG-06 | `suspendWorkerAction` y `reactivateWorkerAction` sin verificación | Agregada verificación de autenticación y rol `admin` en ambas funciones |
| BUG-07 | `updateWorkerAction` sin verificación — cualquiera podía editar cualquier perfil | Agregada verificación de autenticación y rol `admin` al inicio de la función |
| BUG-01 | Módulo accesible sin verificar área del trabajador | `filterCoursesByWorkerAreas` aplicado en `modulos/[moduleId]/page.tsx` post-fetch del curso |
| BUG-02 | Quiz page sin auth ni check de área | Agregado `auth.getUser()` + fetch de curso publicado + `filterCoursesByWorkerAreas` |
| BUG-03 | `submitQuizAction` sin validar cadena quiz→módulo→curso | Agregadas 2 queries de validación antes de procesar el intento |
| BUG-04 | `updateLastModuleAction` usaba `createAdminClient` innecesariamente | Reemplazado con `createClient()` — RLS permite usuario leer/escribir su propio progreso |
| BUG-08 | `(dashboard)/layout.tsx` mostraba "Cargando perfil..." cuando perfil es null | Cambiado a `redirect('/login')` |
| BUG-09 | `registerRequestAction` no verificaba RUT duplicado | Agregada query a `profiles` vía `adminClient` antes de `signUp` |
| BUG-10 | `getQuizAttemptsHistoryAction` no filtraba por `last_quiz_reset_at` | Agregado param `courseId`, fetch de reset, filtro `gt('completed_at', resetAt)` |
| BUG-11 | `handleContinue` usaba `setTimeout(300ms)` frágil | Eliminado timeout; se usa resultado de `markModuleCompleteAction` directamente |
| BUG-12 | Dashboard mostraba completions históricas como "esta semana" | Query separada con `.gte('completed_at', sevenDaysAgo)` usando `adminClient` |
| BUG-15 | CSV export no escapaba comas ni comillas | Agregada función `csvEscape` con lógica RFC 4180 |
| BUG-16 | Fetch de logo sin timeout en `generateCertificatePDF` | Agregado `AbortController` con timeout de 5 segundos |
| BUG-23 | `getAdminAlerts` ignoraba `target_areas` — contaba todos los trabajadores | Fetch de `area_trabajo` en workers + `target_areas` en courses; filter por áreas por curso |
| BUG-18 | Botón "Completar curso" aparecía aunque el módulo final no estuviera completado | Condición `isModuleCompleted` añadida; sin completar muestra "Volver al curso" |
| BUG-19 | Nombres de sede inconsistentes en `inicio/page.tsx` y `utils.ts` | Corregido a "Sede Hualpén" / "Sede Coyhaique" en ambos archivos |
| BUG-20 | `activos` tipado como `any[]` en `admin/trabajadores/page.tsx` | Definido tipo `ActiveWorker` con campos explícitos; cast eliminado |
| BUG-21 | "Ver curso" en admin apuntaba al editor en lugar de la vista del trabajador | `href` corregido a `/cursos/${course.id}` |
| BUG-22 | `user!.id` sin null-check en `perfil/page.tsx` | Añadido `if (!user) redirect('/login')` con import estático de `redirect` |
| BUG-13 | Estado del trabajador ignoraba deadlines — falsos positivos de "Al día" | Fetch de cursos con deadline + target_areas; status calculado cruzando áreas y vencimientos por trabajador |
| BUG-14 | Filtro de área en reportes solo comparaba string único vs array | Reemplazado `reporte_avance` view por queries directas; `area_trabajo` ahora es `string[]` en interfaz y filtro |
| BUG-24 | Certificado solo se generaba para cursos con quiz | `generateCertificateAction` acepta `quizAttemptId: string \| null`; `markModuleCompleteAction` genera certificado en cursos sin quiz |
| Reset | `resetModuleProgressAction` solo removía 2 módulos | Ahora setea `completed_modules: []` — reinicio completo de todos los módulos |

### **Pasada 2026-04-26 — Resueltos (BUG-47 a BUG-70)**

| ID | Descripción | Fix |
| :---- | :---- | :---- |
| BUG-47 | `registerWorkerAction` sin verificación de admin — cualquier visitante anónimo podía crear cuentas | Agregado `requireAdmin` al inicio en `lib/actions/auth.ts` |
| BUG-48 | `getQuestionsAction` sin auth — exponía `correct_option` (vector de cheating) | Agregado `requireAdmin` y uso de `createAdminClient` en `lib/actions/admin-questions.ts` |
| BUG-49 | `saveQuestionAction` solo validaba auth, no rol admin | Reemplazado check de `user` por `requireAdmin` |
| BUG-50 | `deleteQuestionAction` solo validaba auth, no rol admin | Reemplazado check de `user` por `requireAdmin` |
| BUG-51 | `markModuleCompleteAction` no validaba que el módulo perteneciera al curso | Helper `validateModuleAccess` en `lib/actions/progress.ts` valida `module.course_id === courseId` |
| BUG-52 | `markModuleCompleteAction` no verificaba acceso por área del trabajador | `validateModuleAccess` aplica `filterCoursesByWorkerAreas` para trabajadores |
| BUG-53 | `updateLastModuleAction` sin validación módulo→curso ni área | Misma helper `validateModuleAccess` aplicada |
| BUG-54 | `submitQuizAction` no verificaba acceso por área | Fetch de curso publicado + `filterCoursesByWorkerAreas` antes de procesar el intento |
| BUG-55 | `submitQuizAction` no validaba `'a'\|'b'\|'c'\|'d'` en respuestas | `AnswersSchema` Zod (record uuid → enum) parsea antes de cualquier query |
| BUG-56 | `filterCoursesByWorkerAreas` retornaba TODOS los cursos cuando `workerAreas` vacío | Cambiado para retornar solo cursos sin restricción de área (`target_areas` vacío) |
| BUG-57 | `rejectWorkerAction` no verificaba `status='pendiente'` — podía borrar usuarios activos | Select extendido a `id, status` + check `status === 'pendiente'` |
| BUG-58 | RUT no normalizado antes de buscar/guardar — duplicados con distinto formato | Helper `normalizarRut` en `registro.ts`; usado en check de duplicado y `signUp` |
| BUG-59 | `submitQuizAction` permitía respuestas vacías y consumía un intento | Verificación `allCovered` (preguntas vs `validatedAnswers` keys) antes del insert |
| BUG-60 | `resetModuleProgressAction` aceptaba parámetros que ignoraba — API engañosa | Renombrada a `resetCourseProgressAction(courseId)`; consumidores actualizados (`QuizClient`, `quiz/page.tsx`) |
| BUG-61 | `searchAction` no escapaba `%` y `_` en patrones `ilike` | Helper `escapeIlike` en `lib/utils.ts`; aplicado a `title` y `full_name` |
| BUG-62 | `forgotPasswordAction` sin fallback de `NEXT_PUBLIC_SITE_URL` | Fallback `'https://alumco-lms.vercel.app'` agregado en `auth.ts` |
| BUG-63 | `requireAdmin` rechazaba `profesor` aunque el layout admin lo permite | Ampliado a `role !== 'admin' && role !== 'profesor'`; tipo de retorno actualizado |
| BUG-64 | `getCertificateAction` y `existing` usaban `.single()` cuando puede no existir fila | Cambiados a `.maybeSingle()` en `certificates.ts` |
| BUG-65 | LoginSchema aceptaba ≥6 chars vs RegisterSchema ≥8 — inconsistencia | LoginSchema actualizado a `min(8)` |
| BUG-66 | `submitQuizAction` no transaccional — intento podía quedar guardado sin marcar módulo | Logging estructurado (userId, courseId, quizId, attemptId) en fallos de operaciones secundarias |
| BUG-67 | `admin-questions.ts` sin validación Zod del payload | `QuestionInputSchema` en `admin-questions.ts` valida shape antes del insert/update |
| BUG-68 | Sin validar `correct_option ∈ {a,b,c,d}` ni `options.length === 4` | Cubierto por `QuestionInputSchema` (enum + length(4) + refine ids únicos) |
| BUG-69 | `<img>` en lugar de `next/image` en `ProfileClient.tsx` | Reemplazado por `Image` de `next/image` (avatar y firma) con `unoptimized` |
| BUG-70 | `useState` importado sin usar en `RegisterForm.tsx` | Eliminado el import |
