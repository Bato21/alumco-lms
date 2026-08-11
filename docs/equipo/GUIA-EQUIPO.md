# Guía del equipo — Alumco LMS (KimünKo)

> Guía de onboarding para el equipo. Todo lo que necesitas para entrar, usar y desarrollar la plataforma en una sesión de trabajo.

**App en producción:** https://kimunko.vercel.app/

---

## 1. ¿Qué es esto?

**KimünKo** es nuestro producto: una plataforma LMS (Learning Management System) construida para el cliente **ONG Alumco**, que capacita a trabajadores de ELEAMs (residencias de adultos mayores) en Chile. Por eso conviven las dos marcas: KimünKo (el producto) y Alumco (el cliente).

El ciclo completo que cubre:

1. Un trabajador **solicita acceso** en `/registro` (nombre, RUT, correo, contraseña).
2. Un **admin aprueba** la solicitud y le asigna sede, áreas de trabajo y rol.
3. El trabajador ve **solo los cursos de sus áreas** (Enfermería, Kinesiología, etc.).
4. Avanza por **módulos** de video (YouTube), PDF o quiz, en orden (módulos bloqueados hasta completar el anterior).
5. Al aprobar el quiz final se genera **automáticamente un certificado PDF** con firmas digitales.
6. El admin tiene **dashboard, reportes con export CSV, alertas de vencimiento** y trazabilidad completa.

**Stack:** Next.js 16 (App Router) + React 19 + Supabase (Auth, PostgreSQL, Storage) + TypeScript estricto + Tailwind CSS v4 + shadcn/ui.

---

## 2. Cómo entrar

### En producción

1. Ir a https://kimunko.vercel.app/ → redirige a `/login`.
2. Si no tienes cuenta: **"Solicitar acceso"** → llenar formulario → queda en estado `pendiente`.
3. Un admin debe aprobarte en **Admin → Trabajadores → tab Solicitudes** (asigna sede, áreas y rol).
4. Recién entonces puedes iniciar sesión. Si tu cuenta no está `activo`, el login te rechaza.

> Para que ustedes tres tengan acceso admin: uno con cuenta admin existente aprueba a los otros dos y les pone rol `admin` desde el panel de trabajadores.

### En local

```bash
git clone <repo>
cd alumco
npm install
# pedir .env.local a quien lo tenga (NO está en git):
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   NEXT_PUBLIC_SITE_URL
npm run dev   # http://localhost:3000
```

⚠️ **Local y producción comparten la misma base de datos Supabase.** Lo que crees/borres en local afecta producción. Cuidado con borrar trabajadores o cursos reales.

---

## 3. Roles

| Rol | Qué ve | Qué puede hacer |
|---|---|---|
| `trabajador` | `/inicio`, `/cursos`, `/mis-certificados`, `/perfil` | Tomar cursos de sus áreas, rendir quizzes, descargar certificados |
| `admin` | Todo + `/admin/*` | Aprobar solicitudes, CRUD trabajadores/cursos/sedes, reportes, resetear intentos de quiz |
| `profesor` | Admin limitado | Crear/editar sus propios cursos |

---

## 4. Tour por la aplicación

### Login y registro (público)

![Login](capturas/01-login.png)

- Login con email/contraseña. Valida que el perfil esté `activo`.
- Redirige según rol: admin → `/admin/dashboard`, trabajador → `/inicio`.
- Hay recuperación de contraseña ("¿Olvidó su clave?").

![Registro](capturas/02-registro.png)

- El registro crea la cuenta en estado `pendiente`. Sin aprobación admin no se puede entrar.

### Vista trabajador

**`/inicio`** — dashboard personal: banner con cursos vencidos/próximos a vencer, stats, calendario de plazos. La primera vez aparece un modal de bienvenida con tu sede y áreas:

![Inicio trabajador](capturas/10-trabajador-inicio.png)

**`/cursos`** — solo los cursos de tus áreas, con tabs Todos / En progreso / Completados / Sin iniciar:

![Mis cursos](capturas/11-trabajador-cursos.png)

**`/cursos/[id]`** — detalle con barra de progreso e índice de módulos. Los módulos se desbloquean en orden:

![Detalle curso](capturas/12-trabajador-curso-detalle.png)

- Módulo **video**: reproductor YouTube embebido.
- Módulo **PDF**: visor embebido (archivo en Supabase Storage).
- Módulo **quiz**: intentos limitados (`max_attempts`), porcentaje mínimo (`passing_score`). Los intentos quedan registrados para siempre (auditoría); solo un admin puede resetearlos.

**`/mis-certificados`** — galería de certificados descargables (PDF generado con pdf-lib, firmas del instructor y directora técnica).

**`/perfil`** — datos personales, áreas asignadas (solo lectura), fecha de nacimiento editable, stats:

![Perfil](capturas/14-trabajador-perfil.png)

### Vista admin

**`/admin/dashboard`** — KPIs globales: colaboradores activos, capacitaciones publicadas, % cumplimiento, certificados emitidos, comparativa por sede, cursos más completados:

![Dashboard admin](capturas/20-admin-dashboard.png)

**`/admin/trabajadores`** — tabla unificada con tabs por URL (`?tab=activos|suspendidos|solicitudes`). Desde aquí se aprueban solicitudes (panel lateral asigna sede + áreas + rol), se edita, suspende o reactiva gente:

![Trabajadores](capturas/21-admin-trabajadores.png)
![Solicitudes](capturas/22-admin-solicitudes.png)

**`/admin/cursos`** — listado de cursos; **`/admin/cursos/nuevo`** — constructor visual: primero datos básicos (título, descripción, fecha límite, áreas objetivo), luego se agregan módulos con drag & drop (dnd-kit) y editor de preguntas de quiz (2–5 alternativas por pregunta):

![Cursos admin](capturas/23-admin-cursos.png)
![Constructor](capturas/24-admin-constructor-cursos.png)

**`/admin/reportes`** — cumplimiento por trabajador con filtros sede/área y **export CSV**:

![Reportes](capturas/25-admin-reportes.png)

**`/admin/sedes`** — crear/activar/desactivar sedes:

![Sedes](capturas/27-admin-sedes.png)

**`/admin/certificados`** — todos los certificados emitidos:

![Certificados admin](capturas/26-admin-certificados.png)

**`/admin/perfil`** — perfil del admin, incluye subir su **firma digital** (se estampa en los certificados).

---

## 5. Estructura del código (mapa rápido)

```
src/
├── app/
│   ├── (auth)/          login, registro (público)
│   ├── (dashboard)/     vistas trabajador (inicio, cursos, perfil, certificados)
│   ├── admin/           vistas admin (dashboard, trabajadores, cursos, reportes, sedes...)
│   └── certificado/     vista pública de certificado
├── components/
│   ├── ui/              shadcn/ui — NO editar a mano
│   └── alumco/          componentes del negocio (CourseBuilder/, paneles, sidebars...)
└── lib/
    ├── actions/         Server Actions — TODAS las mutaciones pasan por aquí
    ├── supabase/        createClient (usuario, respeta RLS) / createAdminClient (service role)
    └── types/           tipos del esquema
```

Reglas de la casa (del README, respetarlas):

- **Server Components por defecto**; `'use client'` solo para interactividad.
- **Mutaciones solo vía Server Actions** que devuelven `{ success | error }` + `revalidatePath`.
- Toda función que use `createAdminClient()` **debe verificar antes** `auth.getUser()` + rol admin.
- TypeScript estricto, sin `any`.
- Paleta corporativa: azul `#2B4FA0`, amarillo `#F5A623`.

### Datos (Supabase)

Tablas: `profiles`, `courses`, `modules`, `quizzes`, `questions`, `quiz_attempts` (inmutable), `course_progress`, `certificates`, `sedes`. Trigger `on_auth_user_created` crea el perfil en `pendiente` automáticamente. RLS: cada trabajador solo ve lo suyo.

---

## 6. Mejoras de UI recomendadas (priorizadas)

Auditoría hecha con las Web Interface Guidelines + revisión visual de las capturas.

### Alta prioridad

1. **Jerarquía de marcas poco clara.** Conviven dos marcas a propósito: **KimünKo** (nuestro producto) y **Alumco** (el cliente). Correcto mantener ambas, pero un usuario nuevo no entiende la relación. Agregar en login/registro una línea que las conecte, ej. "KimünKo · plataforma de capacitación de ONG Alumco".
2. **Tablas sin paginación.** `/admin/trabajadores` y `/admin/reportes` renderizan ~60 filas en una página kilométrica. Con 100+ trabajadores será inusable y lento. Paginar (20–25 por página) o virtualizar. Archivos: `WorkersTable.tsx`, `ReportesClient.tsx`.
3. **Datos de prueba visibles en producción.** Curso "Cuidado mascotas" y sede "Nueva sede" (inactiva) están en la BD productiva. Limpiar antes de mostrar a la ONG.
4. **Tarjetas de curso con gradientes arcoíris** (naranjo-verde-azul) en `/cursos` chocan con la paleta corporativa azul/amarillo y entre sí. Usar gradientes derivados de la paleta o imágenes de portada reales.

### Media prioridad

5. **Placeholder cortado en buscador admin**: "Buscar capacitaciones, perso…" se trunca. Acortar el texto o ensanchar el input (`TopBar.tsx` admin).
6. **Inputs de fecha nativos** (`dd/mm/aaaa`) en constructor de cursos y perfil se ven genéricos frente al resto del diseño. Opcional: date picker estilizado (shadcn `Calendar` + `Popover`).
7. **Transición del hero móvil en login**: la onda azul superior termina abrupta en viewport angosto. Revisar breakpoint del split-screen.
8. **`transition-all` en varios sitios** (`AdminNav.tsx:28,80`, barras de progreso en dashboard/reportes/cursos). Cambiar a propiedades específicas (`transition-colors`, `transition-[width]`) — `transition-all` anima propiedades de layout sin querer.
9. **Números tabulares en KPIs**: agregar `tabular-nums` a las cifras del dashboard y reportes para que no "bailen" al actualizarse.

### Baja prioridad / pulido

10. **Estado vacío de "Actividad reciente"** en dashboard es solo texto plano; agregar icono + CTA.
11. **Botón "Desactivar sede" en rojo outline** para todas las sedes da sensación de peligro permanente; considerar menú contextual (⋯) con la acción dentro.
12. **`text-wrap: balance`** en títulos de tarjetas de curso para evitar líneas huérfanas.

### Lo que ya está bien (no tocar)

- `focus:outline-none` siempre va acompañado de `focus:ring-2` ✔
- Formularios con `autoComplete`, labels correctos ✔
- `prefers-reduced-motion` respetado en `globals.css` ✔
- `loading.tsx` (skeletons) en todas las rutas pesadas ✔
- Tabs de trabajadores reflejados en URL (`?tab=`) — deep-linkeable ✔
- Modal de bienvenida solo aparece una vez (`onboarding_completed`) ✔

---

## 7. Tips para trabajar en equipo

- **Branches**: trabajar en ramas (`testandy` es la actual), PRs hacia `main`. Vercel despliega `main` automáticamente.
- **No editar `components/ui/`** a mano — son de shadcn, se regeneran.
- **Probar como trabajador**: crear cuenta en `/registro` y aprobarse a sí mismo desde una cuenta admin (asignarse un área que tenga cursos).
- **Resetear intentos de quiz**: solo desde el detalle del trabajador en admin (los intentos nunca se borran, solo se "resetea el contador" vía `last_quiz_reset_at`).
- Las capturas de esta guía están en `docs/capturas/` — regenerarlas si la UI cambia mucho.
