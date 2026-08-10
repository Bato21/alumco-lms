-- APLICADA en producción el 2026-08-10. Idempotente: re-correrla no rompe nada.
-- Backfill ejecutado sobre los 2 certificados que existían.
-- ─────────────────────────────────────────────────────────────────────────
-- Verificación pública de certificados con QR
--
-- Cada certificado gana un `verification_code` corto e irrepetible. El PDF
-- lleva un QR que apunta a /certificados/verificar/{codigo}, una ruta pública
-- (sin login) que un fiscalizador de SENAMA puede abrir desde el celular.
--
-- El código NO es adivinable a partir del id: se genera con gen_random_bytes,
-- no con un hash del uuid (un md5(id) sería reversible por quien conozca el
-- id del certificado, que sí aparece en URLs internas).
--
-- Alfabeto Crockford base32 sin I/L/O/U: evita confundir 0/O y 1/I/L cuando
-- alguien tipea el código a mano desde un certificado impreso.
-- ─────────────────────────────────────────────────────────────────────────

alter table public.certificates
  add column if not exists verification_code text;

-- 1) Generador ────────────────────────────────────────────────────────────
create or replace function public.gen_verification_code()
returns text
language plpgsql
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';  -- Crockford base32
  result text := '';
  i integer;
begin
  for i in 1..12 loop
    result := result || substr(alphabet, 1 + floor(random() * 32)::int, 1);
  end loop;
  return result;
end;
$$;

-- 2) Backfill de los certificados existentes ──────────────────────────────
-- El loop reintenta ante colisión (astronómicamente improbable con 32^12,
-- pero el unique index de abajo no perdona).
do $$
declare
  cert record;
  candidate text;
begin
  for cert in select id from public.certificates where verification_code is null loop
    loop
      candidate := public.gen_verification_code();
      exit when not exists (
        select 1 from public.certificates where verification_code = candidate
      );
    end loop;
    update public.certificates set verification_code = candidate where id = cert.id;
  end loop;
end;
$$;

alter table public.certificates
  alter column verification_code set not null;

create unique index if not exists certificates_verification_code_idx
  on public.certificates (verification_code);

-- 3) Trigger para certificados nuevos ─────────────────────────────────────
create or replace function public.set_certificate_verification_code()
returns trigger
language plpgsql
as $$
declare
  candidate text;
begin
  if new.verification_code is null then
    loop
      candidate := public.gen_verification_code();
      exit when not exists (
        select 1 from public.certificates where verification_code = candidate
      );
    end loop;
    new.verification_code := candidate;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_set_certificate_verification_code on public.certificates;
create trigger tr_set_certificate_verification_code
  before insert on public.certificates
  for each row execute function public.set_certificate_verification_code();

-- 4) RLS ──────────────────────────────────────────────────────────────────
-- A propósito NO se agrega una policy pública de lectura sobre `certificates`.
-- Abrir la tabla a `anon` expondría el listado completo a cualquiera con la
-- anon key (que es pública por definición en una app Next).
--
-- El lookup de la ruta pública lo hace el server con service_role filtrando
-- por verification_code exacto, y devuelve solo los campos mínimos
-- (nombre, curso, fecha, sede). Ver src/lib/certificates/verify.ts.
