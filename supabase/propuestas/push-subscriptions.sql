-- PROPUESTA: no aplicada. La corre Bato en el dashboard cuando esté de acuerdo.
-- Suscripciones de notificaciones push (PWA). Cada fila = un navegador/celular
-- suscrito de un usuario. El envío lo hace el server con web-push (VAPID).

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_select_own" on public.push_subscriptions
  for select to authenticated using (user_id = auth.uid());
create policy "push_insert_own" on public.push_subscriptions
  for insert to authenticated with check (user_id = auth.uid());
create policy "push_delete_own" on public.push_subscriptions
  for delete to authenticated using (user_id = auth.uid());
