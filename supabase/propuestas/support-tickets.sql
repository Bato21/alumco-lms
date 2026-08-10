-- APLICADA en producción el 2026-08-10. Idempotente: re-correrla no rompe nada.
-- ─────────────────────────────────────────────────────────────────────────
-- Tickets de soporte (MVP)
--
-- Reemplaza el canal actual (WhatsApp a la directora + correos sueltos) por
-- algo con trazabilidad: cada reporte tiene estado, dueño e historial.
--
-- Sobre tickets sin login: el schema deja `requester_id` nullable y guarda
-- `requester_email`/`requester_name` para poder habilitarlos después sin
-- migrar. En el MVP el formulario público NO se expone — sin un store de
-- rate limit compartido (Redis) y sin sistema de correo, un endpoint abierto
-- es un buzón de spam. Ver docs/GAPS-CRITICOS.md §Gap 4.
-- ─────────────────────────────────────────────────────────────────────────

-- 1) Enums ────────────────────────────────────────────────────────────────
do $$ begin
  create type public.support_category as enum (
    'acceso', 'error_tecnico', 'contenido_curso', 'certificado', 'cuenta', 'otro'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.support_priority as enum ('baja', 'media', 'alta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.support_status as enum ('abierto', 'en_progreso', 'cerrado');
exception when duplicate_object then null; end $$;

-- 2) Tickets ──────────────────────────────────────────────────────────────
create table if not exists public.support_tickets (
  id              uuid primary key default gen_random_uuid(),
  requester_id    uuid references public.profiles(id) on delete set null,
  requester_email text,
  requester_name  text,
  category        public.support_category not null,
  priority        public.support_priority not null default 'media',
  status          public.support_status   not null default 'abierto',
  subject         text not null check (char_length(subject) between 6 and 160),
  description     text not null check (char_length(description) between 12 and 5000),
  -- Contexto técnico capturado en el cliente: { url, userAgent, viewport }.
  -- Sirve para reproducir el bug sin ir y volver preguntando.
  context         jsonb not null default '{}'::jsonb,
  assignee_id     uuid references public.profiles(id) on delete set null,
  is_demo         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  closed_at       timestamptz,
  -- Un ticket sin dueño necesita al menos un correo de contacto para poder
  -- responderlo. Con dueño, el correo sale del perfil.
  constraint support_tickets_has_requester
    check (requester_id is not null or requester_email is not null)
);

create index if not exists support_tickets_status_idx    on public.support_tickets (status);
create index if not exists support_tickets_requester_idx on public.support_tickets (requester_id);
create index if not exists support_tickets_created_idx   on public.support_tickets (created_at desc);

-- 3) Mensajes del hilo ────────────────────────────────────────────────────
create table if not exists public.support_ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets(id) on delete cascade,
  author_id   uuid references public.profiles(id) on delete set null,
  body        text not null check (char_length(body) between 1 and 5000),
  -- Nota interna del equipo: nunca se muestra al solicitante.
  is_internal boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists support_ticket_messages_ticket_idx
  on public.support_ticket_messages (ticket_id, created_at);

-- 4) updated_at ───────────────────────────────────────────────────────────
create or replace function public.touch_support_ticket()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tr_touch_support_ticket on public.support_tickets;
create trigger tr_touch_support_ticket
  before update on public.support_tickets
  for each row execute function public.touch_support_ticket();

-- 5) RLS ──────────────────────────────────────────────────────────────────
alter table public.support_tickets         enable row level security;
alter table public.support_ticket_messages enable row level security;

-- Tickets: el solicitante ve los suyos, staff ve todos.
drop policy if exists st_select_own_or_staff on public.support_tickets;
create policy st_select_own_or_staff on public.support_tickets
  for select using (requester_id = auth.uid() or public.is_staff());

-- Crear: solo a nombre propio. Un trabajador no puede abrir un ticket
-- haciéndose pasar por otro.
drop policy if exists st_insert_own on public.support_tickets;
create policy st_insert_own on public.support_tickets
  for insert with check (requester_id = auth.uid());

-- Cambiar estado/prioridad/asignado: solo staff.
drop policy if exists st_update_staff on public.support_tickets;
create policy st_update_staff on public.support_tickets
  for update using (public.is_staff()) with check (public.is_staff());

-- Mensajes: visibles si ves el ticket. Las notas internas solo para staff.
drop policy if exists stm_select_visible on public.support_ticket_messages;
create policy stm_select_visible on public.support_ticket_messages
  for select using (
    (not is_internal or public.is_staff())
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id
        and (t.requester_id = auth.uid() or public.is_staff())
    )
  );

-- Responder: el solicitante en su propio ticket (nunca nota interna), o staff.
drop policy if exists stm_insert_participant on public.support_ticket_messages;
create policy stm_insert_participant on public.support_ticket_messages
  for insert with check (
    author_id = auth.uid()
    and (
      public.is_staff()
      or (
        not is_internal
        and exists (
          select 1 from public.support_tickets t
          where t.id = ticket_id and t.requester_id = auth.uid()
        )
      )
    )
  );
