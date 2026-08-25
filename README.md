# KimünKo — LMS para ONG Alumco

**Plataforma en producción: [kimunko.vercel.app](https://kimunko.vercel.app/)**

Plataforma de gestión de aprendizaje y gestión interna construida para **ONG Alumco**, organización dedicada al cuidado de adultos mayores en ELEAMs (Establecimientos de Larga Estadía para Adultos Mayores) en Chile. Capacita de forma asíncrona a los trabajadores de sus sedes, homologa conocimientos clínicos y operativos, emite certificados verificables, y coordina la operación diaria: eventos institucionales, días administrativos y soporte interno.

> **Stack:** Next.js 16 (App Router) + Supabase (Auth, PostgreSQL, Storage) + TypeScript estricto + Tailwind CSS v4. PWA instalable con notificaciones push.

---

## 🧑‍💻 Si acabas de tomar el proyecto, lee esto primero

Cinco cosas que no son obvias mirando el código y que te van a ahorrar horas:

1. **El esquema de la base de datos NO está versionado en este repo.** `supabase/propuestas/` solo tiene el SQL de 9 features añadidas después del arranque. Las tablas base y toda la familia `events` se crearon a mano en el panel de Supabase. Levantar un proyecto Supabase nuevo desde cero **no es posible solo con este repo** — ver [§ Base de datos: qué está versionado y qué no](#base-de-datos-qué-está-versionado-y-qué-no).
2. **No existe `src/middleware.ts`.** Next.js 16 renombró el middleware a **`proxy.ts`**. El archivo es `src/proxy.ts` y exporta `proxy` + `config`. Si lees en `CLAUDE.md` o en un commit viejo la cadena `middleware.ts → proxy.ts`, está obsoleta.
3. **`npm install` antes de cualquier cosa.** El `node_modules` que puedas heredar suele estar desactualizado respecto a `package.json`, y el síntoma es un `typecheck` lleno de "Cannot find module 'recharts' / 'vitest' / 'sanitize-html'" que parece un problema de código y no lo es.
4. **Los estilos viven en dos hojas, no en una.** `globals.css` (tokens oklch, verificados por contraste) importa `didasko.css` dentro de `@layer components`, y encima hay tres paletas con scope que redeclaran tokens con `!important`. Un cambio "global" de color puede no llegar a ninguna vista real. Ver [§ Capas de estilo](#capas-de-estilo).
5. **El mundo demo ya no se reinicia solo.** El cron `reset-demo-world` está desactivado desde el 2026-08-16 (BUG-73). Los datos demo se acumulan.

Estado verificado el **2026-08-25** sobre `main` (commit `a9ba0cb`) y contra el proyecto Supabase vivo:

| Comando | Resultado |
|---|---|
| `npm run typecheck` | ✅ limpio |
| `npm test` | ✅ 42/42 en 4 archivos |
| `npm run lint` | ✅ 0 errores · ⚠️ 15 warnings (6 × `<img>` en vez de `next/image`, 5 × variables sin usar) |

---

## 🎯 Qué hace la plataforma

### Capacitación (el núcleo)

1. **Solicitud de acceso** — los nuevos trabajadores se registran indicando RUT, sede y áreas de trabajo. Un admin revisa cada solicitud antes de habilitar el acceso.
2. **Asignación de cursos por área** — cada curso tiene `target_areas` (ej. Enfermería, Kinesiología). Los trabajadores solo ven los cursos relevantes para su rol.
3. **Aprendizaje asincrónico** — módulos de **video** (YouTube), **PDF** (URL externa en `modules.content_url`, no Storage — ver los pendientes), **texto** (HTML saneado en servidor) o **quiz**, con desbloqueo secuencial.
4. **Evaluaciones con intentos** — cada quiz acepta hasta N intentos con porcentaje mínimo de aprobación. Los intentos son inmutables (auditoría) y solo el admin puede resetear el progreso.
5. **Certificación automática y verificable** — al completar el último módulo se genera un certificado PDF con sello institucional, firmas y un **QR con folio único** que cualquier tercero puede verificar en una página pública, sin cuenta.
6. **Trazabilidad y reportes** — progreso por sede/área, alertas por deadlines vencidos, cobertura anual contra meta, certificados emitidos y export CSV.

### Gestión interna (módulos complementarios)

| Módulo | Qué resuelve |
|---|---|
| **Eventos institucionales** | Planificación de 18 de septiembre, Navidad y Año Nuevo por sede: secciones con encargado y colaboradores, checklist de tareas con plazos, documentos (incl. dificultades alimenticias de los residentes) y galería de fotos. |
| **Días administrativos** | Solicitud, aprobación y control de cupo de días libres, con cupo configurable por área y período de renovación. |
| **Soporte** | Tickets internos con categoría, prioridad, hilo de mensajes y estados. |
| **Sedes** | ABM de sedes: la plataforma dejó de tener dos sedes fijas y las administra el admin. |
| **Feedback de cursos** | Los trabajadores califican el curso al terminarlo; el admin lo revisa por curso. |
| **Preferencias de accesibilidad** | Escala tipográfica por usuario (`normal` / `grande` / `extra`), persistida en su perfil. |
| **Modo vista previa** | Un admin puede recorrer la plataforma tal como la ve un colaborador, con banner permanente y salida en un clic. |
| **Mundo demo** | Cuentas `is_demo` con datos propios, aisladas del mundo real y rotuladas con una barra permanente. El reinicio periódico **está roto y desactivado** desde el 2026-08-16 (BUG-73); hoy los datos demo se acumulan. |

---

## 🚀 Tecnologías principales

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **Next.js 16** (App Router) + **React 19** | Server Components y Server Actions. NO Pages Router. |
| Lenguaje | **TypeScript** estricto | Sin `any`. Tipos en `src/lib/types/databases.ts`. |
| Base de datos | **PostgreSQL** vía Supabase | Row Level Security, triggers y funciones. |
| Auth | **Supabase Auth** (`@supabase/ssr`) | Cookies SSR + `src/proxy.ts` (el middleware de Next 16). |
| Storage | **Supabase Storage** | Banners de curso, documentos y fotos de eventos. Las firmas están previstas pero su bucket no existe todavía. |
| Estilos | **Tailwind CSS v4** | Paleta corporativa Alumco y tokens verificados por contraste. |
| UI base | **shadcn/ui** + **Radix UI** | Primitivos con buena base de accesibilidad; la conformidad de la app se mide aparte (ver más abajo). |
| Iconos | **Lucide React** | — |
| Forms | **React Hook Form** + **Zod** | Validación cliente + servidor. |
| Gráficos | **Recharts** | Dashboard admin (cobertura, cumplimiento por área, certificados por mes). |
| Drag & Drop | **@dnd-kit/core** + sortable | Constructor de cursos. |
| PDFs | **pdf-lib** + **qrcode** | Certificados generados en servidor, con QR de verificación. |
| Saneado HTML | **sanitize-html** | Módulos de tipo texto (se guarda ya saneado). |
| Push / PWA | **web-push** (VAPID) + `public/sw.js` | Service worker propio, manifest, página offline. |
| Estado servidor | Server Components + Server Actions | Sin REST/GraphQL adicional. |
| Estado cliente | **TanStack React Query** | Solo donde el caching en cliente aporta. |
| Notificaciones UI | **Sonner** | Toasts. |
| Temas | **next-themes** | Modo claro/oscuro. |
| Tests | **Vitest** | `tests/` — gates de módulo, rate limit, saneado, verificación de folios. |

---

## 👥 Roles y permisos

| Rol | Acceso | Capacidad |
|---|---|---|
| `trabajador` | `/inicio`, `/cursos`, `/eventos`, `/dias-administrativos`, `/soporte`, `/perfil`, `/mis-certificados` | Toma los cursos de sus áreas, rinde quizzes, descarga certificados, participa en eventos, pide días administrativos, abre tickets. |
| `admin` | Todo lo anterior + `/admin/*` | Aprueba solicitudes, CRUD de trabajadores y sedes, constructor de cursos, eventos, días administrativos, soporte, reportes y métricas globales. |
| `profesor` | Acceso administrativo acotado | Crear/editar cursos y revisar progreso (`requireAdmin` lo acepta junto con `admin`). |

Los trabajadores se crean siempre en estado `pendiente` y necesitan aprobación admin (que asigna `sede`, `area_trabajo[]` y `role`) antes de poder iniciar sesión.

---

## 🧭 Mapa de rutas

### Públicas
- `/` — landing institucional (misión, valores, memorias, contacto).
- `/login` — verifica credenciales y `profile.status === 'activo'`.
- `/registro` — solicitud de acceso (queda `pendiente`).
- `/reset-password` — restablecimiento de contraseña.
- `/certificados/verificar/[codigo]` — **verificación pública de un certificado por folio**, sin sesión. Con rate limit por IP y exposición mínima de datos.
- `/offline` — pantalla de la PWA sin conexión.

### Trabajador — `src/app/(dashboard)/`
- `/inicio` — stats personales, próximo evento, calendario de plazos y banner de cursos vencidos.
- `/cursos` — listado filtrado por área, con tabs (Todos / En progreso / Completados / Sin iniciar).
- `/cursos/[id]` — detalle con índice de módulos y progreso.
- `/cursos/[id]/modulos/[moduleId]` — visor de módulo (video, PDF, texto o intro al quiz).
- `/cursos/[id]/modulos/[moduleId]/quiz` — quiz player con intentos, score y feedback.
- `/eventos` y `/eventos/[id]` — eventos de su sede, sus secciones y sus tareas.
- `/dias-administrativos` — saldo, historial y solicitud de días.
- `/soporte` y `/soporte/[id]` — tickets propios y su hilo.
- `/mis-certificados` — certificados aprobados y descargables.
- `/perfil` — datos personales, firma digital, preferencias de accesibilidad, stats de cumplimiento.
- `/certificado/[certificateId]` — vista del certificado (requiere ser el titular o staff).

### Admin — `src/app/admin/`
- `/admin/dashboard` — KPIs, cobertura anual contra meta, cumplimiento por área, certificados por mes, comparativa entre sedes, actividad reciente y alertas.
- `/admin/trabajadores` — vista unificada con tabs (`?tab=activos|suspendidos|solicitudes`).
- `/admin/trabajadores/[id]` — detalle con progreso y certificados.
- `/admin/cursos` — listado, publicar/despublicar, duplicar.
- `/admin/cursos/nuevo` y `/admin/cursos/[id]/editar` — constructor visual por bloques (drag & drop con dnd-kit).
- `/admin/cursos/[id]/feedback` — feedback recibido de ese curso.
- `/admin/eventos`, `/admin/eventos/nuevo`, `/admin/eventos/[id]` — wizard de creación y gestión de secciones, tareas, documentos y fotos.
- `/admin/dias-administrativos` — solicitudes, aprobación y configuración de cupos.
- `/admin/soporte` y `/admin/soporte/[id]` — bandeja de tickets.
- `/admin/sedes` — ABM de sedes.
- `/admin/reportes` — cumplimiento por trabajador, filtros por sede/área, export CSV.
- `/admin/certificados` — todos los certificados emitidos.
- `/admin/perfil` — perfil del admin (incluye subida de firma digital).

---

## 🏛️ Arquitectura

### Modelo de datos (PostgreSQL / Supabase)

```text
── Personas y organización ─────────────────────────────────────────────
profiles              extiende auth.users (trigger on_auth_user_created)
                      role, sede, area_trabajo[], status, rut, firma_url,
                      onboarding_completed, is_demo
sedes                 sedes administrables (id, nombre, activa)
user_preferences      escala tipográfica y ajustes por usuario

── Capacitación ────────────────────────────────────────────────────────
courses               título, deadline, target_areas[], is_published,
                      duplicated_from, is_demo
modules               content_type ∈ {video, pdf, slides, texto, quiz};
                      order_index, is_final_module, content_html (saneado)
quizzes               1:1 con módulo tipo quiz; passing_score, max_attempts
questions             options en JSONB tipado; correct_option
quiz_attempts         INMUTABLE (sin UPDATE/DELETE) — auditoría de intentos
course_progress       1 fila por (user, course); completed_modules[],
                      is_completed, last_quiz_reset_at
certificates          verification_code (folio Crockford base32 de 12),
                      quiz_attempt_id opcional, pdf_url
course_feedback       calificación y comentario del curso

── Gestión interna ─────────────────────────────────────────────────────
events                por sede y tipo (dieciocho | navidad | ano_nuevo)
event_sections        secciones custom del evento
event_section_members encargado | colaborador (PK compuesta)
event_tasks           pendiente | en_progreso | completada, con due_date/time
event_documents       docs del evento (incl. dificultades alimenticias)
event_photos          galería
admin_day_requests    pendiente | aprobada | rechazada | cancelada
admin_day_config      período de renovación y cupo por defecto
admin_day_area_quotas cupo por área
support_tickets       categoría, prioridad, estado
support_ticket_messages hilo del ticket
platform_settings     ajustes globales (meta anual de cobertura, etc.)
push_subscriptions    endpoints Web Push por usuario
```

**Triggers y funciones operativas:** `on_auth_user_created` (crea el perfil en `pendiente`), `check_attempt_limit_trigger` (respeta `last_quiz_reset_at`), `set_certificate_verification_code` (folio del certificado), `set_*_updated_at`, y helpers de RLS (`is_admin`, `is_staff`, `is_event_member`, `is_section_encargado`, `user_sede`, `viewer_is_demo`).

**Row Level Security:** los trabajadores solo leen/escriben sus propios datos y los de su sede donde corresponde; el admin accede al estado global vía `createAdminClient()` (service role), nunca con políticas RLS complejas y autorreferenciales.

### Base de datos: qué está versionado y qué no

**Este es el punto débil del handoff, y conviene saberlo antes de prometer nada.**

| Qué | Dónde vive | ¿Reproducible desde el repo? |
|---|---|---|
| Tablas base (`profiles`, `courses`, `modules`, `quizzes`, `questions`, `quiz_attempts`, `certificates`, `course_progress`, `sedes`) | Solo en el proyecto Supabase vivo | ❌ **No.** Se crearon a mano en el panel. |
| Familia `events` (`events`, `event_sections`, `event_section_members`, `event_tasks`, `event_documents`, `event_photos`) | Solo en el proyecto vivo. El SQL de `event_photos` quedó como fragmento suelto en `docs/HANDOFF-BATO.md` | ❌ **No.** |
| Triggers, funciones y **todas** las policies RLS | Solo en el proyecto vivo | ❌ **No.** |
| 9 features posteriores | [`supabase/propuestas/`](./supabase/propuestas/), un `.sql` idempotente por feature, con cabecera que dice si está aplicada | ✅ Sí. |
| Rollbacks y seeds del mundo demo | [`scripts/`](./scripts/) | ✅ Sí. |

En la práctica: **no puedes levantar un Supabase nuevo desde cero con este repo.** Para clonar el entorno, o pides acceso al proyecto existente (`eaodsaiwzhbgehhfnegj`, región `sa-east-1`), o extraes el esquema del vivo antes de que se pierda el acceso:

```bash
# Volcado del esquema completo (sin datos) a un archivo versionable.
supabase db dump --db-url "postgresql://postgres:<pass>@db.<ref>.supabase.co:5432/postgres" \
  --schema public -f supabase/schema.sql
```

**Si vas a hacer una sola tarea de deuda técnica en este proyecto, que sea esta.** Mientras el esquema no esté en el repo, el proyecto depende de que nadie pierda las credenciales del panel.

Estado de las 9 propuestas: siete están marcadas como aplicadas en producción; `event-tasks-due-time.sql` y `push-subscriptions.sql` conservan la cabecera "PROPUESTA: no aplicada", pero **ambas tablas ya existen en la base** — las cabeceras quedaron desactualizadas. Verifica contra la base antes de correr nada; son idempotentes, pero la cabecera no es fuente de verdad.

#### Deuda de tipado asociada

`src/lib/types/databases.ts` declara la interfaz `Database` a mano (no está generada). **Le faltan dos tablas que sí existen y sí se consultan:** `sedes` y `push_subscriptions`. Por eso `src/lib/actions/sedes.ts` y `src/lib/actions/push.ts` escapan el tipado con `as unknown as never` y `as any`. Si tocas esos archivos, esa es la razón — no es descuido puntual. La vía limpia es regenerar los tipos:

```bash
npx supabase gen types typescript --project-id eaodsaiwzhbgehhfnegj > src/lib/types/databases.ts
```

…pero ojo: el archivo actual **también** contiene los tipos de dominio a mano (`AreaTrabajo`, `AREAS_TRABAJO`, `QuizStatus`, `CreateEventPayload`…), que una regeneración ciega borraría. `src/lib/types/database.ts` es solo un re-export de compatibilidad de 4 líneas.

#### Instantánea de producción (2026-08-25)

60 perfiles (2 demo, 7 con solicitud pendiente) · 13 cursos (11 publicados) · 30 módulos (7 PDF, 10 quiz) · 3 certificados emitidos · 2 eventos · 3 suscripciones push.

> El curso publicado **"Cuidado mascotas"** tiene un módulo de quiz con **0 preguntas**. Parece contenido de prueba que quedó publicado; conviene despublicarlo o completarlo antes de una demo con la clienta.

### Flujo de autenticación

```
Registro                  Aprobación                       Login
─────────                ──────────                       ──────

/registro                 Admin en                         /login
   │                      /admin/trabajadores                 │
   ▼                      ?tab=solicitudes                    ▼
RegisterForm              │                                loginAction
   │                      ▼                                   │
registerRequestAction     approveWorkerAction                 ▼
   │                      ─ asigna sede,                  Verifica
   ▼                        area_trabajo[],               profile.status
auth.users                  role                          === 'activo'
   │                      ─ status='activo'                  │
   ▼ (trigger)             │                                 ▼
profiles                   ▼                              Redirect según rol:
status='pendiente'        Trabajador habilitado          - admin → /admin/dashboard
                          para iniciar sesión             - trabajador → /inicio
```

**El middleware se llama `proxy.ts`.** Next.js 16 renombró el archivo: no hay `src/middleware.ts` y no debe crearse. La cadena real es `src/proxy.ts` (exporta `proxy` y el `matcher`) → `src/lib/supabase/middleware.ts` (`updateSession`).

Corre en cada request: refresca la sesión, redirige a `/login` a quien no tenga sesión y saca de `/` , `/login` y `/registro` a quien sí la tenga (hacia `/cursos`, desde donde el layout reencamina al staff). Tres rutas quedan abiertas por ambos lados a propósito: `/certificados/verificar/…` (un fiscalizador escanea el QR sin cuenta, y un admin logueado no debe rebotar), `/reset-password` (quien olvidó la clave no tiene sesión, pero quien sigue logueado en el teléfono también debe poder cambiarla) y `/offline` (queda fuera del `matcher`: es lo que sirve el service worker sin red, así que no puede depender de una llamada de auth).

`updateSession` usa `auth.getClaims()`, que verifica el JWT localmente contra la llave pública cacheada, no `getUser()`: este último costaba 100-300 ms de latencia en **cada** navegación.

La verificación fina de **rol** y **status** no está en el proxy sino en los layouts (`(dashboard)/layout.tsx` y `admin/layout.tsx`). Consecuencia importante: **un layout no protege una Server Action.** Las actions se invocan por POST directo a su endpoint y no pasan por el layout de la página que las usa — cada una tiene que verificar por su cuenta (ver [§ Seguridad](#-seguridad)).

### Patrón Server / Client

- **Server Components** son el default; **Client Components** (`'use client'` en la primera línea) solo para interactividad.
- **Server Actions** (`'use server'`) son las únicas mutaciones. Devuelven `{ success | error }` y disparan `revalidatePath`.
- **Dos clientes Supabase:**
  - `createClient()` (cookies del usuario) — lecturas/escrituras del propio usuario; respeta RLS.
  - `createAdminClient()` (service role) — solo operaciones administrativas verificadas. Toda función que lo use **debe** pasar antes por `requireAdmin()` (`src/lib/auth/requireAdmin.ts`).

### Capas de estilo

No hay una sola hoja de estilos. El orden importa y ha causado errores reales de contraste que "se corrigieron" sin llegar a ninguna pantalla:

```
src/app/globals.css          ← raíz. Tokens canónicos en oklch, dentro de @layer base.
   ├─ @import "tailwindcss"
   ├─ @import "tw-animate-css"
   └─ @import "./didasko.css" layer(components)   ← 1.633 líneas de tema
```

- **`globals.css`** (932 líneas) define un único set de tokens en **oklch**, cada par `foreground/background` calculado contra el fondo real (crema `#FAF6ED`, no blanco puro). La cabecera del archivo documenta por qué: antes convivían dos `:root` incompatibles y la paleta Alumco nunca llegaba al runtime.
- **`didasko.css`** entra en `@layer components` a propósito, para que las utilidades de Tailwind (`hidden`, `flex`, `lg:*`) le ganen a las clases del tema (`.sidebar`, `.topbar`).
- **Tres paletas con scope redeclaran tokens y usan `!important`:** `.paleta-oliva` (admin), `.paleta-azul` (trabajador) y `.landing-page`. Un cambio en el `:root` puede quedar tapado por cualquiera de las tres.
- **La landing casi no usa este CSS:** su estilo vive en `style` en línea y bloques `<style jsx>` dentro de `src/components/alumco/landing/**`. Un barrido de las hojas globales no la cubre.

Regla práctica heredada de la auditoría: **verificar el CSS emitido**, no el fuente — leer `.next/static/chunks/*.css` después de `npm run build`. Cinco veces una corrección global no llegó a ninguna vista real por las paletas con scope.

Las fuentes se cargan por `next/font` (Geist, Fraunces, Archivo, Playfair Display) y además hay dos `@import` a Google Fonts en `globals.css` (Material Symbols e Inter) — es decir, tipografía por dos vías distintas.

### Analítica

`src/app/layout.tsx` inyecta **Google Analytics (gtag.js) con el ID `G-D6ZQY4GK0W` hardcodeado**, sin variable de entorno y sin banner de consentimiento. Si el proyecto cambia de manos o de titular, ese ID sigue reportando a la propiedad original.

### PWA y notificaciones

`public/sw.js` (registrado por `ServiceWorkerRegistrar`, solo en producción) da instalación, caché de shell y la pantalla `/offline`. Las notificaciones push usan **VAPID** con `web-push`: la suscripción se guarda por usuario desde `ActivarNotificaciones` y los envíos salen desde `src/lib/push/send.ts` (eventos, tareas asignadas y plazos).

---

## 📂 Estructura del proyecto

```text
alumco-lms/
├── public/
│   ├── sw.js                            # Service worker de la PWA
│   ├── icons/                           # Iconos PWA (192, 512, apple-touch)
│   ├── banners/                         # Banners de curso por temática
│   └── hero-*.jpg / LogoAlumco.png      # Assets de landing y marca
│
├── src/
│   ├── proxy.ts                         # El middleware de Next 16 (NO hay middleware.ts)
│   │
│   ├── app/
│   │   ├── layout.tsx                   # Layout raíz (fonts, GA, prefs a11y, SW)
│   │   ├── page.tsx                     # Landing institucional
│   │   ├── globals.css                  # Tailwind v4 + tokens oklch verificados
│   │   ├── didasko.css                  # Tema + paletas con scope (importado por globals)
│   │   ├── manifest.ts / offline/       # PWA
│   │   ├── not-found.tsx / error.tsx
│   │   │
│   │   ├── (auth)/                      # login · registro · reset-password
│   │   ├── (dashboard)/                 # inicio · cursos · eventos ·
│   │   │                                # dias-administrativos · soporte ·
│   │   │                                # mis-certificados · perfil
│   │   ├── admin/                       # dashboard · trabajadores · cursos ·
│   │   │                                # eventos · dias-administrativos ·
│   │   │                                # soporte · sedes · reportes ·
│   │   │                                # certificados · perfil
│   │   ├── certificado/[certificateId]/ # Vista del certificado (titular o staff)
│   │   └── certificados/verificar/[codigo]/  # Verificación pública por folio
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn/ui (no modificar manualmente)
│   │   └── alumco/                      # Componentes de negocio, por dominio
│   │       ├── admin/                   # ApprovalPanel, WorkerEditPanel,
│   │       │   └── CourseBuilder/       #   constructor drag & drop
│   │       ├── auth/                    # Login / Register / Forgot / Reset
│   │       ├── certificado/             # Badge, descarga, impresión
│   │       ├── curso/                   # VideoPlayer, PdfViewer, ModuleIndex,
│   │       │                            # TextoModulo, feedback, calendario
│   │       ├── dashboard/               # Gráficos Recharts y meta anual
│   │       ├── dias/                    # Solicitud de días administrativos
│   │       ├── ds/                      # Design system interno (Icono, etc.)
│   │       ├── eventos/                 # Wizard, secciones, tareas, docs, fotos
│   │       ├── landing/                 # Secciones de la landing pública
│   │       ├── nav/                     # AdminSidebar, WorkerSidebar, TopNav
│   │       ├── shared/                  # Accesibilidad, notificaciones, búsqueda,
│   │       │                            # DemoBanner, PreviewMode, SW, skeletons
│   │       └── support/                 # Tickets y su hilo
│   │
│   ├── hooks/
│   ├── lib/
│   │   ├── actions/                     # Server Actions ('use server')
│   │   │   ├── auth.ts registro.ts trabajadores.ts sedes.ts
│   │   │   ├── courses.ts admin-questions.ts progress.ts quiz.ts
│   │   │   ├── certificates.ts feedback.ts alerts.ts analytics.ts
│   │   │   ├── events.ts admin-days.ts support.ts
│   │   │   └── preferences.ts preview.ts push.ts search.ts
│   │   │
│   │   ├── auth/                        # requireAdmin, previewMode, demoScope
│   │   ├── certificates/verify.ts       # Verificación pública por folio
│   │   ├── eventos/                     # Fotos y próximo evento
│   │   ├── push/send.ts                 # Envío Web Push (VAPID)
│   │   ├── supabase/                    # client · server · middleware
│   │   ├── types/                       # databases.ts (fuente) + database.ts (re-export)
│   │   ├── rateLimit.ts                 # Límite en memoria (ruta pública)
│   │   ├── sanitizeHtml.ts              # Saneado de módulos de texto
│   │   └── utils.ts                     # cn, formatDate, calcularEdad,
│   │                                    # filterCoursesByWorkerAreas, gates…
│   │
│   └── testing/bugs.md                  # Registro de QA
│
├── tests/                               # Vitest (moduleGates, rateLimit,
│                                        # sanitizeHtml, verification) + README
├── supabase/propuestas/                 # SQL por feature. NO está el esquema base.
├── scripts/                             # audit-mobile.mjs + rollbacks/seeds demo
├── docs/                                # Guías, auditorías, handoffs y capturas
├── video-demo/                          # Producción del video demo (guion,
│                                        # escenas HTML, storyboard). No es app.
├── .github/workflows/                   # auto-deploy + alias de preview
├── CLAUDE.md                            # Contexto y normativas para asistentes
├── CONTEXTO-ALUMCO.md                   # Contexto de negocio (breve)
├── components.json · eslint.config.mjs · next.config.ts
├── package.json · postcss.config.mjs · tsconfig.json · vitest.config.mts
└── README.md
```

**Restos y trampas del árbol** (útil antes de "limpiar" algo):

- `src/app/admin/trabajadores/` tiene **`SuspendedTable.tsx` y `SuspendidosTable.tsx`**. Solo se importa `SuspendedTable`; el segundo es código muerto.
- `video-demo/` es material audiovisual, no código de la app: no entra en el build ni en el `tsconfig` de runtime. Los renders (`.mp4`, `snapshots/`) están gitignorados; el guion y las escenas sí se versionan.
- `docs/superpowers/` son specs y planes internos de rediseños, no documentación de equipo.
- El repo declara la dependencia `"package.json": "^2.0.1"` — un paquete de npm real, casi con seguridad instalado por error. Nadie lo importa.

---

## 💻 Cómo iniciar el proyecto en un dispositivo nuevo

### 1. Requisitos previos
- [Node.js](https://nodejs.org/) **20 o superior**.
- Un gestor de paquetes (`npm`, `pnpm`, `yarn` o `bun`).
- **Acceso al proyecto de Supabase existente.** No basta con crear uno nuevo: el esquema (tablas base, triggers, funciones y RLS) **no está versionado en este repo** — ver [§ Base de datos](#base-de-datos-qué-está-versionado-y-qué-no). Sin ese acceso, la app compila pero no funciona.

### 2. Clonar e instalar
```bash
git clone https://github.com/Bato21/alumco-lms.git
cd alumco-lms
npm install
```

> Si heredas un `node_modules` ya existente, **corre `npm install` igual**. Un árbol desactualizado produce errores de `typecheck` que parecen bugs de código (`Cannot find module 'recharts'`, `'vitest'`, `'sanitize-html'`) y no lo son.

### 3. Variables de entorno

Crear `.env.local` en la raíz:

```env
# ── Obligatorias ────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # solo servidor, nunca exponer

# ── Recomendadas ────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=https://kimunko.vercel.app  # base del QR de certificados
                                                 # y del link de reset de clave

# ── Notificaciones push (opcional; sin esto, activarlas devuelve error) ──
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<clave-publica-vapid>
VAPID_PRIVATE_KEY=<clave-privada-vapid>
VAPID_SUBJECT=mailto:contacto@ongalumco.cl
```

> El par VAPID se genera una sola vez con `npx web-push generate-vapid-keys`. Si cambia, todas las suscripciones existentes dejan de recibir notificaciones.
>
> El `SUPABASE_SERVICE_ROLE_KEY` habilita `createAdminClient()` (bypassa RLS). **Nunca** debe importarse desde un Client Component.

#### Variable de grabación (uso excepcional)

| Variable | Efecto | Por defecto |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_MODO_GRABACION` | Con el valor exacto `'true'` activa el modo grabación. Cualquier otro valor, o la variable ausente, deja la plataforma en su comportamiento normal. | Ausente → comportamiento **normal** |

Con `NEXT_PUBLIC_MODO_GRABACION='true'` cambian dos cosas, ambas solo para cuentas demo:

1. **No se monta la barra amarilla de MODO DEMO** (`src/app/(dashboard)/layout.tsx`, `src/app/admin/layout.tsx`).
2. **La sede demo se rotula "Hualpén"** en la página pública de verificación de certificado, en vez de "Demostración" (`src/lib/certificates/verify.ts`).

> ⚠️ **`NEXT_PUBLIC_MODO_GRABACION` es exclusivamente para producir material
> audiovisual.** La barra de MODO DEMO es información real y necesaria para
> cualquier persona que use una cuenta demo: le avisa que su contenido es privado
> y que se reinicia cada pocas horas. Ocultarla deja a esa persona creyendo que
> trabaja sobre datos permanentes. Y rotular la sede demo como una sede real hace
> que un certificado de demostración se vea como uno auténtico ante quien lo
> verifique.
>
> **Hay que devolverla a su estado normal en cuanto termine la grabación**:
> borrar la variable (o dejarla en cualquier valor distinto de `'true'`) y
> redesplegar. Al ser una variable `NEXT_PUBLIC_*` queda incrustada en el build,
> así que **el cambio no surte efecto hasta un nuevo deploy**; en local, reiniciar
> `npm run dev`.

### 4. Buckets de Supabase Storage

| Bucket | Público | Contenido | Estado en el proyecto vivo |
|---|---|---|---|
| `course-banners` | sí | Portadas subidas desde el constructor de cursos. | ✅ existe |
| `event-documents` | no | Documentos de eventos (incl. dificultades alimenticias). | ✅ existe |
| `event-photos` | no | Galería de fotos de eventos. | ✅ existe |
| `firmas` | sí | Firmas digitales del personal (`uploadFirmaAction`). | ⚠️ **no creado** — ver "Pendientes conocidos" |

Los módulos de tipo PDF **no usan Storage**: guardan una URL externa en `modules.content_url`. Ver la advertencia sobre el visor embebido en "Pendientes conocidos".

### 5. Levantar el proyecto
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

**El primer usuario admin se crea a mano**, porque el registro público deja a todo el mundo en `pendiente` y solo un admin puede aprobar — es un arranque en frío. En el panel de Supabase: crear el usuario en Auth → Users, y luego, en el SQL editor, elevar el perfil que el trigger `on_auth_user_created` ya generó:

```sql
update public.profiles
set role = 'admin', status = 'activo', sede = 'sede_1', area_trabajo = array['Dirección técnica']
where id = '<uuid del usuario>';
```

### 6. Antes de abrir un PR

No hay CI que lo haga por ti (ver [§ Deploy, ramas y CI](#-deploy-ramas-y-ci)):

```bash
npm run typecheck && npm run lint && npm test
```

---

## 🛠 Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | App en modo desarrollo con hot-reload. |
| `npm run build` | Build de producción. |
| `npm run start` | Sirve el build (requiere `build` previo). |
| `npm run lint` | ESLint sobre todo el código, incluido `jsx-a11y` en modo estricto. |
| `npm test` | Vitest: gates de módulo, rate limit, saneado HTML y verificación de folios. |
| `npm run test:watch` | Vitest en watch. |
| `npm run typecheck` | `tsc --noEmit`. |

---

## 🚢 Deploy, ramas y CI

- **Repositorio:** `https://github.com/Bato21/alumco-lms.git`. La rama de trabajo es **`main`**; local y `origin/main` están sincronizados en el commit `a9ba0cb`.
- **Producción:** [kimunko.vercel.app](https://kimunko.vercel.app/), en Vercel. **No hay CI de calidad**: ningún workflow corre `lint`, `typecheck` ni `test` antes de desplegar. Hay que correrlos a mano antes de mergear.
- **`.github/workflows/auto-deploy.yml`** — cada push a `main` dispara un deploy hook de Vercel (`curl -X POST ${{ secrets.VERCEL_DEPLOY_HOOK }}`). Es todo lo que hace: un push a `main` va a producción sin puerta de calidad.
- **`.github/workflows/alias-preview-clienta.yml`** — al pushear a `andydidankolanding`, espera a que Vercel termine y apunta `alumcotest.vercel.app` a ese deploy. Era el preview para mostrar a la clienta; esa rama lleva sin tocarse desde junio.
- **20 ramas remotas, casi todas muertas.** Solo `main` (2026-08-17), `testeo` y `accesibilidad-AA` (ya mergeada) son recientes; el resto son fases del proyecto ya integradas o experimentos de estética entre abril y julio. **Se pueden podar sin pérdida**, pero confirma con el equipo antes: hay ramas por persona (`valentin`, `testandy`, `didanko`) que pueden tener trabajo sin mergear.
- **Secrets que el repo necesita en GitHub:** `VERCEL_DEPLOY_HOOK` y `VERCEL_TOKEN`. En Vercel, además, todas las variables de la sección anterior.

---

## 🎨 Branding y accesibilidad

- **Paleta corporativa Alumco:** Primary blue `#2B4FA0` · Accent gold `#F5A623` · Success `#27AE60` · Error `#E74C3C` · Background `#F5F5F5` · Dark text `#1A1A2E`.
- **Logo oficial:** `https://ongalumco.cl/wp-content/uploads/2023/11/logo-alumco-completoccc-300x102.png`
- **Tipografía base:** `html { font-size: 112.5% }` ≈ 18px con la configuración por defecto del navegador, y escala si la persona subió el tamaño de fuente del sistema. Cada usuario puede además elegir escala `normal` / `grande` / `extra` desde su perfil.
- **Sedes:** administrables desde `/admin/sedes`. Las dos históricas son "Sede Hualpén" (`sede_1`) y "Sede Coyhaique" (`sede_2`); `sede_demo` pertenece al mundo demo.

### Accesibilidad — estado verificado

| | |
|---|---|
| **Estándar objetivo** | WCAG 2.2, nivel AA (criterios A + AA). No se evalúa AAA. |
| **Estado actual** | ⚠️ **Parcialmente conforme.** 37 de 41 criterios conformes (+3 con observación) y **38 de 38 hallazgos cerrados** —31 de la auditoría y 7 de tres barridos de verificación posteriores—: no queda deuda de código conocida. El único criterio no conforme es **1.2.2 (subtítulos de video)**, que no se resuelve programando —depende del flujo editorial— y que, siendo de nivel A, impide alcanzar tanto A como AA. |
| **Última verificación** | 2026-08-14 · rama `accesibilidad-AA` |
| **Método** | Revisión estática de código sobre el 100 % de las vistas + cálculo de contraste sobre los colores efectivos del bundle compilado. **Sin** pruebas con lector de pantalla real ni con usuarios. |
| **Informe de conformidad** | [`docs/CONFORMIDAD_A11Y.md`](./docs/CONFORMIDAD_A11Y.md) |
| **Auditoría detallada (38 hallazgos)** | [`docs/AUDITORIA_A11Y.md`](./docs/AUDITORIA_A11Y.md) |

> La afirmación genérica "WCAG AA" que figuraba antes en este README no estaba respaldada por
> ninguna verificación. La auditoría de 2026-08-10 encontró **31 incumplimientos**, 8 de ellos
> bloqueantes; tres barridos posteriores encontraron 7 más, uno de ellos de nivel A. Los 38 están
> corregidos. Este bloque se mantiene actualizado con el estado real, no con el objetivo — y el
> estado real sigue siendo **revisión de código**: nada se ha probado con lector de pantalla, con
> axe en navegador ni con usuarios.

**Verificación permanente en el repositorio:**

- `npm run lint` incluye `eslint-plugin-jsx-a11y` en preset **`strict`** con todas sus reglas
  elevadas a `error`, de modo que una regresión de accesibilidad rompe el build. Los overrides
  (dos reglas desactivadas y dos ajustes de opciones) están justificados por escrito en
  `eslint.config.mjs`.
- Las normas que debe cumplir todo código nuevo están en la sección
  **"Normas de accesibilidad"** de [`CLAUDE.md`](./CLAUDE.md).
- Suite de humo con `@axe-core/playwright` sobre 15 rutas autenticadas: **propuesta, pendiente
  de aprobación** (ver `docs/CONFORMIDAD_A11Y.md` § 7).

---

## 🔒 Seguridad

**El modelo mental:** un layout protege una *página*, nunca una *Server Action*. Las actions se invocan por POST a su propio endpoint, sin pasar por el layout de la pantalla que las usa. Por eso cada action que toca `createAdminClient()` (service role, ignora RLS) tiene que verificar por su cuenta.

- **`requireAdmin()`** (`src/lib/auth/requireAdmin.ts`) es el portón canónico: verifica sesión y rol (`admin` o `profesor`) antes de tocar service role. Lo usan `courses`, `admin-questions`, `admin-days`, `support`, `feedback`, `alerts`, `analytics`, `certificates`, `preview` y `auth`.
- **No es el único mecanismo, aunque el nombre lo sugiera.** Cuatro archivos hacen la misma verificación en línea, con su propio helper: `events.ts` (`getCaller()` + `caller.role !== 'admin'`, y checks por pertenencia a sección para tareas y documentos), `trabajadores.ts`, `registro.ts` y `progress.ts`. Son equivalentes en efecto, pero si buscas `requireAdmin` para auditar cobertura vas a creer que están desprotegidos. **No lo están** — salvo la excepción de abajo.
- **⚠️ `src/lib/actions/sedes.ts` no verifica nada.** `getSedesAction`, `createSedeAction` y `toggleSedeAction` usan `createAdminClient()` sin comprobar sesión ni rol. Cualquier usuario autenticado —incluido un `trabajador`— puede crear sedes o desactivarlas, y `toggleSedeAction(id, false)` además ejecuta `UPDATE profiles SET sede = NULL WHERE sede = <id>`, dejando sin sede a todos los trabajadores de esa sede. Es la única brecha de autorización abierta que encontró esta revisión. Ver la sección **Pendientes conocidos**.
- `searchAction` y las actions de `push.ts` también usan service role sin `requireAdmin`, pero **sí** verifican sesión y acotan el resultado por rol y por scope demo: son correctas.
- **Filtrado por área:** las queries de cursos visibles para trabajadores incluyen `target_areas` en el `select` y pasan por `filterCoursesByWorkerAreas`. El acceso a módulo y quiz se revalida en servidor (`computeModuleGates`, `validateModuleAccess`).
- **Certificados:** la vista y descarga del PDF verifican propiedad (el caller es el titular) o rol staff. La **verificación pública** solo devuelve nombre, curso, fecha, sede y si es demo — nunca RUT, correo, área ni ids internos —, exige folio con formato válido y está limitada por IP (`src/lib/rateLimit.ts`).
- **Módulos de texto:** el HTML se sanea en el servidor con `sanitize-html` **antes** de guardarse; el cliente nunca sanea.
- **`quiz_attempts` es inmutable** — sin UPDATE ni DELETE. Para "resetear" intentos se usa `course_progress.last_quiz_reset_at`.
- **Mundo demo aislado:** `demoScope` mantiene a las cuentas `is_demo` viendo solo datos demo, y el contenido demo fuera del mundo real.

Registro de QA y bugs cerrados: [`src/testing/bugs.md`](./src/testing/bugs.md).

---

## ⚠️ Pendientes conocidos

Reverificado el **2026-08-25** contra el proyecto Supabase vivo (`eaodsaiwzhbgehhfnegj`) y el código de `main`. Los tres bloqueantes de la revisión anterior **siguen abiertos**, y esta pasada añadió tres más.

### Bloqueantes para considerar la entrega "limpia"

| # | Pendiente | Efecto hoy | Cómo se cierra |
|---|---|---|---|
| 1 | **El esquema de la base no está en el repo** | El proyecto no es reproducible: si se pierde el acceso al panel de Supabase, no hay forma de recrear tablas, triggers ni RLS. Ver [§ Base de datos](#base-de-datos-qué-está-versionado-y-qué-no). | `supabase db dump --schema public` y versionar el resultado. **La deuda más cara de todas.** |
| 2 | **`sedes.ts` expone tres Server Actions sin verificación de rol** | Cualquier usuario autenticado puede crear o desactivar sedes; desactivar una pone `sede = NULL` a todos sus trabajadores. Único hallazgo de autorización de esta pasada. | Añadir `requireAdmin()` al inicio de `getSedesAction`, `createSedeAction` y `toggleSedeAction`, como en el resto de `lib/actions/`. Se arregla desde el repo, en minutos. |
| 3 | **`NEXT_PUBLIC_MODO_GRABACION='true'` podría seguir activa en producción** | Si lo está: la barra de MODO DEMO no se muestra a las cuentas demo, y `/certificados/verificar/…` rotula la sede demo como "Hualpén" (sede real). No es verificable desde el repo — la variable vive en Vercel. | Comprobar en Vercel → Settings → Environment Variables. Si está, borrarla **y redesplegar** (es `NEXT_PUBLIC_*`: queda incrustada en el build). |
| 4 | **El bucket `firmas` no existe en el proyecto Supabase** ✅ confirmado hoy | Solo hay tres buckets: `course-banners`, `event-documents`, `event-photos`. `uploadFirmaAction` falla siempre; **0 perfiles** tienen `firma_url` y los certificados PDF salen con las líneas de firma en blanco. | Crear el bucket `firmas` como público y volver a subir las firmas del instructor y la dirección técnica. |
| 5 | **El visor de PDF embebido no carga los documentos externos** ✅ confirmado hoy | Los **7** módulos de tipo PDF apuntan a URLs externas (MINSAL, SENAMA, SEGG…); **2 usan `http://`** (contenido mixto) y la mayoría responde `X-Frame-Options: SAMEORIGIN`: el `<iframe>` de `PdfViewer` queda en blanco. El botón "Descargar PDF" sí funciona. | Alojar los PDFs en un bucket propio y apuntar `modules.content_url` ahí, o cambiar el visor a descarga/enlace en vez de `<iframe>`. |
| 6 | **El mundo demo no se reinicia** | El job `reset-demo-world` (`0 */6 * * *`) acumula **1 corrida exitosa y 93 fallidas**, y hoy está **`active = false`**. Los datos demo se acumulan indefinidamente. | BUG-73 en `src/testing/bugs.md` tiene el diagnóstico: la regla de reescritura de `quiz_attempts` anula el `DELETE` en silencio. Arreglar la función y reactivar el job. |

### Trabajo programado sin observabilidad (BUG-74)

El job anterior **falló 93 veces durante 24 días sin que nadie se enterara**. Nada lee `cron.job_run_details`. Importa más allá del demo: el plan de PWA contempla un cron diario de recordatorios de plazos, y con este mismo patrón los avisos de vencimiento dejarían de salir en silencio — en una plataforma cuyo objeto es acreditar horas de capacitación ante SENAMA. **Regla a adoptar antes de crear cualquier job nuevo: todo trabajo programado necesita un consumidor de su estado.**

### Deuda de base de datos

Linter de Supabase (`get_advisors`), releído el 2026-08-25:

| Nivel | Hallazgo | Nota |
|---|---|---|
| ERROR | Vista `public.reporte_avance` es `SECURITY DEFINER` | La app **ya no la usa** (se reemplazó por queries directas en BUG-14), pero el tipo sigue declarado en `databases.ts`. Lo correcto es eliminar la vista y el tipo. |
| WARN | 6 funciones `SECURITY DEFINER` ejecutables por `anon` vía RPC | `reset_demo_world`, `check_and_set_attempt`, `handle_new_user`, `has_completed_course`, `is_staff`, `set_is_demo_from_user`, `viewer_is_demo`. `reset_demo_world` es la peor: muta datos y la puede llamar cualquiera sin sesión. Revocar `EXECUTE` a `anon`. |
| WARN | 9 funciones `SECURITY DEFINER` ejecutables por `authenticated` | Incluye `is_admin()` y `user_sede()`. Son helpers de RLS; exponerlos como RPC no otorga privilegios, pero conviene revocarlos igual. |
| WARN | Protección de contraseñas filtradas desactivada | Se activa con un clic en Auth → Passwords (chequeo contra HaveIBeenPwned). |
| WARN | `search_path` mutable en 7 funciones | `set_updated_at`, `handle_new_user`, `gen_verification_code`, `set_certificate_verification_code`, `touch_support_ticket`, `touch_course_feedback`, `touch_user_preferences`. Endurecimiento recomendado (`SET search_path = ''`). |

### Bugs abiertos en `src/testing/bugs.md`

BUG-01 a BUG-70 están cerrados. Siguen abiertos los cuatro de las últimas pasadas:

| ID | Severidad | Qué pasa |
|---|---|---|
| BUG-71 | Media | `/admin/sedes` no filtra por `is_demo`: un admin demo ve las sedes reales de la ONG. `sedes` no tiene columna `is_demo`, el scope hay que derivarlo del id reservado `sede_demo`. |
| BUG-72 | Media | El desplegable de sedes de `/admin/trabajadores` se protege por accidente, no por diseño. |
| BUG-73 | Alta | `reset_demo_world()` no reinicia nada (ver bloqueante 6). |
| BUG-74 | Alta | Fallo silencioso de trabajo programado, sin alerta ni panel. |

### Calidad menor (no bloquea)

- **15 warnings de lint**, ninguno error: 6 `<img>` que deberían ser `next/image` (`certificado/[certificateId]`, `error.tsx`, `WorkerSidebar`, `WorkerTopNav`, `WelcomeModal`) y 5 variables/importes sin usar.
- **Código muerto:** `src/app/admin/trabajadores/SuspendidosTable.tsx` no se importa en ninguna parte.
- **Dependencia espuria:** `"package.json": "^2.0.1"` en `dependencies`. Nadie la importa; se puede desinstalar.
- **`tests/README.md` está desactualizado:** dice que las tablas de las propuestas SQL "todavía no están aplicadas". Sí lo están — todas existen en producción. El checklist manual que trae sigue siendo válido y útil.
- **`CLAUDE.md` conserva referencias obsoletas:** la cadena `src/middleware.ts → src/proxy.ts` y una tabla de fases que ya no refleja el alcance real del proyecto.

### Accesibilidad

- **1.2.2 (subtítulos de video)** sigue no conforme: los videos de curso son de YouTube y dependen de que se carguen subtítulos en cada uno. Es flujo editorial, no código.
- La conformidad declarada proviene de **revisión de código**, no de pruebas con lector de pantalla, axe en navegador ni con usuarios.

---

## 📚 Documentación adicional

- [`CLAUDE.md`](./CLAUDE.md) — Contexto completo del proyecto, normativas de código (incluidas las **normas de accesibilidad** obligatorias) y fases de desarrollo.
- [`docs/README.md`](./docs/README.md) — Índice de la documentación.
- [`docs/equipo/GUIA-EQUIPO.md`](./docs/equipo/GUIA-EQUIPO.md) — Onboarding del equipo: qué es la plataforma, cómo entrar, tour por la app y mapa del código.
- [`docs/CONFORMIDAD_A11Y.md`](./docs/CONFORMIDAD_A11Y.md) — Declaración de conformidad WCAG 2.2 AA: alcance, metodología y criterio por criterio. Documento de evidencia para la entrega.
- [`docs/AUDITORIA_A11Y.md`](./docs/AUDITORIA_A11Y.md) — Auditoría técnica con los 38 hallazgos, ratios de contraste medidos y fix de cada uno.
- [`docs/flujo-plataforma/FLUJO.md`](./docs/flujo-plataforma/FLUJO.md) — Flujo end-to-end con capturas, más los scripts de Playwright que las generan.
- [`src/testing/bugs.md`](./src/testing/bugs.md) — Registro de QA: 74 bugs con severidad, diagnóstico y fix. Los cuatro abiertos están al final.
- [`tests/README.md`](./tests/README.md) — Qué cubren los tests y, sobre todo, **qué no**: las policies RLS y el render de rutas públicas se prueban a mano, con el checklist que trae. (Su afirmación de que las tablas nuevas no están aplicadas quedó obsoleta.)
- [`docs/GAPS-CRITICOS.md`](./docs/GAPS-CRITICOS.md) — Análisis comparativo contra la plataforma del equipo rival y plan de cierre de los 4 gaps. Tres ya están cerrados (verificación de certificados, BI ampliado, tickets); el pendiente es **notificaciones por email**.
- `docs/HANDOFF-BATO.md` · `docs/HANDOFF_MODULO_EVENTOS.md` · `docs/HANDOFF-GAPS-CIERRE.md` — Traspasos previos. El de Bato es el único lugar donde quedó el SQL de `event_photos`.
- `docs/GUIA_GRABACION.md` · `docs/VIDEO_BRIEF.md` · `video-demo/` — Producción del video demo. Explican `NEXT_PUBLIC_MODO_GRABACION` y el estado del mundo demo.
- `docs/superpowers/` — Specs y planes internos de rediseños (landing, tema didasko, eventos, PWA, burbuja demo). Útiles para entender **por qué** algo está hecho así.

---

## 🧭 Qué haría yo primero

Si tuvieras que ordenar el trabajo pendiente por relación valor/esfuerzo:

1. **Poner `requireAdmin()` en `sedes.ts`.** Minutos de trabajo, cierra la única brecha de autorización abierta.
2. **Versionar el esquema de la base.** Una tarde. Es lo único de esta lista que, si no se hace, puede costar el proyecto entero.
3. **Crear el bucket `firmas`.** Un clic en Supabase; desbloquea que los certificados salgan firmados.
4. **Decidir qué pasa con los PDFs externos.** Hoy 7 módulos publicados muestran un visor en blanco.
5. **Arreglar o retirar el cron demo (BUG-73/74)**, y no crear ningún job nuevo hasta que haya forma de saber que falló.
