# Cierre de gaps — qué quedó implementado y qué falta correr

> Rama `valentin`. Complementa `docs/GAPS-CRITICOS.md`, que es el plan; esto es
> lo que efectivamente está en el código.

---

## ⚠️ Bloqueante: hay 5 archivos SQL sin aplicar

El código está escrito y compila, pero **cinco features no funcionan hasta que
alguien corra las propuestas en la base viva**. Siguen la convención del repo:
viven en `supabase/propuestas/` y no se aplican solas.

| Archivo | Habilita | Si no se corre |
|---|---|---|
| `certificate-verification.sql` | Folio + QR + ruta pública | El PDF sale sin QR (fallback al ID corto); la ruta pública siempre dice "no válido" |
| `platform-settings.sql` | Objetivo anual editable | El gauge usa 85% fijo y guardar el objetivo falla |
| `support-tickets.sql` | Tickets de soporte | `/soporte` y `/admin/soporte` no cargan |
| `course-feedback.sql` | Valoraciones | La tarjeta de valoración falla al guardar |
| `accessibility-preferences.sql` | Preferencias persistidas | Todos ven los valores por defecto |
| `course-duplication-and-text-modules.sql` | Duplicar cursos + módulos de texto | Duplicar falla; los módulos de texto no se pueden crear |

El código degrada con gracia donde pudo (el QR se omite, el objetivo cae al
default, las preferencias vuelven a los valores base) pero no en todo.

**Orden sugerido:** cualquiera, no dependen entre sí. Todas usan
`public.is_staff()`, que ya existe desde `admin-days.sql`.

---

## Variables de entorno

Se agregó a `.env.local` y **hay que agregarla también en Vercel**:

```
NEXT_PUBLIC_SITE_URL=https://alumco-lms-nm38.vercel.app
```

Es la base absoluta que se codifica dentro del QR de cada certificado. Si en
producción queda mal, los QR ya emitidos apuntan a un dominio equivocado — es
el único valor de esta tanda que conviene revisar antes de emitir certificados.

---

## Decisiones que conviene revisar

### 1. Qué se expone en la verificación pública

La ruta muestra **nombre, curso, fecha de emisión y sede**. Nada más.

`docs/GAPS-CRITICOS.md` proponía incluir el RUT enmascarado; se dejó fuera. Un
RUT parcial sigue siendo dato personal y con nombre + sede + curso ya se
acredita el certificado. Si la dirección técnica pide el RUT para fiscalización
de SENAMA, agregarlo es una línea en `src/lib/certificates/verify.ts` — pero es
una decisión de ellos, no técnica.

### 2. Tickets sin login: no se implementó

El competidor tiene formulario público con rate limit. Acá quedó **solo para
autenticados**. Razones:

- No hay sistema de correo (Gap 1 sigue abierto), así que un ticket anónimo
  entra a una tabla que nadie mira hasta que alguien abra el panel.
- El rate limit es en memoria del proceso; en Vercel cada instancia tiene el
  suyo, lo que alcanza para frenar scraping pero no para sostener un endpoint
  de escritura abierto.

El schema ya lo contempla (`requester_id` nullable, `requester_email`), así que
habilitarlo después es código, no migración.

### 3. Rate limiting en memoria

`src/lib/rateLimit.ts` usa un `Map` por proceso. Para el tráfico de Alumco
alcanza. El reemplazo natural es `@upstash/ratelimit`; la firma de
`checkRateLimit()` se diseñó para no cambiar al hacerlo.

### 4. Preview Mode muestra los datos del propio admin

El toggle cambia la **interfaz**, no la identidad: el admin ve la navegación y
las pantallas del colaborador, pero con su propio perfil y sus propias áreas de
trabajo. No suplanta a nadie. El banner lo dice explícitamente.

Si lo que se necesita es "ver la plataforma como la ve Fulana", eso es otra
cosa (impersonación) y trae consecuencias de auditoría que conviene conversar
antes.

### 5. Tamaño de letra vía `zoom`

`didasko.css` escala con `zoom`, no con `font-size`. El sistema DIDASKO define
tamaños en px (muchos inline), así que subir la raíz en rem no movería nada.
`zoom` escala la caja completa —texto, iconos y targets táctiles— que es lo que
espera quien pide "letra más grande". Soportado en todos los navegadores
actuales (Firefox desde la 126).

---

## Bug encontrado y corregido de paso

**La evaluación final no tenía candado secuencial.** Se podía entrar por URL a
`/cursos/[id]/modulos/[moduleId]/quiz` sin haber abierto ningún módulo,
aprobarla y recibir el certificado. Ahora se valida en la página y en
`submitQuizAction`.

La regla del candado vivía escrita tres veces (ficha del curso, índice lateral,
página del módulo) y en ninguna server action. Ahora es una sola función
—`computeModuleGates` en `src/lib/utils.ts`— que usan las cinco.

---

## Tests

`npm test` (Vitest, 42 tests). Cubren la lógica pura de autorización y saneado:
candado secuencial, formato del folio, rate limit y saneado de HTML.

Lo que **no** cubren y hay que probar a mano está en `tests/README.md`, con un
checklist para las rutas públicas. Las policies RLS solo se pueden probar
contra la base viva, que todavía no tiene las tablas.
