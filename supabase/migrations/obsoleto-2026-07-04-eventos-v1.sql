-- OBSOLETO — NO APLICAR.
-- Este era el schema v1 de eventos (roles jefe/delegado por área, tareas
-- planas, doc bloqueante, fotos con bucket público). La DB viva fue
-- migrada por Bato con OTRO schema: secciones custom por evento con
-- miembros encargado/colaborador, tareas por sección con 3 estados,
-- eventos por sede, doc de alimentación como advertencia no bloqueante.
-- Ver docs/superpowers/plans/2026-07-04-eventos-v2-schema-bato.md para
-- el schema real y las decisiones de producto. Se conserva este archivo
-- solo como referencia histórica del diseño original.
--
-- Eventos institucionales: 18 de septiembre, Navidad, Año Nuevo
-- Pegar completo en el SQL Editor del dashboard de Supabase.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text not null check (event_type in ('dieciocho','navidad','ano_nuevo')),
  description text not null default '',
  event_date date not null,
  status text not null default 'planificacion' check (status in ('planificacion','activo','finalizado')),
  cover_image_url text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_roles (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('jefe','delegado')),
  area text not null,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
-- Un solo jefe por área por evento
create unique index event_roles_un_jefe_por_area
  on public.event_roles (event_id, area) where (role = 'jefe');

create table public.event_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  area text not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  is_done boolean not null default false,
  done_by uuid references public.profiles(id),
  done_at timestamptz,
  order_index int not null default 0,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index event_tasks_event_idx on public.event_tasks (event_id);
create index event_tasks_assigned_idx on public.event_tasks (assigned_to);

create table public.event_documents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  file_path text not null,
  doc_type text not null default 'otro' check (doc_type in ('dificultades_alimenticias','otro')),
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index event_documents_event_idx on public.event_documents (event_id);

create table public.event_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  image_url text not null,
  caption text,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index event_photos_event_idx on public.event_photos (event_id);

-- RLS: lectura para autenticados; escrituras solo vía service role (server actions)
alter table public.events enable row level security;
alter table public.event_roles enable row level security;
alter table public.event_tasks enable row level security;
alter table public.event_documents enable row level security;
alter table public.event_photos enable row level security;

create policy "eventos_select_auth" on public.events for select to authenticated using (true);
create policy "event_roles_select_auth" on public.event_roles for select to authenticated using (true);
create policy "event_tasks_select_auth" on public.event_tasks for select to authenticated using (true);
create policy "event_documents_select_auth" on public.event_documents for select to authenticated using (true);
create policy "event_photos_select_auth" on public.event_photos for select to authenticated using (true);

-- Buckets de storage
insert into storage.buckets (id, name, public) values ('event-docs', 'event-docs', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('event-photos', 'event-photos', true)
  on conflict (id) do nothing;
