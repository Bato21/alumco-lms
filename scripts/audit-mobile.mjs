// Auditoría móvil de la vista colaborador.
// Inicia sesión con la cuenta demo, recorre las rutas del trabajador en tres
// anchos de teléfono y, en cada una, saca captura y mide tres cosas que no se
// ven bien "a ojo": desbordamiento horizontal, targets táctiles chicos y texto
// bajo 16px. Solo lee: no toca la app.
//
//   node scripts/audit-mobile.mjs
//   BASE_URL=http://127.0.0.1:3000 node scripts/audit-mobile.mjs

import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3000'
const OUT = process.env.OUT_DIR ?? 'tmp/mobile-audit'

const VIEWPORTS = [
  { name: '375-se', width: 375, height: 667 },
  { name: '390-ip14', width: 390, height: 844 },
  { name: '412-android', width: 412, height: 915 },
]

// Umbrales acordados: base accesible (16px cuerpo, 48px target).
const MIN_TARGET = 48
const MIN_FONT = 16

const auditar = () => {
  const vw = window.innerWidth
  const docW = document.documentElement.scrollWidth

  // 1. Desbordamiento horizontal: qué elemento se sale del viewport.
  const desbordes = []
  if (docW > vw + 1) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.right > vw + 1 || r.left < -1) {
        const cs = getComputedStyle(el)
        if (cs.position === 'fixed') continue
        desbordes.push({
          sel: el.tagName.toLowerCase() +
            (el.className && typeof el.className === 'string'
              ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
              : ''),
          left: Math.round(r.left),
          right: Math.round(r.right),
          texto: (el.textContent ?? '').trim().slice(0, 40),
        })
      }
    }
  }

  const visible = (el) => {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }

  // 2. Targets táctiles bajo el mínimo.
  // `.area-tactil` amplía la zona pulsable a 48x48 con un ::after sin cambiar
  // la caja visible, así que ahí se mide el área efectiva, no el rectángulo.
  const targets = []
  for (const el of document.querySelectorAll('a, button, [role="button"], input, select, textarea')) {
    if (!visible(el)) continue
    const r = el.getBoundingClientRect()
    if (el.classList.contains('area-tactil')) {
      const after = getComputedStyle(el, '::after')
      const aw = parseFloat(after.width) || 0
      const ah = parseFloat(after.height) || 0
      if (Math.max(r.width, aw) >= 48 && Math.max(r.height, ah) >= 48) continue
    }
    if (r.width < 48 || r.height < 48) {
      targets.push({
        sel: el.tagName.toLowerCase() +
          (el.className && typeof el.className === 'string'
            ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
            : ''),
        w: Math.round(r.width),
        h: Math.round(r.height),
        texto: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30),
      })
    }
  }

  // 3. Texto bajo 16px (solo nodos hoja con texto real).
  const fuentes = new Map()
  for (const el of document.querySelectorAll('body *')) {
    if (el.children.length > 0) continue
    const t = (el.textContent ?? '').trim()
    if (!t) continue
    if (!visible(el)) continue
    const fs = parseFloat(getComputedStyle(el).fontSize)
    if (fs < 16) {
      const k = `${fs}px`
      if (!fuentes.has(k)) fuentes.set(k, { px: fs, n: 0, muestra: t.slice(0, 30) })
      fuentes.get(k).n++
    }
  }

  return {
    vw,
    docW,
    desbordaH: docW > vw + 1,
    desbordes: desbordes.slice(0, 8),
    targets: targets.slice(0, 12),
    nTargets: targets.length,
    fuentes: [...fuentes.values()].sort((a, b) => a.px - b.px),
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'es-CL',
  })
  const page = await ctx.newPage()

  // Login con la cuenta demo colaborador (botón que rellena y envía).
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /Demo Colaborador/i }).click()
  await page.waitForURL('**/inicio', { timeout: 45_000 })

  // Descubre ids reales para las rutas dinámicas.
  const dinamicas = []
  await page.goto(`${BASE}/cursos`, { waitUntil: 'networkidle' })
  const cursoHref = await page.locator('a[href^="/cursos/"]').first().getAttribute('href').catch(() => null)
  if (cursoHref) {
    dinamicas.push(cursoHref)
    await page.goto(`${BASE}${cursoHref}`, { waitUntil: 'networkidle' })
    const modHref = await page.locator('a[href*="/modulos/"]').first().getAttribute('href').catch(() => null)
    if (modHref) {
      dinamicas.push(modHref)
      dinamicas.push(`${modHref}/quiz`)
    }
  }
  await page.goto(`${BASE}/eventos`, { waitUntil: 'networkidle' })
  const evHref = await page.locator('a[href^="/eventos/"]').first().getAttribute('href').catch(() => null)
  if (evHref) dinamicas.push(evHref)

  const RUTAS = [
    '/inicio',
    '/cursos',
    ...dinamicas,
    '/eventos',
    '/mis-certificados',
    '/perfil',
    '/dias-administrativos',
  ]

  console.log(`Rutas a auditar (${RUTAS.length}):`)
  RUTAS.forEach((r) => console.log('  ' + r))
  console.log()

  const informe = []

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height })

    for (const ruta of RUTAS) {
      const slug = ruta.replace(/^\//, '').replace(/\//g, '_').replace(/[^\w-]/g, '') || 'root'
      try {
        await page.goto(`${BASE}${ruta}`, { waitUntil: 'networkidle', timeout: 45_000 })
        await page.waitForTimeout(400)

        const file = path.join(OUT, `${vp.name}__${slug}.png`)
        await page.screenshot({ path: file, fullPage: true })

        const r = await page.evaluate(auditar)
        informe.push({ viewport: vp.name, ruta, file, ...r })

        const flags = []
        if (r.desbordaH) flags.push(`OVERFLOW ${r.docW}>${r.vw}`)
        if (r.nTargets) flags.push(`${r.nTargets} targets<${MIN_TARGET}px`)
        const min = r.fuentes[0]
        if (min) flags.push(`fuente min ${min.px}px`)
        console.log(`${vp.name.padEnd(13)} ${ruta.padEnd(46)} ${flags.join('  ') || 'ok'}`)
      } catch (e) {
        console.log(`${vp.name.padEnd(13)} ${ruta.padEnd(46)} ERROR: ${e.message.split('\n')[0]}`)
        informe.push({ viewport: vp.name, ruta, error: e.message.split('\n')[0] })
      }
    }
  }

  fs.writeFileSync(path.join(OUT, 'informe.json'), JSON.stringify(informe, null, 2))
  console.log(`\nCapturas + informe.json en ${OUT}/`)

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
