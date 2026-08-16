-- ============================================================================
-- ventana-certificado.sql
--
-- El plano final del video es la página pública de verificación de certificado.
-- Esa página tiene dos ramas (src/app/certificados/verificar/[codigo]/page.tsx,
-- líneas 120-183): con is_demo = true pinta "Certificado de demostración" en
-- beige con ícono de alerta; con is_demo = false pinta "Certificado válido" en
-- verde con ícono de check. Queremos filmar la segunda.
--
-- El componente NO se toca. Se voltea la bandera del certificado durante una
-- ventana de minutos, se captura, y se devuelve enseguida.
--
--   1. Ejecutar el PASO 1
--   2. Abrir la URL, capturar el plano
--   3. Ejecutar el PASO 2 EN LA MISMA SESIÓN, sin cerrar el editor SQL
--
-- ⚠️ Los dos pasos van juntos. Mientras la bandera esté en false, ese
-- certificado:
--   · aparece en la lista de /admin/certificados del admin REAL
--     (admin/certificados/page.tsx:26 filtra .eq('is_demo', isDemo))
--   · suma +1 al gráfico "certificados por mes" del dashboard del admin REAL
--     (lib/actions/analytics.ts:51, misma condición)
--   · deja de ser limpiable por el cron, que solo borra 'certificates where is_demo'
--
-- La captura resultante se entrega al pipeline como `supplied`. No hay que
-- volver a tocar la base para el video.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- DATOS DEL CERTIFICADO A FILMAR   (fijados el 2026-08-16)
--   Titular: Camila Fuentes Ortega
--   Curso  : Prevención y manejo de caídas en adultos mayores
-- ────────────────────────────────────────────────────────────────────────────
--   UUID   : 53ba7ed8-4a5a-4c16-a167-c75256c017a4
--   Código : D3N9MPFVPEXC
--   URL    : https://<dominio>/certificados/verificar/D3N9MPFVPEXC
-- ────────────────────────────────────────────────────────────────────────────


-- ═══ PASO 1 — Abrir la ventana ══════════════════════════════════════════════
-- Ejecutar, luego capturar la URL de arriba.

update public.certificates
set is_demo = false
where is_demo = true
  and id = '53ba7ed8-4a5a-4c16-a167-c75256c017a4';

-- Comprobar que afectó exactamente 1 fila antes de ir a capturar:
select id, verification_code, is_demo
from public.certificates
where id = '53ba7ed8-4a5a-4c16-a167-c75256c017a4';


-- ═══ PASO 2 — Cerrar la ventana ═════════════════════════════════════════════
-- Ejecutar INMEDIATAMENTE después de capturar, en esta misma sesión.

update public.certificates
set is_demo = true
where is_demo = false
  and id = '53ba7ed8-4a5a-4c16-a167-c75256c017a4';

-- Verificación de cierre: debe devolver is_demo = true, y el conteo de
-- certificados marcados como reales debe volver a 0.
select id, verification_code, is_demo
from public.certificates
where id = '53ba7ed8-4a5a-4c16-a167-c75256c017a4';

select count(*) as certificados_reales
from public.certificates
where is_demo = false;   -- esperado: 0
-- Ninguna persona real tiene certificado en esta base: los certificados que
-- existían antes de la grabación eran los dos de la cuenta demo. Si esto
-- devuelve 1, el PASO 2 no se ejecutó.


-- ────────────────────────────────────────────────────────────────────────────
-- Si el PASO 2 no llegó a correr (se cerró el editor, se cortó la sesión), la
-- sección 1 de scripts/rollback-seed-demo.sql lo repara: re-etiqueta cualquier
-- certificado de cuenta demo que haya quedado marcado como real.
-- ────────────────────────────────────────────────────────────────────────────
