import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient, createAdminClient, getCachedUser } from '@/lib/supabase/server'
import { getViewerIsDemo } from '@/lib/auth/demoScope'
import { getAdminAlerts } from '@/lib/actions/alerts'
import { getProximoEventoResumen } from '@/lib/eventos/proximoEvento'
import { Avatar, Badge, BadgeEstado, Progreso, Onda, Icono } from '@/components/alumco/ds'
import type { IconoNombre } from '@/components/alumco/ds'
import { CompactEventCard } from '@/components/alumco/eventos/CompactEventCard'
import { EventNotificationModal } from '@/components/alumco/eventos/EventNotificationModal'
import {
  getAnnualCoverage,
  getCertificatesByMonth,
  getComplianceByArea,
} from '@/lib/actions/analytics'
import { AnnualCoverageGauge } from '@/components/alumco/dashboard/AnnualCoverageGauge'
import { AnnualTargetForm } from '@/components/alumco/dashboard/AnnualTargetForm'
import { CertificatesMonthlyChart } from '@/components/alumco/dashboard/CertificatesMonthlyChart'
import { ComplianceByAreaChart } from '@/components/alumco/dashboard/ComplianceByAreaChart'

export const metadata: Metadata = {
  title: 'Panel de administración',
}

export const dynamic = 'force-dynamic'

interface CourseCompletion {
  course_name: string
  completion_rate: number
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const user = await getCachedUser()
  const adminClient = await createAdminClient()
  const isDemo = await getViewerIsDemo()

  // 6 queries + alertas en paralelo; el resto de las métricas se derivan en
  // memoria. getAdminAlerts iba en serie después y sumaba ~150ms al TTFB.
  const [
    { data: profile },
    { data: workersData },
    { data: allCourses },
    { data: allProgress },
    { data: allCertificates },
    { count: pendingApprovals },
    adminAlerts,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user!.id)
      .single() as unknown as Promise<{ data: { full_name: string } | null }>,
    adminClient
      .from('profiles')
      .select('id, full_name, sede, area_trabajo')
      .eq('role', 'trabajador')
      .eq('status', 'activo')
      .eq('is_demo', isDemo)
      .order('full_name') as unknown as Promise<{ data: { id: string; full_name: string; sede: string; area_trabajo: string[] | null }[] | null }>,
    adminClient
      .from('courses')
      .select('id, title, target_areas')
      .eq('is_published', true)
      .eq('is_demo', isDemo) as unknown as Promise<{ data: { id: string; title: string; target_areas: string[] | null }[] | null }>,
    adminClient
      .from('course_progress')
      .select('user_id, course_id, is_completed, completed_at, updated_at')
      .eq('is_demo', isDemo) as unknown as Promise<{ data: { user_id: string; course_id: string; is_completed: boolean; completed_at: string | null; updated_at: string | null }[] | null }>,
    adminClient
      .from('certificates')
      .select('user_id, issued_at')
      .eq('is_demo', isDemo) as unknown as Promise<{ data: { user_id: string; issued_at: string }[] | null }>,
    // Aprobaciones pendientes: trabajadores esperando acceso (solo conteo)
    adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'trabajador')
      .eq('status', 'pendiente')
      .eq('is_demo', isDemo) as unknown as Promise<{ count: number | null }>,
    getAdminAlerts(),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Bienvenido'

  const totalWorkers = workersData?.length ?? 0

  const completedSet = new Set(
    (allProgress ?? []).filter(p => p.is_completed).map(p => `${p.user_id}:${p.course_id}`)
  )
  // Cualquier fila de progreso = el curso fue iniciado (aunque no completado).
  const startedSet = new Set(
    (allProgress ?? []).map(p => `${p.user_id}:${p.course_id}`)
  )

  let assignmentsTotal = 0
  let assignmentsCompleted = 0
  for (const w of workersData ?? []) {
    const wAreas = (w.area_trabajo as string[]) ?? []
    for (const c of allCourses ?? []) {
      const tAreas = (c.target_areas as string[] | null) ?? []
      const visible = tAreas.length === 0 || tAreas.some(a => wAreas.includes(a))
      if (!visible) continue
      assignmentsTotal++
      if (completedSet.has(`${w.id}:${c.id}`)) {
        assignmentsCompleted++
      }
    }
  }
  const approvalRate = assignmentsTotal > 0
    ? Math.round((assignmentsCompleted / assignmentsTotal) * 100)
    : 0

  const completedByCourse = new Map<string, number>()
  for (const p of allProgress ?? []) {
    if (p.is_completed) {
      completedByCourse.set(p.course_id, (completedByCourse.get(p.course_id) ?? 0) + 1)
    }
  }

  // Pirámide invertida: mostrar lo accionable (peor cumplimiento), no el logro.
  const worstCourses: CourseCompletion[] = (allCourses ?? [])
    .map((course) => {
      const completedCount = completedByCourse.get(course.id) ?? 0
      const completion_rate = totalWorkers > 0
        ? Math.round((completedCount / totalWorkers) * 100)
        : 0

      return {
        course_name: course.title,
        completion_rate,
      }
    })
    .filter((c) => c.completion_rate < 100)
    .sort((a, b) => a.completion_rate - b.completion_rate)
    .slice(0, 3)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const startOfMonthMs = startOfMonth.getTime()

  const certificatesThisMonth = (allCertificates ?? []).filter(
    c => new Date(c.issued_at).getTime() >= startOfMonthMs
  ).length

  // Derived stats (no new queries)
  const publishedCourses = allCourses?.length ?? 0
  const totalCertificates = allCertificates?.length ?? 0

  const sede1Workers = workersData?.filter(w => w.sede === 'sede_1') ?? []
  const sede2Workers = workersData?.filter(w => w.sede === 'sede_2') ?? []

  const getSedeRate = (sedeWorkers: { id: string }[]) => {
    if (sedeWorkers.length === 0) return 0
    const ids = new Set(sedeWorkers.map(w => w.id))
    const rel = allProgress?.filter(p => ids.has(p.user_id)) ?? []
    if (rel.length === 0) return 0
    return Math.round((rel.filter(p => p.is_completed).length / rel.length) * 100)
  }

  const sede1Rate = getSedeRate(sede1Workers)
  const sede2Rate = getSedeRate(sede2Workers)

  const sedeLabel = (s: string) => (s === 'sede_1' ? 'Hualpén' : s === 'sede_2' ? 'Coyhaique' : s)

  // Trabajadores que requieren seguimiento (pendientes > 0), derivado de los datos ya cargados
  const workerFollowupAll = (workersData ?? [])
    .map((w) => {
      const wAreas = (w.area_trabajo as string[]) ?? []
      let total = 0
      let done = 0
      let started = 0
      for (const c of allCourses ?? []) {
        const tAreas = (c.target_areas as string[] | null) ?? []
        const visible = tAreas.length === 0 || tAreas.some((a) => wAreas.includes(a))
        if (!visible) continue
        total++
        const key = `${w.id}:${c.id}`
        if (completedSet.has(key)) done++
        else if (startedSet.has(key)) started++
      }
      const pendientes = total - done
      // sin iniciar = pendientes que ni siquiera se abrieron (acción = recordatorio)
      const sinIniciar = pendientes - started
      const cumplimiento = total > 0 ? Math.round((done / total) * 100) : 0
      const estado = pendientes === 0 ? 'al-dia' : cumplimiento < 50 ? 'atrasado' : 'en-riesgo'
      return { id: w.id, nombre: w.full_name, sede: sedeLabel(w.sede), pendientes, sinIniciar, cumplimiento, estado }
    })
    .filter((w) => w.pendientes > 0)
    .sort((a, b) => b.pendientes - a.pendientes)

  const atrasadosCount = workerFollowupAll.filter((w) => w.estado === 'atrasado').length
  const workerFollowup = workerFollowupAll.slice(0, 6)

  // Vencidos (plazo ya pasado) separados de próximos: incumplimiento real vs aviso.
  const overdueAlerts = adminAlerts.alerts.filter((a) => a.urgency === 'overdue')
  const upcomingAlerts = adminAlerts.alerts.filter((a) => a.urgency !== 'overdue')
  const overdueCount = overdueAlerts.length
  const vencimientos = upcomingAlerts.slice(0, 3)

  const plazoLabel = (daysLeft: number, urgency: string): [string, 'peligro' | 'aviso'] => {
    if (urgency === 'overdue' || daysLeft < 0) return ['Vencido', 'peligro']
    if (daysLeft <= 14) return [`En ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`, 'aviso']
    return [`En ${Math.ceil(daysLeft / 7)} semanas`, 'aviso']
  }

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches'
  const mesLabel = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

  // Pirámide invertida: el KPI de salud (cumplimiento) va primero (patrón F, izquierda).
  const heroStats: [string, string][] = [
    [`${approvalRate}%`, 'cumplimiento'],
    [String(totalWorkers), 'trabajadores'],
    [String(publishedCourses), 'cursos activos'],
  ]
  const sedeRows: [string, number, number][] = [
    ['Sede Hualpén', sede1Rate, sede1Workers.length],
    ['Sede Coyhaique', sede2Rate, sede2Workers.length],
  ]

  // Acciones del día: lo que el admin debe resolver, primero (pirámide invertida).
  const acciones: { href: string; icono: IconoNombre; valor: number; etiqueta: string; detalle: string; tono: 'peligro' | 'ambar' }[] = [
    { href: '/admin/reportes', icono: 'alerta', valor: overdueCount, etiqueta: 'Cursos vencidos', detalle: 'fuera de plazo, sin completar', tono: 'peligro' },
    { href: '/admin/trabajadores?tab=solicitudes', icono: 'usuarios', valor: pendingApprovals ?? 0, etiqueta: 'Aprobaciones pendientes', detalle: 'esperan acceso al sistema', tono: 'ambar' },
    { href: '/admin/trabajadores', icono: 'reportes', valor: atrasadosCount, etiqueta: 'Trabajadores atrasados', detalle: 'bajo 50% de avance', tono: 'ambar' },
  ]

  // Resumen del próximo evento (cache() dedup con el layout/campana).
  // Las agregaciones de BI van en el mismo lote: son independientes entre sí
  // y en serie sumaban ~300ms al TTFB.
  const [evento, mensuales, porArea, cobertura] = await Promise.all([
    getProximoEventoResumen(true),
    getCertificatesByMonth(12),
    getComplianceByArea(),
    getAnnualCoverage(),
  ])

  return (
    <div className="col" style={{ gap: 20 }} data-screen-label="Admin · Dashboard">

      {/* Modal de evento al iniciar sesión (estado 1). Se auto-abre si no fue
          visto; al cerrarlo queda la tarjeta compacta (estado 2). */}
      {evento && <EventNotificationModal evento={evento} userId={user!.id} />}

      {/* Bienvenida + tarjeta compacta de evento a la derecha (abajo en móvil) */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch entra">
        <div
          className="card bloque-marca flex-1 min-w-0"
          style={{ background: 'var(--grad-marca)', color: '#fff', border: 'none', overflow: 'hidden', position: 'relative' }}
        >
          <div className="fila" style={{ padding: '30px 32px 24px', gap: 24, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <div className="crece" style={{ minWidth: 280 }}>
              <span className="t-eyebrow" style={{ color: 'var(--oliva-clara, var(--ambar))' }}>◆ {mesLabel}</span>
              <h1 className="t-display" style={{ fontSize: 30, color: '#fff', marginTop: 8 }}>
                {saludo}, {firstName}.<br />
                Hay <em style={{ color: 'var(--oliva-clara, var(--ambar))' }}>{adminAlerts.count} vencimiento{adminAlerts.count !== 1 ? 's' : ''}</em> este mes.
              </h1>
            </div>
            <div className="fila" style={{ gap: 28 }}>
              {heroStats.map(([v, l]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div className="t-display" style={{ fontSize: 34, color: '#fff' }}>{v}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <Onda alto={36} />
        </div>

        {evento && <CompactEventCard evento={evento} />}
      </div>

      {/* Acciones del día — lo accionable arriba (pirámide invertida + patrón F) */}
      <div className="entra entra-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {acciones.map((a) => {
          const cero = a.valor === 0
          const col = cero ? 'var(--ok)' : a.tono === 'peligro' ? 'var(--peligro)' : 'var(--ambar-700)'
          const bg = cero ? 'var(--ok-bg)' : a.tono === 'peligro' ? 'var(--peligro-bg)' : 'var(--ambar-50)'
          return (
            <Link
              key={a.etiqueta}
              href={a.href}
              aria-label={`${a.etiqueta}: ${a.valor}. ${cero ? 'todo al día' : a.detalle}`}
              className="card card-pad card-hover fila"
              style={{ gap: 14, alignItems: 'flex-start', textDecoration: 'none', color: 'inherit' }}
            >
              <span
                aria-hidden="true"
                style={{ width: 44, height: 44, borderRadius: 12, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color: col }}
              >
                <Icono n={cero ? 'check' : a.icono} s={22} />
              </span>
              <div className="crece" style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--tinta-2)' }}>{a.etiqueta}</div>
                <div className="t-display" style={{ fontSize: 30, lineHeight: 1.15, color: cero ? 'var(--tinta)' : col }}>{a.valor}</div>
                <div className="texto-s silencio-3">{cero ? 'todo al día' : a.detalle}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Grid principal: seguimiento + columna lateral */}
      <div className="entra entra-2 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
        {/* Requieren seguimiento */}
        <div className="card col" style={{ gap: 0 }}>
          <div className="fila card-pad" style={{ paddingBottom: 10 }}>
            <h2 className="crece" style={{ fontSize: 16.5 }}>Requieren seguimiento</h2>
            <Link href="/admin/trabajadores" className="btn btn-secondary btn-sm">Ver todos</Link>
          </div>
          {workerFollowup.length === 0 ? (
            <div className="card-pad"><p className="silencio texto-s">Todo el equipo está al día.</p></div>
          ) : (
            <>
              {/* Desktop: tabla */}
              <div className="tabla-envoltura hidden lg:block">
                <table className="tabla">
                  <caption className="sr-only">Trabajadores con cursos obligatorios pendientes</caption>
                  <thead>
                    <tr>
                      <th scope="col">Trabajador/a</th>
                      <th scope="col">Sede</th>
                      <th scope="col" style={{ textAlign: 'right' }}>Pendientes</th>
                      <th scope="col">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workerFollowup.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <div className="fila" style={{ gap: 10 }}>
                            <Avatar nombre={t.nombre} s={32} />
                            <strong style={{ fontSize: 14.5 }}>{t.nombre}</strong>
                          </div>
                        </td>
                        <td className="silencio texto-s">{t.sede}</td>
                        <td style={{ textAlign: 'right' }}>
                          <strong>{t.pendientes}</strong> <span className="silencio-3 texto-s">cursos</span>
                          {t.sinIniciar > 0 && (
                            <div className="texto-s silencio-3">{t.sinIniciar} sin iniciar</div>
                          )}
                        </td>
                        <td><BadgeEstado estado={t.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Móvil: tarjetas apiladas (sin scroll horizontal — PDF accesibilidad) */}
              <ul className="lg:hidden" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {workerFollowup.map((t) => (
                  <li
                    key={t.id}
                    className="fila"
                    style={{ gap: 12, padding: '12px 18px', borderTop: '1px solid var(--borde-suave)' }}
                  >
                    <Avatar nombre={t.nombre} s={38} />
                    <div className="crece" style={{ minWidth: 0 }}>
                      <div className="recorte" style={{ fontWeight: 600, fontSize: 14.5 }}>{t.nombre}</div>
                      <div className="texto-s silencio-3">
                        {t.sede} · {t.pendientes} pend.{t.sinIniciar > 0 ? ` · ${t.sinIniciar} sin iniciar` : ''}
                      </div>
                    </div>
                    <BadgeEstado estado={t.estado} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Columna derecha */}
        <div className="col" style={{ gap: 20 }}>
          {/* Vencimientos próximos */}
          <div className="card card-pad col" style={{ gap: 14 }}>
            <div className="fila">
              <h2 className="crece" style={{ fontSize: 16.5 }}>Vencimientos próximos</h2>
              <Link href="/admin/reportes" style={{ fontSize: 14, fontWeight: 600 }}>Ver reportes</Link>
            </div>
            {vencimientos.length === 0 ? (
              <p className="silencio texto-s">
                {overdueCount > 0
                  ? `Sin próximos a vencer. Hay ${overdueCount} ya vencido${overdueCount !== 1 ? 's' : ''} (arriba).`
                  : 'No hay vencimientos próximos.'}
              </p>
            ) : (
              <div className="col" style={{ gap: 10 }}>
                {vencimientos.map((a) => {
                  const [texto, tono] = plazoLabel(a.daysLeft, a.urgency)
                  return (
                    <div
                      key={a.courseId}
                      className="fila"
                      style={{ gap: 12, padding: '10px 12px', borderRadius: 12, background: 'var(--crema)', border: '1px solid var(--borde-suave)' }}
                    >
                      <span style={{ color: tono === 'peligro' ? 'var(--peligro)' : 'var(--aviso)' }}>
                        <Icono n={tono === 'peligro' ? 'alerta' : 'reloj'} s={19} />
                      </span>
                      <div className="crece" style={{ lineHeight: 1.3, minWidth: 0 }}>
                        <div className="recorte" style={{ fontWeight: 600, fontSize: 14.5 }}>{a.courseTitle}</div>
                        <div className="texto-s silencio-3">{a.pendingWorkers ?? 0} personas</div>
                      </div>
                      <Badge tono={tono} punto={false}>{texto}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Cumplimiento por sede */}
          <div className="card card-pad col" style={{ gap: 16 }}>
            <div className="fila">
              <div className="crece">
                <h2 style={{ fontSize: 16.5 }}>Cumplimiento por sede</h2>
                <p className="texto-s silencio-3">Cursos obligatorios al día, por residencia</p>
              </div>
              <Link href="/admin/reportes" style={{ fontSize: 14, fontWeight: 600 }}>Detalle por sede</Link>
            </div>
            <div className="col" style={{ gap: 14 }}>
              {sedeRows.map(([n, rate, count]) => (
                <div key={n} className="col" style={{ gap: 6 }}>
                  <div className="fila" style={{ fontSize: 14 }}>
                    <span className="crece" style={{ fontWeight: 600 }}>{n}</span>
                    {/* Estado por icono + texto, no solo color (accesibilidad daltónica) */}
                    <span className="fila" style={{ gap: 5, fontWeight: 640, color: rate < 70 ? 'var(--peligro)' : 'var(--ok)' }}>
                      <Icono n={rate < 70 ? 'alerta' : 'check'} s={14} />
                      {rate}%
                    </span>
                  </div>
                  <Progreso pct={rate} azul={rate >= 70} />
                  <span className="texto-s silencio-3">{count} trabajadores</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Panorama del año: cobertura vs. objetivo + tendencia mensual ── */}
      <div className="entra entra-3 grid grid-cols-1 lg:grid-cols-[1fr_1.7fr] gap-5 items-start">
        <div className="card card-pad col" style={{ gap: 14 }}>
          <div className="fila" style={{ gap: 8 }}>
            <div className="crece" style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 16.5 }}>Cobertura anual</h2>
              <p className="texto-s silencio-3">Trabajadores certificados este año</p>
            </div>
            {cobertura.data && <AnnualTargetForm target={cobertura.data.target} />}
          </div>
          {cobertura.data ? (
            <AnnualCoverageGauge data={cobertura.data} />
          ) : (
            <p className="silencio texto-s">No se pudo calcular la cobertura anual.</p>
          )}
        </div>

        <div className="card card-pad col" style={{ gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 16.5 }}>Certificados emitidos por mes</h2>
            <p className="texto-s silencio-3">Últimos 12 meses — la tendencia que pide el directorio</p>
          </div>
          {mensuales.data ? (
            <CertificatesMonthlyChart data={mensuales.data} />
          ) : (
            <p className="silencio texto-s">No se pudo cargar la serie mensual.</p>
          )}
        </div>
      </div>

      {/* ── Cumplimiento por área de trabajo ── */}
      <div className="entra entra-3 card card-pad col" style={{ gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 16.5 }}>Cumplimiento por área de trabajo</h2>
          <p className="texto-s silencio-3">
            Dónde falta capacitación, por estamento — de peor a mejor
          </p>
        </div>
        {porArea.data ? (
          <ComplianceByAreaChart data={porArea.data} />
        ) : (
          <p className="silencio texto-s">No se pudo cargar el desglose por área.</p>
        )}
      </div>

      {/* Fila inferior: cursos más completados + certificados */}
      <div className="entra entra-3 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
        <div className="card card-pad col" style={{ gap: 14 }}>
          <div className="crece">
            <h2 style={{ fontSize: 16.5 }}>Cursos con menor cumplimiento</h2>
            <p className="texto-s silencio-3">Dónde enfocar el seguimiento esta semana</p>
          </div>
          {worstCourses.length === 0 ? (
            <p className="silencio texto-s">Todos los cursos están al 100%.</p>
          ) : (
            <div className="col" style={{ gap: 12 }}>
              {worstCourses.map((c) => {
                const color = c.completion_rate < 50 ? 'var(--peligro)' : c.completion_rate < 80 ? 'var(--aviso)' : 'var(--tinta)'
                return (
                  <div key={c.course_name} className="col" style={{ gap: 6 }}>
                    <div className="fila texto-s">
                      <span className="crece recorte" style={{ fontWeight: 600 }}>{c.course_name}</span>
                      <strong style={{ color }}>{c.completion_rate}%</strong>
                    </div>
                    <Progreso pct={c.completion_rate} azul />
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div
          className="card bloque-marca col"
          style={{ background: 'var(--grad-oliva, var(--grad-marca))', color: '#fff', border: 'none', overflow: 'hidden' }}
        >
          <div className="card-pad col" style={{ gap: 4, position: 'relative', zIndex: 1 }}>
            <div className="fila" style={{ gap: 8 }}>
              <Icono n="certificado" s={18} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>Certificados este mes</span>
            </div>
            <div className="t-display" style={{ fontSize: 44, color: '#fff' }}>{certificatesThisMonth}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)' }}>{totalCertificates} emitidos en total</div>
            <Link href="/admin/certificados" className="btn btn-primary" style={{ marginTop: 12 }}>Ver certificados</Link>
          </div>
          <Onda alto={28} />
        </div>
      </div>
    </div>
  )
}
