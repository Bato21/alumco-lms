-- PROPUESTA: no aplicada. La corre Bato en el dashboard cuando esté de acuerdo.
-- Ver docs/HANDOFF-BATO.md (sección "SQL pendiente: galería de fotos") y
-- docs/superpowers/plans/2026-07-04-eventos-v2-schema-bato.md (Task 6).

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
