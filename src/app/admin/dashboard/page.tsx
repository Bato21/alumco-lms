import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient, createAdminClient, getCachedUser } from '@/lib/supabase/server'
import { Avatar, BadgeEstado, Progreso, Onda, Icono } from '@/components/alumco/ds'

export const metadata: Metadata = {
  title: 'Dashboard Administrador | Alumco LMS',
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

  // 5 queries en paralelo; el resto de las métricas se derivan en memoria.
  const [
    { data: profile },
    { data: workersData },
    { data: allCourses },
    { data: allProgress },
    { data: allCertificates },
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
      .order('full_name') as unknown as Promise<{ data: { id: string; full_name: string; sede: string; area_trabajo: string[] | null }[] | null }>,
    adminClient
      .from('courses')
      .select('id, title, target_areas')
      .eq('is_published', true) as unknown as Promise<{ data: { id: string; title: string; target_areas: string[] | null }[] | null }>,
    adminClient
      .from('course_progress')
      .select('user_id, course_id, is_completed, completed_at, updated_at') as unknown as Promise<{ data: { user_id: string; course_id: string; is_completed: boolean; completed_at: string | null; updated_at: string | null }[] | null }>,
    adminClient
      .from('certificates')
      .select('user_id, issued_at') as unknown as Promise<{ data: { user_id: string; issued_at: string }[] | null }>,
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Bienvenido'

  const totalWorkers = workersData?.length ?? 0

  const completedSet = new Set(
    (allProgress ?? []).filter(p => p.is_completed).map(p => `${p.user_id}:${p.course_id}`)
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

  const topCourses: CourseCompletion[] = (allCourses ?? [])
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
    .sort((a, b) => b.completion_rate - a.completion_rate)
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

  const workersById = new Map((workersData ?? []).map(w => [w.id, w]))

  const recentActivity = (allProgress ?? [])
    .map(p => ({
      ...p,
      worker: workersById.get(p.user_id),
    }))
    .filter(p => p.worker && p.updated_at)
    .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
    .slice(0, 5)
    .map(p => {
      const diff = Math.floor((Date.now() - new Date(p.updated_at!).getTime()) / (1000 * 60 * 60 * 24))
      const timeAgo = diff === 0 ? 'Hoy' : diff === 1 ? 'Ayer' : `Hace ${diff} días`
      const name = p.worker!.full_name
      return {
        userId: p.user_id as string,
        courseId: p.course_id as string,
        updatedAt: p.updated_at as string,
        name,
        action: p.is_completed ? 'completó un curso' : 'actualizó su progreso',
        time: timeAgo,
      }
    })

  const sedeLabel = (s: string) => (s === 'sede_1' ? 'Hualpén' : s === 'sede_2' ? 'Coyhaique' : s)

  // Trabajadores que requieren seguimiento (pendientes > 0), derivado de los datos ya cargados
  const workerFollowup = (workersData ?? [])
    .map((w) => {
      const wAreas = (w.area_trabajo as string[]) ?? []
      let total = 0
      let done = 0
      for (const c of allCourses ?? []) {
        const tAreas = (c.target_areas as string[] | null) ?? []
        const visible = tAreas.length === 0 || tAreas.some((a) => wAreas.includes(a))
        if (!visible) continue
        total++
        if (completedSet.has(`${w.id}:${c.id}`)) done++
      }
      const pendientes = total - done
      const cumplimiento = total > 0 ? Math.round((done / total) * 100) : 0
      const estado = pendientes === 0 ? 'al-dia' : cumplimiento < 50 ? 'atrasado' : 'en-riesgo'
      return { id: w.id, nombre: w.full_name, sede: sedeLabel(w.sede), pendientes, cumplimiento, estado }
    })
    .filter((w) => w.pendientes > 0)
    .sort((a, b) => b.pendientes - a.pendientes)
    .slice(0, 6)

  const pendientesTotal = assignmentsTotal - assignmentsCompleted

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches'
  const mesLabel = new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

  const heroStats: [string, string][] = [
    [String(totalWorkers), 'trabajadores'],
    [`${approvalRate}%`, 'cumplimiento'],
    [String(publishedCourses), 'cursos activos'],
  ]
  const sedeRows: [string, number, number][] = [
    ['Sede Hualpén', sede1Rate, sede1Workers.length],
    ['Sede Coyhaique', sede2Rate, sede2Workers.length],
  ]

  return (
    <div className="col" style={{ gap: 20 }} data-screen-label="Admin · Dashboard">

      {/* Hero saludo (variante B) */}
      <div
        className="card bloque-marca entra"
        style={{ background: 'var(--grad-marca)', color: '#fff', border: 'none', overflow: 'hidden', position: 'relative' }}
      >
        <div className="fila" style={{ padding: '30px 32px 24px', gap: 24, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <div className="crece" style={{ minWidth: 280 }}>
            <span className="t-eyebrow" style={{ color: 'var(--ambar)' }}>◆ {mesLabel}</span>
            <h2 className="t-display" style={{ fontSize: 30, color: '#fff', marginTop: 8 }}>
              {saludo}, {firstName}.<br />
              Hay <em style={{ color: 'var(--ambar)' }}>{pendientesTotal} cursos pendientes</em> en el equipo.
            </h2>
            <div className="fila" style={{ gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
              <Link href="/admin/cursos/nuevo" className="btn btn-primary">
                <Icono n="mas" s={18} /> Nueva capacitación
              </Link>
              <Link href="/admin/reportes" className="btn btn-secondary">Ver reportes</Link>
            </div>
          </div>
          <div className="fila" style={{ gap: 28 }}>
            {heroStats.map(([v, l]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div className="t-display" style={{ fontSize: 34, color: '#fff' }}>{v}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <Onda alto={36} />
      </div>

      {/* Grid principal: seguimiento + columna lateral */}
      <div className="entra entra-2 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
        {/* Requieren seguimiento */}
        <div className="card col" style={{ gap: 0 }}>
          <div className="fila card-pad" style={{ paddingBottom: 10 }}>
            <h3 className="crece" style={{ fontSize: 16.5 }}>Requieren seguimiento</h3>
            <Link href="/admin/trabajadores" className="btn btn-secondary btn-sm">Ver todos</Link>
          </div>
          {workerFollowup.length === 0 ? (
            <div className="card-pad"><p className="silencio texto-s">Todo el equipo está al día.</p></div>
          ) : (
            <div className="tabla-envoltura">
              <table className="tabla">
                <thead>
                  <tr><th>Trabajador/a</th><th>Sede</th><th>Pendientes</th><th>Estado</th></tr>
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
                      <td><strong>{t.pendientes}</strong> <span className="silencio-3 texto-s">cursos</span></td>
                      <td><BadgeEstado estado={t.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div className="col" style={{ gap: 20 }}>
          {/* Cumplimiento por sede */}
          <div className="card card-pad col" style={{ gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 16.5 }}>Cumplimiento por sede</h3>
              <p className="texto-s silencio-3">Cursos completados por residencia</p>
            </div>
            <div className="col" style={{ gap: 14 }}>
              {sedeRows.map(([n, rate, count]) => (
                <div key={n} className="col" style={{ gap: 6 }}>
                  <div className="fila" style={{ fontSize: 14 }}>
                    <span className="crece" style={{ fontWeight: 600 }}>{n}</span>
                    <span style={{ fontWeight: 640, color: rate < 70 ? 'var(--peligro)' : 'var(--tinta)' }}>{rate}%</span>
                  </div>
                  <Progreso pct={rate} azul={rate >= 70} />
                  <span className="texto-s silencio-3">{count} trabajadores</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="card card-pad col" style={{ gap: 14 }}>
            <h3 style={{ fontSize: 16.5 }}>Actividad reciente</h3>
            {recentActivity.length === 0 ? (
              <p className="silencio texto-s">Aún no hay actividad esta semana.</p>
            ) : (
              <div className="col" style={{ gap: 0 }}>
                {recentActivity.map((item, i) => (
                  <div
                    key={`${item.userId}-${item.courseId}-${item.updatedAt}`}
                    className="fila"
                    style={{ gap: 12, padding: '10px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--borde-suave)' : 'none' }}
                  >
                    <Avatar nombre={item.name} s={34} />
                    <div className="crece texto-s" style={{ lineHeight: 1.4 }}>
                      <strong>{item.name}</strong> {item.action}
                    </div>
                    <span className="texto-s silencio-3" style={{ whiteSpace: 'nowrap' }}>{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fila inferior: cursos más completados + certificados */}
      <div className="entra entra-3 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
        <div className="card card-pad col" style={{ gap: 14 }}>
          <h3 style={{ fontSize: 16.5 }}>Cursos más completados</h3>
          {topCourses.length === 0 ? (
            <p className="silencio texto-s">Sin datos aún.</p>
          ) : (
            <div className="col" style={{ gap: 12 }}>
              {topCourses.map((c) => (
                <div key={c.course_name} className="col" style={{ gap: 6 }}>
                  <div className="fila texto-s">
                    <span className="crece recorte" style={{ fontWeight: 600 }}>{c.course_name}</span>
                    <strong>{c.completion_rate}%</strong>
                  </div>
                  <Progreso pct={c.completion_rate} azul />
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          className="card bloque-marca col"
          style={{ background: 'var(--grad-marca)', color: '#fff', border: 'none', overflow: 'hidden' }}
        >
          <div className="card-pad col" style={{ gap: 4, position: 'relative', zIndex: 1 }}>
            <div className="fila" style={{ gap: 8 }}>
              <Icono n="certificado" s={18} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Certificados este mes</span>
            </div>
            <div className="t-display" style={{ fontSize: 44, color: '#fff' }}>{certificatesThisMonth}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{totalCertificates} emitidos en total</div>
            <Link href="/admin/certificados" className="btn btn-primary" style={{ marginTop: 12 }}>Ver certificados</Link>
          </div>
          <Onda alto={28} />
        </div>
      </div>
    </div>
  )
}
