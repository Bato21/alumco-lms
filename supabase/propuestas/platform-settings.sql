-- APLICADA en producción el 2026-08-10. Idempotente: re-correrla no rompe nada.
-- ─────────────────────────────────────────────────────────────────────────
-- Ajustes de plataforma (key-value)
--
-- Hoy el único consumidor es el gauge de cobertura anual del dashboard admin:
-- el target contra el que se mide la cobertura tiene que poder cambiar sin
-- tocar código (SENAMA puede subir la exigencia de un año a otro).
--
-- Se deja como key-value genérico en vez de una tabla `annual_target` para no
-- volver a migrar cuando aparezca el segundo ajuste configurable.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.platform_settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Target de cobertura anual: % de trabajadores activos que deben tener al
-- menos un certificado emitido dentro del año en curso.
insert into public.platform_settings (key, value) values
  ('annual_certification_target', '{"target": 85}'::jsonb)
on conflict (key) do nothing;

alter table public.platform_settings enable row level security;

-- Lectura para cualquier autenticado (el dashboard de profesor también lo lee).
drop policy if exists ps_select_auth on public.platform_settings;
create policy ps_select_auth on public.platform_settings
  for select using (auth.uid() is not null);

-- Escritura solo staff. `public.is_staff()` ya existe (ver admin-days.sql).
drop policy if exists ps_write_staff on public.platform_settings;
create policy ps_write_staff on public.platform_settings
  for all using (public.is_staff()) with check (public.is_staff());
