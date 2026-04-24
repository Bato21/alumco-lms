# QA Report — Alumco LMS
Fecha: 2026-04-24
Revisión: código fuente estático (sin ejecución)

---

## BUG-01 — Acceso al módulo no verifica área del trabajador
**Severidad:** Alta
**Rol afectado:** trabajador
**Flujo:** Visualización de módulo individual
**Archivo(s):** `src/app/(dashboard)/cursos/[id]/modulos/[moduleId]/page.tsx`
**Descripción:** La página de curso (`/cursos/[id]/page.tsx`) valida correctamente que el trabajador tenga acceso al curso según su área. Sin embargo, la página de módulo (`/cursos/[id]/modulos/[moduleId]/page.tsx`) no realiza ninguna verificación de área — solo verifica que el curso esté publicado (línea 57: `.eq('is_published', true)`). Un trabajador puede acceder directamente a la URL de un módulo de un curso que no le corresponde, saltando el control de acceso por área.
**Pasos para reproducir:**
1. Iniciar sesión como trabajador del área de Enfermería
2. Copiar la URL directa de un módulo de un curso asignado a Administración
3. Pegar y navegar a esa URL
**Comportamiento esperado:** El trabajador recibe un mensaje de acceso denegado o es redirigido.
**Comportamiento actual:** El trabajador puede ver el contenido del módulo completo sin restricción.
**Fix sugerido:** Agregar la misma validación de `filterCoursesByWorkerAreas` que existe en `/cursos/[id]/page.tsx` dentro de la página de módulo, después de obtener el perfil del usuario.

---

## BUG-02 — Acceso a quiz de módulo no verifica área del trabajador
**Severidad:** Alta
**Rol afectado:** trabajador
**Flujo:** Quiz de módulo
**Archivo(s):** `src/app/(dashboard)/cursos/[id]/modulos/[moduleId]/quiz/page.tsx`
**Descripción:** La página de quiz tampoco verifica el área del trabajador ni el acceso al curso. Líneas 40–86: el servidor obtiene el quiz y las preguntas sin verificar que el usuario autenticado tenga acceso a ese curso. Adicionalmente, `submitQuizAction` en `src/lib/actions/quiz.ts` tampoco verifica el acceso por área antes de procesar el quiz.
**Pasos para reproducir:**
1. Iniciar sesión como trabajador sin acceso a un curso específico
2. Navegar directamente a `/cursos/{courseId}/modulos/{moduleId}/quiz`
**Comportamiento esperado:** El acceso es denegado.
**Comportamiento actual:** El trabajador puede ver y responder el quiz, y el servidor acepta la submisión.
**Fix sugerido:** En `QuizPage` (server component), verificar el perfil del usuario y aplicar `filterCoursesByWorkerAreas` antes de devolver los datos del quiz. También verificar en `submitQuizAction` que el módulo pertenece a un curso accesible para el usuario.

---

## BUG-03 — `submitQuizAction` no verifica que el módulo pertenezca al curso indicado
**Severidad:** Alta
**Rol afectado:** trabajador
**Flujo:** Submisión de quiz
**Archivo(s):** `src/lib/actions/quiz.ts` (líneas 112–299)
**Descripción:** `submitQuizAction` recibe `quizId`, `moduleId` y `courseId` del cliente, pero no verifica que el quiz pertenezca realmente al módulo ni que el módulo pertenezca al curso. Un usuario malicioso podría enviar un `quizId` de un curso diferente al `courseId` indicado para marcar progreso en cursos arbitrarios.
**Pasos para reproducir:**
1. Interceptar la llamada con herramientas de desarrollo
2. Enviar una submisión con `courseId` de un curso diferente al `quizId` real
**Comportamiento esperado:** La acción valida la relación quiz→módulo→curso en el servidor.
**Comportamiento actual:** Se registra el intento y se puede marcar progreso en un curso incorrecto.
**Fix sugerido:** Agregar una query que verifique `quizzes.module_id = moduleId` y que el módulo tenga `course_id = courseId` antes de procesar la submisión.

---

## BUG-04 — `updateLastModuleAction` usa `createAdminClient` para escribir progreso del usuario
**Severidad:** Alta
**Rol afectado:** trabajador
**Flujo:** Actualización de último módulo visto
**Archivo(s):** `src/lib/actions/progress.ts` (líneas 106–158)
**Descripción:** `updateLastModuleAction` usa `createAdminClient()` (service role) para insertar o actualizar `course_progress`. Según CLAUDE.md (decisiones críticas de RLS): "course_progress: usar `createClient()` para escrituras (NO adminClient)". Usar el service role bypassa las políticas RLS, pero más importante: el adminClient no tiene `auth.uid()` del usuario, lo que puede causar inconsistencias de datos o incluso que se permita actualizar registros de otros usuarios si existiera alguna condición de matching por `user_id`.
**Pasos para reproducir:** La función es invocada internamente cuando un trabajador navega entre módulos.
**Comportamiento esperado:** Usar `createClient()` del usuario para escrituras de progreso propio.
**Comportamiento actual:** Se usa `createAdminClient()` para actualizaciones que deberían ser del usuario.
**Fix sugerido:** Reemplazar `const adminClient = await createAdminClient()` con `const supabase = await createClient()` (ya disponible en el scope) para las operaciones de lectura y escritura de `course_progress`. La función `createClient()` ya se instancia en la línea 112.

---

## BUG-05 — `approveWorkerAction` no verifica que el usuario sea admin
**Severidad:** Alta
**Rol afectado:** todos
**Flujo:** Aprobación de solicitudes de registro
**Archivo(s):** `src/lib/actions/registro.ts` (líneas 158–198)
**Descripción:** `approveWorkerAction` verifica que el usuario esté autenticado (`if (!user) return { error: 'No autenticado' }`) pero no verifica que tenga rol `admin`. Un usuario con rol `trabajador` o `profesor` que obtenga acceso al endpoint (p.ej., mediante llamada directa a la Server Action) podría aprobar solicitudes y asignar cualquier rol, incluyendo `admin`.
**Pasos para reproducir:**
1. Como trabajador, construir una llamada directa a `approveWorkerAction` con `role: 'admin'`
**Comportamiento esperado:** Solo administradores pueden aprobar solicitudes.
**Comportamiento actual:** Cualquier usuario autenticado puede aprobar solicitudes (la RLS del adminClient no filtra por rol del solicitante).
**Fix sugerido:** Agregar verificación de rol después de la línea 174:
```typescript
const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
if (callerProfile?.role !== 'admin') return { error: 'No autorizado' }
```

---

## BUG-06 — `suspendWorkerAction` y `reactivateWorkerAction` no verifican autorización
**Severidad:** Alta
**Rol afectado:** todos
**Flujo:** Suspensión/reactivación de trabajadores
**Archivo(s):** `src/lib/actions/trabajadores.ts` (líneas 55–91)
**Descripción:** Tanto `suspendWorkerAction` como `reactivateWorkerAction` reciben solo un `profileId` y directamente usan `createAdminClient()` para actualizar el estado sin verificar que el caller sea un admin. Cualquier usuario autenticado podría invocar estas Server Actions para suspender o reactivar cualquier cuenta.
**Pasos para reproducir:** Invocar directamente la Server Action desde el cliente con un `profileId` arbitrario.
**Comportamiento esperado:** Solo admins pueden suspender/reactivar cuentas.
**Comportamiento actual:** No hay verificación de rol; cualquier usuario autenticado puede ejecutar la acción.
**Fix sugerido:** Agregar al inicio de ambas funciones:
```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { error: 'No autenticado' }
const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
if (profile?.role !== 'admin') return { error: 'No autorizado' }
```

---

## BUG-07 — `updateWorkerAction` no verifica autorización del caller
**Severidad:** Alta
**Rol afectado:** todos
**Flujo:** Edición de datos de trabajador (admin)
**Archivo(s):** `src/lib/actions/trabajadores.ts` (líneas 22–53)
**Descripción:** `updateWorkerAction` recibe un `profileId` externo y actualiza directamente el perfil usando `createAdminClient()` sin ninguna verificación de autenticación ni de rol del caller. Misma vulnerabilidad que BUG-05 y BUG-06.
**Comportamiento esperado:** Solo admins pueden modificar perfiles de otros usuarios.
**Comportamiento actual:** Cualquier llamada con un `profileId` válido puede modificar el perfil de cualquier trabajador.
**Fix sugerido:** Verificar autenticación y rol `admin` al inicio de la función.

---

## BUG-08 — Middleware redirige usuarios logueados a `/cursos` pero el layout del dashboard redirige a `/admin/dashboard` los admins
**Severidad:** Media
**Rol afectado:** admin, profesor
**Flujo:** Login / navegación inicial
**Archivo(s):** `src/lib/supabase/middleware.ts` (línea 44), `src/app/(dashboard)/layout.tsx` (línea 32)
**Descripción:** Cuando un admin o profesor ya autenticado visita `/login` o `/registro`, el middleware los redirige a `/cursos` (línea 44: `return NextResponse.redirect(new URL('/cursos', request.url))`). El layout del dashboard redirige admins de `/cursos` a `/admin/dashboard` (línea 32), pero esto implica una redirección doble innecesaria. Más grave: si el dashboard layout falla en obtener el perfil, devuelve un mensaje de "Cargando perfil..." en lugar de redirigir, exponiendo el layout de trabajador a un admin.
**Comportamiento esperado:** El middleware debería redirigir directamente a `/admin/dashboard` para admins/profesores.
**Comportamiento actual:** Redirección doble: `/login` → `/cursos` → `/admin/dashboard`.
**Fix sugerido:** En el middleware, consultar el rol del usuario y redirigir al destino correcto según rol, o simplemente redirigir a `/inicio` y dejar que cada layout maneje la redirección final.

---

## BUG-09 — `registerRequestAction` no verifica si ya existe un perfil con ese RUT
**Severidad:** Media
**Rol afectado:** trabajador
**Flujo:** Registro de nuevo usuario
**Archivo(s):** `src/lib/actions/registro.ts` (líneas 102–153)
**Descripción:** El registro valida el formato del RUT mediante `validarRut()` pero no verifica si ya existe un perfil con el mismo RUT en la base de datos. Esto podría permitir que un trabajador cree múltiples cuentas con el mismo RUT usando diferentes correos electrónicos. La constraint UNIQUE del RUT, si existe en la DB, sería la única protección.
**Comportamiento esperado:** Mostrar error "Ya existe una cuenta con ese RUT" antes de intentar crear el usuario en Auth.
**Comportamiento actual:** El sistema intenta crear el usuario en Auth y solo falla si el correo está duplicado.
**Fix sugerido:** Antes de `supabase.auth.signUp`, consultar `profiles` por RUT con `createAdminClient()` y retornar error si ya existe.

---

## BUG-10 — `getQuizAttemptsHistoryAction` no filtra por `last_quiz_reset_at`
**Severidad:** Media
**Rol afectado:** trabajador
**Flujo:** Historial de intentos de quiz
**Archivo(s):** `src/lib/actions/quiz.ts` (líneas 309–323)
**Descripción:** `getQuizStatusAction` filtra correctamente los intentos por `last_quiz_reset_at` (líneas 71–74). Sin embargo, `getQuizAttemptsHistoryAction` obtiene TODOS los intentos del quiz sin aplicar ningún filtro por fecha de reset. Esto hace que el historial mostrado en UI incluya intentos "antes del reset", pudiendo confundir al trabajador al mostrar intentos que el sistema ya no considera válidos.
**Pasos para reproducir:**
1. Agotar los intentos de un quiz
2. El admin resetea el progreso
3. El trabajador intenta de nuevo y ve el historial
**Comportamiento esperado:** El historial solo muestra intentos válidos (posteriores al último reset).
**Comportamiento actual:** El historial muestra todos los intentos históricos incluyendo los anteriores al reset.
**Fix sugerido:** En `getQuizAttemptsHistoryAction`, obtener `last_quiz_reset_at` desde `course_progress` y filtrar: `.gt('completed_at', resetAt)` como se hace en `getQuizStatusAction`.

---

## BUG-11 — `handleContinue` en QuizClient usa `setTimeout` de 300ms como sustituto de espera real
**Severidad:** Media
**Rol afectado:** trabajador
**Flujo:** Continuar después de aprobar quiz
**Archivo(s):** `src/app/(dashboard)/cursos/[id]/modulos/[moduleId]/quiz/QuizClient.tsx` (líneas 93–116)
**Descripción:** Después de aprobar, `handleContinue` llama `markModuleCompleteAction` y luego hace un `await new Promise(resolve => setTimeout(resolve, 300))` (línea 107) esperando que `revalidatePath` haya tenido efecto. Este `setTimeout` es un antipatrón frágil: en conexiones lentas el caché puede no haberse invalidado; en conexiones rápidas es demora innecesaria. Si `markModuleCompleteAction` falla silenciosamente, el módulo no se marca como completado y el timeout no lo detecta.
**Comportamiento esperado:** La navegación ocurre solo después de confirmar que el módulo fue marcado como completado.
**Comportamiento actual:** La navegación ocurre después de 300ms independientemente del resultado de `markModuleCompleteAction`.
**Fix sugerido:** Verificar el resultado de `markModuleCompleteAction` antes de navegar y mostrar error si falla, sin depender de un timeout.

---

## BUG-12 — Estadística "cursos completados esta semana" es en realidad total histórico
**Severidad:** Media
**Rol afectado:** admin
**Flujo:** Dashboard administrador
**Archivo(s):** `src/app/admin/dashboard/page.tsx` (líneas 47–51)
**Descripción:** El texto del hero banner dice "X cursos completados **esta semana**" (línea 239), pero la variable `coursesCompleted` se obtiene filtrando `progressData` solo por `is_completed: true` (líneas 50–51) sin ningún filtro de fecha. `progressData` viene de una query sin filtro de fecha (líneas 47–49). El valor mostrado es el total histórico de cursos completados, no de la semana actual.
**Comportamiento esperado:** Mostrar cursos completados en los últimos 7 días.
**Comportamiento actual:** Muestra el total histórico de completados, etiquetado incorrectamente como "esta semana".
**Fix sugerido:** Agregar `.gte('completed_at', startOfWeek.toISOString())` al query de `progressData` o filtrar por `completed_at` en el cálculo, para que coincida con el texto del UI.

---

## BUG-13 — Estado "Atrasado" en dashboard admin asignado incorrectamente
**Severidad:** Media
**Rol afectado:** admin
**Flujo:** Tabla de progreso por trabajador en dashboard admin
**Archivo(s):** `src/app/admin/dashboard/page.tsx` (líneas 86–94)
**Descripción:** Un trabajador es marcado como "Atrasado" si `workerProgressList.length === 0` (ningún registro de progreso), pero "Al día" (`al_dia`) si tiene todos sus cursos completados O si no tiene ningún curso en progreso. La lógica no considera los deadlines de los cursos. Un trabajador que no ha iniciado ningún curso pero que tiene deadlines activos se marca como "Atrasado", que es correcto, pero un trabajador que tiene solo cursos completados (aunque tenga cursos nuevos sin iniciar) aparece como "Al día".
**Comportamiento esperado:** El estado debería reflejar si el trabajador tiene cursos con deadline próximo o vencido sin completar.
**Comportamiento actual:** Lógica simplificada que produce falsos positivos para el estado "Al día".
**Fix sugerido:** A verificar manualmente según requisito de negocio, pero al menos la lógica debería revisar si hay cursos en progreso con deadline vencido.

---

## BUG-14 — Filtro de área en reportes solo funciona con área primaria (no con arrays)
**Severidad:** Media
**Rol afectado:** admin
**Flujo:** Reportes de cumplimiento
**Archivo(s):** `src/app/admin/reportes/ReportesClient.tsx` (línea 63), `src/app/admin/reportes/page.tsx` (línea 39)
**Descripción:** En la vista `reporte_avance`, `area_trabajo` se obtiene como `area_trabajo[1]` (primer elemento del array, según CLAUDE.md: "usa area_trabajo[1] como valor representativo"). El filtro en `ReportesClient` compara `w.area_trabajo !== area` (línea 63), lo cual es una comparación de string simple. Si un trabajador tiene múltiples áreas, solo se muestra la primera en el reporte y el filtro no puede encontrarlo por sus áreas secundarias.
**Comportamiento esperado:** Un trabajador con áreas ["Enfermería", "Kinesiología"] aparece al filtrar por cualquiera de las dos áreas.
**Comportamiento actual:** Solo aparece al filtrar por su área primaria (primera del array).
**Fix sugerido:** A verificar si la vista SQL de `reporte_avance` puede ser modificada para exponer el array completo. En el cliente, usar `.includes()` en lugar de `!==` si el campo fuera un array.

---

## BUG-15 — CSV export no escapa comas ni comillas en los campos
**Severidad:** Media
**Rol afectado:** admin
**Flujo:** Exportar reporte CSV
**Archivo(s):** `src/app/admin/reportes/ReportesClient.tsx` (líneas 82–102)
**Descripción:** La función `handleExport` genera CSV concatenando valores con `.join(',')` sin escapar los valores que puedan contener comas o comillas. Nombres de trabajadores como "Martínez, Juan" o títulos de cursos con comas romperán el formato CSV. El separador de cursos pendientes usa ` | ` (línea 92) pero el delimitador de campos es `,` sin quoting.
**Comportamiento esperado:** Los campos con comas se envuelven en comillas, las comillas internas se escapan como `""`.
**Comportamiento actual:** Los campos no se escapan, corrompiendo el CSV si hay comas en los datos.
**Fix sugerido:** Reemplazar `.join(',')` por una función que envuelva cada campo en comillas dobles y escape las comillas internas: `` `"${String(v).replace(/"/g, '""')}"` ``.

---

## BUG-16 — `generateCertificatePDF` hace fetch de logo externo sin timeout ni fallback robusto
**Severidad:** Media
**Rol afectado:** admin, trabajador
**Flujo:** Descarga de certificado PDF
**Archivo(s):** `src/lib/actions/certificates.ts` (líneas 163–181)
**Descripción:** La generación del PDF hace `fetch('https://ongalumco.cl/...')` sin timeout configurado. Si el servidor externo está lento o caído, la generación del PDF cuelga indefinidamente. El bloque `catch` en la línea 176 devuelve texto "ALUMCO" como fallback, pero en un entorno serverless (Vercel) una petición sin timeout puede exceder el límite de ejecución de la función y fallar con un error genérico.
**Comportamiento esperado:** El fetch tiene un timeout razonable (ej. 5s) y falla gracefully.
**Comportamiento actual:** Sin timeout, puede colgar la función serverless.
**Fix sugerido:** Usar `AbortController` con timeout: `const controller = new AbortController(); setTimeout(() => controller.abort(), 5000); fetch(url, { signal: controller.signal })`.

---

## BUG-17 — `rejectWorkerAction` no verifica que el caller sea admin
**Severidad:** Alta
**Rol afectado:** todos
**Flujo:** Rechazo de solicitud de registro
**Archivo(s):** `src/lib/actions/registro.ts` (líneas 202–231)
**Descripción:** `rejectWorkerAction` llama directamente a `adminClient.auth.admin.deleteUser(profileId)` sin verificar que el usuario caller sea un admin. Cualquier usuario autenticado podría invocar esta Server Action para eliminar permanentemente cuentas de otros usuarios (incluyendo sus propias cuentas o las de admins).
**Comportamiento esperado:** Solo administradores pueden rechazar solicitudes y eliminar cuentas.
**Comportamiento actual:** No hay verificación de autenticación ni de rol del caller.
**Fix sugerido:** Agregar al inicio de la función la verificación de usuario autenticado y rol `admin`, similar a BUG-05.

---

## BUG-18 — Página de módulo muestra "Completar curso" aunque el módulo no sea el último
**Severidad:** Baja
**Rol afectado:** trabajador
**Flujo:** Navegación entre módulos
**Archivo(s):** `src/app/(dashboard)/cursos/[id]/modulos/[moduleId]/page.tsx` (líneas 244–256)
**Descripción:** Cuando no hay `nextModule`, el botón de navegación dice "Completar curso" y redirige al curso. Sin embargo, la ausencia de `nextModule` no significa necesariamente que el módulo actual sea el último del curso: podría haber módulos anteriores no completados. El texto "Completar curso" es engañoso si el curso aún no está completo.
**Comportamiento esperado:** El botón muestra "Completar curso" solo si es el último módulo Y todos los anteriores están completados.
**Comportamiento actual:** El botón siempre dice "Completar curso" cuando no hay módulo siguiente.
**Fix sugerido:** Verificar `isCourseCompleted` o que todos los módulos estén completos antes de mostrar ese texto; de lo contrario mostrar "Volver al curso".

---

## BUG-19 — `sedeName` en inicio/page.tsx usa "Sede Principal" y "Sede 2" en lugar de nombres reales
**Severidad:** Baja
**Rol afectado:** trabajador
**Flujo:** Dashboard del trabajador
**Archivo(s):** `src/app/(dashboard)/inicio/page.tsx` (línea 92)
**Descripción:** En el dashboard del trabajador, `sedeName` devuelve `'Sede Principal'` para `sede_1` y `'Sede 2'` para `sede_2` (línea 92). Según el branding del proyecto, los nombres correctos son "Sede Hualpén" y "Sede Coyhaique" (definidos en CLAUDE.md). La función `sedeLabel` en `src/lib/utils.ts` devuelve "Sede Secundaria" para sede_2, también incorrecto. El único lugar donde aparecen los nombres correctos es en componentes admin.
**Comportamiento esperado:** Consistencia en el nombre de las sedes en toda la aplicación: "Sede Hualpén" y "Sede Coyhaique".
**Comportamiento actual:** Nombres inconsistentes entre vistas: "Sede Principal/Sede 2" en el dashboard del trabajador, "Sede Principal/Sede Secundaria" en utils.ts.
**Fix sugerido:** Centralizar en `sedeLabel` en `utils.ts` con los valores correctos y usar esa función en todas las vistas.

---

## BUG-20 — `WorkersTable` usa `any[]` para el tipo de workers activos
**Severidad:** Baja
**Rol afectado:** admin
**Flujo:** Listado de trabajadores activos
**Archivo(s):** `src/app/admin/trabajadores/page.tsx` (línea 31)
**Descripción:** `const activos = (activosRaw as any[]) || []` en la línea 31 usa casting explícito a `any[]`, violando la regla de TypeScript estricto del proyecto (CLAUDE.md: "Sin any. Tipado fuerte"). Esto deshabilita las verificaciones de tipo en todo el uso posterior de `activos`, incluyendo cuando se pasa a `WorkersTable`. Si cambia la estructura de `profiles`, el compilador no detectará incompatibilidades.
**Comportamiento esperado:** Tipo inferido correctamente desde la query de Supabase.
**Comportamiento actual:** `any[]` desactiva el chequeo de tipos.
**Fix sugerido:** Definir un tipo explícito o usar el tipo generado por Supabase para el resultado de la query de profiles.

---

## BUG-21 — Botones "Editar" y "Ver curso" en admin/cursos redirigen al mismo lugar
**Severidad:** Baja
**Rol afectado:** admin, profesor
**Flujo:** Gestión de cursos
**Archivo(s):** `src/app/admin/cursos/page.tsx` (líneas 189–200)
**Descripción:** En la tarjeta de cada curso, hay dos botones: "Editar" y "Ver curso". Ambos apuntan a `/admin/cursos/${course.id}/editar` (líneas 192 y 197). El botón "Ver curso" debería llevar a una vista de previsualización del curso (posiblemente `/cursos/${course.id}` o similar), no al editor.
**Comportamiento esperado:** "Editar" → editor del curso; "Ver curso" → vista del curso como la ve el trabajador.
**Comportamiento actual:** Ambos botones llevan al mismo editor.
**Fix sugerido:** Cambiar el `href` del botón "Ver curso" a la ruta correcta de previsualización.

---

## BUG-22 — Página perfil del trabajador llama a `user!.id` sin verificar null
**Severidad:** Baja
**Rol afectado:** trabajador, admin, profesor
**Flujo:** Perfil de usuario
**Archivo(s):** `src/app/(dashboard)/perfil/page.tsx` (líneas 9, 120, 122)
**Descripción:** La página de perfil usa `user!.id` (non-null assertion) en la línea 15 después de `const { data: { user } } = await supabase.auth.getUser()` sin verificar si `user` es null. Si la sesión ha expirado entre la verificación del layout y la renderización de la página, `user` podría ser null y el operador `!` lanzaría un error en runtime.
**Comportamiento esperado:** Redirigir a `/login` si `user` es null.
**Comportamiento actual:** Error de runtime si `user` es null.
**Fix sugerido:** Agregar `if (!user) redirect('/login')` antes de usar `user.id`, como se hace en otras páginas del proyecto.

---

## BUG-23 — `getAdminAlerts` calcula pendientes como `totalWorkers - completed` sin filtrar por área
**Severidad:** Media
**Rol afectado:** admin
**Flujo:** Alertas de deadlines
**Archivo(s):** `src/lib/actions/alerts.ts` (líneas 62–86)
**Descripción:** Las alertas de admin calculan `pendingWorkers = totalWorkers - completed` donde `totalWorkers` es el total de todos los trabajadores activos. Sin embargo, un curso puede tener `target_areas` que lo hace visible solo para un subconjunto de trabajadores. Esto hace que el conteo de "pendientes" esté inflado: incluye trabajadores que nunca deberían tomar ese curso.
**Comportamiento esperado:** `pendingWorkers` solo cuenta trabajadores a quienes corresponde ese curso según `target_areas`.
**Comportamiento actual:** Todos los trabajadores activos cuentan como "pendientes" para cualquier curso, incluso los de área específica.
**Fix sugerido:** Filtrar `workers` por `target_areas` del curso antes de calcular `pendingWorkers`, similar a la lógica de `filterCoursesByWorkerAreas`.

---

## BUG-24 — `generateCertificateAction` no verifica que el módulo sea `is_final_module`
**Severidad:** Media
**Rol afectado:** trabajador
**Flujo:** Generación de certificado
**Archivo(s):** `src/lib/actions/quiz.ts` (líneas 261–274), `src/lib/actions/certificates.ts` (líneas 19–71)
**Descripción:** Según CLAUDE.md: "Se genera [certificado] al aprobar el quiz del módulo `is_final_module = true`". Sin embargo, `submitQuizAction` llama `generateCertificateAction` cuando `courseCompleted = true`, pero esto se determina en `markModuleCompleteAction` que verifica si todos los módulos están completos — no si el módulo actual es el final. Si un curso tiene un solo módulo de tipo `quiz`, `courseCompleted` será true al aprobarlo aunque no sea `is_final_module`. No hay verificación de `is_final_module` en ninguna de las dos funciones de la cadena.
**Comportamiento esperado:** El certificado solo se genera si el módulo aprobado tiene `is_final_module = true`.
**Comportamiento actual:** El certificado se genera cuando todos los módulos están completos, independientemente del flag `is_final_module`.
**Fix sugerido:** A verificar manualmente si este comportamiento es intencional o si debe existir la verificación de `is_final_module`. Técnicamente es un bug si el negocio requiere que sea el módulo final específico.

---

## BUG-25 — `proxy.ts` no está referenciado como middleware de Next.js
**Severidad:** Alta
**Rol afectado:** todos
**Flujo:** Seguridad / autenticación general
**Archivo(s):** `src/proxy.ts`
**Descripción:** El archivo de proxy está en `src/proxy.ts`. Next.js espera el middleware en `src/middleware.ts` (o en la raíz del proyecto para rutas específicas). Según CLAUDE.md "src/proxy.ts (NO src/middleware.ts — Next.js 16)", pero Next.js 16 sigue usando `middleware.ts` como archivo de entrada para el middleware. Si `proxy.ts` no es importado desde algún archivo `middleware.ts`, el middleware de autenticación (que verifica sesiones y redirige usuarios no autenticados) **no se ejecuta nunca**, dejando todas las rutas sin protección en el servidor.
**Pasos para reproducir:** Verificar si existe `src/middleware.ts` o `middleware.ts` en la raíz.
**Comportamiento esperado:** El middleware se ejecuta en cada request protegiendo las rutas.
**Comportamiento actual (a verificar):** Si no existe ningún `middleware.ts` que importe `proxy.ts`, el middleware no se ejecuta.
**Fix sugerido:** Verificar que existe un archivo `middleware.ts` que re-exporte desde `proxy.ts`. Si no existe, crearlo.

---

## Observaciones adicionales

**Archivo perfil/page.tsx**: Existe y está implementado (contrariamente a lo que sugería CLAUDE.md que lo marcaba como pendiente).

**Archivo admin/certificados/CertificadosClient.tsx**: Existe pero no fue listado en los archivos a revisar — se deduce su existencia por la importación en `page.tsx`.

**`revalidatePath` en `generateCertificateAction`**: Línea 70 llama `revalidatePath('/cursos/${courseId}/certificado')` pero esa ruta no existe en el sistema; la ruta correcta es `/certificado/${certificateId}`.

---

## Resumen
- Total bugs encontrados: 25
- Alta severidad: 8 (BUG-01, BUG-02, BUG-03, BUG-05, BUG-06, BUG-07, BUG-17, BUG-25)
- Media severidad: 12 (BUG-04, BUG-08, BUG-09, BUG-10, BUG-11, BUG-12, BUG-13, BUG-14, BUG-15, BUG-16, BUG-23, BUG-24)
- Baja severidad: 5 (BUG-18, BUG-19, BUG-20, BUG-21, BUG-22)
- A verificar manualmente: 3 (BUG-13, BUG-24, BUG-25)
