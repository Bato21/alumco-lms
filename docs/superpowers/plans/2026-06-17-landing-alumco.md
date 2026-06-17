# Landing Page Alumco — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la redirección de `/` por una landing page institucional de la ONG Alumco, con hero captivante, todo el contenido del sitio actual y un botón "Ingresar" → `/login`.

**Architecture:** Una página server-rendered en `src/app/page.tsx` que compone 7 componentes presentacionales en `src/components/alumco/landing/`. Reusa el design system existente (`didasko.css`: tokens, clases `.btn-*`, `.card`, `.t-display`, `film-grain`; componentes ds `Onda`, `MarcaAlumco`). Solo `LandingNav` y `ContactoSection` son client components.

**Tech Stack:** Next.js (App Router), React, Tailwind v4 (utilidades), `lucide-react` para íconos, CSS tokens de `didasko.css`.

## Global Constraints

- Todo el copy en español (es-CL). Sin i18n.
- Reusar tokens y clases de `src/app/didasko.css` — NO crear un sistema de estilos nuevo. Paleta: `--azul-950/900/800`, `--ambar`, `--crema`, `--tinta`; clases `.btn-primary` (ámbar), `.btn-secondary`, `.btn-marca`, `.card`, `.card-hover`, `.card-pad`, `.t-display`, `.t-eyebrow`, `film-grain`, `.entra`.
- Tipografía: Fraunces vía `.t-display` / `var(--fuente-display)`; Geist (cuerpo) por defecto.
- Íconos: `lucide-react` (`^0.577.0`, ya instalado).
- Foto hero: `public/login-hero.jpg` (placeholder swappable).
- Logo: `public/LogoAlumco.png` o componente `MarcaAlumco` de `@/components/alumco/ds`.
- NO tocar login, plataforma ni otras rutas. Único cambio fuera de `landing/`: `src/app/page.tsx`.
- Form de contacto SOLO visual (sin backend, sin mailto, sin submit real).
- Sin framework de unit tests en el repo. Ciclo de verificación por tarea: `npm run lint` + `npm run build` + check visual en `npm run dev` (http://localhost:3000).
- Responsive mobile-first.

---

### Task 1: Scaffold — contenido compartido + página base

Crea el archivo de datos compartidos (links de nav, info de contacto) y reemplaza el redirect de `page.tsx` por un shell de landing renderizable.

**Files:**
- Create: `src/components/alumco/landing/content.ts`
- Modify: `src/app/page.tsx` (actualmente solo `redirect('/cursos')`)

**Interfaces:**
- Produces:
  - `NAV_LINKS: { href: string; label: string }[]`
  - `CONTACTO: { correoGeneral: string; correoDirectora: string; instagram: string }`

- [ ] **Step 1: Crear el archivo de contenido compartido**

Create `src/components/alumco/landing/content.ts`:

```ts
export const NAV_LINKS = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#mision-vision', label: 'Misión y Visión' },
  { href: '#valores', label: 'Valores' },
  { href: '#memorias', label: 'Memorias' },
  { href: '#contacto', label: 'Contacto' },
] as const

export const CONTACTO = {
  correoGeneral: 'da.ehualpen@gmail.com',
  correoDirectora: 'dt.ehualpen@gmail.com',
  instagram: 'https://instagram.com',
} as const
```

- [ ] **Step 2: Reemplazar `page.tsx` por el shell de landing**

Replace the entire contents of `src/app/page.tsx`:

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ONG Alumco — Cuidado con empatía para personas mayores',
  description:
    'ELEAM dedicado a brindar atención integral, de calidad y centrada en la persona para nuestras personas mayores.',
}

export default function LandingPage() {
  return (
    <main style={{ background: 'var(--crema)', color: 'var(--tinta)' }}>
      <section id="inicio" style={{ padding: '120px 24px', textAlign: 'center' }}>
        <h1 className="t-display" style={{ fontSize: 40 }}>
          ONG Alumco
        </h1>
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Verificar lint + build**

Run: `npm run lint && npm run build`
Expected: PASS, sin errores. (El redirect anterior queda eliminado; `/` ahora renderiza la landing shell.)

- [ ] **Step 4: Verificación visual**

Run: `npm run dev`, abrir http://localhost:3000
Expected: Se ve "ONG Alumco" centrado sobre fondo crema. NO redirige a `/cursos`.

- [ ] **Step 5: Commit**

```bash
git add src/components/alumco/landing/content.ts src/app/page.tsx
git commit -m "feat(landing): scaffold página base + contenido compartido"
```

---

### Task 2: LandingNav (client)

Barra de navegación sticky: transparente sobre el hero, fondo crema sólido al hacer scroll. Logo, anchors, botón "Ingresar".

**Files:**
- Create: `src/components/alumco/landing/LandingNav.tsx`
- Modify: `src/app/page.tsx` (montar `<LandingNav />` arriba del `<main>`)

**Interfaces:**
- Consumes: `NAV_LINKS` de `./content`
- Produces: `LandingNav` (default export React component, sin props)

- [ ] **Step 1: Crear el componente**

Create `src/components/alumco/landing/LandingNav.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { NAV_LINKS } from './content'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'background 0.25s ease, box-shadow 0.25s ease',
        background: scrolled ? 'rgba(252,250,246,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(140%) blur(8px)' : 'none',
        boxShadow: scrolled ? 'var(--sombra-1)' : 'none',
      }}
    >
      <nav
        style={{
          maxWidth: 1160,
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link href="#inicio" aria-label="ONG Alumco — inicio" style={{ display: 'flex', alignItems: 'center' }}>
          <Image src="/LogoAlumco.png" alt="ONG Alumco" width={132} height={44} priority style={{ objectFit: 'contain' }} />
        </Link>

        {/* Links desktop */}
        <div className="landing-nav-links" style={{ alignItems: 'center', gap: 28 }}>
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                color: scrolled ? 'var(--tinta-2)' : 'rgba(255,255,255,0.9)',
                fontWeight: 500,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              {l.label}
            </a>
          ))}
          <Link href="/login" className="btn btn-primary" style={{ marginLeft: 8 }}>
            Ingresar
          </Link>
        </div>

        {/* Toggle móvil */}
        <button
          type="button"
          className="landing-nav-toggle btn-icon"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{ color: scrolled ? 'var(--tinta)' : '#fff', background: 'transparent', border: 'none' }}
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {/* Menú móvil desplegable */}
      {open && (
        <div
          className="landing-nav-mobile"
          style={{
            background: 'var(--crema)',
            borderTop: '1px solid var(--borde-suave)',
            padding: '12px 24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{ color: 'var(--tinta-2)', fontWeight: 500, padding: '10px 0', textDecoration: 'none' }}
            >
              {l.label}
            </a>
          ))}
          <Link href="/login" className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setOpen(false)}>
            Ingresar
          </Link>
        </div>
      )}
    </header>
  )
}
```

- [ ] **Step 2: Añadir CSS responsive para mostrar/ocultar links vs toggle**

Append to `src/app/globals.css`:

```css
/* Landing nav — responsive */
.landing-nav-links { display: flex; }
.landing-nav-toggle { display: none; }
.landing-nav-mobile { display: flex; }
@media (max-width: 820px) {
  .landing-nav-links { display: none !important; }
  .landing-nav-toggle { display: inline-flex !important; }
}
@media (min-width: 821px) {
  .landing-nav-mobile { display: none !important; }
}
html { scroll-behavior: smooth; }
```

- [ ] **Step 3: Montar en `page.tsx`**

In `src/app/page.tsx`, add the import and render `<LandingNav />` before `<main>`:

```tsx
import type { Metadata } from 'next'
import LandingNav from '@/components/alumco/landing/LandingNav'

export const metadata: Metadata = {
  title: 'ONG Alumco — Cuidado con empatía para personas mayores',
  description:
    'ELEAM dedicado a brindar atención integral, de calidad y centrada en la persona para nuestras personas mayores.',
}

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <main style={{ background: 'var(--crema)', color: 'var(--tinta)' }}>
        <section id="inicio" style={{ padding: '120px 24px', textAlign: 'center' }}>
          <h1 className="t-display" style={{ fontSize: 40 }}>
            ONG Alumco
          </h1>
        </section>
      </main>
    </>
  )
}
```

- [ ] **Step 4: Verificar lint + build**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 5: Verificación visual**

Run: `npm run dev`, abrir http://localhost:3000.
Expected: Nav fija arriba. Al hacer scroll cambia a fondo crema con sombra. En móvil (DevTools < 820px) aparece el botón hamburguesa y abre menú. Botón "Ingresar" navega a `/login`.

- [ ] **Step 6: Commit**

```bash
git add src/components/alumco/landing/LandingNav.tsx src/app/globals.css src/app/page.tsx
git commit -m "feat(landing): nav sticky con scroll state y menú móvil"
```

---

### Task 3: HeroSection

Hero full-bleed con foto, tinte navy + glow ámbar (igual que el panel del login), título serif y 2 CTAs.

**Files:**
- Create: `src/components/alumco/landing/HeroSection.tsx`
- Modify: `src/app/page.tsx` (reemplazar la `<section id="inicio">` placeholder por `<HeroSection />`)

**Interfaces:**
- Produces: `HeroSection` (default export, sin props)

- [ ] **Step 1: Crear el componente**

Create `src/components/alumco/landing/HeroSection.tsx`:

```tsx
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'

export default function HeroSection() {
  return (
    <section
      id="inicio"
      className="film-grain"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        overflow: 'hidden',
        color: '#fff',
        padding: '120px 24px 80px',
      }}
    >
      <Image
        src="/login-hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
        style={{ objectFit: 'cover', transform: 'scale(1.05)' }}
      />
      {/* Tinte navy de marca */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(168deg, rgba(13,28,69,0.82) 0%, rgba(21,42,102,0.80) 55%, rgba(10,22,56,0.90) 100%)',
        }}
      />
      {/* Resplandor ámbar — el amanecer */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(80% 55% at 50% 110%, rgba(245,166,35,0.28) 0%, rgba(245,166,35,0.06) 45%, transparent 72%)',
        }}
      />
      <div className="entra" style={{ position: 'relative', zIndex: 1, maxWidth: 760 }}>
        <span className="t-eyebrow" style={{ color: 'var(--ambar)' }}>
          ◆ ELEAM · ONG Alumco
        </span>
        <h1 className="t-display" style={{ fontSize: 'clamp(38px, 6vw, 64px)', color: '#fff', marginTop: 18 }}>
          Nuestros cuidados son el reflejo de la{' '}
          <em style={{ color: 'var(--ambar)', fontStyle: 'italic' }}>empatía</em>.
        </h1>
        <p
          style={{
            color: 'rgba(255,255,255,0.82)',
            marginTop: 22,
            fontSize: 'clamp(16px, 2.2vw, 20px)',
            lineHeight: 1.6,
            maxWidth: 560,
            marginInline: 'auto',
          }}
        >
          Dedicadas a brindar el más alto estándar de cuidado para nuestras personas mayores.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 14,
            justifyContent: 'center',
            marginTop: 36,
            flexWrap: 'wrap',
          }}
        >
          <a href="#contacto" className="btn btn-primary btn-lg">
            Contacto
          </a>
          <Link
            href="/login"
            className="btn btn-lg"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
          >
            Ingresar a la plataforma
          </Link>
        </div>
      </div>
      <a
        href="#mision-vision"
        aria-label="Bajar"
        style={{
          position: 'absolute',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.7)',
          zIndex: 1,
        }}
      >
        <ChevronDown size={28} />
      </a>
    </section>
  )
}
```

- [ ] **Step 2: Montar en `page.tsx`**

In `src/app/page.tsx`, import `HeroSection` and replace the placeholder `<section id="inicio">…</section>` with `<HeroSection />`:

```tsx
import HeroSection from '@/components/alumco/landing/HeroSection'
// ...
<main style={{ background: 'var(--crema)', color: 'var(--tinta)' }}>
  <HeroSection />
</main>
```

- [ ] **Step 3: Verificar lint + build**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 4: Verificación visual**

http://localhost:3000 → Hero a pantalla completa con foto difuminada en navy + glow ámbar, título serif con "empatía" en ámbar, 2 botones. El nav transparente se ve legible encima. Flecha de scroll baja a Misión.

- [ ] **Step 5: Commit**

```bash
git add src/components/alumco/landing/HeroSection.tsx src/app/page.tsx
git commit -m "feat(landing): hero full-bleed con tinte navy y glow ámbar"
```

---

### Task 4: MisionVision

Sección de dos columnas con Misión y Visión, headings serif y regla de acento.

**Files:**
- Create: `src/components/alumco/landing/MisionVision.tsx`
- Modify: `src/app/page.tsx` (montar `<MisionVision />` después del hero)

**Interfaces:**
- Produces: `MisionVision` (default export, sin props)

- [ ] **Step 1: Crear el componente**

Create `src/components/alumco/landing/MisionVision.tsx`:

```tsx
export default function MisionVision() {
  return (
    <section id="mision-vision" style={{ padding: '96px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 56,
        }}
      >
        <div>
          <span className="t-eyebrow">◆ Quiénes somos</span>
          <h2 className="t-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginTop: 12 }}>
            Misión
          </h2>
          <div style={{ width: 56, height: 3, background: 'var(--ambar)', borderRadius: 2, margin: '18px 0 22px' }} />
          <p style={{ color: 'var(--tinta-2)', fontSize: 17, lineHeight: 1.7 }}>
            Brindar a los y las residentes de ELEAM una atención integral, de calidad y centrada en la
            persona desde un enfoque de derechos, considerando sus necesidades en las áreas: biomédica,
            funcional, social, mental y espiritual con el apoyo de sus personas significativas, realizando
            una gestión eficiente de los recursos disponibles.
          </p>
        </div>
        <div>
          <span className="t-eyebrow">◆ Hacia dónde vamos</span>
          <h2 className="t-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginTop: 12 }}>
            Visión
          </h2>
          <div style={{ width: 56, height: 3, background: 'var(--azul-700)', borderRadius: 2, margin: '18px 0 22px' }} />
          <p style={{ color: 'var(--tinta-2)', fontSize: 17, lineHeight: 1.7 }}>
            Ser un ELEAM de referencia a nivel nacional especializado en brindar una atención
            transdisciplinaria dirigida a mejorar la calidad de vida de las personas mayores durante toda
            su estadía.
          </p>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Montar en `page.tsx`**

Import `MisionVision` and render after `<HeroSection />` inside `<main>`.

- [ ] **Step 3: Verificar lint + build**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 4: Verificación visual**

http://localhost:3000 → Dos columnas (Misión ámbar / Visión azul) que colapsan a una columna en móvil. Texto legible.

- [ ] **Step 5: Commit**

```bash
git add src/components/alumco/landing/MisionVision.tsx src/app/page.tsx
git commit -m "feat(landing): sección Misión y Visión"
```

---

### Task 5: ValoresSection

Grid de 5 cards (ícono lucide + texto), sombra suave y hover lift.

**Files:**
- Create: `src/components/alumco/landing/ValoresSection.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces: `ValoresSection` (default export, sin props)

- [ ] **Step 1: Crear el componente**

Create `src/components/alumco/landing/ValoresSection.tsx`:

```tsx
import { ShieldCheck, RefreshCw, HeartHandshake, Users, Award, type LucideIcon } from 'lucide-react'

const VALORES: { icon: LucideIcon; texto: string }[] = [
  { icon: ShieldCheck, texto: 'Somos transparentes y actuamos con coherencia.' },
  { icon: RefreshCw, texto: 'Somos constantes, aprendemos y nos adaptamos a los cambios.' },
  { icon: HeartHandshake, texto: 'Tenemos una actitud positiva y empática.' },
  { icon: Users, texto: 'Somos un equipo que se coordina con la comunidad para realizar mejoras sociales.' },
  { icon: Award, texto: 'Desarrollamos una gestión de calidad para alcanzar la excelencia.' },
]

export default function ValoresSection() {
  return (
    <section
      id="valores"
      style={{ padding: '96px 24px', background: 'var(--arena-100)', borderBlock: '1px solid var(--borde-suave)' }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
        <span className="t-eyebrow">◆ Lo que nos guía</span>
        <h2 className="t-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginTop: 12 }}>
          Nuestros valores
        </h2>
        <div
          style={{
            marginTop: 48,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
          }}
        >
          {VALORES.map(({ icon: Icon, texto }) => (
            <div key={texto} className="card card-hover card-pad" style={{ textAlign: 'center', padding: 28 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: 'var(--ambar-50)',
                  color: 'var(--ambar-700)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}
              >
                <Icon size={26} strokeWidth={1.8} />
              </div>
              <p style={{ color: 'var(--tinta)', fontSize: 16, lineHeight: 1.55, fontWeight: 500 }}>{texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Montar en `page.tsx`**

Import `ValoresSection` and render after `<MisionVision />`.

- [ ] **Step 3: Verificar lint + build**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 4: Verificación visual**

http://localhost:3000 → 5 cards con íconos ámbar sobre fondo arena. Hover levanta la card. Responsive (se reacomodan).

- [ ] **Step 5: Commit**

```bash
git add src/components/alumco/landing/ValoresSection.tsx src/app/page.tsx
git commit -m "feat(landing): sección Valores con cards e íconos"
```

---

### Task 6: MemoriasSection

Texto de transparencia financiera + 8 documentos como cards descargables (visual) + mockup de dispositivo.

**Files:**
- Create: `src/components/alumco/landing/MemoriasSection.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Produces: `MemoriasSection` (default export, sin props)

- [ ] **Step 1: Crear el componente**

Create `src/components/alumco/landing/MemoriasSection.tsx`:

```tsx
import { FileText, Download } from 'lucide-react'

const DOCS = [
  'Convenio',
  'Estado financiero',
  'Balance',
  'Memorial',
  'Nómina de directorio',
  'Plan vigente (PICV)',
  'Presupuesto adjudicado',
  'Recursos recibidos',
]

export default function MemoriasSection() {
  return (
    <section id="memorias" style={{ padding: '96px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 48px' }}>
        <span className="t-eyebrow">◆ Transparencia</span>
        <h2 className="t-display" style={{ fontSize: 'clamp(28px, 4vw, 40px)', marginTop: 12 }}>
          Memorias
        </h2>
        <p style={{ color: 'var(--tinta-2)', fontSize: 17, lineHeight: 1.7, marginTop: 18 }}>
          La transparencia financiera es fundamental para nosotros. A lo largo del año, hemos gestionado
          nuestros recursos con responsabilidad y eficiencia, asegurando que cada donación se utilice para
          el beneficio directo de nuestros residentes. Nuestro compromiso con la integridad financiera se
          refleja en cada partida de gastos.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        {DOCS.map((doc) => (
          <a
            key={doc}
            href="#"
            className="card card-hover"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '16px 18px',
              color: 'var(--tinta)',
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--azul-50)',
                color: 'var(--azul-800)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileText size={18} />
            </span>
            <span style={{ fontWeight: 500, fontSize: 15, flex: 1 }}>{doc}</span>
            <Download size={16} style={{ color: 'var(--tinta-3)' }} />
          </a>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Montar en `page.tsx`**

Import `MemoriasSection` and render after `<ValoresSection />`.

- [ ] **Step 3: Verificar lint + build**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 4: Verificación visual**

http://localhost:3000 → Texto de transparencia + grid de 8 docs con ícono archivo + flecha descarga. Hover levanta. (Los hrefs son `#` — placeholder, no descargan.)

- [ ] **Step 5: Commit**

```bash
git add src/components/alumco/landing/MemoriasSection.tsx src/app/page.tsx
git commit -m "feat(landing): sección Memorias con documentos"
```

---

### Task 7: ContactoSection (client, solo visual)

Form visual (sin submit real) + bloque de información de contacto.

**Files:**
- Create: `src/components/alumco/landing/ContactoSection.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `CONTACTO` de `./content`
- Produces: `ContactoSection` (default export, sin props)

- [ ] **Step 1: Crear el componente**

Create `src/components/alumco/landing/ContactoSection.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Mail, UserRound, Instagram } from 'lucide-react'
import { CONTACTO } from './content'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 'var(--radio-m)',
  border: '1px solid var(--borde)',
  background: 'var(--blanco)',
  color: 'var(--tinta)',
  fontFamily: 'var(--fuente-cuerpo)',
  fontSize: 15,
}

export default function ContactoSection() {
  const [form, setForm] = useState({ nombre: '', correo: '', mensaje: '' })

  return (
    <section
      id="contacto"
      style={{ padding: '96px 24px', background: 'var(--arena-100)', borderTop: '1px solid var(--borde-suave)' }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 48,
        }}
      >
        {/* Formulario (solo visual) */}
        <form
          onSubmit={(e) => e.preventDefault()}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div>
            <span className="t-eyebrow">◆ Escríbenos</span>
            <h2 className="t-display" style={{ fontSize: 'clamp(26px, 4vw, 36px)', marginTop: 12 }}>
              Contacto
            </h2>
          </div>
          <label style={{ fontSize: 14, color: 'var(--tinta-2)', fontWeight: 500 }}>
            Nombre
            <input
              style={{ ...inputStyle, marginTop: 6 }}
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
          </label>
          <label style={{ fontSize: 14, color: 'var(--tinta-2)', fontWeight: 500 }}>
            Correo electrónico
            <input
              type="email"
              style={{ ...inputStyle, marginTop: 6 }}
              value={form.correo}
              onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
            />
          </label>
          <label style={{ fontSize: 14, color: 'var(--tinta-2)', fontWeight: 500 }}>
            Mensaje
            <textarea
              rows={4}
              style={{ ...inputStyle, marginTop: 6, resize: 'vertical' }}
              value={form.mensaje}
              onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
            />
          </label>
          <button type="submit" className="btn btn-primary btn-lg" style={{ alignSelf: 'flex-start' }}>
            Enviar
          </button>
        </form>

        {/* Información de contacto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <h3 className="t-display" style={{ fontSize: 22, color: 'var(--azul-900)' }}>
            Información de contacto
          </h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Mail size={20} style={{ color: 'var(--ambar-700)', marginTop: 2 }} />
            <div>
              <p style={{ fontWeight: 600, color: 'var(--azul-900)' }}>Correo electrónico</p>
              <a href={`mailto:${CONTACTO.correoGeneral}`} style={{ color: 'var(--tinta-2)' }}>
                {CONTACTO.correoGeneral}
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <UserRound size={20} style={{ color: 'var(--ambar-700)', marginTop: 2 }} />
            <div>
              <p style={{ fontWeight: 600, color: 'var(--azul-900)' }}>Directora Técnica ELEAM Hualpén</p>
              <a href={`mailto:${CONTACTO.correoDirectora}`} style={{ color: 'var(--tinta-2)' }}>
                {CONTACTO.correoDirectora}
              </a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Instagram size={20} style={{ color: 'var(--ambar-700)', marginTop: 2 }} />
            <div>
              <p style={{ fontWeight: 600, color: 'var(--azul-900)' }}>Redes sociales</p>
              <a href={CONTACTO.instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--tinta-2)' }}>
                Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Montar en `page.tsx`**

Import `ContactoSection` and render after `<MemoriasSection />`.

- [ ] **Step 3: Verificar lint + build**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 4: Verificación visual**

http://localhost:3000 → Form a la izq (escribir funciona, "Enviar" no hace nada — `preventDefault`), info de contacto a la der con correos e Instagram. Responsive a una columna.

- [ ] **Step 5: Commit**

```bash
git add src/components/alumco/landing/ContactoSection.tsx src/app/page.tsx
git commit -m "feat(landing): sección Contacto (form visual + datos)"
```

---

### Task 8: LandingFooter

Footer con logo, links de nav y copyright.

**Files:**
- Create: `src/components/alumco/landing/LandingFooter.tsx`
- Modify: `src/app/page.tsx` (montar `<LandingFooter />` fuera/al final del `<main>`)

**Interfaces:**
- Consumes: `NAV_LINKS` de `./content`
- Produces: `LandingFooter` (default export, sin props)

- [ ] **Step 1: Crear el componente**

Create `src/components/alumco/landing/LandingFooter.tsx`:

```tsx
import Image from 'next/image'
import { NAV_LINKS } from './content'

export default function LandingFooter() {
  return (
    <footer style={{ background: 'var(--azul-950)', color: 'rgba(255,255,255,0.75)' }}>
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: '48px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Image
          src="/LogoAlumco.png"
          alt="ONG Alumco"
          width={132}
          height={44}
          style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.92 }}
        />
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 22 }}>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, textDecoration: 'none' }}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.12)',
          padding: '18px 24px',
          textAlign: 'center',
          fontSize: 13,
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        Copyright © {new Date().getFullYear()} ONG Alumco
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Montar en `page.tsx`**

Import `LandingFooter` and render it after `</main>` (sibling of `<main>`, inside the fragment).

- [ ] **Step 3: Verificar lint + build**

Run: `npm run lint && npm run build`
Expected: PASS.

- [ ] **Step 4: Verificación visual**

http://localhost:3000 → Footer navy con logo en blanco, links y copyright con el año actual.

- [ ] **Step 5: Commit**

```bash
git add src/components/alumco/landing/LandingFooter.tsx src/app/page.tsx
git commit -m "feat(landing): footer institucional"
```

---

### Task 9: Pulido responsive + verificación final

Revisión integral de la página completa: responsive, anchors, estados del nav, build limpio.

**Files:**
- Modify (si es necesario): cualquier componente de `src/components/alumco/landing/` y `src/app/globals.css`

**Interfaces:**
- N/A (solo ajustes)

- [ ] **Step 1: Verificar el `page.tsx` final**

`src/app/page.tsx` debe verse así (orden completo):

```tsx
import type { Metadata } from 'next'
import LandingNav from '@/components/alumco/landing/LandingNav'
import HeroSection from '@/components/alumco/landing/HeroSection'
import MisionVision from '@/components/alumco/landing/MisionVision'
import ValoresSection from '@/components/alumco/landing/ValoresSection'
import MemoriasSection from '@/components/alumco/landing/MemoriasSection'
import ContactoSection from '@/components/alumco/landing/ContactoSection'
import LandingFooter from '@/components/alumco/landing/LandingFooter'

export const metadata: Metadata = {
  title: 'ONG Alumco — Cuidado con empatía para personas mayores',
  description:
    'ELEAM dedicado a brindar atención integral, de calidad y centrada en la persona para nuestras personas mayores.',
}

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <main style={{ background: 'var(--crema)', color: 'var(--tinta)' }}>
        <HeroSection />
        <MisionVision />
        <ValoresSection />
        <MemoriasSection />
        <ContactoSection />
      </main>
      <LandingFooter />
    </>
  )
}
```

- [ ] **Step 2: Revisión responsive en DevTools**

Run: `npm run dev`. Revisar anchos 375px (móvil), 768px (tablet), 1280px (desktop).
Expected:
- Nav: hamburguesa < 820px, links visibles ≥ 821px; legible sobre el hero y en estado scrolled.
- Hero: título y botones no se desbordan; botones envuelven en móvil.
- Misión/Visión, Valores, Memorias, Contacto: grids colapsan a 1 columna en móvil sin overflow horizontal.
- Anchors del nav llevan a cada sección con scroll suave; el offset del header fijo no tapa los títulos (si tapa, añadir `scroll-margin-top: 80px` a las secciones vía regla en `globals.css`: `section[id] { scroll-margin-top: 80px; }`).

Aplicar los ajustes que falten en los archivos correspondientes.

- [ ] **Step 3: Build de producción limpio**

Run: `npm run lint && npm run build`
Expected: PASS sin warnings nuevos. La ruta `/` aparece como página estática en el output de build (ya no redirect).

- [ ] **Step 4: Commit (si hubo ajustes)**

```bash
git add -A
git commit -m "fix(landing): pulido responsive y scroll-margin de anchors"
```

---

## Notas de implementación

- Si `npm run lint` se queja de `any` o imports no usados, corregir inline (el repo usa ESLint estricto).
- `lucide-react` exporta `type LucideIcon` para tipar el array de valores; si la versión no lo exporta, usar `import type { LucideIcon } from 'lucide-react'` o el tipo `ComponentType<{ size?: number }>`.
- La foto del hero (`/login-hero.jpg`) es placeholder. El cliente puede reemplazarla por una foto propia de personas mayores manteniendo el mismo nombre o actualizando el `src`.
- Los documentos de Memorias usan `href="#"` (sin descarga real) por estar fuera de alcance.
