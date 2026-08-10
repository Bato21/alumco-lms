-- PROPUESTA: no aplicada. La corre Bato en el dashboard cuando esté de acuerdo.
-- ─────────────────────────────────────────────────────────────────────────
-- Preferencias de accesibilidad por usuario
--
-- Van en tabla propia y no en columnas de `profiles` a propósito: `profiles`
-- tiene campos sensibles (role, status, sede) y ampliar la superficie de
-- UPDATE que el trabajador ejerce sobre esa tabla para guardar un tamaño de
-- letra es un riesgo desproporcionado. Acá la policy es trivial: cada quien
-- escribe su propia fila y nada más.
--
-- El público de esta plataforma son cuidadores de ELEAM, muchos mayores de
-- 50: el tamaño de letra y el contraste no son un extra cosmético.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.user_preferences (
  user_id        uuid primary key references public.profiles(id) on delete cascade,
  -- 'normal' | 'grande' | 'extra' — 3 niveles, no un slider libre: un slider
  -- deja al usuario en estados intermedios donde el layout se rompe.
  font_scale     text    not null default 'normal'
                         check (font_scale in ('normal', 'grande', 'extra')),
  high_contrast  boolean not null default false,
  -- null = respetar prefers-reduced-motion del sistema (el default sano).
  -- true/false = el usuario decidió explícitamente y su decisión manda.
  reduced_motion boolean,
  updated_at     timestamptz not null default now()
);

create or replace function public.touch_user_preferences()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tr_touch_user_preferences on public.user_preferences;
create trigger tr_touch_user_preferences
  before update on public.user_preferences
  for each row execute function public.touch_user_preferences();

alter table public.user_preferences enable row level security;

drop policy if exists up_select_own on public.user_preferences;
create policy up_select_own on public.user_preferences
  for select using (user_id = auth.uid());

drop policy if exists up_insert_own on public.user_preferences;
create policy up_insert_own on public.user_preferences
  for insert with check (user_id = auth.uid());

drop policy if exists up_update_own on public.user_preferences;
create policy up_update_own on public.user_preferences
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
