# Landing Page Alumco — Diseño

**Fecha:** 2026-06-17
**Branch:** `andydidankolanding`
**Enfoque:** A — "Amanecer editorial" (reusa design system de la plataforma)

## Objetivo

Reemplazar la redirección de `/` por una landing page institucional de la ONG
Alumco. El cliente debe reconocer su sitio actual (ongalumco.cl) pero mejorado:
mismo contenido, hero captivante, diseño cohesivo con la plataforma de
capacitación. Botón "Ingresar" lleva a `/login`. El resto de la plataforma queda
intacto.

## Decisiones tomadas

| Tema | Decisión |
|------|----------|
| Acceso plataforma | Botón "Ingresar" → `/login` (no login embebido) |
| Contenido | Institucional ONG Alumco (igual que sitio actual, pulido) |
| Dirección visual | "Amanecer editorial" — reusa tokens de `didasko.css` |
| Form contacto | Solo visual (sin backend, sin mailto) |
| Íconos valores | `lucide-react` (ya instalado, `^0.577.0`) |
| Foto hero | `public/login-hero.jpg` como placeholder (swappable) |

## Design system (existente, reusar)

- Tokens en `src/app/didasko.css`: `--azul-950/900/800`, `--ambar`, `--crema`,
  `--tinta`, sombras `--sombra-1/2/3`, radios `--radio-s/m/l`.
- Tipografía: Fraunces (display, `--fuente-display`) + Geist (cuerpo,
  `--fuente-cuerpo`).
- Gradiente marca: `--grad-marca`. Tinte navy + glow ámbar igual que el panel
  del login (`src/app/(auth)/login/page.tsx`).
- Tailwind v4 (sin `tailwind.config`); estilos vía utilidades + CSS de tokens.

## Arquitectura

```
src/app/page.tsx                          # renderiza la landing (ya no redirige)
src/components/alumco/landing/
  ├── LandingNav.tsx        (client)      # sticky, scroll state, anchors
  ├── HeroSection.tsx                     # full-bleed foto + título serif
  ├── MisionVision.tsx                    # 2 columnas
  ├── ValoresSection.tsx                  # grid 5 cards + íconos lucide
  ├── MemoriasSection.tsx                 # transparencia + 8 docs + mockup
  ├── ContactoSection.tsx   (client)      # form visual + info contacto
  └── LandingFooter.tsx                   # logo + nav + copyright
```

Cada componente tiene un único propósito y recibe su contenido inline (datos
estáticos). `page.tsx` los compone en orden. Solo `LandingNav` y
`ContactoSection` son client components (scroll state / form state); el resto
server.

## Secciones (contenido del sitio actual)

### 1. LandingNav (client)
- Logo Alumco (izq) usando `AlumcoLogo` / `LogoAlumco.png`.
- Links ancla: Inicio · Misión y Visión · Valores · Memorias · Contacto.
- Botón ámbar "Ingresar" → `/login` (Next `Link`).
- Transparente sobre el hero; al hacer scroll pasa a fondo crema sólido con
  sombra suave (estado vía `useState` + scroll listener / IntersectionObserver).
- Responsive: menú hamburguesa en móvil.

### 2. HeroSection
- Foto full-bleed (`login-hero.jpg`), tinte navy (`linear-gradient` navy) +
  resplandor ámbar, grano de película (`film-grain`) — mismo tratamiento que el
  panel del login.
- Título Fraunces: **"Nuestros Cuidados son el reflejo de la Empatía."**
  ("Empatía" en ámbar).
- Subtítulo: "Dedicadas a brindar el más alto estándar de cuidado para nuestras
  personas mayores."
- CTAs: "Contacto" (ancla #contacto) + "Ingresar a la plataforma" → `/login`.
- Indicador de scroll al pie.

### 3. MisionVision
- Dos columnas (stack en móvil), headings serif grandes, regla acento.
- **Misión:** "Brindar a los y las residentes de ELEAM una atención integral, de
  calidad y centrada en la persona desde un enfoque de derechos, considerando
  sus necesidades en las áreas: biomédica, funcional, social, mental y espiritual
  con el apoyo de sus personas significativas, realizando una gestión eficiente
  de los recursos disponibles."
- **Visión:** "Ser un ELEAM de referencia a nivel nacional especializado en
  brindar una atención transdisciplinaria dirigida a mejorar la calidad de vida
  de las personas mayores durante toda su estadía."

### 4. ValoresSection
- Grid 5 cards (3 + 2 centradas, responsive), sombra `--sombra-1`, hover lift.
- Cada card: ícono `lucide-react` + texto. Mapeo:
  1. Transparencia/coherencia — `Handshake` o `ShieldCheck`
  2. Constancia/adaptación — `RefreshCw`
  3. Actitud positiva/empática — `Smile` / `HeartHandshake`
  4. Equipo/comunidad — `Users`
  5. Gestión de calidad/excelencia — `Award`
- Textos:
  1. "Somos transparentes y actuamos con coherencia."
  2. "Somos constantes, aprendemos y nos adaptamos a los cambios."
  3. "Tenemos una actitud positiva y empática."
  4. "Somos un equipo que se coordina con la comunidad para realizar mejoras
     sociales."
  5. "Desarrollamos una gestión de calidad para alcanzar la excelencia."

### 5. MemoriasSection
- Texto: "La transparencia financiera es fundamental para nosotros. A lo largo
  del año, hemos gestionado nuestros recursos con responsabilidad y eficiencia,
  asegurando que cada donación se utilice para el beneficio directo de nuestros
  residentes. Nuestro compromiso con la integridad financiera se refleja en cada
  partida de gastos."
- 8 docs como cards descargables (visual, `#` href placeholder): CONVENIO,
  ESTADO FINANCIERO, BALANCE, MEMORIAL, NÓMINA DE DIRECTORIO, PLAN VIGENTE
  (PICV), PRESUPUESTO ADJUDICADO, RECURSOS RECIBIDOS. Ícono `FileText` + flecha
  descarga.
- Mockup tablet/dispositivo a la derecha mostrando marca Alumco.

### 6. ContactoSection (client) — solo visual
- Form: Nombre, Correo electrónico, Mensaje, botón "Enviar". Sin submit real
  (estado local; el botón no envía a backend en v1).
- Info de contacto: Correo Electrónico `da.ehualpen@gmail.com`; Directora Técnica
  ELEAM Hualpén `dt.ehualpen@gmail.com`; Redes Sociales: Instagram (ícono
  `lucide` `Instagram`).

### 7. LandingFooter
- Logo Alumco, links ancla repetidos, "Copyright © ONG ALUMCO".

## Comportamiento / interacción
- Scroll suave en anchors (`scroll-behavior: smooth` o `scrollIntoView`).
- Nav cambia de estado al pasar el hero.
- Hover lift en cards de valores y docs.
- Responsive mobile-first (hero, grids, nav hamburguesa).

## Fuera de alcance (YAGNI)
- Backend del form de contacto (solo visual).
- Descarga real de documentos de memorias (hrefs placeholder).
- Cambios en login / plataforma / rutas existentes.
- i18n (todo en español).

## Criterios de éxito
- `/` muestra la landing (ya no redirige a `/cursos`).
- Todo el contenido del sitio actual presente y legible.
- Hero captivante full-bleed coherente con el login.
- Responsive en móvil y desktop.
- Botón "Ingresar" funciona → `/login`.
- Build sin errores.
