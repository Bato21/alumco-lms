# Product Context — KimünKo

Fuente primaria: `docs/VIDEO_BRIEF.md` (§ 1, § 2) y `docs/GUIA_GRABACION.md`.
Entorno verificado a mano contra `https://kimunko.vercel.app` el 2026-08-16.

## Product

- **Name:** KimünKo — "sabiduría del agua". El repositorio es `alumco-lms`; KimünKo es
  el nombre de producto de cara al usuario.
- **URL:** https://kimunko.vercel.app (dominio de grabación; sirve `main`).
  **Nunca** `alumcotest.vercel.app`, que sirve una rama de julio sin verificación
  pública de certificados.
- **One-liner:** Plataforma de capacitación asíncrona de ONG Alumco que homologa
  conocimientos entre sus ELEAM sin sacar al personal de turno, y deja evidencia
  auditable de quién se capacitó, en qué y cuándo.
- **Tech stack:** Next.js 16 (App Router), TypeScript estricto, Supabase
  (Auth + PostgreSQL + Storage), Vercel. PWA instalable (`src/app/manifest.ts`,
  `public/sw.js`) con Web Push real vía VAPID.

## Audience

- **Who:** doble, y las dos ven el mismo video.
  1. **La profesora de la defensa académica.** Evalúa rigor: que el problema esté
     bien planteado, que la solución sea coherente y que lo mostrado funcione de
     verdad. Le importa el *por qué* — la norma, la trazabilidad.
  2. **Valentina Garrido, Product Owner de ONG Alumco.** Evalúa utilidad: si le
     sirve a su equipo, si el personal de turno lo usará desde el teléfono, si le
     resuelve la auditoría de SENAMA. Le importa el *qué*.

  Regla de tono que impone esa dualidad: sostener el argumento normativo mostrando
  pantallas reales en uso. Abstracto pierde a Valentina; recorrido de UI pierde a la
  profesora. Cada beat sirve a las dos a la vez.

  Los usuarios retratados son trabajadores de ELEAM: rango etario amplio,
  alfabetización digital variable, mayoría en móvil.

- **Pain points:**
  1. El Decreto 20/2022 exige un mínimo de 22 horas anuales de capacitación por
     trabajador, y hoy esa evidencia vive en planillas, correos y papeles sueltos.
  2. La capacitación presencial choca con el trabajo por turnos: no se puede vaciar
     una sede para una charla.
  3. Dos sedes con conocimientos desiguales, sin forma de homologarlos.
  4. Ante una fiscalización de SENAMA no hay un registro consultable de quién se
     capacitó, en qué y cuándo.

- **Desired action:** visitar el sitio. La placa final muestra `kimunko.vercel.app`
  y cierra con "KimünKo. Sabiduría del agua." No vende: invita a comprobarlo.

- **Emotional journey:** desorden → reconocimiento → alivio → confianza.
  Empieza en el papeleo (el espectador reconoce su propio caos), sigue a Camila
  resolviéndolo sin fricción, y cierra en la verificación pública del certificado,
  que es donde el alivio se vuelve confianza institucional.

## Brand

- **Colors:** paleta Alumco — azul primario `#2B4FA0`, ámbar `#F5A623`, verde
  `#27AE60`, rojo `#E74C3C`, fondo `#F5F5F5`, tinta `#1A1A2E`.
  **Ojo:** la identidad no es plana. Hay paletas con scope que redefinen tokens —
  `.paleta-azul` (vista trabajador), `.paleta-oliva` (vista admin) y `.landing-page`.
  El color cambia según la vista que se esté filmando.
- **Typography:** la de la propia plataforma; se deriva de las capturas.
- **Tone:** institucional y cálido. Cuidado, no corporativo. Español de Chile.
- **Visual style:** derivar desde las capturas. **No** importar un preset de marca
  ajena: la plataforma acaba de pasar una revisión de contraste WCAG 2.2 AA con
  hallazgos cerrados, y un preset pisaría colores ya medidos.

## Video Concept

- **Type:** promo
- **Angle:** **Jornada + dolor inicial.** El beat 1 abre en el papeleo; los beats 3
  a 6 siguen a una sola persona ficticia —Camila Fuentes Ortega, auxiliar de
  enfermería en Hualpén— a lo largo de una jornada verosímil. Un catálogo de
  funcionalidades no se recuerda; una persona haciendo su trabajo, sí.
- **Duration:** el brief propone 90 s como techo duro. **Pendiente de confirmar en
  Fase 1** — es una elección del usuario, no una derivación de esta investigación.
- **Theme:** el brief propone claro, derivado de la propia UI (fondo `#F5F5F5`).
  **Pendiente de confirmar en Fase 1.**
- **Voice:** **ninguna.** Decidido el 2026-08-16: la entrega de este pipeline es
  **muda**. Solo importa la imagen; el usuario añade música y voz en off después,
  en su propio editor. El campo `voice` se rellenará con un valor `elevenlabs:`
  nominal porque `validate_brief.py:354-360` impone un vocabulario cerrado sin
  opción "ninguna" — es un requisito del validador, no una decisión creativa.
- **Music:** `none`.

> **El cronómetro pierde su red.** Normalmente la Fase 5 re-ajusta las escenas
> contra la locución. Sin voz en el pipeline eso no ocurre: las duraciones del
> storyboard son la única verdad, y la imagen debe caer exacta en las ventanas del
> guion (0-10, 10-20, 20-38, 38-54, 54-70, 70-84, 84-90) o la voz en off no calzará
> al montarla después.

## Features to Highlight

1. **Cursos con evaluación y avance registrado** — es el núcleo del cumplimiento:
   el trabajador ve lo asignado a su rol, revisa el material, rinde la evaluación y
   el avance queda registrado al instante. Sin planillas ni recordatorios manuales.
2. **Eventos con secciones, encargados y tareas con fecha** — demuestra que la
   plataforma no es un repositorio de videos sino una herramienta de coordinación.
   Las restricciones alimentarias quedan visibles antes de comprar.
3. **PWA con notificaciones push reales** — la administradora asigna desde el
   computador y a Camila le llega al teléfono. Es el argumento de que la plataforma
   alcanza al personal donde efectivamente está: en turno, con el celular encima.
4. **Certificado con folio verificable públicamente** — cierra el argumento
   normativo. Un fiscalizador comprueba la autenticidad desde su propio teléfono,
   sin cuenta y sin pedirle nada a nadie.
