// Captura de pantallazos del flujo de KimünKo / Alumco LMS — modo VIEWPORT (no fullPage)
// para que cada pantalla se vea balanceada (sin sidebar estirada con vacío).
// Uso: node docs/flujo-plataforma/_capturar.mjs
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const BASE = 'https://alumco-lms.vercel.app'
const ADMIN = { email: 'da.ongalumco@gmail.com', password: 'alumco123' }
const TRAB = { email: 'Baptiste@gmail.com', password: '12345678' }
// Quiz accesible y SIN aprobar por Baptiste (intento 1 de 3 -> intro + preguntas limpias)
const QUIZ = '/cursos/9db1207c-9175-4507-89c3-835f633d520a/modulos/2fc2838b-001d-430d-8b2a-699a371ff94b/quiz'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'capturas')
fs.mkdirSync(OUT, { recursive: true })

const VP = { width: 1440, height: 900 } // 16:10 uniforme
const results = []
const log = (s) => { console.log(s); results.push(s) }

async function shot(page, name, settle = 1400) {
  try {
    await page.waitForTimeout(settle)
    await page.screenshot({ path: path.join(OUT, name), fullPage: false }) // viewport
    log(`OK    ${name}`)
  } catch (e) { log(`FAIL  ${name}  ${e.message}`) }
}
async function go(page, route, name, settle) {
  try {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await shot(page, name, settle)
  } catch (e) { log(`FAIL  ${name}  goto ${route}: ${e.message}`) }
}
async function login(page, { email, password }) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.fill('#email', email); await page.fill('#password', password)
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 45000 }),
    page.click('button[type="submit"]'),
  ])
  await page.waitForTimeout(1500)
  log(`LOGIN ${email} -> ${page.url()}`)
}
async function firstHref(page, selector, re) {
  return page.$$eval(selector, (els, reSrc) => {
    const r = new RegExp(reSrc)
    for (const e of els) { const h = e.getAttribute('href'); if (h && r.test(h)) return h }
    return null
  }, re).catch(() => null)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 2, locale: 'es-CL' })
ctx.setDefaultTimeout(45000)
const page = await ctx.newPage()

// ---------- PÚBLICO ----------
await go(page, '/login', '01-login.png')
try { await page.click('text=¿Olvidó su clave?'); await shot(page, '02-login-olvido-clave.png', 900) }
catch (e) { log(`FAIL  02  ${e.message}`) }
await go(page, '/registro', '03-registro.png')

// ---------- TRABAJADOR ----------
await ctx.clearCookies()
await login(page, TRAB)
await go(page, '/inicio', '10-trab-inicio.png')
await go(page, '/cursos', '11-trab-cursos.png')
const cursoHref = await firstHref(page, 'a[href^="/cursos/"]', '^/cursos/[^/?]+$')
if (cursoHref) {
  await go(page, cursoHref, '12-trab-curso-detalle.png')
  const modHref = await firstHref(page, 'a[href*="/modulos/"]', '/modulos/[^/?]+$')
  if (modHref) await go(page, modHref, '13-trab-modulo.png')
}
// Quiz: intro + preguntas
await page.goto(`${BASE}${QUIZ}`, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => !document.body.innerText.includes('Cargando evaluaci'), { timeout: 25000 }).catch(() => {})
await shot(page, '14-trab-quiz.png', 2200)
try {
  await page.click('text=Comenzar evaluación'); await page.waitForTimeout(2500)
  await page.screenshot({ path: path.join(OUT, '14b-trab-quiz-pregunta.png'), fullPage: false })
  log('OK    14b-trab-quiz-pregunta.png')
} catch (e) { log(`FAIL  14b  ${e.message}`) }
await go(page, '/mis-certificados', '15-trab-certificados.png')
await go(page, '/perfil', '16-trab-perfil.png')

// ---------- ADMIN ----------
await ctx.clearCookies()
await login(page, ADMIN)
for (const [name, route] of [
  ['20-admin-dashboard.png', '/admin/dashboard'],
  ['21-admin-cursos.png', '/admin/cursos'],
  ['22-admin-curso-nuevo.png', '/admin/cursos/nuevo'],
  ['24-admin-trabajadores.png', '/admin/trabajadores'],
  ['26-admin-sedes.png', '/admin/sedes'],
  ['27-admin-certificados.png', '/admin/certificados'],
  ['28-admin-reportes.png', '/admin/reportes'],
  ['29-admin-perfil.png', '/admin/perfil'],
]) await go(page, route, name)

await page.goto(`${BASE}/admin/cursos`, { waitUntil: 'domcontentloaded' }).catch(() => {})
const editHref = await firstHref(page, 'a[href*="/editar"]', '/admin/cursos/[^/]+/editar$')
if (editHref) await go(page, editHref, '23-admin-curso-editar.png')
else log('SKIP  23')
await page.goto(`${BASE}/admin/trabajadores`, { waitUntil: 'domcontentloaded' }).catch(() => {})
const trabHref = await firstHref(page, 'a[href^="/admin/trabajadores/"]', '^/admin/trabajadores/[^/?]+$')
if (trabHref) await go(page, trabHref, '25-admin-trabajador-detalle.png')
else log('SKIP  25')

await browser.close()
console.log('\n==== RESUMEN ====\n' + results.join('\n'))
fs.writeFileSync(path.join(OUT, '_resultado.txt'), results.join('\n'))
