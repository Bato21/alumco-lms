import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const BASE = 'https://alumco-lms.vercel.app'
const TRAB = { email: 'Baptiste@gmail.com', password: '12345678' }
const QUIZ = '/cursos/7e002d0a-f53f-42ad-b427-2044544f2ee4/modulos/b62c94ed-197b-4284-b11a-9da066ab8c23/quiz'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'capturas')
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'es-CL' })
const page = await ctx.newPage()
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' })
await page.fill('#email', TRAB.email); await page.fill('#password', TRAB.password)
await Promise.all([page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 45000 }), page.click('button[type="submit"]')])
await page.goto(`${BASE}${QUIZ}`, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => !document.body.innerText.includes('Cargando evaluaci'), { timeout: 25000 }).catch(() => {})
await page.waitForTimeout(2500)
await page.screenshot({ path: path.join(OUT, '14-trab-quiz.png'), fullPage: true })
console.log('OK 14-trab-quiz.png ->', page.url())
// vista de pregunta (inicia la evaluación)
try {
  await page.click('text=Comenzar evaluación')
  await page.waitForTimeout(2500)
  await page.screenshot({ path: path.join(OUT, '14b-trab-quiz-pregunta.png'), fullPage: true })
  console.log('OK 14b-trab-quiz-pregunta.png')
} catch (e) { console.log('FAIL 14b', e.message) }
await browser.close()
