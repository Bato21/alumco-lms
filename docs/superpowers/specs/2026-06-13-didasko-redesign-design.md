# Rediseño visual "DIDASKO" — Alumco LMS

**Fecha:** 2026-06-13
**Estado:** Aprobado (diseño creado por el usuario en Claude Design)
**Fuente de diseño:** `Rediseño web.zip` (`/Users/andyvillarroel/Downloads/`), variante **DIDASKO** del prototipo "Amanecer sobre agua".

## Objetivo

Aplicar **tal cual** el rediseño visual DIDASKO al LMS funcional existente (Next.js 16 + React 19 + Tailwind v4 + shadcn + Supabase), conservando toda la lógica, datos reales, rutas, auth y server actions. El cambio es **solo de presentación**: estructura de marcado, tokens de color, tipografía y componentes visuales.

## Variantes finalizadas por el usuario (TWEAK_DEFAULTS del prototipo)

| Decisión | Valor | Significado |
|---|---|---|
| `tema` | **didasko** | Neo-brutalista con paleta Alumco (navy + ámbar) |
| `dashAdmin` | **B** | Dashboard admin = saludo/hero + alertas primero |
| `inicioTrab` | **A** | Inicio trabajador = "Continuar aprendiendo" |
| `cardCurso` | **icono** | Card de curso con ícono (no cabecera) |
| `agua` | true | Motivo de ondas decorativas activado |
| `densidad` | comoda | Densidad estándar (no compacta) |

## Sistema de diseño DIDASKO

**Paleta** (de `styles/alumco.css` + `styles/tema-didasko.css`):
- Azul marca: `--azul-950:#0f1f4d`, `--azul-900:#152a66`, `--azul-800:#1e3a8a`, `--azul-700:#2c4a9e`, `--azul-100:#dde6f5`, `--azul-50:#eef3fb`
- Ámbar: `--ambar:#F5A623`, `--ambar-600:#e08e0b`, `--ambar-700:#b45309`, `--ambar-100:#fdebc8`, `--ambar-50:#fdf6e7`
- Neutrales didasko: `--crema:#FAF6ED`, `--blanco:#FFFDF6`, `--arena-100:#F3ECDC`, `--arena-200:#E9E0CA`, `--borde:#1e3a8a`, `--borde-suave:#E5DCC4`
- Estados: ok `#2e7d5b`, peligro `#bb3a2e`, aviso `#b45309`, info `#2c4a9e` (cada uno con `-bg`)

**Rasgos didasko:**
- Fondo crema con retícula de puntos: `radial-gradient(#E0D6BA 1.2px, transparent 1.2px)` 22×22px
- Sombras duras navy: `3px 3px 0`, `4px 4px 0`, `9px 9px 0` (rgba azul)
- Bordes 2px navy en cards, botones, inputs, chips, avatares
- Radios pequeños: s 6px / m 9px / l 12px
- Esquinas mixtas: heros/filas rectas, cards de grilla alternan recta/redondeada (`nth-of-type`)
- Rellenos pastel ocasionales en cards (`nth-of-type(6n+1)` ámbar-50, `6n+4` azul-50)
- Tipografía display: **Archivo** (mayúsculas, peso 800); cuerpo: **Geist**
- `.t-display em` → resaltado ámbar tipo marcador
- `.t-eyebrow` → badge ámbar con borde navy + sombra dura
- Sidebar admin: **blanco** con borde navy; pill activa navy con sombra ámbar
- Botones: borde 2px, sombra dura, `translate(-1px,-1px)` en hover, `translate(2px,2px)` en active

**Marca:** "alumco" en minúsculas + "Kimün**Ko** · capacitación". Gota ámbar como isotipo. Ondas SVG decorativas.

## Arquitectura de la implementación

### Fase 1 — Fundamentos (tokens, fuentes, primitivas)
- Portar `alumco.css` + `tema-didasko.css` a `src/app/globals.css` (o import dedicado), con `data-tema="didasko"` siempre activo en `<body>`.
- Añadir fuente **Archivo** vía `next/font/google` en `layout.tsx`; mapear `--fuente-display`/`--fuente-cuerpo` a las variables de next/font (Archivo display, Geist cuerpo). Conservar Fraunces si se usa en login "agua", pero didasko usa Archivo.
- Resolver conflicto: `globals.css` actual tiene tokens shadcn (oklch) + Material Design + `html{font-size:18px}` + `min-height:48px` en controles. Se conserva la base de accesibilidad pero se prioriza el look didasko. Alinear `--primary` (navy) y radios para que shadcn no choque.
- Crear primitivas TSX en `src/components/alumco/ds/` espejo de `lib/ui.jsx`:
  `Icono`, `Gota`, `MarcaAlumco`, `Onda`, `Avatar`, `Badge`, `BadgeEstado`, `Progreso`, `Vacio`, `Skeleton`, `TarjetaStat`, `Anillo`, `EncabezadoPagina`. Mismas clases CSS y firmas.

### Fase 2 — Login / Auth
- Rediseñar `LoginForm` + página `(auth)/login` al patrón split-panel: 44% panel de marca "Amanecer sobre agua" (gradiente navy + gota + eyebrow + display + onda al pie) y formulario a la derecha con clases `.campo/.input/.btn`.
- Conservar toda la lógica de `LoginForm.tsx` (server action `loginAction`, caps lock, mostrar/ocultar clave, olvidé clave). Aplicar tema didasko.
- Mantener (o adaptar) las animaciones de mascota gota existentes si no chocan; el diseño didasko prioriza el split-panel.

### Fase 3 — Área admin
- **AdminShell**: sidebar blanco didasko (MarcaAlumco claro→navy, nav con pill, sección "Gestión"/"Cuenta", footer con avatar + salir) + topbar (búsqueda redonda, campana con punto ámbar, avatar). Conservar drawer móvil.
- Mapear nav real: Dashboard, Cursos, Trabajadores, Sedes, Reportes (+ Solicitudes, Certificados, Mi perfil que ya existen).
- **Dashboard (variante B)**: hero navy con saludo + N vencimientos + stats inline (trabajadores/cumplimiento/cursos) + onda; tabla "Requieren seguimiento" + "Vencimientos próximos" + "Cumplimiento por sede". Alimentar con datos reales del page.tsx actual (totalWorkers, approvalRate, publishedCourses, sede rates, recentActivity, certificados).
- **Cursos (card "icono")**, **Trabajadores** (tabla + buscador + filtro sede + modal invitar), **Sedes** (cards con anillo + stats), **Reportes** (stats + avance por curso + brechas). Conservar wiring de datos real de cada page.
- Restilizar páginas extra (certificados admin, perfil admin, builder, solicitudes) con las primitivas didasko para consistencia.

### Fase 4 — Área trabajador
- **WorkerShell**: topbar horizontal con nav inline (Inicio / Mis cursos / Certificados) + campana + avatar→perfil (desktop). En móvil: bottom nav de 4 destinos (Inicio, Cursos, Certificados, Perfil) según `Móvil Trabajador.html`.
- **Inicio (variante A)**: saludo + `CardContinuar` (hero navy con anillo) + "Tus próximos cursos" (CursoCardTrab) + tarjeta de alerta de vencimiento. Datos reales.
- **Catálogo**, **Detalle de curso + Quiz**, **Certificados**, **Perfil** (con toggles). Conservar lógica real (progreso, quiz server actions, descarga de certificados PDF).

### Fase 5 — Pulido y verificación
- `npm run build` + `npm run lint` sin errores.
- Revisar responsive, accesibilidad (focus-visible, targets ≥44px), `prefers-reduced-motion`.
- Verificar visualmente contra los mockups.

## Componentes no migrables literalmente (reconciliación)

- **Datos**: el mockup usa `window.ALUMCO` (mock). La app usa Supabase. Se conserva SIEMPRE el dato real; el mock solo define la *estructura visual*.
- **Sedes**: mockup tiene 4 ELEAM; la app real tiene sede_1/sede_2 (Hualpén/Coyhaique). Se usan las sedes reales.
- **Nav worker**: mockup desktop usa topbar nav; la app tenía WorkerSidebar. Se adopta el topbar del diseño en desktop y bottom nav en móvil.
- **Iconos**: el diseño trae sus propios SVG (`I` en ui.jsx). Se portan tal cual como componente `Icono` (no se usa lucide en superficies rediseñadas, salvo donde sea irrelevante).

## Criterios de éxito

1. El look DIDASKO (navy+ámbar, retícula de puntos, sombras duras, Archivo display, sidebar blanco) está aplicado en login, admin y trabajador.
2. Las variantes elegidas (dash B, inicio A, card icono) están implementadas.
3. Toda la funcionalidad real sigue operando (auth, navegación, datos Supabase, quiz, certificados).
4. `npm run build` pasa.
5. Fidelidad visual alta respecto a `Alumco LMS.html` y `Móvil Trabajador.html`.

## Fuera de alcance

- Cambios de backend, esquema de datos o lógica de negocio.
- El tema "agua" alternativo (solo se implementa didasko).
- El panel de tweaks del prototipo (es herramienta de diseño, no de producción).
