-- PROPUESTA: no aplicada. La corre Bato en el dashboard cuando esté de acuerdo.
-- ─────────────────────────────────────────────────────────────────────────
-- 1) Duplicación de cursos — trazabilidad del original
-- 2) Módulos de tipo texto (HTML enriquecido)
-- ─────────────────────────────────────────────────────────────────────────

-- 1) Duplicación ──────────────────────────────────────────────────────────
-- El clon apunta al curso del que salió. `on delete set null` para que borrar
-- el original no arrastre a los cursos que se derivaron de él.
alter table public.courses
  add column if not exists duplicated_from uuid
    references public.courses(id) on delete set null;

create index if not exists courses_duplicated_from_idx
  on public.courses (duplicated_from);

comment on column public.courses.duplicated_from is
  'Curso origen si este se creó por duplicación. Solo trazabilidad: el clon es independiente.';


-- 2) Módulos de texto ─────────────────────────────────────────────────────
-- `content_url` es NOT NULL en el schema actual y para un módulo de texto no
-- hay URL que guardar, así que el HTML va en su propia columna y el código
-- escribe '' en content_url.
alter table public.modules
  add column if not exists content_html text;

comment on column public.modules.content_html is
  'HTML ya saneado en el servidor (sanitize-html). Solo para content_type = ''texto''.';

-- El tipo de `modules.content_type` puede ser un enum o un text con CHECK
-- según cómo se creó la tabla. Este bloque cubre ambos casos.
do $$
declare
  col_type text;
begin
  select case when t.typtype = 'e' then 'enum' else 'text' end
    into col_type
    from pg_attribute a
    join pg_type t on t.oid = a.atttypid
   where a.attrelid = 'public.modules'::regclass
     and a.attname = 'content_type'
     and not a.attisdropped;

  if col_type = 'enum' then
    -- ALTER TYPE ... ADD VALUE no corre dentro de un bloque transaccional en
    -- PG < 12; en Supabase (PG 15+) sí funciona.
    begin
      execute 'alter type public.content_type add value if not exists ''texto''';
    exception when others then
      raise notice 'No se pudo extender el enum content_type: %', sqlerrm;
    end;
  else
    -- Variante text + CHECK: reescribir la restricción incluyendo 'texto'.
    execute 'alter table public.modules drop constraint if exists modules_content_type_check';
    execute $c$alter table public.modules
      add constraint modules_content_type_check
      check (content_type in ('video', 'pdf', 'slides', 'quiz', 'texto'))$c$;
  end if;
end;
$$;
