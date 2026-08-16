-- ============================================================================
-- rollback-seed-demo.sql
-- Devuelve el mundo demo al estado previo a la resiembra para el video.
--
-- Snapshot tomado: 2026-08-16, proyecto eaodsaiwzhbgehhfnegj (alumco-lms).
-- Ejecutar entero, en una sola transacción. Es idempotente.
--
-- ALCANCE: toca EXCLUSIVAMENTE filas con is_demo = true o sede_id = 'sede_demo'.
-- Cada DELETE y cada UPDATE lleva esa condición en su WHERE, directamente o a
-- través de una subconsulta sobre filas demo. No toca auth.users.
--
-- LO QUE NO RESTAURA:
--   · Las suscripciones push de las cuentas demo (se borran, no se recrean:
--     cada dispositivo debe volver a activarlas desde Mi perfil).
--   · NEXT_PUBLIC_MODO_GRABACION: es variable de entorno, se revierte en
--     Vercel/.env, no acá.
--
-- OJO con la § 5 y la § 6: la producción del video NO modificó
-- reset_demo_world() (se descartó el Ajuste B) y dejó el cron desactivado a
-- propósito, porque la función está rota — ver BUG-73. Restaurar la función es
-- un no-op inofensivo, pero NO reactives el cron sin haber resuelto BUG-73:
-- volvería a fallar cada 6 horas, como lleva haciendo desde el 2026-07-24.
-- ============================================================================

begin;

-- ── Guarda: si las cuentas demo no están donde se espera, abortar ──────────
do $$
declare
  v_admin uuid := '22837ec7-9e0d-4a8c-98af-20676660d97e';
  v_colab uuid := '7ef1a84f-f5d5-42d2-a6a5-c2918c6c6b17';
begin
  if not exists (select 1 from public.profiles where id = v_admin and is_demo) then
    raise exception 'Admin demo % no existe o no es is_demo. Abortando rollback.', v_admin;
  end if;
  if not exists (select 1 from public.profiles where id = v_colab and is_demo) then
    raise exception 'Colaborador demo % no existe o no es is_demo. Abortando rollback.', v_colab;
  end if;
end $$;


-- ════════════════════════════════════════════════════════════════════════════
-- 1. CRÍTICO — Certificado filmado: devolverlo a is_demo = true
--
-- Para filmar el plano final se pone is_demo = false en UN certificado demo,
-- para que /certificados/verificar/[codigo] muestre la UI de "Certificado
-- válido" en vez de la de "Certificado de demostración".
--
-- Ese volteo NO dura toda la producción: se hace en una ventana de minutos con
-- scripts/ventana-certificado.sql (voltear → capturar → devolver). Esta sección
-- es la RED DE SEGURIDAD por si el paso de cierre de esa ventana no llegó a
-- correr.
--
-- Mientras esa bandera esté en false, ese certificado:
--   · aparece en la lista del admin REAL (admin/certificados filtra por is_demo)
--   · NO lo limpia el cron (reset_demo_world borra 'certificates where is_demo')
--
-- Es lo primero del archivo porque es lo más fácil de olvidar y lo único que
-- deja rastro demo en una vista de producción.
-- ════════════════════════════════════════════════════════════════════════════

-- Red de seguridad: re-etiqueta cualquier certificado de una cuenta demo que
-- haya quedado marcado como real. El scope lo da el subselect sobre perfiles
-- is_demo = true, así que no puede alcanzar un certificado de persona real.
update public.certificates
set is_demo = true
where is_demo = false
  and user_id in (select id from public.profiles where is_demo = true);

-- Certificado filmado (fijado el 2026-08-16), por si hace falta apuntarlo a mano:
-- update public.certificates set is_demo = true
--  where id = '53ba7ed8-4a5a-4c16-a167-c75256c017a4';  -- código: D3N9MPFVPEXC


-- ════════════════════════════════════════════════════════════════════════════
-- 2. Perfiles demo — nombre, área, RUT y firma originales
-- ════════════════════════════════════════════════════════════════════════════

update public.profiles set
  full_name    = 'Admin Demo',
  area_trabajo = '{Administración}'::area_trabajo_tipo[],
  rut          = null,
  firma_url    = null
where is_demo = true
  and id = '22837ec7-9e0d-4a8c-98af-20676660d97e';

update public.profiles set
  full_name    = 'Colaborador Demo',
  area_trabajo = '{Enfermería}'::area_trabajo_tipo[],
  rut          = null,
  firma_url    = null
where is_demo = true
  and id = '7ef1a84f-f5d5-42d2-a6a5-c2918c6c6b17';


-- ════════════════════════════════════════════════════════════════════════════
-- 3. Sede Demo — nombre visible original
--
-- OJO: durante la grabación se renombra a "Hualpén", que colisiona a propósito
-- con la sede real 'sede_1' ("Sede Hualpén"). Si esto no se revierte, quien
-- mantenga la plataforma verá dos sedes casi homónimas y no sabrá cuál es cuál.
-- El id nunca cambia: el aislamiento por sede no se toca en ningún momento.
-- ════════════════════════════════════════════════════════════════════════════

update public.sedes
set nombre = 'Sede Demo'
where id = 'sede_demo';

-- `activa` se deja como está (false). No se modificó durante la grabación:
-- activarla haría aparecer la sede demo en el desplegable de asignación de
-- trabajadores del admin real (admin/trabajadores/page.tsx usa .eq('activa', true)
-- sin filtro demo).


-- ════════════════════════════════════════════════════════════════════════════
-- 4. Contenido demo — borrar lo grabado y reponer lo original
-- Orden hijo → padre para no violar claves foráneas.
-- ════════════════════════════════════════════════════════════════════════════

-- ARCHIVO A ELIMINAR A MANO (no lo borra este script):
--   public/demo/restricciones-alimentarias.pdf
-- Es el documento ficticio de restricciones alimentarias que se sirve como
-- estático de Next y al que apunta la fila de event_documents borrada más abajo.
-- Sin borrarlo queda un PDF servido en producción sin nada que lo referencie.

delete from public.certificates    where is_demo = true;
delete from public.course_progress where is_demo = true;
delete from public.quiz_attempts   where is_demo = true;

delete from public.event_tasks
  where section_id in (select es.id from public.event_sections es
                       join public.events e on e.id = es.event_id where e.is_demo = true);
delete from public.event_section_members
  where section_id in (select es.id from public.event_sections es
                       join public.events e on e.id = es.event_id where e.is_demo = true);
delete from public.event_documents
  where event_id in (select id from public.events where is_demo = true);
delete from public.event_photos
  where event_id in (select id from public.events where is_demo = true);
delete from public.event_sections
  where event_id in (select id from public.events where is_demo = true);
delete from public.events where is_demo = true;

delete from public.questions
  where quiz_id in (select q.id from public.quizzes q
                    join public.modules m on m.id = q.module_id
                    join public.courses c on c.id = m.course_id where c.is_demo = true);
delete from public.quizzes
  where module_id in (select m.id from public.modules m
                      join public.courses c on c.id = m.course_id where c.is_demo = true);
delete from public.modules
  where course_id in (select id from public.courses where is_demo = true);
delete from public.courses where is_demo = true;


-- ── 4.1 Cursos ────────────────────────────────────────────────────────────
insert into public.courses
  (id, title, description, is_published, order_index, created_by, target_areas,
   deadline, deadline_description, thumbnail_url, duplicated_from, is_demo)
values
  ('8c8a9e3c-3ba0-4db1-9284-3e43a671ad64',
   'Curso demo: Inducción a KimünKo',
   'Curso de ejemplo del modo demo. Puedes crear, editar y borrar libremente: todo se reinicia periódicamente.',
   true, 1, '22837ec7-9e0d-4a8c-98af-20676660d97e', '{}'::area_trabajo_tipo[],
   null, null, null, null, true),
  ('b0645620-d04f-4d0a-8fa1-483de5bf1207',
   'Curso de ejemplo', '', true, 2,
   '22837ec7-9e0d-4a8c-98af-20676660d97e', '{}'::area_trabajo_tipo[],
   '2026-07-30', null, null, null, true);

-- ── 4.2 Módulos ───────────────────────────────────────────────────────────
insert into public.modules
  (id, course_id, title, description, content_type, content_url, order_index,
   duration_mins, is_required, is_final_module, content_html)
values
  ('8c8c7224-e871-4e46-8aaa-361caa11c246', '8c8a9e3c-3ba0-4db1-9284-3e43a671ad64',
   'Bienvenida en video', null, 'video',
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, null, true, false, null),
  ('5259cbf4-0871-4708-b64f-c94219b9f1df', '8c8a9e3c-3ba0-4db1-9284-3e43a671ad64',
   'Evaluación final', null, 'quiz', '', 2, null, true, true, null),
  ('0a5ff306-9bc2-4126-a28c-29a891a7f4c4', 'b0645620-d04f-4d0a-8fa1-483de5bf1207',
   'Intro', null, 'video',
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, 2, true, true, null);

-- ── 4.3 Quiz y preguntas ──────────────────────────────────────────────────
insert into public.quizzes (id, module_id, title, passing_score, max_attempts)
values ('f0b92eeb-1250-485f-847b-5ef95b9ea5ab',
        '5259cbf4-0871-4708-b64f-c94219b9f1df', 'Evaluación final', 70, 3);

insert into public.questions (id, quiz_id, question_text, options, correct_option, order_index)
values
  ('cd49cc9f-031e-43c1-9d61-5a4c2bc3c0d8', 'f0b92eeb-1250-485f-847b-5ef95b9ea5ab',
   '¿Qué es KimünKo?',
   '[{"id":"a","text":"Una plataforma de capacitación"},{"id":"b","text":"Un tipo de café"},{"id":"c","text":"Una ciudad"}]'::jsonb,
   'a', 1),
  ('9b257e43-3065-4c9f-bd67-ac6721e79170', 'f0b92eeb-1250-485f-847b-5ef95b9ea5ab',
   'En modo demo, ¿qué pasa con lo que creas?',
   '[{"id":"a","text":"Se comparte con toda la ONG"},{"id":"b","text":"Solo lo ves tú y se reinicia"},{"id":"c","text":"Se borra al instante"}]'::jsonb,
   'b', 2);

-- ── 4.4 Evento, sección, encargado y tareas ───────────────────────────────
insert into public.events
  (id, title, event_type, description, event_date, status, cover_image_url,
   created_by, sede_id, is_demo)
values
  ('7cb8c686-eafb-4653-a6a2-ecac7823ef33', 'Evento demo: 18 de septiembre',
   'dieciocho', 'Evento de ejemplo del modo demo para probar secciones, tareas y equipos.',
   '2026-08-22', 'activo', null,
   '22837ec7-9e0d-4a8c-98af-20676660d97e', 'sede_demo', true);

insert into public.event_sections (id, event_id, name, description, order_index)
values ('6302b4a8-ae01-45c2-bfe2-1f38960c528e', '7cb8c686-eafb-4653-a6a2-ecac7823ef33',
        'Cocina y alimentación', 'Coordinación del menú del evento.', 0);

insert into public.event_section_members (section_id, user_id, member_role)
values ('6302b4a8-ae01-45c2-bfe2-1f38960c528e',
        '7ef1a84f-f5d5-42d2-a6a5-c2918c6c6b17', 'encargado');

insert into public.event_tasks
  (id, section_id, title, description, status, due_date, due_time, order_index,
   completed_at, completed_by, created_by)
values
  ('c0b3bbc8-6efb-46eb-aa97-19e6414a7a89', '6302b4a8-ae01-45c2-bfe2-1f38960c528e',
   'Definir el menú', 'Elegir platos considerando dificultades alimenticias.',
   'completada', null, null, 0, '2026-07-24T02:24:20.327+00',
   '7ef1a84f-f5d5-42d2-a6a5-c2918c6c6b17', '22837ec7-9e0d-4a8c-98af-20676660d97e'),
  ('0e11c04b-ffc1-4ddf-9f11-2e067cfe8d80', '6302b4a8-ae01-45c2-bfe2-1f38960c528e',
   'Comprar insumos', 'Lista de compras para 30 personas.',
   'pendiente', null, null, 1, null, null, '22837ec7-9e0d-4a8c-98af-20676660d97e'),
  ('3b1da6ea-91ab-4b0e-94e9-017caef4ccf9', '6302b4a8-ae01-45c2-bfe2-1f38960c528e',
   'Traer la salsa BBQ', null, 'pendiente', '2026-08-22', null, 2, null, null,
   '7ef1a84f-f5d5-42d2-a6a5-c2918c6c6b17'),
  ('a3ef6b55-d9d2-4475-b5fc-ce8595c6a4b5', '6302b4a8-ae01-45c2-bfe2-1f38960c528e',
   'Instalar decoraciones', null, 'pendiente', '2026-08-26', '16:30:00', 4, null, null,
   '7ef1a84f-f5d5-42d2-a6a5-c2918c6c6b17');

-- ── 4.5 Intento de quiz, progreso y certificados ──────────────────────────
insert into public.quiz_attempts
  (id, quiz_id, user_id, score, status, answers, attempt_number, completed_at, is_demo)
values
  ('64c663b2-c188-403c-b25c-61e2361d460d', 'f0b92eeb-1250-485f-847b-5ef95b9ea5ab',
   '7ef1a84f-f5d5-42d2-a6a5-c2918c6c6b17', 100, 'aprobado',
   '{"9b257e43-3065-4c9f-bd67-ac6721e79170":"b","cd49cc9f-031e-43c1-9d61-5a4c2bc3c0d8":"a"}'::jsonb,
   1, '2026-07-23T18:37:32.203875+00', true);

insert into public.course_progress
  (id, user_id, course_id, last_module_id, completed_modules, is_completed,
   started_at, completed_at, last_quiz_reset_at, is_demo)
values
  ('3efa129c-60fb-49d5-bf5e-bcbd7d63a5b7', '7ef1a84f-f5d5-42d2-a6a5-c2918c6c6b17',
   '8c8a9e3c-3ba0-4db1-9284-3e43a671ad64', '5259cbf4-0871-4708-b64f-c94219b9f1df',
   '{8c8c7224-e871-4e46-8aaa-361caa11c246,5259cbf4-0871-4708-b64f-c94219b9f1df}'::uuid[],
   true, '2026-07-23T18:35:54.471598+00', '2026-07-24T02:24:15.301+00', null, true),
  ('80738df1-4be3-42bc-98ac-4ad65c2f07f1', '7ef1a84f-f5d5-42d2-a6a5-c2918c6c6b17',
   'b0645620-d04f-4d0a-8fa1-483de5bf1207', '0a5ff306-9bc2-4126-a28c-29a891a7f4c4',
   '{0a5ff306-9bc2-4126-a28c-29a891a7f4c4}'::uuid[],
   true, '2026-07-24T02:24:41.199334+00', '2026-07-24T02:24:41.304+00', null, true);

insert into public.certificates
  (id, user_id, quiz_attempt_id, course_id, issued_at, pdf_url, verification_code, is_demo)
values
  ('a138ea91-769a-48f1-a733-b451d962b40e', '7ef1a84f-f5d5-42d2-a6a5-c2918c6c6b17',
   '64c663b2-c188-403c-b25c-61e2361d460d', '8c8a9e3c-3ba0-4db1-9284-3e43a671ad64',
   '2026-07-23T18:37:33.432687+00', null, 'S7KT4Q9YW52T', true),
  ('b1d1bc11-120a-4321-9453-1f51c94860f9', '7ef1a84f-f5d5-42d2-a6a5-c2918c6c6b17',
   null, 'b0645620-d04f-4d0a-8fa1-483de5bf1207',
   '2026-07-24T02:24:41.880147+00', null, 'FNFFWZ50E42Z', true);


-- ════════════════════════════════════════════════════════════════════════════
-- 5. Función de resiembra — definición original
--
-- El Ajuste B la reescribe para que resiembre el contenido de cámara. Esto la
-- devuelve a la versión que reseminaba el set original (con el video
-- dQw4w9WgXcQ). Se restaura ANTES de reactivar el cron.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.reset_demo_world()
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_admin uuid;
  v_colab uuid;
  v_course uuid;
  v_mod_video uuid;
  v_mod_quiz uuid;
  v_quiz uuid;
  v_event uuid;
  v_section uuid;
begin
  select id into v_admin from profiles where is_demo and role = 'admin' order by created_at limit 1;
  select id into v_colab from profiles where is_demo and role = 'trabajador' order by created_at limit 1;
  if v_admin is null then return; end if;

  delete from quiz_attempts where is_demo;
  delete from certificates where is_demo;
  delete from courses where is_demo;
  delete from events where is_demo;
  delete from course_progress where is_demo;
  delete from push_subscriptions where user_id in (v_admin, v_colab);

  insert into courses (title, description, is_published, order_index, created_by, target_areas, is_demo)
  values ('Curso demo: Inducción a KimünKo',
          'Curso de ejemplo del modo demo. Puedes crear, editar y borrar libremente: todo se reinicia periódicamente.',
          true, 1, v_admin, array[]::area_trabajo_tipo[], true)
  returning id into v_course;

  insert into modules (course_id, title, content_type, content_url, order_index, is_required, is_final_module)
  values (v_course, 'Bienvenida en video', 'video', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, true, false)
  returning id into v_mod_video;

  insert into modules (course_id, title, content_type, content_url, order_index, is_required, is_final_module)
  values (v_course, 'Evaluación final', 'quiz', '', 2, true, true)
  returning id into v_mod_quiz;

  insert into quizzes (module_id, title, passing_score, max_attempts)
  values (v_mod_quiz, 'Evaluación final', 70, 3)
  returning id into v_quiz;

  insert into questions (quiz_id, question_text, options, correct_option, order_index) values
    (v_quiz, '¿Qué es KimünKo?',
     '[{"id":"a","text":"Una plataforma de capacitación"},{"id":"b","text":"Un tipo de café"},{"id":"c","text":"Una ciudad"}]'::jsonb,
     'a', 1),
    (v_quiz, 'En modo demo, ¿qué pasa con lo que creas?',
     '[{"id":"a","text":"Se comparte con toda la ONG"},{"id":"b","text":"Solo lo ves tú y se reinicia"},{"id":"c","text":"Se borra al instante"}]'::jsonb,
     'b', 2);

  insert into events (title, event_type, sede_id, event_date, description, status, created_by, is_demo)
  values ('Evento demo: 18 de septiembre', 'dieciocho', 'sede_demo', (current_date + 30),
          'Evento de ejemplo del modo demo para probar secciones, tareas y equipos.',
          'activo', v_admin, true)
  returning id into v_event;

  insert into event_sections (event_id, name, description, order_index)
  values (v_event, 'Cocina y alimentación', 'Coordinación del menú del evento.', 0)
  returning id into v_section;

  if v_colab is not null then
    insert into event_section_members (section_id, user_id, member_role)
    values (v_section, v_colab, 'encargado');
  end if;

  insert into event_tasks (section_id, title, description, status, order_index, created_by) values
    (v_section, 'Definir el menú', 'Elegir platos considerando dificultades alimenticias.', 'pendiente', 0, v_admin),
    (v_section, 'Comprar insumos', 'Lista de compras para 30 personas.', 'pendiente', 1, v_admin);
end $function$;


-- ════════════════════════════════════════════════════════════════════════════
-- 6. Reactivar el cron de reset (estado original: jobid 1, '0 */6 * * *', activo)
-- ════════════════════════════════════════════════════════════════════════════

select cron.alter_job(
  (select jobid from cron.job where jobname = 'reset-demo-world'),
  active := true
);

commit;


-- ════════════════════════════════════════════════════════════════════════════
-- Verificación posterior — debe devolver exactamente estos valores
-- ════════════════════════════════════════════════════════════════════════════
-- select count(*) from public.profiles       where is_demo = false;  -- 58
-- select count(*) from public.courses        where is_demo = false;  -- 10
-- select count(*) from public.events         where is_demo = false;  -- 1
-- select count(*) from public.certificates   where is_demo = false;  -- 0  ← clave
--   OJO: la línea de arriba decía 2 por un error de lectura de la auditoría.
--   Los dos certificados que existían antes de la grabación eran AMBOS
--   is_demo = true, de la cuenta demo. Ninguna persona real tiene certificado.
--   Cualquier valor distinto de 0 significa que quedó un certificado demo
--   marcado como real: ejecutar la sección 1 de este archivo.
-- select count(*) from public.courses        where is_demo = true;   -- 2
-- select count(*) from public.event_sections
--   where event_id in (select id from public.events where is_demo);  -- 1
-- select nombre, activa from public.sedes where id = 'sede_demo';    -- Sede Demo, false
-- select jobname, active from cron.job;                              -- reset-demo-world, true
