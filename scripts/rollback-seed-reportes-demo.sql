-- ============================================================================
-- rollback-seed-reportes-demo.sql
--
-- Revierte la siembra de 10 trabajadores demo para el clip de /admin/reportes
-- (mode=screencast, hve-video-director). Escrito ANTES de insertar nada, como
-- exige el encargo — los 10 IDs de abajo son los que la migración de siembra
-- usará, no un descubrimiento posterior.
--
-- Ejecutar en una sola pasada, en orden (los DELETE respetan las FK: primero
-- las tablas que referencian profiles.id, al final profiles y auth.users).
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- LOS 10 IDs SEMBRADOS (fijos, documentados aquí para que el rollback no
-- dependa de una consulta por patrón de email ni de is_demo=true a secas —
-- is_demo=true también es Camila Fuentes Ortega y Marcela Aguirre Soto, que
-- NO se tocan).
-- ────────────────────────────────────────────────────────────────────────────
--   dec0de00-0001-4000-8000-000000000001  demo-reportes-01@kimunko.demo  Valentina Rojas Muñoz
--   dec0de00-0002-4000-8000-000000000002  demo-reportes-02@kimunko.demo  Cristóbal Herrera Paredes
--   dec0de00-0003-4000-8000-000000000003  demo-reportes-03@kimunko.demo  Javiera Espinoza Bravo
--   dec0de00-0004-4000-8000-000000000004  demo-reportes-04@kimunko.demo  Ignacio Salazar Vidal
--   dec0de00-0005-4000-8000-000000000005  demo-reportes-05@kimunko.demo  Constanza Morales Tapia
--   dec0de00-0006-4000-8000-000000000006  demo-reportes-06@kimunko.demo  Matías Cáceres Reyes
--   dec0de00-0007-4000-8000-000000000007  demo-reportes-07@kimunko.demo  Fernanda Contreras Soto
--   dec0de00-0008-4000-8000-000000000008  demo-reportes-08@kimunko.demo  Benjamín Vergara Leiva
--   dec0de00-0009-4000-8000-000000000009  demo-reportes-09@kimunko.demo  Antonia Sepúlveda Vega
--   dec0de00-0010-4000-8000-000000000010  demo-reportes-10@kimunko.demo  Rodrigo Fuentealba Pinto

-- ═══ PASO A — course_progress sembrado para estos 10 usuarios ═══════════════
delete from public.course_progress
where is_demo = true
  and user_id in (
    'dec0de00-0001-4000-8000-000000000001','dec0de00-0002-4000-8000-000000000002',
    'dec0de00-0003-4000-8000-000000000003','dec0de00-0004-4000-8000-000000000004',
    'dec0de00-0005-4000-8000-000000000005','dec0de00-0006-4000-8000-000000000006',
    'dec0de00-0007-4000-8000-000000000007','dec0de00-0008-4000-8000-000000000008',
    'dec0de00-0009-4000-8000-000000000009','dec0de00-0010-4000-8000-000000000010'
  );

-- ═══ PASO B — perfiles ═══════════════════════════════════════════════════════
-- is_demo=true es cinturón de seguridad extra, nunca la única condición: si por
-- error un ID de la lista dejó de ser is_demo, este WHERE no lo borra, y eso es
-- exactamente lo que queremos (nunca tocar una fila con is_demo=false).
delete from public.profiles
where is_demo = true
  and id in (
    'dec0de00-0001-4000-8000-000000000001','dec0de00-0002-4000-8000-000000000002',
    'dec0de00-0003-4000-8000-000000000003','dec0de00-0004-4000-8000-000000000004',
    'dec0de00-0005-4000-8000-000000000005','dec0de00-0006-4000-8000-000000000006',
    'dec0de00-0007-4000-8000-000000000007','dec0de00-0008-4000-8000-000000000008',
    'dec0de00-0009-4000-8000-000000000009','dec0de00-0010-4000-8000-000000000010'
  );

-- ═══ PASO C — auth.users (y auth.identities si el asistente creó alguna) ═══
delete from auth.identities
where user_id in (
    'dec0de00-0001-4000-8000-000000000001','dec0de00-0002-4000-8000-000000000002',
    'dec0de00-0003-4000-8000-000000000003','dec0de00-0004-4000-8000-000000000004',
    'dec0de00-0005-4000-8000-000000000005','dec0de00-0006-4000-8000-000000000006',
    'dec0de00-0007-4000-8000-000000000007','dec0de00-0008-4000-8000-000000000008',
    'dec0de00-0009-4000-8000-000000000009','dec0de00-0010-4000-8000-000000000010'
  );

delete from auth.users
where id in (
    'dec0de00-0001-4000-8000-000000000001','dec0de00-0002-4000-8000-000000000002',
    'dec0de00-0003-4000-8000-000000000003','dec0de00-0004-4000-8000-000000000004',
    'dec0de00-0005-4000-8000-000000000005','dec0de00-0006-4000-8000-000000000006',
    'dec0de00-0007-4000-8000-000000000007','dec0de00-0008-4000-8000-000000000008',
    'dec0de00-0009-4000-8000-000000000009','dec0de00-0010-4000-8000-000000000010'
  )
  and email like 'demo-reportes-%@kimunko.demo';  -- cinturón extra: email, no solo ID

-- ═══ VERIFICACIÓN — todo debe devolver 0 ════════════════════════════════════
select
  (select count(*) from public.course_progress
     where user_id in (
       'dec0de00-0001-4000-8000-000000000001','dec0de00-0002-4000-8000-000000000002',
       'dec0de00-0003-4000-8000-000000000003','dec0de00-0004-4000-8000-000000000004',
       'dec0de00-0005-4000-8000-000000000005','dec0de00-0006-4000-8000-000000000006',
       'dec0de00-0007-4000-8000-000000000007','dec0de00-0008-4000-8000-000000000008',
       'dec0de00-0009-4000-8000-000000000009','dec0de00-0010-4000-8000-000000000010'
     )) as course_progress_restante,
  (select count(*) from public.profiles
     where id in (
       'dec0de00-0001-4000-8000-000000000001','dec0de00-0002-4000-8000-000000000002',
       'dec0de00-0003-4000-8000-000000000003','dec0de00-0004-4000-8000-000000000004',
       'dec0de00-0005-4000-8000-000000000005','dec0de00-0006-4000-8000-000000000006',
       'dec0de00-0007-4000-8000-000000000007','dec0de00-0008-4000-8000-000000000008',
       'dec0de00-0009-4000-8000-000000000009','dec0de00-0010-4000-8000-000000000010'
     )) as profiles_restantes,
  (select count(*) from auth.users where email like 'demo-reportes-%@kimunko.demo') as auth_users_restantes,
  -- El mundo demo original (Camila + Marcela) debe seguir intacto:
  (select count(*) from public.profiles where is_demo = true) as demo_profiles_originales_esperado_2;
