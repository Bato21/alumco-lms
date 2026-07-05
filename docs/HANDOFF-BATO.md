# Handoff para Bato — Feature Eventos (rama `testandy`)

_Actualizado: 2026-07-04 (noche)_

## TL;DR

1. **NO corras** `supabase/migrations/obsoleto-2026-07-04-eventos-v1.sql` — es la migración vieja de un schema que descartamos. Quedó de referencia histórica.
2. El código de esta rama se está adaptando a **TU schema** (el que ya migraste: `event_sections`, `event_section_members`, tareas por sección, `sede_id`, doc como advertencia). No toques nada de lo que ya aplicaste.
3. Lo ÚNICO que falta en la DB es la **galería de fotos** (pedido original del equipo). SQL propuesto abajo — revísalo, ajústalo a tu estilo de policies y córrelo tú.
4. Verifica que no quedaron tablas huérfanas del intento v1 (`event_roles`, `event_photos` viejas) si es que alguna vez las creaste — el schema actual no las usa (salvo `event_photos` nueva, punto 3).

## Estado del código en esta rama

- **v1 (obsoleta)**: implementamos la feature completa contra un schema propio (roles por área, tareas planas con `is_done`, doc bloqueante, galería). Todo revisado con build verde — pero incompatible con tu DB.
- **v2 (en curso en esta misma rama)**: adaptación al schema real. Plan detallado en `docs/superpowers/plans/2026-07-04-eventos-v2-schema-bato.md`. Orden: tipos → actions → wizard admin 4 pasos → detalle admin → dashboard card + vistas colaborador → galería.
- Si al pullear ves componentes de eventos que no compilan contra los tipos nuevos: es el refactor v2 a medio camino. El estado final tiene `npm run build` verde — revisa el último commit de la rama antes de asumir breakage.

## Decisiones de producto (confirmadas por Andy)

| Tema | Decisión |
|---|---|
| Doc dificultades alimenticias | **Advertencia persistente** (banner amarillo en detalle admin y dashboard). NO bloquea crear ni activar. Coincide con tu diseño. |
| Eventos por sede | Sí, `sede_id` como lo modelaste. RLS filtra colaboradores por su sede. |
| Galería de fotos | **Se mantiene** — era pedido explícito del equipo ("subir imágenes del evento para que las vean los que colaboraron"). Requiere el SQL de abajo. |
| Quién marca tareas | Admin + encargado de la sección (tu RLS ya lo cubre). |
| Asignados múltiples por tarea | No en V1 — las tareas cuelgan de la sección, los miembros de la sección las ven. Suficiente. |

## SQL pendiente: galería de fotos (córrelo tú cuando estés de acuerdo)

```sql
-- Galería de fotos por evento (pedido original del equipo)
create table public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  image_url text not null,
  caption text,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index event_photos_event_idx on public.event_photos (event_id);

alter table public.event_photos enable row level security;

-- Lectura: cualquier autenticado (las fotos son el "recuerdo" del evento).
-- Si prefieres restringir por sede del evento, cámbialo a tu patrón.
create policy "event_photos_select_auth" on public.event_photos
  for select to authenticated using (true);

-- Escritura: la hacemos vía service role en Server Action validando que el
-- que sube sea miembro de alguna sección del evento (admin siempre puede).
-- Si prefieres policies de INSERT/DELETE explícitas, avísanos y calzamos el código.

insert into storage.buckets (id, name, public) values ('event-photos', 'event-photos', true)
  on conflict (id) do nothing;
```

Cuando lo corras, avisa — la UI de galería queda lista en el código esperando la tabla.

## Contratos que el código asume de tu DB (si algo difiere, gritar)

- `events.sede_id` es `text` FK a `sedes.id`.
- `event_documents.file_url` guarda el **path** dentro del bucket privado `event-documents` (no una URL completa) — la descarga siempre va por signed URL de 60 s generada en Server Action.
- `event_tasks.status`: la UI usa toggle pendiente↔completada; `en_progreso` queda soportado en tipos pero sin UI (V1).
- `event_section_members.member_role`: `'encargado'` puede crear/editar/completar tareas de su sección vía RLS con cliente de usuario; `'colaborador'` solo ve.
- RLS de `profiles`: los lookups de nombres cross-user van con service role en server (tu RLS de profiles solo permite self-reads a no-admins).

## Checklist de verificación conjunta (cuando el refactor v2 cierre)

- [ ] Admin crea evento completo vía wizard → aparece en `/admin/eventos`
- [ ] Evento sin doc de alimentación → se crea igual, banner amarillo en detalle y dashboard
- [ ] Trabajador de sede X no ve eventos de sede Y (2 cuentas)
- [ ] Colaborador ve tareas de su sección pero no las marca; encargado sí (`completed_at`/`completed_by` se llenan)
- [ ] Doc descarga solo por signed URL; URL directa del bucket falla
- [ ] Card del evento primero en el dashboard con evento activo/planificación
- [ ] `npm run build` verde

## Coordinación

- Rama: `testandy` (Andy). No mergear a `main` sin la verificación conjunta de arriba.
- Ojo al merge futuro: `andydidankolanding` (rediseño) borra `AdminNav.tsx`/`TopBar.tsx`; el link "Eventos" vive en `AdminSidebar.tsx` (nav real) y `WorkerTopNav.tsx` — conservarlos en lo que sobreviva.
