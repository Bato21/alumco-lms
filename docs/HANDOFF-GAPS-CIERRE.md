# Cierre de gaps — qué quedó implementado y qué falta correr

> Rama `valentin`. Complementa `docs/GAPS-CRITICOS.md`, que es el plan; esto es
> lo que efectivamente está en el código.

---

## ✅ Resuelto: los 6 archivos SQL ya están aplicados (2026-08-10)

Se corrieron los seis en la base de producción. Las features que dependían de
ellos ya no están bloqueadas.

| Archivo | Habilita | Estado |
|---|---|---|
| `certificate-verification.sql` | Folio + QR + ruta pública | ✅ aplicada — backfill sobre los 2 certificados existentes |
| `platform-settings.sql` | Objetivo anual editable | ✅ aplicada — `annual_certification_target` = 85 |
| `support-tickets.sql` | Tickets de soporte | ✅ aplicada |
| `course-feedback.sql` | Valoraciones | ✅ aplicada |
| `accessibility-preferences.sql` | Preferencias persistidas | ✅ aplicada |
| `course-duplication-and-text-modules.sql` | Duplicar cursos + módulos de texto | ✅ aplicada — ver nota del enum |

**Nota sobre el enum `content_type`.** Resultó ser un enum (`video, pdf, slides,
quiz`), no un text con CHECK. El `alter type ... add value 'texto'` se corrió
por separado y en su propia transacción, no vía el bloque `DO` del archivo: ese
bloque atrapa cualquier error en un `raise notice`, así que de haber fallado
habría quedado "exitoso" sin agregar el valor, y los módulos de texto fallarían
recién al crearse. El enum quedó `video, pdf, slides, quiz, texto` (verificado).

**Verificado post-aplicación:** 5 tablas nuevas con RLS y 13 policies; 2
columnas nuevas (`courses.duplicated_from`, `modules.content_html`); los 2
folios existentes calzan con el regex de `verify.ts` y resuelven sus joins; el
trigger `tr_set_certificate_verification_code` genera folio válido en
certificados nuevos (probado con un insert revertido).

---

## ⚠️ Pendiente: variable de entorno en Vercel

**Sigue sin hacerse.** Hay que agregar en Vercel (Production y Preview) y
redesplegar:

```
NEXT_PUBLIC_SITE_URL=https://<dominio-real-de-produccion>
```

Es la base absoluta que se codifica dentro del QR de cada certificado. Si en
producción queda mal, los QR ya emitidos apuntan a un dominio equivocado — es
el único valor de esta tanda que conviene revisar antes de emitir certificados.

En `.env.local` está como `http://localhost:3000`, que es lo correcto para
desarrollo: no sirve de referencia para producción.

**Antes de fijarla, decidir cuál es el dominio bueno.** Hoy el código tiene dos
fallbacks distintos, y como máximo uno puede ser correcto:

| Archivo | Fallback si la env var falta |
|---|---|
| `src/lib/actions/auth.ts:197` | `https://alumco-lms.vercel.app` (correos de reset de contraseña) |
| `src/lib/certificates/verify.ts:101` | `https://alumco-lms-nm38.vercel.app` (QR de certificados) |

Una vez confirmado el dominio real conviene unificar ambos fallbacks, para que
un despliegue sin la variable no mande a la gente a dos dominios distintos.

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
