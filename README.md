# Link de plataforma

https://alumco-lms-nm38.vercel.app/

# Alumco LMS

Plataforma de gestión de aprendizaje (LMS) construida para **ONG Alumco**, organización dedicada al cuidado de adultos mayores en ELEAMs (Establecimientos de Larga Estadía para Adultos Mayores) en Chile. La aplicación permite capacitar de forma asíncrona a los trabajadores de las dos sedes (Hualpén y Coyhaique), homologando conocimientos clínicos y operativos, y emitiendo certificados oficiales al aprobar las evaluaciones.

> **Stack:** Next.js 16 (App Router) + Supabase (Auth, PostgreSQL, Storage) + TypeScript estricto + Tailwind CSS v4.

---

## 🎯 ¿Para qué sirve?

La plataforma cubre el ciclo completo de capacitación interna:

1. **Solicitud de acceso** — los nuevos trabajadores se registran indicando RUT, sede y áreas de trabajo. Un admin revisa cada solicitud antes de habilitar el acceso.
2. **Asignación de cursos por área** — cada curso tiene `target_areas` (ej. Enfermería, Kinesiología). Los trabajadores solo ven los cursos relevantes para su rol.
3. **Aprendizaje asincrónico** — los trabajadores avanzan a su ritmo a través de módulos de **video** (YouTube), **PDF** (Supabase Storage) o **quiz** (selección múltiple).
4. **Evaluaciones con intentos** — cada quiz acepta hasta N intentos con porcentaje mínimo de aprobación. Los intentos son inmutables (auditoría) y solo el admin puede resetear el progreso.
5. **Certificación automática** — al completar el último módulo del curso (incluyendo quiz si lo hay), el sistema genera un certificado PDF firmado digitalmente con datos del trabajador, sello institucional y firmas del instructor y la directora técnica.
6. **Trazabilidad y reportes** — el admin visualiza progreso por sede/área, alertas por deadlines vencidos, certificados emitidos y exporta reportes en CSV.

---

## 🚀 Tecnologías Principales

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | **Next.js 16** (App Router) + **React 19** | Server Components y Server Actions. NO Pages Router. |
| Lenguaje | **TypeScript** estricto | Sin `any`. Tipos en `src/lib/types/database.ts`. |
| Base de datos | **PostgreSQL** vía Supabase | Con Row Level Security (RLS), triggers y vistas. |
| Auth | **Supabase Auth** (`@supabase/ssr`) | Cookies SSR + middleware Next.js. |
| Storage | **Supabase Storage** | PDFs de cursos, firmas digitales (`firmas/`). |
| Estilos | **Tailwind CSS v4** | Paleta corporativa Alumco (`#2B4FA0`, `#F5A623`). |
| UI base | **shadcn/ui** + **Radix UI** | Componentes accesibles WCAG AA. |
| Iconos | **Lucide React** | — |
| Forms | **React Hook Form** + **Zod** | Validación cliente + servidor. |
| Drag & Drop | **@dnd-kit/core** + sortable | Para el constructor de cursos. |
| Estado servidor | Server Components + Server Actions | Sin REST/GraphQL adicional. |
| Estado cliente | **TanStack React Query** | Solo donde el client-side caching aporta. |
| Notificaciones | **Sonner** | Toasts. |
| PDFs | **pdf-lib** | Generación de certificados desde el servidor. |
| Temas | **next-themes** | (Modo oscuro/claro disponible). |

---

## 👥 Roles y permisos

La plataforma maneja tres roles que determinan qué rutas y acciones están disponibles:

| Rol | Acceso | Capacidad |
|---|---|---|
| `trabajador` | `/inicio`, `/cursos`, `/perfil`, `/mis-certificados` | Toma cursos asignados a sus áreas, rinde quizzes, descarga certificados, edita su perfil. |
| `admin` | Todo lo anterior + `/admin/*` | Aprobar solicitudes, CRUD de trabajadores, constructor de cursos, reportes, métricas globales. |
| `profesor` | Acceso administrativo limitado | Crear/editar sus propios cursos y revisar progreso. |

Los trabajadores solo se crean en estado `pendiente` y necesitan aprobación admin (que asigna `sede`, `area_trabajo[]` y `role`) antes de poder iniciar sesión.

---

## 🧭 Mapa funcional de rutas

### Rutas públicas (`src/app/(auth)/`)
- `/login` — login con email/contraseña; verifica `profile.status === 'activo'`.
- `/registro` — formulario de solicitud (queda en estado `pendiente`).

### Rutas trabajador (`src/app/(dashboard)/`)
- `/inicio` — dashboard con stats personales, calendario de plazos y banner de cursos vencidos.
- `/cursos` — listado filtrado por área, con tabs (Todos / En progreso / Completados / Sin iniciar).
- `/cursos/[id]` — detalle del curso con índice de módulos y estado de progreso.
- `/cursos/[id]/modulos/[moduleId]` — visor de módulo (video YouTube, PDF embebido o intro a quiz).
- `/cursos/[id]/modulos/[moduleId]/quiz` — quiz player con intentos, score y feedback.
- `/mis-certificados` — galería de certificados aprobados y descargables.
- `/perfil` — datos personales editables, fecha de nacimiento, firma digital, stats de cumplimiento.
- `/certificado/[certificateId]` — vista pública del certificado (con verificación de propiedad o rol admin).

### Rutas administrativas (`src/app/admin/`)
- `/admin/dashboard` — KPIs, comparativa Hualpén vs. Coyhaique, actividad reciente, top cursos, alertas.
- `/admin/trabajadores` — vista unificada con tabs (`?tab=activos|suspendidos|solicitudes`).
- `/admin/trabajadores/[id]` — detalle de trabajador con su progreso y certificados.
- `/admin/cursos` — listado de cursos creados.
- `/admin/cursos/nuevo` — constructor visual basado en bloques (drag & drop con dnd-kit).
- `/admin/cursos/[id]/editar` — mismo constructor en modo edición + publicar/despublicar.
- `/admin/reportes` — reporte de cumplimiento por trabajador, con filtros por sede/área y export CSV.
- `/admin/certificados` — todos los certificados emitidos.
- `/admin/perfil` — perfil del propio admin (incluye subida de firma digital).

---

## 🏛️ Arquitectura

### Modelo de datos (PostgreSQL / Supabase)

```text
profiles            ── extiende auth.users; trigger on_auth_user_created lo crea automáticamente
                       campos clave: role, sede, area_trabajo[], status, rut, firma_url
courses             ── título, descripción, deadline, target_areas[], created_by
modules             ── pertenece a un course; content_type ∈ {video, pdf, slides, quiz}
                       order_index para ordenar; is_final_module marca el último
quizzes             ── 1:1 con módulo de tipo quiz; passing_score, max_attempts
questions           ── pertenece a quizzes; options en JSONB tipado
quiz_attempts       ── INMUTABLE (sin UPDATE/DELETE); auditoría completa de intentos
course_progress    ── 1 fila por (user, course); completed_modules[], is_completed,
                       last_quiz_reset_at (para reseteos del admin)
certificates       ── generado al completar; quiz_attempt_id (opcional), pdf_url
```

**Triggers operativos:**
- `on_auth_user_created` → crea `profiles` con `status='pendiente'`.
- `check_attempt_limit_trigger` → valida intentos respetando `last_quiz_reset_at`.
- `set_*_updated_at` → mantiene `updated_at` automático.

**Row Level Security:** los trabajadores solo leen/escriben sus propios datos; el admin accede al estado global vía `createAdminClient()` (service role), nunca vía políticas RLS complejas.

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

El middleware (`src/middleware.ts` → `src/proxy.ts` → `src/lib/supabase/middleware.ts`) corre en cada request: refresca la sesión, redirige usuarios no autenticados a `/login` y a usuarios logueados los saca de `/login` o `/registro`. La verificación fina de **rol** y **status** vive en los layouts (`(dashboard)/layout.tsx` y `admin/layout.tsx`).

### Patrón Server / Client

- **Server Components** son el default (todo lo que no necesita interacción).
- **Client Components** llevan `'use client'` en la primera línea y se reservan para interactividad (forms, drag & drop, modales).
- **Server Actions** (`'use server'`) son las únicas mutaciones. Devuelven `{ success | error }` y disparan `revalidatePath`.
- **Dos clientes Supabase:**
  - `createClient()` (cookies del usuario) — usar para lecturas/escrituras del propio usuario; respeta RLS.
  - `createAdminClient()` (service role) — solo para operaciones administrativas verificadas (bypassa RLS). Toda función que lo use **debe** verificar previamente `auth.getUser()` + `profiles.role === 'admin'`.

---

## 📂 Estructura del proyecto

```text
alumco-lms/
├── public/                              # Assets estáticos
│
├── src/
│   ├── middleware.ts                    # Re-exporta proxy.ts como middleware Next.js
│   ├── proxy.ts                         # Configuración del matcher; delega a supabase/middleware.ts
│   │
│   ├── app/                             # App Router (Next.js)
│   │   ├── layout.tsx                   # Layout raíz (HTML, fonts, providers globales)
│   │   ├── page.tsx                     # Landing / redirect inicial
│   │   ├── globals.css                  # Tailwind v4 + tokens corporativos Alumco
│   │   ├── not-found.tsx                # 404 personalizada
│   │   ├── error.tsx                    # Error boundary global
│   │   │
│   │   ├── (auth)/                      # Grupo público — sin chrome del dashboard
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── registro/page.tsx
│   │   │
│   │   ├── (dashboard)/                 # Grupo trabajador — verifica status='activo'
│   │   │   ├── layout.tsx               # Sidebar + TopBar + redirect admins
│   │   │   ├── TopBar.tsx
│   │   │   ├── inicio/                  # Dashboard del trabajador
│   │   │   ├── cursos/                  # Listado, detalle, módulos, quiz
│   │   │   │   └── [id]/modulos/[moduleId]/quiz/
│   │   │   ├── mis-certificados/
│   │   │   └── perfil/
│   │   │
│   │   ├── admin/                       # Verifica role='admin' (o 'profesor' donde aplica)
│   │   │   ├── layout.tsx
│   │   │   ├── AdminNav.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── dashboard/               # KPIs y gráficos
│   │   │   ├── trabajadores/            # Vista unificada con tabs por URL
│   │   │   │   └── [id]/                # Detalle de trabajador
│   │   │   ├── cursos/                  # CRUD de cursos
│   │   │   │   ├── nuevo/
│   │   │   │   └── [id]/editar/
│   │   │   ├── reportes/
│   │   │   ├── certificados/
│   │   │   └── perfil/
│   │   │
│   │   └── certificado/[certificateId]/ # Vista pública del certificado
│   │
│   ├── components/
│   │   ├── ui/                          # shadcn/ui (no modificar manualmente)
│   │   │   ├── button.tsx, card.tsx, dialog.tsx, ...
│   │   │
│   │   └── alumco/                      # Componentes específicos del negocio
│   │       ├── AdminSidebar.tsx
│   │       ├── WorkerSidebar.tsx
│   │       ├── BottomNav.tsx
│   │       ├── TopBar / NotificationBell / SearchBar
│   │       ├── LoginForm / RegisterForm / ForgotPasswordForm
│   │       ├── ApprovalPanel / WorkerEditPanel
│   │       ├── VideoPlayer / PdfViewer / ModuleIndex
│   │       ├── CertificateBadge / DownloadCertificateButton
│   │       ├── DeadlineCalendar / WelcomeModal / Skeletons
│   │       ├── CourseCard / AlumcoLogo / LogoutButton / PrintButton
│   │       └── CourseBuilder/           # Constructor visual drag & drop
│   │           ├── CourseBuilder.tsx
│   │           ├── BlockCanvas.tsx
│   │           ├── BlockCard.tsx
│   │           ├── BlockPalette.tsx
│   │           ├── BlockPropertiesPanel.tsx
│   │           ├── CourseData.tsx
│   │           ├── QuizQuestionsEditor.tsx
│   │           └── QuestionForm.tsx
│   │
│   ├── hooks/
│   │   └── usePendingRequestsCount.ts   # Contador de solicitudes pendientes (admin)
│   │
│   ├── lib/
│   │   ├── actions/                     # Server Actions ('use server')
│   │   │   ├── auth.ts                  # loginAction, logoutAction
│   │   │   ├── registro.ts              # registerRequestAction, approveWorkerAction, rejectWorkerAction
│   │   │   ├── trabajadores.ts          # CRUD trabajadores, suspend/reactivate, perfiles, firmas
│   │   │   ├── courses.ts               # CRUD cursos y módulos, reorder, publish
│   │   │   ├── admin-questions.ts       # Crear/editar preguntas del quiz
│   │   │   ├── progress.ts              # Marcar módulo completo, reset, last_module
│   │   │   ├── quiz.ts                  # submitQuizAction, getQuizStatus, history
│   │   │   ├── certificates.ts          # generateCertificate, generateCertificatePDF
│   │   │   ├── alerts.ts                # Alertas de deadlines (admin y trabajador)
│   │   │   └── search.ts                # Búsqueda global
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts                # Cliente browser (componentes 'use client')
│   │   │   ├── server.ts                # createClient + createAdminClient (server only)
│   │   │   └── middleware.ts            # updateSession para el middleware Next.js
│   │   │
│   │   ├── types/
│   │   │   ├── database.ts              # Tipos del esquema (Profile, Course, Quiz, ...)
│   │   │   └── databases.ts
│   │   │
│   │   └── utils.ts                     # cn(), formatDate, calcularEdad, sedeLabel,
│   │                                    # filterCoursesByWorkerAreas, scoreLabel
│   │
│   └── testing/
│       └── bugs.md                      # Reporte de QA (registro de bugs y fixes)
│
├── CLAUDE.md                            # Contexto y normativas para asistentes de código
├── components.json                      # Config shadcn/ui
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## 💻 Cómo iniciar el proyecto en un dispositivo nuevo

### 1. Requisitos previos
- [Node.js](https://nodejs.org/) **20 o superior**.
- Un gestor de paquetes (`npm`, `pnpm`, `yarn` o `bun`).
- Acceso a un proyecto de **Supabase** con el esquema de Alumco LMS aplicado (tablas, triggers, RLS y vistas).

### 2. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd alumco-lms
```

### 3. Instalar dependencias
```bash
npm install
# o pnpm install / yarn install / bun install
```

### 4. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz con las credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # solo en server, nunca exponer
```

> El `SUPABASE_SERVICE_ROLE_KEY` es necesario para `createAdminClient()` (operaciones administrativas que bypassan RLS). **Nunca** se debe importar desde un Client Component.

### 5. Configurar Supabase Storage
Crear (si no existen) los siguientes buckets:
- `firmas` — público, para firmas digitales del personal.
- `cursos` — público, para PDFs de los módulos.

### 6. Iniciar el servidor de desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El primer usuario admin debe crearse manualmente en Supabase (en `auth.users` + `profiles` con `role='admin'` y `status='activo'`).

---

## 🛠 Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Inicia la app en modo desarrollo con hot-reload. |
| `npm run build` | Compila la aplicación para producción. |
| `npm run start` | Sirve el build de producción (requiere `build` previo). |
| `npm run lint` | Ejecuta ESLint sobre todo el código. |

---

## 🎨 Branding y accesibilidad

- **Paleta corporativa Alumco:**
  - Primary blue `#2B4FA0`
  - Accent gold `#F5A623`
  - Success `#27AE60`
  - Error `#E74C3C`
  - Background `#F5F5F5`
  - Dark text `#1A1A2E`
- **Logo oficial:** `https://ongalumco.cl/wp-content/uploads/2023/11/logo-alumco-completoccc-300x102.png`
- **Tipografía base:** 18px (priorizando legibilidad para trabajadores de todas las edades).
- **Accesibilidad:** WCAG AA, targets táctiles ≥ 48×48px, atributos `aria-*` en todos los elementos interactivos.
- **Sedes (nomenclatura oficial):** `sede_1` → "Sede Hualpén", `sede_2` → "Sede Coyhaique".

---

## 🔒 Seguridad

- **Toda Server Action que use `createAdminClient()`** debe verificar al inicio: usuario autenticado + rol adecuado. El patrón está centralizado en `src/lib/auth/requireAdmin.ts` (cuando exista) y replicado en `trabajadores.ts`.
- **Filtrado por área:** las queries de cursos visibles para trabajadores deben incluir `target_areas` en el `select` y pasar por `filterCoursesByWorkerAreas`.
- **Certificados:** la descarga del PDF verifica propiedad (caller es dueño del cert) o rol admin/profesor.
- **`quiz_attempts` es inmutable** — la auditoría no permite UPDATE ni DELETE. Para "resetear" intentos se usa `course_progress.last_quiz_reset_at`.

Para auditorías de QA y registro de bugs ver [`src/testing/bugs.md`](./src/testing/bugs.md).

---

## 📚 Documentación adicional

- **`CLAUDE.md`** — Contexto completo del proyecto, normativas de código y fases de desarrollo. Imprescindible para entender decisiones de arquitectura.
- **`src/testing/bugs.md`** — Reporte de QA con bugs detectados, severidad y fix paso a paso.
