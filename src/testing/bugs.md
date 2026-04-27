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

## Resumen — Pasada 2026-04-25 ✅ TODOS RESUELTOS (2026-04-26)

- Total bugs nuevos detectados: **21**
- **Alta severidad:** 14 — ✅ todos resueltos
- **Media severidad:** 4 — ✅ todos resueltos
- **Baja severidad:** 3 — ✅ todos resueltos

### Registro de resolución

| ID | Descripción breve | Archivo(s) | Estado |
| :---- | :---- | :---- | :---- |
| BUG-26 | `inicio/page.tsx` no incluía `target_areas` en select → filtro de área ignorado | `(dashboard)/inicio/page.tsx` | ✅ |
| BUG-27 | `cursos/page.tsx` no incluía `target_areas` en select → filtro de área ignorado | `(dashboard)/cursos/page.tsx` | ✅ |
| BUG-28 | `updateCourseAction` sin verificación de rol admin | `lib/actions/courses.ts` | ✅ |
| BUG-29 | `togglePublishCourseAction` sin verificación de autorización | `lib/actions/courses.ts` | ✅ |
| BUG-30 | `deleteCourseAction` sin verificación de autorización | `lib/actions/courses.ts` | ✅ |
| BUG-31 | `createModuleAction` sin verificación de autorización | `lib/actions/courses.ts` | ✅ |
| BUG-32 | `updateModuleAction` sin verificación de autorización | `lib/actions/courses.ts` | ✅ |
| BUG-33 | `deleteModuleAction` sin verificación de autorización | `lib/actions/courses.ts` | ✅ |
| BUG-34 | `reorderModulesAction` sin verificación de autorización | `lib/actions/courses.ts` | ✅ |
| BUG-35 | `createCourseAction` solo verificaba auth, no rol admin | `lib/actions/courses.ts` | ✅ |
| BUG-36 | `getWorkerDetailAction` sin verificación de rol admin | `lib/actions/trabajadores.ts` | ✅ |
| BUG-37 | `getAllCertificatesAction` sin verificación de rol admin | `lib/actions/certificates.ts` | ✅ |
| BUG-38 | `generateCertificatePDF` sin auth ni check de ownership | `lib/actions/certificates.ts` | ✅ |
| BUG-39 | `getAdminAlerts` sin verificación de rol admin | `lib/actions/alerts.ts` | ✅ |
| BUG-40 | `drawFirma` fetch sin timeout → podía colgar indefinidamente | `lib/actions/certificates.ts` | ✅ |
| BUG-41 | `WorkerProgress.area_trabajo` tipado como `string` en lugar de `string[]` | `admin/dashboard/page.tsx` | ✅ |
| BUG-42 | Tabs "Sede Hualpén"/"Sede Coyhaique" eran botones decorativos sin función | `admin/dashboard/page.tsx` | ✅ eliminados |
| BUG-43 | Card "Cumplimiento" mostraba approval rate de quizzes en lugar de completion rate real | `admin/dashboard/page.tsx` | ✅ recalculado por área |
| BUG-44 | Input `fecha_nacimiento` sin atributo `max` → permitía fechas futuras | `(dashboard)/perfil/ProfileClient.tsx` | ✅ |
| BUG-45 | `notStartedCount` solo contaba filas en `course_progress`, ignoraba cursos sin abrir | `(dashboard)/perfil/page.tsx` | ✅ |
| BUG-46 | `recentActivity` usaba `key={i}` (índice) → identidad inestable | `admin/dashboard/page.tsx` | ✅ key compuesta `userId-courseId-updatedAt` |

### Helper creado
- `src/lib/auth/requireAdmin.ts` — verifica autenticación y rol admin; usado por BUG-28 a BUG-39.

### Bugs heredados aún a verificar manualmente
- BUG-13 (estado "Atrasado" en dashboard): la lógica fue reescrita y ahora cruza áreas + deadlines. El comportamiento depende del requisito de negocio sobre cómo tratar trabajadores que no abrieron ningún curso pero tienen deadlines vigentes — confirmar con cliente.
- BUG-24 (verificación de `is_final_module`): la generación se dispara cuando `courseCompleted = true`, no por flag específico. Confirmar si el negocio quiere distinción.

---

# QA Report — Pasada 2026-04-26 (BUG-47+)

Fecha: 2026-04-26
Revisión: nueva pasada de QA estática (post-fixes de la pasada 2026-04-25).

## Resumen — Pasada 2026-04-26

- Total bugs nuevos detectados: **24**
- **Alta severidad:** 13
- **Media severidad:** 7
- **Baja severidad:** 4

### Índice rápido

| ID | Severidad | Archivo(s) | Descripción breve |
| :---- | :---- | :---- | :---- |
| BUG-47 | Alta | `lib/actions/auth.ts` | `registerWorkerAction` sin verificación de admin — cualquiera puede crear cuentas |
| BUG-48 | Alta | `lib/actions/admin-questions.ts` | `getQuestionsAction` sin auth y expone `correct_option` (vector de cheating) |
| BUG-49 | Alta | `lib/actions/admin-questions.ts` | `saveQuestionAction` solo valida auth, no rol admin |
| BUG-50 | Alta | `lib/actions/admin-questions.ts` | `deleteQuestionAction` solo valida auth, no rol admin |
| BUG-51 | Alta | `lib/actions/progress.ts` | `markModuleCompleteAction` no valida que el módulo pertenezca al curso |
| BUG-52 | Alta | `lib/actions/progress.ts` | `markModuleCompleteAction` no verifica acceso por área del trabajador |
| BUG-53 | Alta | `lib/actions/progress.ts` | `updateLastModuleAction` no valida módulo→curso ni acceso por área |
| BUG-54 | Alta | `lib/actions/quiz.ts` | `submitQuizAction` no verifica acceso por área del trabajador |
| BUG-55 | Alta | `lib/actions/quiz.ts` | `submitQuizAction` no valida que cada respuesta sea 'a'\|'b'\|'c'\|'d' |
| BUG-56 | Alta | `lib/utils.ts` | `filterCoursesByWorkerAreas` retorna TODOS los cursos cuando `workerAreas` vacío |
| BUG-57 | Alta | `lib/actions/registro.ts` | `rejectWorkerAction` no verifica `status='pendiente'` — puede borrar usuarios activos |
| BUG-58 | Alta | `lib/actions/registro.ts` | RUT no normalizado antes de buscar/guardar — duplicados con distinto formato |
| BUG-59 | Alta | `lib/actions/quiz.ts` | `submitQuizAction` permite enviar respuestas vacías/incompletas y consume un intento |
| BUG-60 | Media | `lib/actions/progress.ts` | `resetModuleProgressAction` acepta parámetros que ignora — API engañosa |
| BUG-61 | Media | `lib/actions/search.ts` | `searchAction` no escapa `%` y `_` en patrones `ilike` |
| BUG-62 | Media | `lib/actions/auth.ts` | `forgotPasswordAction` sin fallback de `NEXT_PUBLIC_SITE_URL` |
| BUG-63 | Media | `lib/auth/requireAdmin.ts` | `requireAdmin` rechaza `profesor` aunque el layout admin lo permite |
| BUG-64 | Media | `lib/actions/certificates.ts` | `getCertificateAction` y `existing` usan `.single()` en lugar de `.maybeSingle()` |
| BUG-65 | Media | `lib/actions/auth.ts` | LoginSchema acepta ≥6 chars, RegisterSchema exige ≥8 — inconsistencia |
| BUG-66 | Media | `lib/actions/quiz.ts` | `submitQuizAction` no usa transacción — intento queda guardado aunque falle marcar módulo |
| BUG-67 | Baja | `lib/actions/admin-questions.ts` | Sin validación Zod del payload (`saveQuestionAction`) |
| BUG-68 | Baja | `lib/actions/admin-questions.ts` | Sin validar que `correct_option ∈ {a,b,c,d}` ni que `options.length === 4` |
| BUG-69 | Baja | `(dashboard)/perfil/ProfileClient.tsx` | `<img>` en lugar de `next/image` para `avatarUrl`/`firmaUrl` |
| BUG-70 | Baja | `components/alumco/RegisterForm.tsx` | `useState` importado sin usar |

---

## Detalle de bugs

### BUG-47 — `registerWorkerAction` sin verificación de admin

- **Severidad:** Alta
- **Archivo:** `src/lib/actions/auth.ts` (líneas 127–175)
- **Descripción:** La función `registerWorkerAction` está marcada como Server Action y, por su comentario (`// Registro (usado por admin para crear trabajadores)`), está pensada para uso administrativo. Sin embargo, NO realiza ninguna verificación de autenticación ni de rol antes de invocar `supabase.auth.signUp`. Cualquier visitante anónimo puede llamar este endpoint y crear cuentas con `role: 'trabajador'` arbitrariamente, abriendo la puerta a spam masivo y bypass del flujo aprobatorio.

#### Fix paso a paso
1. Importar el helper de admin al inicio del archivo:
   ```ts
   import { requireAdmin } from '@/lib/auth/requireAdmin'
   ```
2. Al inicio de `registerWorkerAction`, antes de validar `formData`, agregar:
   ```ts
   const auth = await requireAdmin()
   if (!auth.ok) return { error: auth.error }
   ```
3. Verificar que el flujo público de registro (`/registro`) usa `registerRequestAction` y no esta función — confirmar y, si no se usa, considerar eliminar `registerWorkerAction`.

---

### BUG-48 — `getQuestionsAction` sin auth y filtra `correct_option`

- **Severidad:** Alta (vector de cheating)
- **Archivo:** `src/lib/actions/admin-questions.ts` (líneas 93–110)
- **Descripción:** `getQuestionsAction` no realiza ningún check de autenticación ni rol. Además ejecuta `select('*')` sobre la tabla `questions`, lo que retorna `correct_option` al cliente. Un trabajador (o usuario anónimo) puede invocar la Server Action y obtener todas las respuestas correctas antes de iniciar el quiz.

#### Fix paso a paso
1. Importar `requireAdmin`:
   ```ts
   import { requireAdmin } from '@/lib/auth/requireAdmin'
   ```
2. Al inicio de la función, validar:
   ```ts
   const auth = await requireAdmin()
   if (!auth.ok) return { success: false, error: auth.error }
   ```
3. Mantener `select('*')` solo si la pantalla admin necesita `correct_option`. Si no, listar columnas explícitas.

---

### BUG-49 — `saveQuestionAction` sin verificación de admin

- **Severidad:** Alta
- **Archivo:** `src/lib/actions/admin-questions.ts` (líneas 16–64)
- **Descripción:** Solo verifica que exista un usuario autenticado (`if (!user)`), pero no comprueba el rol. Cualquier trabajador autenticado puede crear o editar preguntas y respuestas correctas, alterando el contenido evaluativo.

#### Fix paso a paso
1. Sustituir el bloque:
   ```ts
   const supabase = await createClient()
   const { data: { user } } = await supabase.auth.getUser()
   if (!user) return { success: false, error: 'No autorizado' }
   ```
   por:
   ```ts
   const auth = await requireAdmin()
   if (!auth.ok) return { success: false, error: auth.error }
   ```
2. Importar `requireAdmin` y eliminar el `import` directo de `createClient` si ya no se usa.

---

### BUG-50 — `deleteQuestionAction` sin verificación de admin

- **Severidad:** Alta
- **Archivo:** `src/lib/actions/admin-questions.ts` (líneas 66–91)
- **Descripción:** Mismo patrón que BUG-49: solo valida autenticación, no rol. Permite a cualquier trabajador autenticado borrar preguntas arbitrarias.

#### Fix paso a paso
1. Reemplazar la verificación de `user` por:
   ```ts
   const auth = await requireAdmin()
   if (!auth.ok) return { success: false, error: auth.error }
   ```
2. Importar `requireAdmin` desde `@/lib/auth/requireAdmin`.

---

### BUG-51 — `markModuleCompleteAction` no valida que el módulo pertenezca al curso

- **Severidad:** Alta
- **Archivo:** `src/lib/actions/progress.ts` (líneas 11–112)
- **Descripción:** Recibe `moduleId` y `courseId` pero nunca verifica la relación entre ambos. Un trabajador podría completar un módulo de un curso al que no debe acceder simplemente combinando un `moduleId` válido con el `courseId` de otro curso.

#### Fix paso a paso
1. Tras la verificación de `user` y antes de leer/escribir `course_progress`, agregar:
   ```ts
   const { data: moduleCheck } = await supabase
     .from('modules')
     .select('id')
     .eq('id', moduleId)
     .eq('course_id', courseId)
     .maybeSingle()

   if (!moduleCheck) {
     return { success: false, error: 'Módulo no pertenece al curso indicado' }
   }
   ```

---

### BUG-52 — `markModuleCompleteAction` no verifica acceso por área

- **Severidad:** Alta
- **Archivo:** `src/lib/actions/progress.ts` (líneas 11–112)
- **Descripción:** Aunque las páginas (`modulos/[moduleId]/page.tsx`, `quiz/page.tsx`) sí filtran por área, la Server Action no lo valida. Un trabajador puede completar el progreso de un curso fuera de su área llamando directamente al endpoint con cualquier par válido `moduleId`+`courseId`.

#### Fix paso a paso
1. Importar el filtro:
   ```ts
   import { filterCoursesByWorkerAreas } from '@/lib/utils'
   ```
2. Tras la verificación del módulo→curso, agregar el chequeo de acceso (solo para trabajadores):
   ```ts
   const { data: callerProfile } = await supabase
     .from('profiles')
     .select('role, area_trabajo')
     .eq('id', user.id)
     .single()

   if (callerProfile?.role === 'trabajador') {
     const { data: course } = await supabase
       .from('courses')
       .select('target_areas, is_published')
       .eq('id', courseId)
       .eq('is_published', true)
       .maybeSingle()
     if (!course) return { success: false, error: 'Curso no disponible' }
     const hasAccess = filterCoursesByWorkerAreas(
       [{ target_areas: (course.target_areas as string[]) ?? [] }],
       (callerProfile.area_trabajo as string[]) ?? []
     ).length > 0
     if (!hasAccess) return { success: false, error: 'No autorizado' }
   }
   ```

---

### BUG-53 — `updateLastModuleAction` no valida módulo→curso ni área

- **Severidad:** Alta
- **Archivo:** `src/lib/actions/progress.ts` (líneas 117–166)
- **Descripción:** Misma vulnerabilidad que BUG-51 y BUG-52 pero en `updateLastModuleAction`. Permite registrar arbitrariamente "último módulo visto" sin importar si el módulo realmente pertenece al curso ni si el trabajador tiene acceso al curso.

#### Fix paso a paso
1. Aplicar el mismo bloque de validación módulo→curso (de BUG-51).
2. Aplicar el mismo bloque de validación de acceso por área (de BUG-52).
3. Solo entonces ejecutar el `update`/`insert` sobre `course_progress`.

---

### BUG-54 — `submitQuizAction` no verifica acceso por área

- **Severidad:** Alta
- **Archivo:** `src/lib/actions/quiz.ts` (líneas 112–322)
- **Descripción:** Valida la cadena quiz→módulo→curso (BUG-03 ya resuelto) pero NO verifica que el trabajador tenga el curso asignado a su área. Un trabajador sin acceso por área puede aprobar quizzes y, al combinar con BUG-52, completar cursos fuera de su área.

#### Fix paso a paso
1. Importar el filtro:
   ```ts
   import { filterCoursesByWorkerAreas } from '@/lib/utils'
   ```
2. Tras validar `quizCheck`, agregar:
   ```ts
   const { data: course } = await supabase
     .from('courses')
     .select('target_areas, is_published')
     .eq('id', courseId)
     .eq('is_published', true)
     .maybeSingle()

   if (!course) {
     return { success: false, score: 0, passed: false, attemptNumber: 0, attemptsRemaining: 0, error: 'Curso no disponible' }
   }

   const { data: callerProfile } = await supabase
     .from('profiles')
     .select('role, area_trabajo')
     .eq('id', user.id)
     .single()

   if (callerProfile?.role === 'trabajador') {
     const hasAccess = filterCoursesByWorkerAreas(
       [{ target_areas: (course.target_areas as string[]) ?? [] }],
       (callerProfile.area_trabajo as string[]) ?? []
     ).length > 0
     if (!hasAccess) {
       return { success: false, score: 0, passed: false, attemptNumber: 0, attemptsRemaining: 0, error: 'No autorizado' }
     }
   }
   ```

---

### BUG-55 — `submitQuizAction` no valida que las respuestas sean 'a'|'b'|'c'|'d'

- **Severidad:** Alta
- **Archivo:** `src/lib/actions/quiz.ts` (líneas 112–322)
- **Descripción:** El parámetro `answers: UserAnswers` (que es `Record<string, 'a'|'b'|'c'|'d'>`) llega del cliente como JSON sin validación. Un cliente malicioso podría enviar valores arbitrarios. Aunque el cálculo (`answers[q.id] === q.correct_option`) no abre directamente cheating, sí guarda en DB un JSON `answers` con datos contaminados que pueden romper queries de auditoría/reportes y sortear validadores que asumen el shape correcto.

#### Fix paso a paso
1. Importar Zod al inicio:
   ```ts
   import { z } from 'zod'
   ```
2. Definir un esquema fuera de la función:
   ```ts
   const AnswerOptionSchema = z.enum(['a', 'b', 'c', 'd'])
   const AnswersSchema = z.record(z.string().uuid(), AnswerOptionSchema)
   ```
3. Al inicio de `submitQuizAction`, antes de cualquier query:
   ```ts
   const parsedAnswers = AnswersSchema.safeParse(answers)
   if (!parsedAnswers.success) {
     return { success: false, score: 0, passed: false, attemptNumber: 0, attemptsRemaining: 0, error: 'Respuestas inválidas' }
   }
   const validatedAnswers = parsedAnswers.data
   ```
4. Reemplazar uso posterior de `answers` por `validatedAnswers`.

---

### BUG-56 — `filterCoursesByWorkerAreas` retorna todos los cursos cuando `workerAreas` vacío

- **Severidad:** Alta
- **Archivo:** `src/lib/utils.ts` (líneas 46–55)
- **Descripción:** Si un trabajador tiene `area_trabajo: []` (no tiene áreas asignadas, p. ej. recién aprobado o desasignado), la función actual retorna `courses` completo. Eso significa que el trabajador ve TODOS los cursos publicados, en vez de ninguno. Es contrario a la intención del filtro y permite que un trabajador sin asignación abra cursos fuera de cualquier área.

#### Fix paso a paso
1. Cambiar la primera línea del cuerpo de la función:
   ```ts
   if (!workerAreas || workerAreas.length === 0) return courses
   ```
   por:
   ```ts
   if (!workerAreas || workerAreas.length === 0) {
     return courses.filter(course => !course.target_areas || course.target_areas.length === 0)
   }
   ```
   *(Solo cursos sin restricción de área son visibles para trabajadores sin áreas asignadas).*
2. Verificar consumidores en `cursos/page.tsx`, `inicio/page.tsx`, `modulos/[moduleId]/page.tsx`, `quiz/page.tsx` — todos deberían comportarse igual o mejor con esta corrección.

---

### BUG-57 — `rejectWorkerAction` no verifica `status='pendiente'`

- **Severidad:** Alta
- **Archivo:** `src/lib/actions/registro.ts` (líneas 218–253)
- **Descripción:** Aunque verifica que el caller sea admin, no comprueba que el `profileId` objetivo esté en estado `pendiente`. Un admin podría (intencional o accidentalmente) llamar `rejectWorkerAction` con el `id` de un trabajador activo y borrarle la cuenta vía `auth.admin.deleteUser`, perdiendo todo su historial de progreso, certificados, etc.

#### Fix paso a paso
1. Modificar la query existente que busca el perfil para incluir `status`:
   ```ts
   const { data: profile, error: searchError } = await adminClient
     .from('profiles')
     .select('id, status')
     .eq('id', profileId)
     .single()
   ```
2. Antes de llamar a `deleteUser`, validar:
   ```ts
   if (profile.status !== 'pendiente') {
     return { error: 'Solo se pueden rechazar solicitudes en estado pendiente' }
   }
   ```

---

### BUG-58 — RUT no normalizado antes de comparar/guardar

- **Severidad:** Alta
- **Archivo:** `src/lib/actions/registro.ts` (líneas 38–61, 100–166)
- **Descripción:** `validarRut` normaliza el RUT internamente para validar dígito verificador, pero la cadena finalmente almacenada en `profiles.rut` y comparada en el chequeo de duplicados es la `parsed.data.rut` *sin normalizar*. Eso significa que `12.345.678-9`, `12345678-9` y `123456789` se aceptan como tres usuarios distintos aunque sean el mismo RUT. Riesgo de duplicidades reales en producción y de bypassear la validación "Ya existe una cuenta con ese RUT".

#### Fix paso a paso
1. Crear/reutilizar una función `normalizarRut` (limpia puntos, guiones y mayúsculas):
   ```ts
   function normalizarRut(rut: string): string {
     return rut.replace(/[.\-\s]/g, '').toUpperCase()
   }
   ```
2. Antes del check de duplicado y del `signUp`, normalizar:
   ```ts
   const rutNormalizado = normalizarRut(parsed.data.rut)
   ```
3. Usar `rutNormalizado` en `eq('rut', ...)` y en `options.data.rut`.
4. Considerar una migración para normalizar RUTs ya almacenados:
   ```sql
   UPDATE public.profiles SET rut = UPPER(REGEXP_REPLACE(rut, '[.\-]', '', 'g')) WHERE rut IS NOT NULL;
   ```
   *(Coordinar con el equipo antes de aplicar.)*

---

### BUG-59 — `submitQuizAction` permite enviar respuestas vacías y consume un intento

- **Severidad:** Alta (impacto UX/datos)
- **Archivo:** `src/lib/actions/quiz.ts` (líneas 112–322)
- **Descripción:** El cliente bloquea el botón "Enviar" hasta tener todas las respuestas, pero el servidor no valida que `answers` cubra todas las preguntas. Un cliente que omita la validación puede enviar `{}` o respuestas parciales, obtener score=0%, y aún así descontar un intento contra `max_attempts`. Resultado: trabajadores podrían "perder" intentos por bugs de red o dobles clicks.

#### Fix paso a paso
1. Tras obtener las `questions` desde la base de datos y validar el shape (BUG-55), comparar la cobertura:
   ```ts
   const expectedIds = new Set(questions.map(q => q.id))
   const providedIds = new Set(Object.keys(validatedAnswers))
   const allCovered = questions.every(q => providedIds.has(q.id))
   if (!allCovered) {
     return {
       success: false,
       score: 0,
       passed: false,
       attemptNumber: attemptsUsed,
       attemptsRemaining: quiz.max_attempts - attemptsUsed,
       error: 'Debes responder todas las preguntas',
     }
   }
   ```
2. Esta validación debe ir ANTES del `insert` en `quiz_attempts` para no consumir intento.

---

### BUG-60 — `resetModuleProgressAction` acepta parámetros que ignora

- **Severidad:** Media
- **Archivo:** `src/lib/actions/progress.ts` (líneas 288–326)
- **Descripción:** La firma `(moduleId, courseId, previousModuleId?)` sugiere un reset granular por módulo, pero el cuerpo siempre setea `completed_modules: []` y `last_module_id: null`. Tanto `moduleId` como `previousModuleId` quedan como dead-code y confunden a futuros mantenedores. `QuizClient.tsx` (línea 121) los pasa creyendo que reinicia solo el módulo actual.

#### Fix paso a paso
1. Renombrar la función a algo como `resetCourseProgressAction` y eliminar los parámetros no usados:
   ```ts
   export async function resetCourseProgressAction(
     courseId: string
   ): Promise<{ success: boolean; error?: string }> { ... }
   ```
2. Buscar consumidores y actualizar la llamada:
   - `src/app/(dashboard)/cursos/[id]/modulos/[moduleId]/quiz/QuizClient.tsx`:
     ```ts
     await resetCourseProgressAction(courseId)
     ```
   - Quitar el import obsoleto de `previousModuleId` si solo se usaba aquí.
3. Si por compatibilidad se decide conservar la firma vieja, agregar un comentario explicando que es un wrapper de reset completo.

---

### BUG-61 — `searchAction` no escapa wildcards en `ilike`

- **Severidad:** Media
- **Archivo:** `src/lib/actions/search.ts` (líneas 28–54)
- **Descripción:** Construye patrones `%${q}%` directamente con la query del usuario. Si el usuario busca `"100%"` o `"_test"`, los `%` y `_` se interpretan como wildcards Postgres, retornando resultados incorrectos. Es un bug funcional, no de seguridad, pero embarra los resultados de búsqueda y puede revelar cursos no relevantes.

#### Fix paso a paso
1. Agregar al inicio del archivo (o en `lib/utils.ts`):
   ```ts
   function escapeIlike(s: string): string {
     return s.replace(/[\\%_]/g, c => `\\${c}`)
   }
   ```
2. Reemplazar:
   ```ts
   .ilike('title', `%${q}%`)
   ```
   por:
   ```ts
   .ilike('title', `%${escapeIlike(q)}%`)
   ```
3. Aplicar lo mismo al `ilike('full_name', ...)` para workers.

---

### BUG-62 — `forgotPasswordAction` sin fallback de `NEXT_PUBLIC_SITE_URL`

- **Severidad:** Media
- **Archivo:** `src/lib/actions/auth.ts` (líneas 177–198)
- **Descripción:** Construye `redirectTo: \`${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password\``. Si la variable de entorno no está configurada (build local, preview Vercel sin la env var), el correo enviado contendrá `undefined/auth/reset-password`, llevando a un 404 al usuario que intenta recuperar su contraseña.

#### Fix paso a paso
1. Calcular la URL con fallback:
   ```ts
   const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alumco-lms.vercel.app'
   const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
     redirectTo: `${siteUrl}/auth/reset-password`,
   })
   ```
2. Mejor aún: validar al boot con `zod` que la env var esté presente en producción y emitir error claro si no.
3. Confirmar que existe la página `/auth/reset-password` (no la encontré en el árbol — si no existe, también es bug).

---

### BUG-63 — `requireAdmin` rechaza `profesor` aunque el layout admin lo permite

- **Severidad:** Media
- **Archivo:** `src/lib/auth/requireAdmin.ts` y `src/app/admin/layout.tsx`
- **Descripción:** `admin/layout.tsx` (línea 33) permite el acceso a usuarios con `role === 'admin'` o `role === 'profesor'`. Sin embargo, `requireAdmin` rechaza explícitamente cualquier rol que no sea `admin`. El resultado: un profesor entra a `/admin/cursos`, ve la UI completa, pero todo botón (crear curso, publicar, eliminar, editar módulos, generar reportes, etc.) falla con "No autorizado". Causa una experiencia rota y oculta lo que en realidad es un rol sin permisos efectivos.

#### Fix paso a paso
- **Opción A — Permitir profesor:** ampliar `requireAdmin`:
  ```ts
  if (profile?.role !== 'admin' && profile?.role !== 'profesor') {
    return { ok: false, error: 'No autorizado' }
  }
  ```
  Renombrar a `requireStaff` o `requireAdminOrProfesor` para que el nombre refleje la intención.
- **Opción B — Restringir el layout:** en `src/app/admin/layout.tsx` línea 33, dejar solo:
  ```ts
  if (!profile || profile.role !== 'admin') redirect('/inicio')
  ```
  Si profesor no debe operar nada, no debe ver el layout admin.
- Decidir con cliente qué permisos efectivos tiene `profesor` y aplicar la opción coherente.

---

### BUG-64 — `getCertificateAction` y `existing` usan `.single()` cuando puede no existir fila

- **Severidad:** Media
- **Archivo:** `src/lib/actions/certificates.ts` (líneas 44–53 y 79–98)
- **Descripción:** Ambas queries esperan exactamente una fila. Cuando el certificado aún no existe, `.single()` lanza error PGRST116 ("Results contain 0 rows"). En el primer caso (`generateCertificateAction`) eso vuelve `{ data: null }` por destructuring laxo, así que probablemente no rompa, pero deja `existing` como `null` y luego intenta insertar — bien. En `getCertificateAction` el catch implícito devuelve `null`, pero con un error PGRST en logs por cada certificado inexistente. Ruido innecesario y patrón frágil.

#### Fix paso a paso
1. En `generateCertificateAction` línea 49, cambiar:
   ```ts
   .single()
   ```
   por:
   ```ts
   .maybeSingle()
   ```
2. En `getCertificateAction` línea 95, cambiar:
   ```ts
   .single()
   ```
   por:
   ```ts
   .maybeSingle()
   ```
3. Aprovechar y revisar el resto del módulo (`generateCertificatePDF` líneas 117, 133, 144) — algunas también podrían beneficiarse de `maybeSingle()` cuando los datos son opcionales.

---

### BUG-65 — Inconsistencia entre LoginSchema (≥6) y RegisterSchema (≥8)

- **Severidad:** Media
- **Archivo:** `src/lib/actions/auth.ts` (líneas 11–18 vs 20–27) y `src/lib/actions/registro.ts` (líneas 49–51)
- **Descripción:** El registro pide mínimo 8 caracteres pero el login acepta 6. Esa diferencia es inocua *hoy* (todas las cuentas creadas tienen ≥8), pero si alguna cuenta histórica se creó con 6 caracteres, o si se cambia la política, el cliente debería aplicar la regla más estricta de manera uniforme. Genera dudas a usuarios con error tipo "ya tenía un password de 6 chars".

#### Fix paso a paso
1. Cambiar `LoginSchema.password` a:
   ```ts
   password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
   ```
2. Si hay riesgo real de cuentas con <8 chars, primero auditar y, si las hay, forzar reset. Si no, aplicar el cambio sin más.

---

### BUG-66 — `submitQuizAction` no es transaccional

- **Severidad:** Media
- **Archivo:** `src/lib/actions/quiz.ts` (líneas 253–298)
- **Descripción:** El intento se inserta en `quiz_attempts` y, si aprobó, después se llama a `markModuleCompleteAction` y `generateCertificateAction`. Si una de las dos últimas falla (ej: error transitorio de DB o RLS), el intento queda guardado como aprobado pero el módulo NO queda completo y/o el certificado NO se emite. La próxima vez el trabajador encontrará "ya aprobaste este quiz" pero no podrá avanzar.

#### Fix paso a paso
- **Opción A — RPC transaccional:** crear una función Postgres que reciba el intento y haga insert + update de progreso + insert de certificado en una transacción.
- **Opción B — Compensación en cliente:** si `markModuleCompleteAction` falla tras un intento aprobado, intentar nuevamente al cargar la página de quiz (`QuizClient.tsx` ya hace algo parecido en `handleContinue`, líneas 99–104). Asegurarse que ese fallback también cubre la generación de certificado.
- **Opción C — Logs + alerta:** mantener el código actual pero agregar logging estructurado (`console.error` con contexto: userId, courseId, quizId, attemptId) cuando alguno de los pasos secundarios falle.
- Recomendación: A si es posible (la lógica de negocio amerita atomicidad), si no B.

---

### BUG-67 — `admin-questions.ts` sin validación Zod del payload

- **Severidad:** Baja
- **Archivo:** `src/lib/actions/admin-questions.ts` (líneas 16–64)
- **Descripción:** `saveQuestionAction` recibe `data: QuestionInput` pero no valida la forma. Un cliente bugueado o malicioso (admin) podría enviar `options: null`, `correct_option: 'z'`, `quiz_id: 'no-uuid'`, etc., y la insert llegará a la DB con datos malformados.

#### Fix paso a paso
1. Definir esquema con Zod al inicio del archivo:
   ```ts
   const QuestionInputSchema = z.object({
     id: z.string().uuid().optional(),
     quiz_id: z.string().uuid(),
     question_text: z.string().min(2),
     order_index: z.number().int().nonnegative(),
     options: z.array(z.object({
       id: z.enum(['a', 'b', 'c', 'd']),
       text: z.string().min(1),
     })).length(4),
     correct_option: z.enum(['a', 'b', 'c', 'd']),
   })
   ```
2. Validar al inicio de `saveQuestionAction`:
   ```ts
   const parsed = QuestionInputSchema.safeParse(data)
   if (!parsed.success) {
     return { success: false, error: parsed.error.issues[0].message }
   }
   ```
3. Usar `parsed.data` en el resto del cuerpo.

---

### BUG-68 — Sin validación que `correct_option ∈ {a,b,c,d}` ni `options.length === 4`

- **Severidad:** Baja (subconjunto de BUG-67 pero con foco)
- **Archivo:** `src/lib/actions/admin-questions.ts` (líneas 7–14, 16–64)
- **Descripción:** El tipo `QuestionInput.correct_option: string` y `options: { id: string; text: string }[]` no restringen valores ni cantidad. Si BUG-67 no se aplica con el esquema completo, agregar al menos estos chequeos manuales evita preguntas con 3 o 5 opciones, o `correct_option` apuntando a opciones inexistentes.

#### Fix paso a paso
1. Si se aplica BUG-67, este queda cubierto.
2. Si se prefiere validación manual, antes del payload:
   ```ts
   const allowed = ['a', 'b', 'c', 'd'] as const
   if (data.options.length !== 4) return { success: false, error: 'Debe haber exactamente 4 opciones' }
   if (!allowed.includes(data.correct_option as 'a'|'b'|'c'|'d')) {
     return { success: false, error: 'correct_option inválida' }
   }
   const ids = data.options.map(o => o.id)
   if (new Set(ids).size !== 4 || !allowed.every(a => ids.includes(a))) {
     return { success: false, error: 'Las opciones deben tener ids a, b, c, d únicos' }
   }
   ```

---

### BUG-69 — `<img>` en lugar de `next/image` para `avatarUrl` y `firmaUrl`

- **Severidad:** Baja (performance/LCP, ESLint)
- **Archivo:** `src/app/(dashboard)/perfil/ProfileClient.tsx` (líneas 164–168, 308–312)
- **Descripción:** Usa `<img>` HTML simple, lo que dispara la regla `@next/next/no-img-element` y degrada Web Vitals (sin lazy loading nativo de Next, sin sizing, sin optimización CDN). En desktop-first es menos crítico, pero el linter falla y la imagen del avatar puede pesar varios MB.

#### Fix paso a paso
1. Importar `Image`:
   ```ts
   import Image from 'next/image'
   ```
2. Reemplazar:
   ```tsx
   <img src={avatarUrl} alt={fullName} className="h-24 w-24 rounded-full object-cover" />
   ```
   por:
   ```tsx
   <Image src={avatarUrl} alt={fullName} width={96} height={96} className="rounded-full object-cover" />
   ```
3. Hacer lo mismo con la firma (line 308).
4. Asegurarse de configurar `next.config.ts` con los `domains` o `remotePatterns` adecuados (Supabase Storage public URL).

---

### BUG-70 — `useState` importado sin usar en `RegisterForm.tsx`

- **Severidad:** Baja (lint/ruido)
- **Archivo:** `src/components/alumco/RegisterForm.tsx` (línea 3)
- **Descripción:** Importa `useState` desde React pero no lo usa en ningún punto del componente. Genera warning de ESLint (`@typescript-eslint/no-unused-vars`) y aumenta el bundle innecesariamente (mínimo, pero ruido en CI).

#### Fix paso a paso
1. Cambiar:
   ```ts
   import { useActionState, useState } from 'react'
   ```
   por:
   ```ts
   import { useActionState } from 'react'
   ```

---

## Notas adicionales / observaciones (no son bugs en sí pero conviene revisar)

- **Falta de página `/auth/reset-password`:** `forgotPasswordAction` (BUG-62) redirige al usuario allí, pero no encontré la ruta en el árbol. Si no existe, todos los enlaces de "olvidé mi clave" terminan en 404 al hacer clic en el correo de Supabase.
- **`getQuestionsAction` + cliente admin:** una vez fixeado BUG-48, asegurarse de que la pantalla de edición de quiz (admin) sí espera `correct_option`. Si no, dividir en dos endpoints: uno público sin `correct_option`, otro admin con.
- **`resetModuleProgressAction` y `last_quiz_reset_at`:** el delta de 1 segundo (`Date.now() - 1000`) para que los intentos pasados queden fuera del filtro `gt('completed_at', resetAt)` es frágil — basta con un reloj fuera de sync para que intentos previos cuenten. Considerar usar el `completed_at` máximo previo + epsilon o un comparador `gt` con la fecha exacta del reset.
- **`admin/layout.tsx` y `requireAdmin`:** si se decide en BUG-63 que profesor sí debe operar, los nombres `requireAdmin` y la cobertura de mensajes de error deben actualizarse para no confundir.
