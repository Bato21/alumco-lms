-- PROPUESTA: no aplicada. La corre Bato en el dashboard cuando esté de acuerdo.
-- ─────────────────────────────────────────────────────────────────────────
-- Feedback de cursos (rating 1-5 + comentario opcional)
--
-- Solo se puede dejar al completar el 100% del curso. Un rating por persona y
-- curso (el unique lo garantiza); si la persona cambia de opinión, actualiza
-- el que ya dejó en vez de acumular.
--
-- El check de "completó el curso" vive en la policy, no solo en la server
-- action: así no depende de que todo el código futuro se acuerde de validarlo.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.course_feedback (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id)  on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  comment    text check (comment is null or char_length(comment) <= 1000),
  is_demo    boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, user_id)
);

create index if not exists course_feedback_course_idx on public.course_feedback (course_id);

create or replace function public.touch_course_feedback()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tr_touch_course_feedback on public.course_feedback;
create trigger tr_touch_course_feedback
  before update on public.course_feedback
  for each row execute function public.touch_course_feedback();

-- ¿El caller completó ese curso? Usado por las policies de escritura.
create or replace function public.has_completed_course(p_course_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.course_progress cp
    where cp.course_id = p_course_id
      and cp.user_id = auth.uid()
      and cp.is_completed
  );
$$;

alter table public.course_feedback enable row level security;

-- Lectura: el autor ve el suyo; staff ve todos (para la vista de resumen).
drop policy if exists cf_select_own_or_staff on public.course_feedback;
create policy cf_select_own_or_staff on public.course_feedback
  for select using (user_id = auth.uid() or public.is_staff());

-- Escribir: solo a nombre propio y solo si completaste el curso.
drop policy if exists cf_insert_own_completed on public.course_feedback;
create policy cf_insert_own_completed on public.course_feedback
  for insert with check (
    user_id = auth.uid() and public.has_completed_course(course_id)
  );

drop policy if exists cf_update_own on public.course_feedback;
create policy cf_update_own on public.course_feedback
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
