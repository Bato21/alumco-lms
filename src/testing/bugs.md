# QA Report — Alumco LMS
Fecha: 2026-04-25
Revisión: nueva pasada de QA estática (post-fixes de la pasada anterior 2026-04-24)

> **Nota:** Los bugs BUG-01 a BUG-25 de la pasada anterior fueron resueltos (ver registro
> en `CLAUDE.md` → sección "Resueltos"). Esta pasada arranca la numeración en BUG-26 y
> documenta los hallazgos nuevos detectados al revisar el código actualizado.
>
> **Formato:** cada bug incluye una sección **Fix paso a paso** con instrucciones explícitas,
> código listo para aplicar y rutas/líneas exactas, pensada para que un modelo (Claude Sonnet)
> pueda corregirla sin necesidad de explorar el codebase.

---

## ⚙️ Helper común a varios bugs (BUG-28 a BUG-39)

Antes de aplicar BUG-28 a BUG-39, crea **una sola vez** un helper que verifique rol admin.
Esto evita repetir el mismo bloque en cada acción.

**Archivo a crear:** `src/lib/auth/requireAdmin.ts`

```ts
import { createClient } from '@/lib/supabase/server'

/**
 * Verifica que el caller esté autenticado y sea admin.
 * Devuelve `{ ok: true, userId }` si autorizado, o `{ ok: false, error }` en caso contrario.
 */
export async function requireAdmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { ok: false, error: 'No autorizado' }
  return { ok: true, userId: user.id }
}
```

> **Nota:** Si el negocio quiere que `profesor` también pueda crear/editar cursos, ajusta
> la condición a `if (profile?.role !== 'admin' && profile?.role !== 'profesor')`.
> Confirmar con el cliente antes de aplicar.

---

## BUG-26 — `/inicio` no filtra por área porque `target_areas` no se incluye en el SELECT
**Severidad:** Alta
**Rol afectado:** trabajador
**Flujo:** Dashboard del trabajador (`/inicio`)
**Archivo(s):** `src/app/(dashboard)/inicio/page.tsx`

**Descripción:** La query a `courses` (líneas 23–27) selecciona `'id, title, deadline, deadline_description, is_published'` pero **no incluye `target_areas`**. La función `filterCoursesByWorkerAreas` (`src/lib/utils.ts` línea 52) trata `!course.target_areas` como "visible para todos" y devuelve `true`, anulando el filtro.

**Fix paso a paso:**
1. Abre `src/app/(dashboard)/inicio/page.tsx`.
2. Localiza el bloque (línea ~23):
   ```ts
   const { data: courses } = await supabase
     .from('courses')
     .select('id, title, deadline, deadline_description, is_published')
     .eq('is_published', true)
     .order('order_index')
   ```
3. Reemplaza la cadena del `.select(...)` por:
   ```ts
   .select('id, title, deadline, deadline_description, is_published, target_areas')
   ```
4. **Validación:** Crear un curso con `target_areas = ['Administración']`, loguearse como trabajador de Enfermería e ir a `/inicio` → ese curso no debe aparecer en banner ni calendario.

---

## BUG-27 — `/cursos` (listado del trabajador) no filtra por área por la misma razón
**Severidad:** Alta
**Rol afectado:** trabajador
**Flujo:** Listado de cursos
**Archivo(s):** `src/app/(dashboard)/cursos/page.tsx`

**Descripción:** Mismo patrón que BUG-26. La query (líneas 62–66) selecciona `'id, title, description, thumbnail_url'` sin `target_areas`.

**Fix paso a paso:**
1. Abre `src/app/(dashboard)/cursos/page.tsx`.
2. Línea ~62, dentro del bloque:
   ```ts
   const { data: courses } = await supabase
     .from('courses')
     .select('id, title, description, thumbnail_url')
     .eq('is_published', true)
     .order('order_index')
   ```
3. Cambia el `.select(...)` por:
   ```ts
   .select('id, title, description, thumbnail_url, target_areas')
   ```
4. **Validación:** un trabajador solo ve los cursos de sus áreas (o los `target_areas = []`).

---

## BUG-28 — `updateCourseAction` no verifica que el caller sea admin
**Severidad:** Alta
**Rol afectado:** todos
**Flujo:** Edición de curso (admin)
**Archivo(s):** `src/lib/actions/courses.ts`

**Fix paso a paso:**
1. Asegúrate de haber creado `src/lib/auth/requireAdmin.ts` (ver sección **Helper común**).
2. En `src/lib/actions/courses.ts`, agrega al inicio de imports:
   ```ts
   import { requireAdmin } from '@/lib/auth/requireAdmin'
   ```
3. Localiza `updateCourseAction` (línea ~118). Justo después de la firma, antes del `const raw = ...`, inserta:
   ```ts
   const auth = await requireAdmin()
   if (!auth.ok) return { error: auth.error }
   ```
4. **Validación:** llamar la acción desde una sesión de trabajador devuelve `{ error: 'No autorizado' }` y no modifica el curso.

---

## BUG-29 — `togglePublishCourseAction` no verifica autorización
**Severidad:** Alta
**Rol afectado:** todos
**Flujo:** Publicar/despublicar curso
**Archivo(s):** `src/lib/actions/courses.ts`

**Fix paso a paso:**
1. Localiza `togglePublishCourseAction` (línea ~158).
2. Como primera línea de la función, agrega:
   ```ts
   const auth = await requireAdmin()
   if (!auth.ok) return { error: auth.error }
   ```
3. **Validación:** un trabajador no puede cambiar `is_published` vía la acción.

---

## BUG-30 — `deleteCourseAction` no verifica autorización
**Severidad:** Alta
**Rol afectado:** todos
**Flujo:** Eliminación de curso
**Archivo(s):** `src/lib/actions/courses.ts`

**Fix paso a paso:**
1. Localiza `deleteCourseAction` (línea ~179).
2. Como primera línea, agrega:
   ```ts
   const auth = await requireAdmin()
   if (!auth.ok) return { error: auth.error }
   ```
3. **Validación:** un trabajador autenticado no logra eliminar cursos.

---

## BUG-31 — `createModuleAction` no verifica autorización
**Severidad:** Alta
**Rol afectado:** todos
**Flujo:** Creación de módulo (constructor)
**Archivo(s):** `src/lib/actions/courses.ts`

**Fix paso a paso:**
1. Localiza `createModuleAction` (línea ~198).
2. Como primera línea de la función (antes de `const adminClient = await createAdminClient()`), agrega:
   ```ts
   const auth = await requireAdmin()
   if (!auth.ok) return { error: auth.error }
   ```
3. **Validación:** un POST de FormData desde sesión de trabajador devuelve "No autorizado".

---

## BUG-32 — `updateModuleAction` no verifica autorización
**Severidad:** Alta
**Archivo(s):** `src/lib/actions/courses.ts`

**Fix paso a paso:**
1. Localiza `updateModuleAction` (línea ~326).
2. Inserta como primera línea:
   ```ts
   const auth = await requireAdmin()
   if (!auth.ok) return { error: auth.error }
   ```

---

## BUG-33 — `deleteModuleAction` no verifica autorización
**Severidad:** Alta
**Archivo(s):** `src/lib/actions/courses.ts`

**Fix paso a paso:**
1. Localiza `deleteModuleAction` (línea ~351).
2. Inserta como primera línea:
   ```ts
   const auth = await requireAdmin()
   if (!auth.ok) return { error: auth.error }
   ```

---

## BUG-34 — `reorderModulesAction` no verifica autorización
**Severidad:** Alta
**Archivo(s):** `src/lib/actions/courses.ts`

**Fix paso a paso:**
1. Localiza `reorderModulesAction` (línea ~370).
2. Inserta como primera línea:
   ```ts
   const auth = await requireAdmin()
   if (!auth.ok) return { error: auth.error }
   ```

---

## BUG-35 — `createCourseAction` solo verifica autenticación, no rol
**Severidad:** Alta
**Archivo(s):** `src/lib/actions/courses.ts`

**Fix paso a paso:**
1. Localiza `createCourseAction` (línea ~62). Verás:
   ```ts
   const supabase = await createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) return { error: 'No autenticado' }
   ```
2. Reemplaza ese bloque por:
   ```ts
   const auth = await requireAdmin()
   if (!auth.ok) return { error: auth.error }
   const userId = auth.userId
   ```
3. **IMPORTANTE:** Más abajo, en el `insert` (línea ~103), cambia `created_by: user.id` por `created_by: userId`.
4. Eliminar el `const supabase` y la llamada a `auth.getUser()` ya que `requireAdmin` los hace internamente y no se vuelven a usar.

---

## BUG-36 — `getWorkerDetailAction` sin verificación: filtra datos personales y progreso
**Severidad:** Alta
**Archivo(s):** `src/lib/actions/trabajadores.ts`

**Fix paso a paso:**
1. Asegúrate de haber creado `requireAdmin` (sección Helper).
2. Importarlo si no está ya:
   ```ts
   import { requireAdmin } from '@/lib/auth/requireAdmin'
   ```
3. Localiza `getWorkerDetailAction` (línea ~111). Dentro del `try`, antes de `const adminClient = await createAdminClient()`, inserta:
   ```ts
   const auth = await requireAdmin()
   if (!auth.ok) return { error: auth.error }
   ```
4. **Validación:** un trabajador autenticado obtiene `{ error: 'No autorizado' }` al invocar la acción con cualquier `profileId`.

---

## BUG-37 — `getAllCertificatesAction` sin verificación de rol admin
**Severidad:** Alta
**Archivo(s):** `src/lib/actions/certificates.ts`

**Fix paso a paso:**
1. Importa el helper al inicio del archivo:
   ```ts
   import { requireAdmin } from '@/lib/auth/requireAdmin'
   ```
2. Localiza `getAllCertificatesAction` (línea ~349).
3. **OJO:** la firma actual devuelve un array directo. Cambia la firma para que pueda devolver un error:
   ```ts
   export async function getAllCertificatesAction(): Promise<{
     data?: { id: string; issued_at: string; pdf_url: string | null; course_id: string; user_id: string }[]
     error?: string
   }> {
     const auth = await requireAdmin()
     if (!auth.ok) return { error: auth.error }

     const adminClient = await createAdminClient()
     const { data } = await adminClient
       .from('certificates')
       .select('id, issued_at, pdf_url, course_id, user_id')
       .order('issued_at', { ascending: false })

     return { data: data ?? [] }
   }
   ```
4. **Actualiza los consumidores:** buscar con grep `getAllCertificatesAction(` y ajustar para esperar `{ data, error }`. Probable consumidor: `src/app/admin/certificados/page.tsx` o `CertificadosClient.tsx`. Reemplazar:
   ```ts
   const certs = await getAllCertificatesAction()
   ```
   por:
   ```ts
   const result = await getAllCertificatesAction()
   const certs = result.data ?? []
   ```

---

## BUG-38 — `generateCertificatePDF` permite descargar el PDF de cualquier certificado por ID
**Severidad:** Alta
**Archivo(s):** `src/lib/actions/certificates.ts`

**Descripción:** La función recibe `certificateId` y, sin verificar autenticación ni que el caller sea dueño del certificado o admin, genera el PDF con datos personales (RUT, nombre, sede, áreas).

**Fix paso a paso:**
1. Importa al inicio del archivo (si no está ya):
   ```ts
   import { createClient, createAdminClient } from '@/lib/supabase/server'
   ```
   (`createClient` ya está importado, verificar.)
2. Localiza `generateCertificatePDF` (línea ~101). Justo después del `try {` y antes de `const adminClient = await createAdminClient()`, inserta:
   ```ts
   const userClient = await createClient()
   const { data: { user } } = await userClient.auth.getUser()
   if (!user) return { error: 'No autenticado' }
   ```
3. Después de obtener `cert` (línea ~107–113), agrega antes del `if (!cert)`:
   ```ts
   if (!cert) return { error: 'Certificado no encontrado' }

   const { data: callerProfile } = await userClient
     .from('profiles')
     .select('role')
     .eq('id', user.id)
     .single()

   const isOwner = cert.user_id === user.id
   const isAdminOrProfesor = callerProfile?.role === 'admin' || callerProfile?.role === 'profesor'
   if (!isOwner && !isAdminOrProfesor) return { error: 'No autorizado' }
   ```
   (Eliminar la línea original `if (!cert) return { error: 'Certificado no encontrado' }` para evitar duplicado.)
4. **Validación:** desde una sesión de trabajador A intentar descargar el PDF de un certificado del trabajador B → devuelve `{ error: 'No autorizado' }`.

---

## BUG-39 — `getAdminAlerts` sin verificación de rol admin
**Severidad:** Alta
**Archivo(s):** `src/lib/actions/alerts.ts`

**Fix paso a paso:**
1. Importa el helper:
   ```ts
   import { requireAdmin } from '@/lib/auth/requireAdmin'
   ```
2. Localiza `getAdminAlerts` (línea ~24). Como primera línea dentro del `try`, antes de `const adminClient = await createAdminClient()`, inserta:
   ```ts
   const auth = await requireAdmin()
   if (!auth.ok) return { count: 0, alerts: [] }
   ```
   (Devolvemos shape vacío para no romper el contrato `Promise<{ count, alerts }>`.)
3. **Validación:** un trabajador que llame `getAdminAlerts` recibe `{ count: 0, alerts: [] }` en lugar de datos globales.

---

## BUG-40 — `drawFirma` (dentro de `generateCertificatePDF`) hace fetch externo sin timeout
**Severidad:** Media
**Archivo(s):** `src/lib/actions/certificates.ts`

**Fix paso a paso:**
1. Localiza la función interna `drawFirma` (línea ~285).
2. Dentro de `if (firmaUrl) { try { ... } }`, reemplaza:
   ```ts
   const res = await fetch(firmaUrl)
   ```
   por:
   ```ts
   const firmaController = new AbortController()
   const firmaTimeout = setTimeout(() => firmaController.abort(), 5000)
   const res = await fetch(firmaUrl, { signal: firmaController.signal })
   clearTimeout(firmaTimeout)
   ```
3. El `catch` existente cubre el `AbortError`, así que no requiere cambios adicionales.
4. **Validación:** simular bucket lento o URL inalcanzable → la generación termina en ~5s con la línea de firma de fallback en lugar de colgar.

---

## BUG-41 — `WorkerProgress.area_trabajo` tipado como `string` pero la DB devuelve `string[]`
**Severidad:** Media
**Archivo(s):** `src/app/admin/dashboard/page.tsx`

**Fix paso a paso:**
1. Localiza la interface `WorkerProgress` (línea ~10):
   ```ts
   interface WorkerProgress {
     id: string
     full_name: string
     sede: string
     area_trabajo: string
     ...
   }
   ```
   Cambia `area_trabajo: string` por `area_trabajo: string[]`.
2. Localiza el `return` dentro del `.map` de `workerProgress` (línea ~154):
   ```ts
   area_trabajo: worker.area_trabajo,
   ```
   Reemplázalo por:
   ```ts
   area_trabajo: (worker.area_trabajo as string[]) ?? [],
   ```
3. Localiza la celda del `<td>` que renderiza áreas (línea ~489):
   ```tsx
   <td className="px-5 lg:px-6 py-4 text-[#6B7280] hidden lg:table-cell">{worker.area_trabajo}</td>
   ```
   Reemplázala por:
   ```tsx
   <td className="px-5 lg:px-6 py-4 text-[#6B7280] hidden lg:table-cell">
     {worker.area_trabajo.length > 0 ? worker.area_trabajo.join(', ') : 'Sin asignar'}
   </td>
   ```
4. **Validación:** la columna "Área" muestra "Enfermería, Kinesiología" en lugar de "EnfermeríaKinesiología".

---

## BUG-42 — Tabs "Sede Hualpén"/"Sede Coyhaique" del dashboard admin son botones decorativos
**Severidad:** Media
**Archivo(s):** `src/app/admin/dashboard/page.tsx`

**Decisión:** dado que la implementación completa requiere refactor (filtrar todo el dashboard por sede), la solución más sencilla y honesta es **eliminar los botones** hasta que la funcionalidad se priorice. Si el cliente quiere los tabs operativos, abrir un ticket nuevo.

**Fix paso a paso (eliminación):**
1. Localiza el bloque de botones (líneas ~289–302):
   ```tsx
   <div className="flex items-center justify-between gap-4 flex-wrap">
     <div className="flex gap-1.5 items-center">
       <button className="...">Todas las sedes</button>
       <button className="...">Sede Hualpén</button>
       <button className="...">Sede Coyhaique</button>
     </div>
     <p className="text-[#6B7280] text-xs">Actualizado hace 0 minutos</p>
   </div>
   ```
2. Reemplázalo por:
   ```tsx
   <div className="flex items-center justify-end gap-4 flex-wrap">
     <p className="text-[#6B7280] text-xs">Actualizado hace 0 minutos</p>
   </div>
   ```
3. **Validación:** el dashboard ya no muestra tabs sin función.

> **Alternativa (implementación completa):** convertir la página a aceptar `searchParams.sede`, filtrar `workersData`, `activeWorkers`, `allProgress`, etc., por sede, y reemplazar `<button>` por `<Link href="?sede=...">`. Solo aplicar si el cliente lo pide explícitamente.

---

## BUG-43 — Card "Cumplimiento" del dashboard admin muestra approval rate de quizzes en lugar de completion rate de cursos
**Severidad:** Media
**Archivo(s):** `src/app/admin/dashboard/page.tsx`

**Decisión:** la métrica más útil es porcentaje de cursos completados sobre cursos asignados. Reemplazar el cálculo.

**Fix paso a paso:**
1. Localiza el bloque de cálculo de `approvalRate` (líneas ~66–74):
   ```ts
   const { data: allAttempts } = await supabase
     .from('quiz_attempts')
     .select('status')

   const totalAttempts = allAttempts?.length ?? 0
   const approvedAttempts = allAttempts?.filter(a => a.status === 'aprobado').length ?? 0
   const approvalRate = totalAttempts > 0
     ? Math.round((approvedAttempts / totalAttempts) * 100)
     : 0
   ```
2. Reemplázalo por:
   ```ts
   // Calcular cumplimiento real: cursos completados / asignaciones esperadas (worker × curso visible por área)
   const { data: coursesForCompliance } = await adminClient
     .from('courses')
     .select('id, target_areas')
     .eq('is_published', true)

   const { data: workersForCompliance } = await adminClient
     .from('profiles')
     .select('id, area_trabajo')
     .eq('role', 'trabajador')
     .eq('status', 'activo')

   const { data: completedProgress } = await adminClient
     .from('course_progress')
     .select('user_id, course_id')
     .eq('is_completed', true)

   let assignmentsTotal = 0
   let assignmentsCompleted = 0
   for (const w of workersForCompliance ?? []) {
     const wAreas = (w.area_trabajo as string[]) ?? []
     for (const c of coursesForCompliance ?? []) {
       const tAreas = (c.target_areas as string[] | null) ?? []
       const visible = tAreas.length === 0 || tAreas.some(a => wAreas.includes(a))
       if (!visible) continue
       assignmentsTotal++
       if (completedProgress?.some(p => p.user_id === w.id && p.course_id === c.id)) {
         assignmentsCompleted++
       }
     }
   }
   const approvalRate = assignmentsTotal > 0
     ? Math.round((assignmentsCompleted / assignmentsTotal) * 100)
     : 0
   ```
3. **Validación:** la card "Cumplimiento" ahora refleja avance real de la fuerza laboral, no éxito en evaluaciones.

> Si el cliente prefiere mantener la métrica de quizzes, **renombrar la card** a "Aprobación de evaluaciones" y mantener el cálculo original.

---

## BUG-44 — `fecha_nacimiento` en perfil sin atributo `max` permite fechas futuras
**Severidad:** Baja
**Archivo(s):** `src/app/(dashboard)/perfil/ProfileClient.tsx`

**Fix paso a paso:**
1. Abre `src/app/(dashboard)/perfil/ProfileClient.tsx`.
2. Busca el `<input type="date" name="fecha_nacimiento" ...>`. Es un Client Component (`'use client'`).
3. Añade el atributo `max` con la fecha de hoy. Antes del `<input>`, asegúrate de tener:
   ```tsx
   const today = new Date().toISOString().split('T')[0]
   ```
   (declararlo dentro del componente, fuera del JSX).
4. Modifica el input agregando `max={today}`. Ejemplo del resultado esperado:
   ```tsx
   <input
     type="date"
     name="fecha_nacimiento"
     defaultValue={fechaNacimiento ?? ''}
     max={today}
     className="..."
   />
   ```
5. **Validación:** el date picker no permite seleccionar fechas posteriores a hoy.

---

## BUG-45 — `notStartedCount` en perfil solo cuenta filas existentes en `course_progress`, ignora cursos disponibles sin abrir
**Severidad:** Baja
**Archivo(s):** `src/app/(dashboard)/perfil/page.tsx`

**Fix paso a paso:**
1. En el bloque `else` (no admin/profesor) — líneas ~92–111 — actualmente lee solo `course_progress` y `certificates`. Hay que sumar una query a `courses` filtrada por área.
2. Reemplaza el bloque completo (líneas 92–111) por:
   ```ts
   } else {
     const { data: progress } = await supabase
       .from('course_progress')
       .select('course_id, is_completed, completed_modules')
       .eq('user_id', user.id)

     const { data: certs } = await supabase
       .from('certificates')
       .select('id')
       .eq('user_id', user.id)

     // Cursos visibles para el trabajador según target_areas
     const { data: allCourses } = await supabase
       .from('courses')
       .select('id, target_areas')
       .eq('is_published', true)

     const workerAreas = (profile?.area_trabajo as string[]) ?? []
     const visibleCourseIds = new Set(
       (allCourses ?? [])
         .filter(c => {
           const tAreas = (c.target_areas as string[] | null) ?? []
           return tAreas.length === 0 || tAreas.some(a => workerAreas.includes(a))
         })
         .map(c => c.id as string)
     )

     completedCount = (progress ?? []).filter(p => p.is_completed).length
     inProgressCount = (progress ?? []).filter(
       p => !p.is_completed && Array.isArray(p.completed_modules) && p.completed_modules.length > 0
     ).length

     const visibleProgressIds = new Set(
       (progress ?? []).map(p => p.course_id as string).filter(id => visibleCourseIds.has(id))
     )
     notStartedCount = Math.max(0, visibleCourseIds.size - visibleProgressIds.size)

     certsCount = (certs ?? []).length
   }
   ```
3. **Validación:** un trabajador con 5 cursos asignados y 0 abiertos ve "5 sin iniciar".

---

## BUG-46 — `recentActivity` usa `key={i}` (índice como key)
**Severidad:** Baja
**Archivo(s):** `src/app/admin/dashboard/page.tsx`

**Fix paso a paso:**
1. Localiza el `.map` de `recentActivity` (línea ~393):
   ```tsx
   {recentActivity.map((item, i) => (
     <div key={i} className="flex items-start gap-3">
   ```
2. Para tener una key estable, primero hay que exponer datos identificadores. Localiza la construcción de `recentActivity` (líneas ~222–240). En el `.map` final, agrega `userId` y `courseId` al objeto retornado:
   ```ts
   return {
     userId: p.user_id as string,
     courseId: p.course_id as string,
     updatedAt: p.updated_at as string,
     name,
     action: p.is_completed ? 'completó un curso' : 'actualizó su progreso',
     time: timeAgo,
     initials: name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
   }
   ```
3. Cambia el `.map` del JSX (línea ~393) a:
   ```tsx
   {recentActivity.map((item) => (
     <div key={`${item.userId}-${item.courseId}-${item.updatedAt}`} className="flex items-start gap-3">
   ```
4. **Validación:** las filas de actividad reciente conservan identidad estable cuando llega una nueva entrada (no parpadean ni reusan estado).

---

## Resumen — Pasada 2026-04-25

- Total bugs nuevos detectados: **21**
- **Alta severidad:** 14 (BUG-26, BUG-27, BUG-28, BUG-29, BUG-30, BUG-31, BUG-32, BUG-33, BUG-34, BUG-35, BUG-36, BUG-37, BUG-38, BUG-39)
- **Media severidad:** 4 (BUG-40, BUG-41, BUG-42, BUG-43)
- **Baja severidad:** 3 (BUG-44, BUG-45, BUG-46)

### Orden recomendado para resolverlos
1. **Helper común** (`src/lib/auth/requireAdmin.ts`) — habilita BUG-28 a BUG-39 con cambios mínimos.
2. **BUG-28 → BUG-35** (todas en `courses.ts`) — son el mismo patrón aplicado en serie.
3. **BUG-36, BUG-37, BUG-39** (auth en otras Server Actions) — patrón idéntico.
4. **BUG-38** (auth en `generateCertificatePDF`) — más cuidadoso porque verifica ownership además de rol.
5. **BUG-26, BUG-27** — cambios de una línea cada uno (`select(...)`).
6. **BUG-40, BUG-44, BUG-46** — fixes locales y rápidos.
7. **BUG-41** — refactor pequeño de tipo + render.
8. **BUG-45** — añade una query y reemplaza el cálculo de `notStartedCount`.
9. **BUG-42, BUG-43** — requieren decisión de producto (eliminar vs implementar / renombrar vs recalcular). Confirmar con cliente antes.

### Patrones recurrentes
1. **Server Actions sin verificación de rol admin** (BUG-28 a BUG-39): el patrón seguro existe en `trabajadores.ts` (verificar `user` + `profiles.role === 'admin'`); falta replicarlo en `courses.ts`, `alerts.ts` y dos funciones de `certificates.ts`. Es la misma clase de bug que BUG-05/06/07/17 ya resueltos, pero en módulos distintos.
2. **`select` incompleto rompe el filtrado por área** (BUG-26, BUG-27): la utilidad `filterCoursesByWorkerAreas` falla silenciosamente cuando `target_areas` no se incluye en la query. Considerar tipar la entrada como `Required<{ target_areas: string[] }>` para forzar el campo.
3. **Confusión arrays/strings en `area_trabajo`** (BUG-41): la columna es `string[]`, varios consumidores la tipan como `string`. Conviene un type guard centralizado.

### Bugs heredados aún a verificar manualmente
- BUG-13 (estado "Atrasado" en dashboard): la lógica fue reescrita y ahora cruza áreas + deadlines (`page.tsx` líneas 99–122). El comportamiento depende del requisito de negocio sobre cómo tratar trabajadores que no abrieron ningún curso pero tienen deadlines vigentes — confirmar con cliente.
- BUG-24 (verificación de `is_final_module`): la generación se dispara cuando `courseCompleted = true`, no por flag específico. Confirmar si el negocio quiere distinción.
