# KimünKo — LMS para ONG Alumco

**Plataforma en producción: [kimunko.vercel.app](https://kimunko.vercel.app/)**

Plataforma de gestión de aprendizaje y gestión interna construida para **ONG Alumco**, organización dedicada al cuidado de adultos mayores en ELEAMs (Establecimientos de Larga Estadía para Adultos Mayores) en Chile. Capacita de forma asíncrona a los trabajadores de sus sedes, homologa conocimientos clínicos y operativos, emite certificados verificables, y coordina la operación diaria: eventos institucionales, días administrativos y soporte interno.

> **Stack:** Next.js 16 (App Router) + Supabase (Auth, PostgreSQL, Storage) + TypeScript estricto + Tailwind CSS v4. PWA instalable con notificaciones push.

---

## 🎯 Qué hace la plataforma

### Capacitación (el núcleo)

1. **Solicitud de acceso** — los nuevos trabajadores se registran indicando RUT, sede y áreas de trabajo. Un admin revisa cada solicitud antes de habilitar el acceso.
2. **Asignación de cursos por área** — cada curso tiene `target_areas` (ej. Enfermería, Kinesiología). Los trabajadores solo ven los cursos relevantes para su rol.
3. **Aprendizaje asincrónico** — módulos de **video** (YouTube), **PDF** (Supabase Storage), **texto** (HTML saneado en servidor) o **quiz**, con desbloqueo secuencial.
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
| **Mundo demo** | Cuentas `is_demo` con datos propios que se reinician periódicamente, aisladas del mundo real y siempre rotuladas. |

---

## 🚀 Tecnologías principales

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **Next.js 16** (App Router) + **React 19** | Server Components y Server Actions. NO Pages Router. |
| Lenguaje | **TypeScript** estricto | Sin `any`. Tipos en `src/lib/types/databases.ts`. |
| Base de datos | **PostgreSQL** vía Supabase | Row Level Security, triggers y funciones. |
| Auth | **Supabase Auth** (`@supabase/ssr`) | Cookies SSR + middleware de Next.js. |
| Storage | **Supabase Storage** | Firmas, banners de curso, documentos y fotos de eventos. |
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

Las migraciones aplicadas fuera del esquema base viven en [`supabase/propuestas/`](./supabase/propuestas/) (un `.sql` por feature) y los rollbacks del mundo demo en [`scripts/`](./scripts/).

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

El middleware (`src/middleware.ts` → `src/proxy.ts` → `src/lib/supabase/middleware.ts`) corre en cada request: refresca la sesión, redirige a `/login` a quien no tenga sesión y saca de `/login` o `/registro` a quien sí la tenga. La verificación fina de **rol** y **status** vive en los layouts (`(dashboard)/layout.tsx` y `admin/layout.tsx`).

### Patrón Server / Client

- **Server Components** son el default; **Client Components** (`'use client'` en la primera línea) solo para interactividad.
- **Server Actions** (`'use server'`) son las únicas mutaciones. Devuelven `{ success | error }` y disparan `revalidatePath`.
- **Dos clientes Supabase:**
  - `createClient()` (cookies del usuario) — lecturas/escrituras del propio usuario; respeta RLS.
  - `createAdminClient()` (service role) — solo operaciones administrativas verificadas. Toda función que lo use **debe** pasar antes por `requireAdmin()` (`src/lib/auth/requireAdmin.ts`).

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
│   ├── middleware.ts                    # Re-exporta proxy.ts como middleware Next.js
│   ├── proxy.ts                         # Matcher; delega en supabase/middleware.ts
│   │
│   ├── app/
│   │   ├── layout.tsx                   # Layout raíz (fonts, providers, skip link)
│   │   ├── page.tsx                     # Landing institucional
│   │   ├── globals.css                  # Tailwind v4 + tokens corporativos
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
│                                        # sanitizeHtml, verification)
├── supabase/propuestas/                 # SQL por feature aplicado a la DB
├── scripts/                             # Auditoría móvil + rollbacks demo
├── docs/                                # Guías, auditorías y handoffs
├── CLAUDE.md                            # Contexto y normativas para asistentes
├── components.json · eslint.config.mjs · next.config.ts
├── package.json · postcss.config.mjs · tsconfig.json · vitest.config.mts
└── README.md
```

---

## 💻 Cómo iniciar el proyecto en un dispositivo nuevo

### 1. Requisitos previos
- [Node.js](https://nodejs.org/) **20 o superior**.
- Un gestor de paquetes (`npm`, `pnpm`, `yarn` o `bun`).
- Acceso a un proyecto de **Supabase** con el esquema de KimünKo aplicado (tablas, triggers, RLS y las migraciones de `supabase/propuestas/`).

### 2. Clonar e instalar
```bash
git clone https://github.com/Bato21/alumco-lms.git
cd alumco-lms
npm install
```

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

Abre [http://localhost:3000](http://localhost:3000). El primer usuario admin debe crearse manualmente en Supabase (`auth.users` + `profiles` con `role='admin'` y `status='activo'`).

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

- **`requireAdmin()`** (`src/lib/auth/requireAdmin.ts`) es el único portón para las Server Actions que usan `createAdminClient()`: verifica sesión y rol (`admin` o `profesor`) antes de tocar service role.
- **Filtrado por área:** las queries de cursos visibles para trabajadores incluyen `target_areas` en el `select` y pasan por `filterCoursesByWorkerAreas`. El acceso a módulo y quiz se revalida en servidor (`computeModuleGates`, `validateModuleAccess`).
- **Certificados:** la vista y descarga del PDF verifican propiedad (el caller es el titular) o rol staff. La **verificación pública** solo devuelve nombre, curso, fecha, sede y si es demo — nunca RUT, correo, área ni ids internos —, exige folio con formato válido y está limitada por IP (`src/lib/rateLimit.ts`).
- **Módulos de texto:** el HTML se sanea en el servidor con `sanitize-html` **antes** de guardarse; el cliente nunca sanea.
- **`quiz_attempts` es inmutable** — sin UPDATE ni DELETE. Para "resetear" intentos se usa `course_progress.last_quiz_reset_at`.
- **Mundo demo aislado:** `demoScope` mantiene a las cuentas `is_demo` viendo solo datos demo, y el contenido demo fuera del mundo real.

Registro de QA y bugs cerrados: [`src/testing/bugs.md`](./src/testing/bugs.md).

---

## ⚠️ Pendientes conocidos

Verificado el **2026-08-17** contra el proyecto Supabase vivo y el deploy de producción. Ninguno de estos puntos se arregla desde el código de este repositorio solo: todos requieren tocar el panel de Supabase, las variables de Vercel o el contenido cargado.

### Bloqueantes para considerar la entrega "limpia"

| # | Pendiente | Efecto hoy | Cómo se cierra |
|---|---|---|---|
| 1 | **`NEXT_PUBLIC_MODO_GRABACION='true'` sigue activa en producción** | La barra de MODO DEMO no se muestra a las cuentas demo, y `/certificados/verificar/…` rotula la sede demo como "Hualpén" (sede real). | Borrar la variable en Vercel **y redesplegar** (es `NEXT_PUBLIC_*`: no basta con borrarla). |
| 2 | **El bucket `firmas` no existe en el proyecto Supabase** | `uploadFirmaAction` falla siempre ("Error al subir la firma"); hoy **0 perfiles** tienen `firma_url` y los certificados PDF salen con las líneas de firma en blanco. | Crear el bucket `firmas` como público y volver a subir las firmas del instructor y la dirección técnica. |
| 3 | **El visor de PDF embebido no carga los documentos externos** | Los 7 módulos de tipo PDF apuntan a URLs externas (MINSAL, SENAMA, SEGG…). La mayoría de esos servidores responde `X-Frame-Options: SAMEORIGIN`, y 2 usan `http://` (contenido mixto): el `<iframe>` de `PdfViewer` queda en blanco. El botón "Descargar PDF" sí funciona. | Alojar los PDFs en un bucket propio (`cursos`) y apuntar `modules.content_url` ahí, o cambiar el visor a descarga/enlace en vez de `<iframe>`. |

### Deuda de base de datos

Linter de Supabase (`get_advisors`):

| Nivel | Hallazgo | Nota |
|---|---|---|
| ERROR | Vista `public.reporte_avance` es `SECURITY DEFINER` | La app **ya no la usa** (se reemplazó por queries directas en BUG-14). Lo correcto es eliminarla. |
| WARN | `reset_demo_world()` ejecutable por el rol `anon` | Solo reinicia el mundo demo, pero es un RPC público que muta datos: conviene revocar `EXECUTE` a `anon`. |
| WARN | Protección de contraseñas filtradas desactivada | Se activa con un clic en Auth → Passwords (chequeo contra HaveIBeenPwned). |
| WARN | `search_path` mutable en 7 funciones | Endurecimiento recomendado (`SET search_path = ''`), sin impacto conocido hoy. |

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
- [`docs/flujo-plataforma/FLUJO.md`](./docs/flujo-plataforma/FLUJO.md) — Flujo end-to-end con capturas.
- [`src/testing/bugs.md`](./src/testing/bugs.md) — Reporte de QA con bugs, severidad y fix.
