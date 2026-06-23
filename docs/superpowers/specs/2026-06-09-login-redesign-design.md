# Rediseño de login "Amanecer sobre agua" — Alumco LMS

**Fecha:** 2026-06-09
**Estado:** Aprobado por el usuario (dirección, layout, acento y concepto elegidos vía preguntas guiadas)

## Contexto

El login actual (dos columnas, estilo Linear/Stripe) es limpio pero genérico. El usuario quiere
más personalidad. Dominio: capacitación de cuidadores de personas mayores. Marcas: KimünKo
(gota de agua ámbar `#F5A623`, "sabiduría del agua", azul `#1e3a8a`) y Alumco (logo multicolor).

## Decisiones del usuario

- **Dirección:** cálido y humano (no audaz-tech, no corporativo, no dark).
- **Layout:** dos columnas, panel de marca renovado (estructura actual probada se mantiene).
- **Acento CTA:** ámbar `#F5A623` con texto oscuro (contraste AA), reemplaza el azul del botón.
- **Animación:** expresiva — gota flotando, ondas en movimiento continuo, fade-in del formulario.
- **Concepto:** "Amanecer sobre agua".

## Diseño

### Panel izquierdo (md+)
- Gradiente vertical `#152a66` → `#1e3a8a` con resplandor radial ámbar sutil arriba a la derecha.
- 3 capas de ondas SVG en la base (blanco translúcido ×2 + ámbar translúcido), deriva horizontal
  continua a velocidades distintas (~22s/30s/38s, una en dirección inversa). Path con tangentes
  idénticas en ambos extremos para loop perfecto.
- Gota KimünKo grande (~90px) flotando (vaivén vertical ~6s), wordmark "KimünKo" + tagline debajo.
- Titular: "Nuestros cuidados son el reflejo de la **empatía**." — "empatía" en ámbar.
- Copyright abajo, sobre las ondas.

### Columna derecha
- Fondo blanco cálido (`#FCFAF6`), estructura sin card que ya validamos. Logo Alumco 200px.
- Botón "Ingresar" ámbar `#F5A623`, hover más profundo, texto `slate-900`.
- Links en `amber-700` (AA sobre blanco). Focus rings ámbar en inputs.
- Fade-in suave (translateY + opacity) del bloque del formulario al cargar.
- Móvil: franja superior decorativa con el gradiente azul + onda (el panel se oculta).

### Animaciones
- CSS puro en `globals.css`: `login-wave-drift`, `login-float`, `login-fade-up`.
- Todo desactivado bajo `prefers-reduced-motion: reduce`.

### Restricciones
- Sin scroll en desktop (`md:h-dvh md:overflow-hidden`); las ondas son absolutas, no agregan altura.
- Sin librerías nuevas. `ForgotPasswordForm` hereda los mismos acentos.

## Archivos

- `src/app/(auth)/login/page.tsx` — estructura, panel, ondas, móvil
- `src/components/alumco/LoginForm.tsx` — CTA/links/focus ámbar
- `src/components/alumco/ForgotPasswordForm.tsx` — ídem
- `src/app/globals.css` — keyframes + clases utilitarias + reduced-motion
