-- ─────────────────────────────────────────────────────────────────────────
-- Días administrativos (solicitudes de días libres del trabajador)
-- Requisitos:
--   • Cupo por área configurable por el admin (default 5).
--   • Período de renovación configurable (anual = por año calendario, fijo = sin renovación).
--   • 1 a 5 días por solicitud, con 5 días hábiles de anticipación.
--   • No se puede solicitar con cursos vencidos.
--   • Admin aprueba/rechaza.
-- Correr en el SQL editor de Supabase (requiere rol de servicio para el seed).
-- ─────────────────────────────────────────────────────────────────────────

-- 1) Config global (singleton: una sola fila con id = TRUE) ────────────────
create table if not exists public.admin_day_config (
  id            boolean primary key default true,
  default_quota integer not null default 5,
  -- 'anual' = el cupo se cuenta por año calendario y se reinicia el 1 de enero.
  -- 'fijo'  = cupo total único, sin renovación.
  reset_period  text    not null default 'anual'
                        check (reset_period in ('anual', 'fijo')),
  updated_by    uuid    references auth.users(id) on delete set null,
  updated_at    timestamptz not null default now(),
  constraint admin_day_config_singleton check (id = true)
);

insert into public.admin_day_config (id, default_quota, reset_period)
values (true, 5, 'anual')
on conflict (id) do nothing;

-- 2) Cupo por área (override del default por área de trabajo) ──────────────
create table if not exists public.admin_day_area_quotas (
  area  text    primary key,
  quota integer not null check (quota >= 0)
);

-- Seed inicial: asistentes de enfermería con cupo ampliado (editable por el admin).
insert into public.admin_day_area_quotas (area, quota) values
  ('Auxiliar de enfermería', 12)
on conflict (area) do nothing;

-- 3) Solicitudes ──────────────────────────────────────────────────────────
create table if not exists public.admin_day_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  start_date   date not null,
  end_date     date not null,
  days_count   integer not null check (days_count between 1 and 5),
  reason       text,
  status       text not null default 'pendiente'
               check (status in ('pendiente', 'aprobada', 'rechazada', 'cancelada')),
  review_note  text,
  reviewed_by  uuid references public.profiles(id) on delete set null,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now(),
  constraint admin_day_requests_range check (end_date >= start_date)
);

create index if not exists admin_day_requests_user_idx   on public.admin_day_requests (user_id);
create index if not exists admin_day_requests_status_idx on public.admin_day_requests (status);
create index if not exists admin_day_requests_start_idx  on public.admin_day_requests (start_date);

-- 4) RLS ───────────────────────────────────────────────────────────────────
alter table public.admin_day_requests  enable row level security;
alter table public.admin_day_config     enable row level security;
alter table public.admin_day_area_quotas enable row level security;

-- Helper: ¿el caller es staff (admin/profesor)?
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'profesor')
  );
$$;

-- Solicitudes: el trabajador ve/crea/cancela las suyas; staff ve/gestiona todas.
drop policy if exists adr_select_own_or_staff on public.admin_day_requests;
create policy adr_select_own_or_staff on public.admin_day_requests
  for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists adr_insert_own on public.admin_day_requests;
create policy adr_insert_own on public.admin_day_requests
  for insert with check (user_id = auth.uid());

drop policy if exists adr_update_own_or_staff on public.admin_day_requests;
create policy adr_update_own_or_staff on public.admin_day_requests
  for update using (user_id = auth.uid() or public.is_staff());

-- Config y cupos: lectura para autenticados; escritura solo staff.
drop policy if exists adc_select_auth on public.admin_day_config;
create policy adc_select_auth on public.admin_day_config
  for select using (auth.uid() is not null);
drop policy if exists adc_write_staff on public.admin_day_config;
create policy adc_write_staff on public.admin_day_config
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists adq_select_auth on public.admin_day_area_quotas;
create policy adq_select_auth on public.admin_day_area_quotas
  for select using (auth.uid() is not null);
drop policy if exists adq_write_staff on public.admin_day_area_quotas;
create policy adq_write_staff on public.admin_day_area_quotas
  for all using (public.is_staff()) with check (public.is_staff());
