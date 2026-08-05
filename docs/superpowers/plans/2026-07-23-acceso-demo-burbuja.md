# Acceso Demo — Burbuja total (camino A)

Branch: `acceso-demo`. Fecha: 2026-07-23.

## Objetivo

Los dos botones "Acceso demo" del login deben entrar a cuentas demo reales
(admin demo + colaborador demo) que **pueden crear/editar/borrar libremente**
pero **solo ven su propio mundo demo**, aislado de producción (burbuja total).
El contenido demo se reinicia periódicamente con un cron.

## Decisiones tomadas

- **Aislamiento:** burbuja total. El usuario demo NO ve ni puede tocar contenido
  real. Arranca de un set sembrado propio.
- **Reset:** cron periódico que borra lo `is_demo` y resiembra.
- **Cuentas:** dos cuentas fijas compartidas (admin demo, colaborador demo).
  Los testers concurrentes comparten el mismo mundo demo (debilidad aceptada de A).

## Hecho clave del repo que define el diseño

El panel admin y varias lecturas usan `createAdminClient()` (service-role), que
**ignora RLS**. Por lo tanto el aislamiento NO puede depender solo de RLS: hay
que filtrar `is_demo` explícitamente en las queries service-role y sembrar el
flag en las escrituras. Las lecturas de trabajador (`/inicio`, `/cursos`,
`/eventos`) sí usan el cliente anon → esas se resuelven con RLS.

Los **eventos ya están aislados por sede** (`user_sede()`), así que una
**Sede Demo** dedicada resuelve el lado trabajador de eventos casi gratis.

## Modelo de datos (migración aditiva, no rompe prod)

1. Sede Demo: fila en `sedes` con nombre "Demo" (o `activa=false` para no
   ofrecerla en registro). Guardar su id.
2. `profiles.is_demo boolean not null default false`. Las dos cuentas demo = true,
   con `sede` = Sede Demo.
3. `is_demo boolean not null default false` en las tablas globales que se leen
   con service-role directo: `courses`, `events`. Los hijos (modules, quizzes,
   questions, event_sections/tasks/documents/photos) heredan vía el padre.
4. Helper `viewer_is_demo()` (SQL, SECURITY DEFINER, STABLE): lee
   `profiles.is_demo` del `auth.uid()`. Devuelve false para todo usuario real y
   para usuarios anónimos.

Todas las filas existentes quedan `is_demo=false` → comportamiento de producción
idéntico.

## RLS (lado trabajador / anon)

- `courses` SELECT: cambiar `is_published=true` por
  `is_published=true AND is_demo = viewer_is_demo()` (manteniendo el OR admin).
  Así el trabajador real ve solo cursos reales y el demo solo cursos demo.
- `modules/quizzes/questions` SELECT: heredan el filtro vía el curso publicado.
- `events` y subtablas: sin cambios. Como las cuentas demo tienen Sede Demo y
  los eventos demo se crean en Sede Demo, `sede_id = user_sede()` ya aísla.

## App (lado admin / service-role)

- `requireAdmin()` / helper nuevo debe exponer si el admin es demo.
- Toda lectura admin de `courses` y `events` filtra por `is_demo` = (admin es demo).
  Archivos: `src/app/admin/**`, `src/lib/actions/courses.ts`, `events.ts`,
  `search.ts`, dashboard.
- Toda escritura demo estampa `is_demo=true` (cursos) y fuerza Sede Demo (eventos).
- Guarda defensiva en mutaciones: un admin demo solo puede update/delete filas
  `is_demo=true`; un admin real solo filas `is_demo=false`. (Con burbuja total el
  read-filter ya evita que el demo vea filas reales, pero esto es red de seguridad.)

## Bloqueos en modo demo

- Cambio de contraseña de la cuenta demo (compartida).
- Aprobar/rechazar/crear trabajadores reales, suspender cuentas.
- Push notifications reales.
- Barra visible "MODO DEMO — el contenido se reinicia cada X h".

## Reset (cron)

Edge function (o pg_cron) cada X horas:
1. Borra cursos `is_demo=true` (cascade a modules/quizzes/questions) y eventos en
   Sede Demo (cascade).
2. Borra datos personales de las dos cuentas demo: `course_progress`,
   `quiz_attempts`, `certificates`, `push_subscriptions`.
3. Resiembra el set demo base (cursos/eventos de muestra).

## Riesgo de infraestructura a confirmar

La branch de git aísla el **código**, pero la base de datos Supabase es la misma
instancia **viva/producción**. Las migraciones aditivas (columnas default false)
no afectan prod. Los cambios de RLS aplican de inmediato a prod → hay que
escribirlos de forma que el comportamiento para usuarios reales sea idéntico
(garantizado si `viewer_is_demo()` = false para todos los reales y las filas
existentes son is_demo=false). Alternativa más segura: Supabase branch (DB dev).

## Orden de implementación

1. Migración aditiva (Sede Demo, columnas is_demo, helper). Sin cambios de RLS aún.
2. Provisionar las dos cuentas demo (Admin API, is_demo=true, Sede Demo) + seed base.
3. Filtrado en lecturas admin (service-role) + estampado en escrituras.
4. Cambio de RLS de `courses`.
5. Botones del login → entrar a las cuentas demo reales (o crear sesión demo).
6. Barra de modo demo + bloqueos.
7. Cron de reset.
