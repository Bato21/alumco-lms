# Handoff — Módulo de Eventos Institucionales (KimünKo)

> Documento de contexto para Claude Code. Guardar idealmente como `docs/HANDOFF_MODULO_EVENTOS.md` en el repo.
> Última actualización: 2026-07-05. Proyecto Supabase: **alumco-lms** (project ref en `.env` local; no se documenta acá).

## 1. Qué es esta feature y por qué existe

KimünKo es el LMS de ONG Alumco (residencias de adultos mayores / ELEAMs en Chile). El cliente pidió un
módulo para organizar los **eventos institucionales recurrentes**: 18 de septiembre, Navidad y Año Nuevo.

Requerimientos del cliente (en sus palabras):
1. Crear eventos con descripción y to-do lists con gente asociada y gente a cargo.
2. Al crear un evento, las to-do lists aparecen **al inicio del dashboard**.
3. Se sube "sí o sí" la **lista de dificultades alimenticias** de los residentes, para tener ese detalle a mano.
4. Los eventos son **por sede**, para separar bien trabajadores y residentes.
5. Adición posterior del equipo: **galería de fotos** del evento.

## 2. Decisiones de diseño y su razón (importante para no deshacerlas)

| Decisión | Razón |
|---|---|
| Modelo **evento → secciones → miembros/tareas** (no roles por área) | El cliente organiza por secciones libres ("cocina", "bebestibles", "decoración") con **varios encargados** por sección. Un primer modelo (`event_roles`, un jefe por área usando el enum `area_trabajo_tipo`) no calzaba y fue **eliminado** — no reintroducir. |
| Tareas pertenecen a la **sección**, sin asignados individuales | Las tareas son referencia compartida para todo el equipo de la sección. Solo los **encargados** las marcan completadas. |
| El documento de dificultades alimenticias **NO bloquea** la creación del evento | Decisión explícita del cliente. El "sí o sí" se implementa en UI: paso destacado en el wizard + **banner amarillo persistente** en detalle del evento y dashboard admin mientras falte. No hay trigger de bloqueo en BD. |
| Separación por sede a nivel de **RLS**, no solo frontend | `events.sede_id` (FK a `sedes`) + política `sede_id = user_sede()`. Un trabajador de la sede A no puede ver eventos, tareas, documentos ni fotos de la sede B ni siquiera consultando PostgREST directo. |
| Buckets de Storage **PRIVADOS** (`event-documents` y `event-photos`) | La lista de dificultades alimenticias contiene **datos de salud de residentes** y las fotos muestran **personas identificables en contexto de cuidado** — datos sensibles bajo **Ley 21.719**. Todo acceso vía **signed URLs** generadas en Server Actions (≈1 h de expiración). **Nunca** construir URLs públicas del bucket ni cambiar los buckets a públicos. Una galería pública hacia afuera requeriría consentimientos firmados de residentes/familias — fuera de alcance. |
| Funciones RLS `security definer` con `search_path` fijo | `is_admin()`, `user_sede()`, `is_event_member(uuid)`, `is_section_encargado(uuid)`. Evitan recursión de RLS en subconsultas. EXECUTE revocado a `anon`/`public`, concedido solo a `authenticated`. |

## 3. Esquema en producción (ya migrado — NO tocar SQL sin consultar a Bato)

Migraciones aplicadas, en orden:
1. `create_events_and_event_roles` *(parcialmente reemplazada: `event_roles` ya no existe)*
2. `events_sections_tasks_documents_rls` — modelo definitivo + RLS completo
3. `event_documents_storage_bucket` — bucket privado de documentos
4. `harden_event_helper_functions` — revoke EXECUTE a anon
5. `event_photos_gallery_private` — galería + bucket privado de fotos

Tablas:
- **events**: id, title, event_type (`dieciocho`|`navidad`|`ano_nuevo`), description, event_date, status (`planificacion`|`activo`|`finalizado`), cover_image_url, **sede_id** (FK `sedes.id`, text), created_by, created_at, updated_at
- **event_sections**: id, event_id (FK cascade), name (unique por evento), description, order_index
- **event_section_members**: PK (section_id, user_id), member_role (`encargado`|`colaborador`)
- **event_tasks**: id, section_id (FK cascade), title, description, status (`pendiente`|`en_progreso`|`completada`), due_date, order_index, completed_at, completed_by, created_by, updated_at
- **event_documents**: id, event_id (FK cascade), doc_type (`dificultades_alimenticias`|`general`), title, file_url (path relativo en bucket), uploaded_by
- **event_photos**: id, event_id (FK cascade), image_url (path relativo en bucket), caption, uploaded_by, created_at

Storage: buckets privados `event-documents` y `event-photos`, path `{event_id}/{archivo}`.

Resumen RLS (quién puede qué):
- `events`/`event_sections`/`event_section_members`: lectura por sede o admin; escritura solo admin.
- `event_tasks`: lectura por sede o admin; INSERT/UPDATE/DELETE por admin **o encargado de esa sección**.
- `event_documents`: lectura solo admin + miembros de alguna sección del evento; escritura solo admin.
- `event_photos`: lectura por sede o admin; INSERT admin o miembro del evento con `uploaded_by = auth.uid()`; DELETE de fila por admin o autor; DELETE de **objetos** en Storage solo admin (ver §5, punto delete).

Triggers: `set_updated_at` en `events` y `event_tasks`.

## 4. Estado del frontend (run en progreso al momento del handoff)

Plan de 5 tasks:
1. ✅/⏳ Tipos + Server Actions contra el schema real
2. ⏳ `/admin/eventos`: lista (título, emoji por tipo 🎉/🎄/🎆, sede, fecha, estado, avance) + wizard de 4 pasos (datos+sede → secciones → miembros por sección → documentos con dificultades alimenticias destacada pero opcional)
3. ⏳ `/admin/eventos/[id]`: gestión completa + banner amarillo si falta el documento
4. ⏳ Dashboard card **como primer elemento** cuando hay evento `planificacion`/`activo` visible: trabajador ve tareas de sus secciones (checkbox solo habilitado para encargados) y quiénes son los encargados; admin ve avance por sección + acceso al documento + advertencia si falta + días restantes
5. ⏳ Galería: `EventoGaleria.tsx`, upload con validación (jpg/png/webp, máx ~5MB), `getEventPhotos` con `createSignedUrls` en lote, tab en detalle y vista de trabajadores

Verificar qué quedó realmente terminado con `git log` / estado del repo antes de continuar.

## 5. Detalles de implementación que evitan bugs conocidos

- **Signed URLs siempre desde Server Actions**; el path guardado en BD es relativo al bucket.
- **deleteEventPhoto para autores no-admin**: la política de Storage solo deja borrar objetos al admin. Flujo correcto: la action lee la fila con el **cliente del usuario** (RLS confirma propiedad) → recién entonces borra el objeto con **service role**. Nunca exponer service role a decisiones del cliente.
- El evento se crea aunque no haya documento de dificultades alimenticias — no agregar validaciones bloqueantes.
- Reutilizar el guard/layout admin y los helpers de perfil/rol existentes; no reimplementar auth.
- `sedes` se consulta para el select del wizard (solo sedes activas).

## 6. Pendientes (handoff)

- [ ] Completar tasks 2–5 del plan según estado real del repo.
- [ ] Correr el **checklist de verificación** completo con dos cuentas (admin + trabajador de otra sede):
  - Admin crea evento completo vía wizard → aparece en `/admin/eventos`
  - Evento sin documento → se crea igual, banner visible en detalle y dashboard admin
  - Trabajador de sede X no ve eventos/tareas/fotos de sede Y
  - Colaborador ve tareas pero no puede marcarlas; encargado sí (se llenan completed_at/by)
  - Documentos y fotos solo vía signed URL; URL directa del bucket falla
  - Autor borra su propia foto; otro colaborador no puede
  - Card del evento aparece PRIMERO en el dashboard
  - `npm run build` sin errores de tipos
- [ ] **Bato**: enviar pantallazo/resumen a la clienta registrando la galería como adición al alcance del trimestre.
- [ ] Hallazgos pre-existentes del advisor de Supabase — **CONFIDENCIAL, no publicar fuera del repo privado**: hay varias observaciones de seguridad y configuración pendientes que se levantan aparte de este módulo. Detalle completo en el advisor de Supabase (`get_advisors` type=security).
- [ ] Definir qué pasa con eventos `finalizado` en el dashboard (hoy: simplemente dejan de aparecer; ¿histórico/galería accesible después?). Pregunta abierta para el cliente.

## 7. Verificación 2026-07-05 (Bato + Claude, rama `deploytestvercel`)

**TL;DR: NO hay nada por hacer en la Base de Datos.** Las 6 migraciones ya están aplicadas y todos los contratos coinciden con lo que el código de Andy asume en `origin/deploytestvercel`. La rama viene lista para deploy una vez resuelta la divergencia local y verificado el uso de signed URLs en el frontend.

### 7.1 Estado real de la DB (verificado via Supabase MCP)

Migraciones aplicadas (en orden):
- `20260705020238_create_events_and_event_roles` *(la parte de `event_roles` fue reemplazada)*
- `20260705021546_events_sections_tasks_documents_rls`
- `20260705021601_event_documents_storage_bucket`
- `20260705021631_harden_event_helper_functions`
- `20260705022751_event_photos_gallery_private`

Tablas presentes con RLS habilitado: `events`, `event_sections`, `event_section_members`, `event_tasks`, `event_documents`, `event_photos`.

Buckets de Storage: `event-documents` (public=false) y `event-photos` (public=false).

Funciones helper confirmadas: `is_admin()`, `user_sede()`, `is_event_member(uuid)`, `is_section_encargado(uuid)`.

### 7.2 Contratos verificados contra el schema real

| Tabla | Campo | Real | Coincide con handoff |
|---|---|---|---|
| `events` | `sede_id` | `text` FK `sedes.id` | ✅ |
| `events` | `event_type` | CHECK: `dieciocho`\|`navidad`\|`ano_nuevo` | ✅ |
| `events` | `status` | CHECK: `planificacion`\|`activo`\|`finalizado`, default `planificacion` | ✅ |
| `event_sections` | `event_id` | FK cascade | ✅ |
| `event_section_members` | PK | (section_id, user_id) | ✅ |
| `event_section_members` | `member_role` | CHECK: `encargado`\|`colaborador`, default `colaborador` | ✅ |
| `event_tasks` | `status` | CHECK: `pendiente`\|`en_progreso`\|`completada` | ✅ |
| `event_documents` | `doc_type` | CHECK: `dificultades_alimenticias`\|`general` | ✅ |
| `event_documents` | `file_url` | `text` (path relativo al bucket) | ✅ |
| `event_photos` | `image_url` | `text` (path relativo al bucket) | ✅ |

### 7.3 Divergencias entre la propuesta original de Andy y la migración real

Estas diferencias las resolvió Bato durante la migración. El código de la rama `origin/deploytestvercel` debe respetarlas — si algún lugar del frontend asume la propuesta original, hay que corregirlo (no la DB).

| Tema | Propuesta Andy (obsoleta) | Migración real (canónica) |
|---|---|---|
| Bucket `event-photos` | Público, URL directa | **Privado, signed URL obligatoria** (Ley 21.719) |
| RLS SELECT `event_photos` | `to authenticated using (true)` | Filtrado **por sede** vía `user_sede()` |
| DELETE de objetos en Storage `event-photos` | Sin discutir | Solo admin puede borrar objetos; para autor no-admin: leer fila con user client (RLS confirma autor), luego borrar objeto con service role |
| Migración v1 (`obsoleto-2026-07-04-eventos-v1.sql`) | Correr | **NO CORRER** — queda en el repo como referencia histórica |

### 7.4 Qué falta ahora (código y proceso, no BD)

- [x] Divergencia de rama resuelta — `deploytestvercel` alineado con `origin/deploytestvercel` (HEAD `3a80bb0`).
- [x] Nav links de eventos verificados — `AdminSidebar.tsx:31` (`/admin/eventos`) y `WorkerTopNav.tsx:26,33` (`/eventos`).
- [x] Sin tablas huérfanas de v1 en la BD (`event_roles`, `event_photos_old`, `event_photos_v1` no existen).
- [ ] Confirmar en `src/lib/actions/events.ts` y `src/components/alumco/eventos/GaleriaFotos.tsx` que las fotos se sirven vía `createSignedUrl` / `createSignedUrls`, no `getPublicUrl`.
- [ ] Confirmar que `deleteEventPhoto` para autor no-admin lee con user client y borra objeto con service role (§5).
- [ ] Limpiar archivos huérfanos del intento v1 en el repo cuando sea seguro:
  - `supabase/migrations/obsoleto-2026-07-04-eventos-v1.sql`
  - `supabase/propuestas/event-photos.sql`
- [ ] Correr el checklist de §6 con dos cuentas antes de mergear a `main`.

### 7.5 Deploy — cómo llega esto a una URL visible

Workflows detectados en `.github/workflows/`:

| Rama | Workflow | Dispara |
|---|---|---|
| `main` | `auto-deploy.yml` | Webhook a Vercel → **producción** |
| `andydidankolanding` | `alias-preview-clienta.yml` | Vercel preview + alias fijo `alumcotest.vercel.app` |
| `deploytestvercel` | — (ninguno custom) | Preview automático de Vercel (URL con hash del deploy) |

Push a `deploytestvercel` sirve para verificación en un preview de rama, pero **no** llega a producción ni al alias de la clienta hasta que se mergee.
