# Tests

`npm test` (Vitest, entorno node).

## Qué cubre esto y qué no

Estos tests cubren la **lógica pura de autorización y saneado** — las funciones
que deciden si un módulo está bloqueado, si un folio de certificado tiene forma
válida, cuándo corta el rate limit y qué HTML sobrevive al saneador. Son las
piezas donde un error se traduce en un problema de seguridad y no en un bug
visible.

Lo que **no** cubren, y hay que probar a mano:

- **Las policies RLS.** Viven en Postgres y las tablas nuevas todavía no están
  aplicadas (ver `supabase/propuestas/`). Probar que un trabajador no lee los
  tickets de otro requiere la base viva con dos sesiones.
- **El render de las rutas públicas.** `/certificados/verificar/[codigo]`
  depende del service_role y de la columna `verification_code`, que existe solo
  después de correr `certificate-verification.sql`.
- **Los gráficos del dashboard.** Recharts necesita DOM; la agregación que los
  alimenta sí es testeable y se puede sumar cuando haga falta.

## Checklist manual para las rutas públicas

Una vez aplicadas las propuestas SQL:

1. `/certificados/verificar/ABC` → "Certificado no válido" (formato corto).
2. `/certificados/verificar/<folio real>` sin sesión → muestra nombre, curso,
   fecha y sede. **No** debe aparecer RUT, correo ni área de trabajo.
3. El mismo folio con sesión de admin → no redirige a `/admin/dashboard`.
4. Recargar 21 veces seguidas → aparece "Demasiadas consultas".
5. Folio de un certificado `is_demo` → sale el aviso de demostración.
6. `/soporte` con sesión de trabajador → solo aparecen los tickets propios.
7. Abrir por URL el `/soporte/<id>` de un ticket ajeno → 404.
8. Como admin, dejar una nota interna y abrir el ticket con la cuenta del
   solicitante → la nota no aparece ni en pantalla ni en el HTML.
