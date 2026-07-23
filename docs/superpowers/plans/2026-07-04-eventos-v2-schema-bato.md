# Eventos V2 — Adaptación al schema real de la DB (Bato)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps con checkboxes.

**Goal:** Adaptar la feature de eventos (ya implementada en testandy contra un schema propio) al schema que Bato migró en la DB viva. La DB NO se toca — solo tipos, actions, componentes y páginas.

**Contexto:** Los 14 commits previos (0cc5ff0..f453b1c) implementan el modelo v1 (roles por área, tareas planas, doc bloqueante). La DB real usa: secciones custom por evento con miembros encargado/colaborador, tareas por sección con 3 estados, eventos por sede, doc de alimentación como advertencia (no bloqueante). Se reusa el máximo: DS ya mapeado, páginas como esqueleto, patrones de actions.

## Schema real en Supabase (referencia — NO tocar la DB)

- `events`: id, title, event_type ('dieciocho'|'navidad'|'ano_nuevo'), description, event_date (date), status ('planificacion'|'activo'|'finalizado'), cover_image_url, **sede_id** (FK sedes.id, text), created_by, created_at, updated_at
- `event_sections`: id, event_id (FK cascade), name (unique por evento), description, order_index
- `event_section_members`: (section_id, user_id) PK compuesta, member_role ('encargado'|'colaborador')
- `event_tasks`: id, **section_id** (FK cascade), title, description, status ('pendiente'|'en_progreso'|'completada'), due_date, order_index, completed_at, completed_by, created_by, updated_at
- `event_documents`: id, event_id (FK cascade), doc_type ('dificultades_alimenticias'|'general'), title, **file_url**, uploaded_by
- Storage: bucket privado `event-documents`, path `{event_id}/{filename}`. **NO existe bucket ni tabla de fotos** (pendiente pedido a Bato — Task 6).

## RLS ya activo (asumir, no reimplementar)

- Trabajadores solo ven eventos de SU sede; admin ve todo (SELECT filtrado por RLS → usar cliente de USUARIO en vistas colaborador y el filtrado es gratis).
- Solo admin crea/edita eventos, secciones, miembros, documentos.
- Encargado de sección crea/edita/completa tareas de SU sección (además del admin) → `toggleTaskStatus`/`upsertTask` pueden ir con cliente de usuario (RLS decide) o admin client con chequeo manual — usar cliente de usuario donde RLS cubra, patrón más simple.
- Documentos legibles solo por admin y miembros de alguna sección del evento; descarga SIEMPRE por signed URL (60 s) en Server Action.

## Decisiones de producto (confirmadas por Andy)

1. Doc de dificultades alimenticias = **advertencia persistente** (banner amarillo en detalle admin y dashboard), NO bloquea creación ni activación. Eliminar la regla bloqueante v1.
2. Galería de fotos se mantiene en el roadmap: **Task 6 deja el SQL propuesto para Bato** y adapta `GaleriaFotos` cuando exista la tabla. UI de fotos queda detrás de un check de existencia o comentada hasta confirmación.
3. Eventos por sede: el wizard pide sede (select de `sedes` activas). Vistas colaborador confían en RLS.

## Global Constraints

- NO tocar SQL/migraciones/policies/buckets. `supabase/migrations/2026-07-04-eventos.sql` queda obsoleta → moverla a `supabase/migrations/obsoleto-2026-07-04-eventos-v1.sql` con comentario de cabecera (Task 1).
- Sin framework de tests: verificación = `npm run lint && npm run build` + chequeo manual. Error pre-existente de VideoPlayer.tsx se ignora.
- Tipos en `src/lib/types/databases.ts` (reemplazar los de v1). Importar desde `@/lib/types/database`.
- DS real ya mapeado (ver `.superpowers/sdd/task-5-report.md` y `task-6-report.md`): `card card-pad`, `btn btn-primary`, `campo/input/select/textarea`, `Badge` tonos `'neutro'|'ok'|'peligro'|'aviso'|'info'`, `Vacio({icono,titulo,texto})`, `EncabezadoPagina({titulo,sub,children})`, `Icono({n,s})`, error banner con `role="alert"` (patrón RegisterForm).
- Textos español chileno. Commits `feat(eventos): …` + Co-Authored-By Claude Fable 5.
- Emojis de tipo: dieciocho 🎉, navidad 🎄, ano_nuevo 🎆.

## Tasks

### Task 1: Tipos v2 + limpieza de migración obsoleta
**Files:** Modify `src/lib/types/databases.ts` (reemplazar bloque de eventos v1); rename migración v1 a `obsoleto-…`.
Tipos nuevos: `EventRecord` (con `sede_id: string`), `EventSection { id, event_id, name, description, order_index }`, `EventSectionMember { section_id, user_id, member_role: 'encargado'|'colaborador' }`, `EventTask { id, section_id, title, description, status: 'pendiente'|'en_progreso'|'completada', due_date: string|null, order_index, completed_at, completed_by, created_by, updated_at }`, `EventDocument { id, event_id, doc_type: 'dificultades_alimenticias'|'general', title, file_url, uploaded_by, created_at? }` (verificar si created_at existe — asumir sí). Actualizar `Database.public.Tables` (5 tablas: events, event_sections, event_section_members, event_tasks, event_documents; eliminar event_roles/event_photos de types — event_photos vuelve en Task 6 como propuesta). Mantener `EVENT_TYPE_LABELS` + agregar `EVENT_TYPE_EMOJI`.
Verificar: lint + tsc — VAN A FALLAR los archivos v1 que consumen tipos viejos; es esperado mid-refactor: esta task solo compila si se hace junto con Task 2, así que Task 1+2 van en el MISMO dispatch/commit si tsc no pasa aislado. (Instrucción al implementer: intentar separado; si tsc rompe por consumidores, continuar con Task 2 en el mismo commit está permitido para actions, y los componentes/páginas rotos se listan como pendiente para Tasks 3-5 — en ese caso usar `// @ts-expect-error TODO v2` NO está permitido; en su lugar, el dispatch de Task 1 incluye Task 2 y stubs mínimos de compilación se resuelven adaptando en Tasks 3-5 en la misma sesión de commits SIN push intermedio.)
**Decisión del controlador para evitar el limbo:** Tasks 1-5 se ejecutan como UNA cadena de commits locales; el build verde se exige al final de Task 5, y lint/tsc parciales se toleran entre medio documentándolo en cada reporte.

### Task 2: Actions v2 (`src/lib/actions/events.ts` — reescritura)
Reemplazar el archivo completo. Actions (todas `'use server'`, patrón try/catch `{ success?, error? }`):
- `createEventAction(payload)` — transaccional lógico: inserta evento (admin client) → secciones → miembros → tareas iniciales → docs quedan para upload posterior. Payload serializable desde el wizard (no FormData: objeto JSON tipado `{ title, event_type, sede_id, event_date, description, sections: { name, description, members: { user_id, member_role }[], tasks: { title, description?, due_date? }[] }[] }`). Rollback manual: si falla un paso, borrar el evento creado (cascade limpia el resto). Devuelve `{ success, eventId }`.
- `updateEventAction(eventId, formData)` — título/tipo/sede/fecha/descripción/status. Sin regla de doc (advertencia es solo UI).
- `deleteEventAction(eventId)`.
- `addSectionAction(eventId, formData{name,description})`, `removeSectionAction(sectionId)`.
- `addMemberAction(sectionId, formData{user_id,member_role})`, `removeMemberAction(sectionId, userId)`.
- `upsertTaskAction(sectionId, formData{taskId?, title, description?, due_date?})` — crea o edita; permisos: admin o encargado de la sección (cliente usuario + RLS, con fallback de mensaje claro si RLS rechaza).
- `toggleTaskStatusAction(taskId, nextStatus)` — 'pendiente'→'completada' o vuelta (UI simple checkbox; 'en_progreso' queda soportado en el tipo pero la UI v2 usa toggle binario); si completada: `completed_at=now`, `completed_by=caller`; si vuelve a pendiente: null ambos. Cliente usuario (RLS: encargado de la sección o admin).
- `deleteTaskAction(taskId)`.
- `uploadEventDocumentAction(eventId, formData{file, doc_type, title?})` — admin; bucket `event-documents`, path `{eventId}/{uuid}-{nombre_sanitizado}`; valida pdf/xlsx/docx ≤10MB; guarda `file_url` = path (bucket privado: se guarda el path, la URL se firma al leer — mantener nombre de columna file_url aunque contenga el path).
- `deleteEventDocumentAction(docId)` — admin; sin regla de "último doc" (ya no es bloqueante).
- `getDocumentSignedUrlAction(docId)` — signed URL **60 s**; autorización: intentar leer el doc con cliente de USUARIO primero (RLS: solo admin/miembros lo ven) — si no lo ve, `{ error: 'No autorizado' }`; luego firmar con admin client.
- Helper interno `getCaller()` se mantiene.

### Task 3: Admin v2 — lista + wizard 4 pasos
**Files:** Modify `src/app/admin/eventos/page.tsx` (agregar columna sede + emoji + avance de tareas: join sections→tasks, "X/Y"); Rewrite `src/app/admin/eventos/nuevo/page.tsx` + nuevo `src/components/alumco/eventos/WizardEvento.tsx` (client, 4 pasos con estado local, submit único a `createEventAction`):
1. Datos: título, tipo (select con emoji), sede (select de `sedes` activas — fetch en la page server y pasar como prop), fecha, descripción.
2. Secciones: agregar/quitar dinámicamente (nombre + descripción).
3. Miembros por sección: buscador de perfiles activos (fetch server: profiles activos con sede — pasar todos como prop y filtrar client-side por la sede elegida en paso 1), asignar encargado/colaborador.
4. Documentos: ítem destacado "Lista de dificultades alimenticias" (requerido VISUALMENTE, no bloquea) + docs generales. Los archivos se suben DESPUÉS de crear el evento (createEventAction no lleva files): el wizard guarda los File en estado, crea el evento, y sube en secuencia con `uploadEventDocumentAction`; si una subida falla, evento ya existe → redirige a detalle con la advertencia visible.
Navegación entre pasos con validación mínima por paso; botón final "Crear evento".
Eliminar `CrearEventoForm.tsx` (reemplazado por wizard).

### Task 4: Admin v2 — detalle
**Files:** Rewrite `src/app/admin/eventos/[id]/page.tsx`; adaptar/reemplazar componentes: `SeccionesEditor.tsx` (nuevo: CRUD secciones + miembros por sección, reemplaza RolesEditor), `TareasEditor.tsx` (adaptar: tareas agrupadas por sección, status 3 estados mostrado como checkbox completada + due_date opcional), `DocsPanel.tsx` (adaptar: doc_type 'general', usar `getDocumentSignedUrlAction`), `PublicarButton.tsx` → `EstadoEventoButton.tsx` (cambiar estado planificacion→activo→finalizado SIN regla de doc). Banner amarillo persistente `⚠️ Falta la lista de dificultades alimenticias` si no hay doc con ese tipo (card con `--aviso`). Eliminar RolesEditor.tsx.
Borrar imports/props de GaleriaFotos (vuelve en Task 6).

### Task 5: Dashboard card + vistas colaborador v2
**Files:** Nuevo `src/components/alumco/eventos/EventoDashboardCard.tsx` (server component) que reemplaza `EventoInicioBlock.tsx` (eliminar): visible si hay evento `planificacion`/`activo` (cliente usuario — RLS filtra sede sola). Trabajador: sus secciones con tareas (checkbox habilitado solo si es encargado de esa sección — pasar member_role; colaborador ve check deshabilitado), nombres de encargados visibles. Admin: avance por sección ("Cocina 5/8"), link rápido al doc de alimentación si existe, advertencia amarilla si falta. Días restantes hasta event_date. PRIMER elemento del dashboard: ya está integrado así en `inicio/page.tsx` (cambiar import). El dashboard admin (`/admin/dashboard`) también lo muestra — verificar dónde insertarlo sin romper el layout existente.
Adaptar `src/app/(dashboard)/eventos/page.tsx` (historial: RLS filtra por sede; mostrar sede solo si admin) y `src/app/(dashboard)/eventos/[id]/page.tsx` (detalle colaborador: secciones donde participo con tareas — toggle solo encargado; docs solo si soy miembro — la query de docs con cliente usuario devuelve vacío si no soy miembro, mostrar sección solo si hay docs; sin galería por ahora). `TaskChecklist.tsx` adaptar a `toggleTaskStatusAction` + prop `canToggle`.
**Al cierre de esta task: `npm run lint && npm run build` DEBEN estar verdes** (fin de la cadena 1-5) + commit por task igual.

### Task 6: Propuesta SQL de fotos para Bato + galería condicionada
**Files:** Nuevo `supabase/propuestas/event-photos.sql` (NO se aplica — es pa mandárselo a Bato): tabla `event_photos { id, event_id FK cascade, image_url, caption, uploaded_by, created_at }`, bucket público `event-photos`, RLS: SELECT autenticados de la misma sede del evento (o simplificado: autenticados), INSERT solo miembros del evento vía policy o service role. Adaptar `GaleriaFotos.tsx` a las actions v2 (`uploadEventPhotoAction`/`deleteEventPhotoAction` reescritas en events.ts detrás del schema propuesto) pero **sin renderizarla en ninguna página todavía** — se conecta cuando Bato confirme. Si esto genera dead code que el linter reclama, dejar las actions y el componente listos pero exportados sin consumidor está OK (lint de Next no falla por eso).

### Task 7: Review final + verificación
Review de rama del refactor completo (v1→v2) + checklist de Bato:
- Admin crea evento completo vía wizard → aparece en /admin/eventos
- Evento sin doc alimentación → se crea igual, banner en detalle y dashboard admin
- Trabajador sede X no ve eventos sede Y (RLS — probar con 2 cuentas en UAT manual)
- Colaborador ve tareas de su sección, no puede marcarlas; encargado sí (completed_at/by se llenan)
- Doc solo por signed URL
- Card primero en dashboard
- `npm run build` verde
