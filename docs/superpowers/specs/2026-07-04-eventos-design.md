# Eventos institucionales — Diseño

**Fecha:** 2026-07-04
**Rama:** testandy
**Estado:** aprobado en conversación, pendiente revisión de spec

## Resumen

Sección de eventos anuales de la residencia (18 de septiembre, Navidad, Año Nuevo) con:

- Creación de eventos por admin con descripción y fecha.
- To-do list por evento con responsables: un **jefe por área** y sus **delegados**.
- Las tareas del colaborador aparecen al tope del inicio del dashboard apenas se crea el evento.
- Documento de **dificultades alimenticias obligatorio**: el evento no se publica sin él.
- Galería de fotos por evento ("foro"): los participantes suben y ven fotos.

Aplica a ambas vistas: admin (`/admin/eventos`) y colaborador (`(dashboard)/eventos`).

## Decisiones tomadas

1. **Fotos**: cualquier colaborador con rol o tarea en el evento puede subir fotos.
2. **Tareas**: admin arma la base al crear el evento; cada jefe de área puede crear y asignar tareas de su área a sus delegados.
3. **Doc de dificultades alimenticias**: bloqueante — sin el documento el evento no puede pasar a estado `activo`.

## Modelo de datos (Supabase)

### `events`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid pk | |
| title | text | ej. "Fiestas Patrias 2026" |
| event_type | text | `'dieciocho' \| 'navidad' \| 'ano_nuevo'` |
| description | text | |
| event_date | date | |
| status | text | `'planificacion' \| 'activo' \| 'finalizado'` |
| cover_image_url | text null | opcional, portada |
| created_by | uuid fk profiles | |
| created_at / updated_at | timestamptz | |

Regla: transición `planificacion → activo` solo si existe `event_documents` con `doc_type = 'dificultades_alimenticias'`.

### `event_roles`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid pk | |
| event_id | uuid fk events | on delete cascade |
| user_id | uuid fk profiles | |
| role | text | `'jefe' \| 'delegado'` |
| area | text | valor de `AREAS_TRABAJO` |

Unicidad: `(event_id, user_id)` — una persona tiene un solo rol por evento. Un jefe por área por evento (`unique (event_id, area) where role = 'jefe'`).

### `event_tasks`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid pk | |
| event_id | uuid fk events | on delete cascade |
| title | text | |
| area | text | área responsable |
| assigned_to | uuid fk profiles null | delegado o jefe asignado |
| is_done | boolean default false | |
| done_by | uuid fk profiles null | quién la marcó |
| done_at | timestamptz null | |
| order_index | int | orden en la lista |
| created_by | uuid fk profiles | |

### `event_documents`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid pk | |
| event_id | uuid fk events | on delete cascade |
| name | text | |
| file_url | text | bucket `event-docs` |
| doc_type | text | `'dificultades_alimenticias' \| 'otro'` |
| uploaded_by | uuid fk profiles | |
| created_at | timestamptz | |

### `event_photos`

| Columna | Tipo | Notas |
|---|---|---|
| id | uuid pk | |
| event_id | uuid fk events | on delete cascade |
| image_url | text | bucket `event-photos` |
| caption | text null | |
| uploaded_by | uuid fk profiles | |
| created_at | timestamptz | |

### Storage

- Bucket `event-docs` (privado, URL firmada): documentos.
- Bucket `event-photos` (público como los banners de cursos): fotos de galería.

## Permisos

| Acción | Admin | Jefe de área | Delegado / con tarea | Trabajador sin rol |
|---|---|---|---|---|
| Crear/editar/eliminar evento | ✅ | — | — | — |
| Asignar jefes y delegados | ✅ | — | — | — |
| Crear/asignar tareas | ✅ todas | ✅ solo su área | — | — |
| Marcar tarea hecha | ✅ | ✅ su área | ✅ las suyas | — |
| Subir documentos | ✅ | — | — | — |
| Ver documentos | ✅ | ✅ | ✅ | ✅ (evento activo) |
| Subir fotos | ✅ | ✅ | ✅ | — |
| Ver galería | ✅ | ✅ | ✅ | ✅ |

Enforcement en server actions (patrón existente `requireAdmin`); RLS como segunda capa con policies equivalentes.

## Rutas y componentes

### Admin

- `/admin/eventos` — lista de eventos agrupados por año, badge de estado, progreso de tareas.
- `/admin/eventos/nuevo` — formulario por pasos en una página: datos básicos → jefes/delegados por área → to-do list inicial → documento de dificultades alimenticias. Botón "Publicar" deshabilitado sin el doc; "Guardar borrador" lo deja en `planificacion`.
- `/admin/eventos/[id]` — detalle: editar datos, gestionar roles y tareas (progreso por área), documentos, galería.

### Colaborador

- `(dashboard)/inicio` — **bloque nuevo al tope** cuando hay evento `activo` y el usuario tiene tareas: título del evento, fecha, checklist interactiva de *sus* tareas, link al detalle. Sin tareas pero con evento activo: banner informativo con link.
- `(dashboard)/eventos` — historial: cards por evento con portada, fecha y acceso a galería (el "foro").
- `(dashboard)/eventos/[id]` — detalle: descripción, mi rol, tareas (las mías marcables; jefe ve las de su área y puede crear), documento de dificultades alimenticias descargable, galería con subida de fotos si participo.

### Componentes nuevos

`src/components/alumco/eventos/`: `EventoCard`, `TaskChecklist`, `RolesPorArea`, `GaleriaFotos`, `SubirFotoButton`, `DocsList`, `EventoInicioBlock` (dashboard), formularios de creación/edición.

### Server actions

`src/lib/actions/events.ts` siguiendo el patrón de `trabajadores.ts`: zod schemas, verificación de rol, `revalidatePath`. Acciones: crear/editar/publicar/finalizar evento, gestionar roles, CRUD tareas, marcar tarea, subir doc, subir foto, eliminar foto (admin o autor).

## Manejo de errores

- Publicar sin doc de alimentación → error claro en el formulario, no excepción.
- Subida de archivos: validar tipo (docs: pdf/xlsx/docx; fotos: jpg/png/webp) y tamaño (fotos ≤ 5 MB, docs ≤ 10 MB) en la action antes del upload.
- Marcar tarea ajena sin permiso → rechazo en action con mensaje.
- Storage upload fallido → no se inserta fila en BD (upload primero, insert después).

## Testing

- Actions: validación zod, permisos por rol (jefe no crea tareas de otra área, trabajador sin rol no sube fotos), regla de publicación bloqueante.
- Manual/UAT: flujo completo admin crea → colaborador ve tareas en inicio → marca → sube foto → galería visible.

## Orden de implementación

1. Migración SQL (tablas + RLS + buckets) y types en `src/lib/types/databases.ts`.
2. `events.ts` actions.
3. Vistas admin (lista, crear, detalle).
4. Bloque de inicio + vistas colaborador.
5. Galería de fotos.

## Fuera de alcance (YAGNI)

- Comentarios/reacciones en fotos (el "foro" es galería, no hilo de discusión).
- Notificaciones push/email al asignar tareas.
- Eventos de tipo libre distintos a los 3 fijos (el enum queda extensible, la UI ofrece los 3).
- Recordatorios automáticos por fecha.
