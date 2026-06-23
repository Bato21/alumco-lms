# Rediseño DIDASKO — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Aplicar tal cual el rediseño visual DIDASKO (neo-brutalista navy+ámbar, ref. sitio Didasko framer) al LMS Next.js existente, conservando datos reales y lógica.

**Architecture:** Portar el CSS del diseño (`alumco.css` + `tema-didasko.css`) como capa global con `data-tema="didasko"` siempre activo; añadir fuente Archivo; crear primitivas TSX espejo de `lib/ui.jsx`; reconstruir shells y páginas con el marcado del mockup, cableado a los datos Supabase reales.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, shadcn, Supabase, next/font (Geist + Archivo + Fraunces).

**Fuente de diseño (disponible en disco):** `/tmp/redise_design/` — `styles/*.css`, `lib/*.jsx`, `Alumco LMS.html`, `Móvil Trabajador.html`. Referencia visual: `uploads/screencapture-didasko-framer-*.png`.

**Verificación por fase (en vez de TDD unitario):** `npm run build` + `npm run lint` sin errores nuevos; comparación visual contra el mockup correspondiente.

---

## Fase 1 — Fundamentos: tokens, fuentes, primitivas

### Task 1.1: Capa CSS del tema DIDASKO

**Files:**
- Create: `src/app/didasko.css` (contenido literal de `alumco.css` + `tema-didasko.css` concatenados)
- Modify: `src/app/globals.css` (importar didasko.css; alinear `--primary` navy; no romper accesibilidad existente)
- Modify: `src/app/layout.tsx` (body `data-tema="didasko"`)

- [ ] **Step 1:** Copiar `/tmp/redise_design/styles/alumco.css` + `/tmp/redise_design/styles/tema-didasko.css` a `src/app/didasko.css` (uno tras otro, sin cambios).
- [ ] **Step 2:** En `globals.css`, `@import "./didasko.css";` después de tailwind. Quitar el doble `@import "tailwindcss"` duplicado. Conservar reglas de accesibilidad (focus-visible, reduced-motion) pero quitar `html{font-size:18px}` si rompe escala didasko (evaluar: didasko usa 16px base; mantener 18px puede agrandar todo — decisión: bajar a 16px en superficies didasko vía body, conservar 18px solo si no choca). Mantener `min-height:48px` en controles (accesibilidad adultos mayores) ya que didasko usa min 44px en botones — compatible.
- [ ] **Step 3:** En `layout.tsx`, `<body data-tema="didasko" ...>`.
- [ ] **Step 4:** `npm run build`. Esperado: compila.
- [ ] **Step 5:** Commit `feat(ui): capa CSS tema DIDASKO + body data-tema`.

### Task 1.2: Fuente Archivo + mapeo de variables

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/didasko.css` (mapear `--fuente-display`/`--fuente-cuerpo` a variables next/font)

- [ ] **Step 1:** En `layout.tsx`, importar `Archivo` de `next/font/google` con `variable: '--font-display-didasko'`. Mantener Geist (`--font-sans`) y Fraunces.
- [ ] **Step 2:** Añadir las variables al `<body className>`.
- [ ] **Step 3:** En didasko.css, en `body[data-tema="didasko"]` setear `--fuente-display: var(--font-display-didasko), "Archivo", sans-serif;` y base `--fuente-cuerpo: var(--font-sans), "Geist", sans-serif;`. La regla `font-family: var(--fuente-cuerpo)` en `body` debe aplicar.
- [ ] **Step 4:** `npm run build`. Verificar fuentes cargan.
- [ ] **Step 5:** Commit `feat(ui): fuente Archivo para display didasko`.

### Task 1.3: Primitivas del sistema de diseño (TSX)

**Files:**
- Create: `src/components/alumco/ds/Icono.tsx` (port literal del objeto `I` + componente `Icono` de `lib/ui.jsx`)
- Create: `src/components/alumco/ds/index.tsx` (Gota, MarcaAlumco, Onda, Avatar, Badge, BadgeEstado, Progreso, Vacio, Skeleton, TarjetaStat, Anillo, EncabezadoPagina — port de `lib/ui.jsx`, tipados, `'use client'` donde haya estado)

- [ ] **Step 1:** Portar `Icono` con todos los paths SVG (mismos nombres: inicio, cursos, usuarios, sede, reportes, certificado, perfil, campana, lupa, mas, chevD, chevR, flechaIzq, check, reloj, alerta, salir, editar, ojo, arrastrar, basura, play, descargar, cerrar, calendario, doc, video, quiz, ajustes, copiar). Props `{ n, s, sw }`.
- [ ] **Step 2:** Portar resto de primitivas. Firmas idénticas al mockup. Tipar props.
- [ ] **Step 3:** `npm run build`. Esperado: compila sin errores de tipos.
- [ ] **Step 4:** Commit `feat(ui): primitivas DS DIDASKO (Icono, Badge, Anillo, etc.)`.

---

## Fase 2 — Login / Auth

### Task 2.1: Página de login split-panel

**Files:**
- Modify: `src/app/(auth)/login/page.tsx` y/o `src/app/(auth)/layout.tsx`
- Modify: `src/components/alumco/LoginForm.tsx`
- Origen mockup: `Alumco LMS.html` líneas 47-128 (`PantallaLogin`)

- [ ] **Step 1:** Layout split: panel marca 44% (`--grad-marca`, Gota s=52, MarcaAlumco, t-eyebrow, t-display con `<em>` ámbar, Onda al pie, copyright) + panel formulario centrado (MarcaAlumco, h2 "Ingreso a la plataforma", campos `.campo/.input`, botón `.btn.btn-primary.btn-lg`).
- [ ] **Step 2:** Conservar lógica de `LoginForm` (loginAction, showForgot, showPassword, capsLock). Reemplazar clases shadcn por clases didasko (`.input`, `.btn`, `.campo`). Mantener `id="email"`/`id="password"` (las animaciones mascota dependen de ellos si se conservan).
- [ ] **Step 3:** `npm run build` + revisar `/login`.
- [ ] **Step 4:** Commit `feat(ui): login split-panel DIDASKO`.

---

## Fase 3 — Área admin

### Task 3.1: AdminShell (sidebar + topbar)

**Files:**
- Modify: `src/components/alumco/AdminSidebar.tsx`, `src/app/admin/TopBar.tsx`, `src/app/admin/layout.tsx`
- Origen: `lib/admin.jsx` 11-69 (`AdminShell`); didasko sidebar = `tema-didasko.css` 197-224

- [ ] **Step 1:** Sidebar didasko: contenedor `.sidebar` (blanco, borde navy 2px vía tema), MarcaAlumco, `.sidebar-nav` con `.nav-item`/`.nav-item.activo` y `.nav-seccion` ("Gestión", "Cuenta"), footer avatar + botón salir. Conservar drawer móvil y rutas reales (Dashboard, Cursos, Trabajadores, Sedes, Reportes, Solicitudes, Certificados, Mi perfil).
- [ ] **Step 2:** Topbar `.topbar`: búsqueda `.input-busqueda` redonda, campana con punto ámbar (conservar NotificationBell), avatar admin. Conservar comportamiento show/hide en scroll.
- [ ] **Step 3:** layout.tsx: fondo crema (lo da el tema), `data-tema` ya global. Ajustar paddings del main a `28px 32px` máx 1240px.
- [ ] **Step 4:** `npm run build` + revisar `/admin/dashboard` (shell).
- [ ] **Step 5:** Commit `feat(ui): AdminShell DIDASKO (sidebar blanco + topbar)`.

### Task 3.2: Dashboard admin variante B

**Files:**
- Modify: `src/app/admin/dashboard/page.tsx`
- Origen: `lib/admin.jsx` 173-226 (`DashAdminB`), 271-284 (`PaginaAdminDashboard` sin encabezado en B)

- [ ] **Step 1:** Conservar TODO el bloque de queries/derivaciones reales (totalWorkers, approvalRate, publishedCourses, certificatesThisMonth, sede rates, recentActivity, topCourses, workers con pendientes).
- [ ] **Step 2:** Reemplazar marcado por: hero `.card.bloque-marca` (grad-marca) con t-eyebrow mes, t-display saludo "Buenos días, {firstName}" + `<em>` N vencimientos, 3 stats inline, Onda; grilla 1.5fr/1fr: tabla "Requieren seguimiento" (workers con pendientes, Avatar+nombre+sede+pendientes+BadgeEstado) + columna (VencimientosProximos derivado de alerts + BarrasSedes con sedes reales).
- [ ] **Step 3:** Portar helpers `VencimientosProximos`, `BarrasSedes` como componentes locales/cliente alimentados por datos reales (no mock). `ActividadReciente` real ya existe.
- [ ] **Step 4:** `npm run build` + revisar dashboard.
- [ ] **Step 5:** Commit `feat(ui): dashboard admin variante B DIDASKO`.

### Task 3.3: Cursos admin (card icono)

**Files:**
- Modify: `src/app/admin/cursos/page.tsx`, `src/components/alumco/CourseCard.tsx` (o nuevo `CursoCardAdmin`)
- Origen: `lib/admin.jsx` 322-393 (estilo "icono" + `PaginaCursosAdmin`)

- [ ] **Step 1:** EncabezadoPagina "Gestión de cursos" + botón "Nueva capacitación". Chips de filtro (Todos/Publicados/Borradores) con conteos reales.
- [ ] **Step 2:** Grilla `repeat(auto-fill,minmax(330px,1fr))` de `CursoCardAdmin` estilo icono (ícono ámbar, BadgeEstado, badges obligatorio, meta módulos/duración/vence, Progreso si publicado, botones Editar/Ver reporte). Datos reales de cursos.
- [ ] **Step 3:** `npm run build` + revisar `/admin/cursos`.
- [ ] **Step 4:** Commit `feat(ui): cursos admin card icono DIDASKO`.

### Task 3.4: Trabajadores

**Files:**
- Modify: `src/app/admin/trabajadores/page.tsx` + `WorkersTable.tsx`/`SuspendedTable.tsx`
- Origen: `lib/admin.jsx` 398-491

- [ ] **Step 1:** EncabezadoPagina + botón invitar. Buscador `.input-busqueda` + select sede. Tabla `.tabla` (Avatar+nombre+rol, sede, Progreso cumplimiento, pendientes, última actividad, BadgeEstado, chevR). Datos reales.
- [ ] **Step 2:** Conservar modal/flujo de invitar/acciones existentes con clases didasko.
- [ ] **Step 3:** `npm run build` + revisar.
- [ ] **Step 4:** Commit `feat(ui): trabajadores DIDASKO`.

### Task 3.5: Sedes + Reportes

**Files:**
- Modify: `src/app/admin/sedes/*`, `src/app/admin/reportes/*`
- Origen: `lib/admin.jsx` 495-605

- [ ] **Step 1:** Sedes: cards con Anillo de cumplimiento + stats (residentes/trabajadores/%) + directora. Datos reales (sede_1/sede_2). Card "agregar sede" punteada.
- [ ] **Step 2:** Reportes: stats (TarjetaStat) + tabla avance por curso + brechas críticas + BarrasSedes. Datos reales.
- [ ] **Step 3:** `npm run build` + revisar.
- [ ] **Step 4:** Commit `feat(ui): sedes y reportes DIDASKO`.

### Task 3.6: Páginas admin restantes (certificados, perfil, builder, solicitudes)

**Files:** `src/app/admin/certificados/*`, `src/app/admin/perfil/*`, `src/components/alumco/CourseBuilder/*`, solicitudes.

- [ ] **Step 1:** Restilizar con primitivas didasko (EncabezadoPagina, card, tabla, btn, badge) conservando lógica. Builder: paleta/canvas/propiedades con cards + botones didasko.
- [ ] **Step 2:** `npm run build` + revisar cada ruta.
- [ ] **Step 3:** Commit `feat(ui): páginas admin restantes DIDASKO`.

---

## Fase 4 — Área trabajador

### Task 4.1: WorkerShell (topbar desktop + bottom nav móvil)

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`, `(dashboard)/TopBar.tsx`, `src/components/alumco/WorkerSidebar.tsx` (→ reemplazar por topbar), `src/components/alumco/BottomNav.tsx`
- Origen: `lib/worker.jsx` 9-44 (`WorkerShell`); `Móvil Trabajador.html` 40-58 (`TabsMovil`)

- [ ] **Step 1:** Desktop: topbar `.topbar` con MarcaAlumco compacta + nav inline (Inicio /cursos→? real routes: /inicio, /cursos, /mis-certificados) con estado activo ámbar, campana, avatar→/perfil. Quitar sidebar lateral en worker.
- [ ] **Step 2:** Móvil: BottomNav 4 destinos (Inicio, Cursos, Certificados, Perfil) estilo `TabsMovil` (ícono + label, activo ámbar). main con padding inferior para no tapar.
- [ ] **Step 3:** `npm run build` + revisar `/inicio` desktop y móvil.
- [ ] **Step 4:** Commit `feat(ui): WorkerShell DIDASKO (topbar + bottom nav)`.

### Task 4.2: Inicio trabajador variante A

**Files:** `src/app/(dashboard)/inicio/page.tsx`
**Origen:** `lib/worker.jsx` 84-152 (`SaludoTrab`, `CardContinuar`, `InicioTrabA`)

- [ ] **Step 1:** Conservar datos reales (curso en progreso, cursos asignados, alertas de vencimiento). Marcado: SaludoTrab (eyebrow fecha + t-display "Hola {nombre}, sigamos aprendiendo") + CardContinuar (hero navy + Anillo % real) + "Tus próximos cursos" (CursoCardTrab reales) + tarjeta alerta vencimiento real.
- [ ] **Step 2:** `npm run build` + revisar.
- [ ] **Step 3:** Commit `feat(ui): inicio trabajador variante A DIDASKO`.

### Task 4.3: Catálogo + CursoCardTrab

**Files:** `src/app/(dashboard)/cursos/page.tsx`
**Origen:** `lib/worker.jsx` 47-78, 259-280

- [ ] **Step 1:** h1 "Mis cursos" + chips categoría + grilla CursoCardTrab (ícono estado, BadgeEstado, meta, Progreso, botón Comenzar/Continuar/Repasar). Datos reales.
- [ ] **Step 2:** `npm run build` + revisar.
- [ ] **Step 3:** Commit `feat(ui): catálogo trabajador DIDASKO`.

### Task 4.4: Detalle de curso + módulos + quiz

**Files:** `src/app/(dashboard)/cursos/[id]/page.tsx`, `.../modulos/[moduleId]/*`, `.../quiz/QuizClient.tsx`
**Origen:** `lib/worker.jsx` 283-436

- [ ] **Step 1:** Hero navy del curso (badges, t-display título, meta, onda) + lista de módulos (ícono por tipo/estado, BadgeEstado, chevR) + columna lateral (Anillo progreso + CTA + nota certificado). Datos reales.
- [ ] **Step 2:** Quiz: portar estética `QuizJugador` (Badge pregunta N, Progreso, opciones con radio ámbar, navegación, pantalla resultado con Anillo) sobre la lógica real de `QuizClient`.
- [ ] **Step 3:** `npm run build` + revisar flujo curso→módulo→quiz.
- [ ] **Step 4:** Commit `feat(ui): detalle de curso y quiz DIDASKO`.

### Task 4.5: Certificados + Perfil trabajador

**Files:** `src/app/(dashboard)/mis-certificados/*`, `src/app/(dashboard)/perfil/*`
**Origen:** `lib/worker.jsx` 439-540

- [ ] **Step 1:** Certificados: cards con cabecera navy "Certificado Alumco" + BadgeEstado + datos (emitido/vence/folio) + botones Ver/Descargar (conservar descarga PDF real).
- [ ] **Step 2:** Perfil: card cabecera (Avatar grande + badges) + "Mis datos" (campos) + "Avisos" (toggles) + cambiar clave. Conservar lógica de ProfileClient.
- [ ] **Step 3:** `npm run build` + revisar.
- [ ] **Step 4:** Commit `feat(ui): certificados y perfil trabajador DIDASKO`.

---

## Fase 5 — Pulido y verificación final

### Task 5.1: Build, lint, responsive, accesibilidad

- [ ] **Step 1:** `npm run build` y `npm run lint` limpios.
- [ ] **Step 2:** Revisar responsive (móvil/tablet/desktop) en login, dashboard, inicio, curso, quiz.
- [ ] **Step 3:** Verificar focus-visible, targets ≥44px, `prefers-reduced-motion`.
- [ ] **Step 4:** Comparación visual final contra `Alumco LMS.html` (dash B, inicio A, card icono) y `Móvil Trabajador.html`.
- [ ] **Step 5:** Commit final `chore: pulido rediseño DIDASKO`.

---

## Self-Review

- **Cobertura spec:** Fundamentos (F1) ✓, Login (F2) ✓, Admin shell+5 páginas+extras (F3) ✓, Worker shell+5 páginas+móvil (F4) ✓, verificación (F5) ✓. Variantes dash B / inicio A / card icono cubiertas en 3.2/4.2/3.3.
- **Datos reales:** cada tarea de página dice explícitamente "conservar datos reales / lógica".
- **Reconciliaciones:** nav worker (topbar+bottom nav), sedes reales, iconos propios — documentadas en spec y F4.1/3.5.
- **Riesgo conocido:** `html{font-size:18px}` actual vs base 16px didasko → resuelto en 1.1 step 2. Tokens shadcn (oklch) vs didasko → didasko gana en superficies rediseñadas; shadcn solo donde queden componentes sin tocar.
