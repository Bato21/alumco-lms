import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Users, BookOpen, TrendingUp, Award, Medal } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard Administrador | Alumco LMS',
}

interface WorkerProgress {
  id: string
  full_name: string
  sede: string
  area_trabajo: string[]
  courses_completed: number
  status: 'al_dia' | 'en_progreso' | 'atrasado'
  last_activity: string
}

interface CourseCompletion {
  course_name: string
  completion_rate: number
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single() as { data: { full_name: string } | null }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Bienvenido'

  const adminClient = await createAdminClient()
  const { data: activeWorkers } = await adminClient
    .from('profiles')
    .select('id')
    .eq('role', 'trabajador')
    .eq('status', 'activo') as { data: { id: string }[] | null }

  const totalWorkers = activeWorkers?.length ?? 0

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data: weekCompletions } = await adminClient
    .from('course_progress')
    .select('id')
    .eq('is_completed', true)
    .gte('completed_at', sevenDaysAgo.toISOString()) as { data: { id: string }[] | null }

  const coursesCompleted = weekCompletions?.length ?? 0

  const { data: inProgressData } = await supabase
    .from('course_progress')
    .select('user_id')
    .eq('is_completed', false) as { data: { user_id: string }[] | null }

  const uniqueInProgress = new Set(inProgressData?.map(p => p.user_id) ?? [])
  const inProgress = uniqueInProgress.size

  const { data: coursesForCompliance } = await adminClient
    .from('courses')
    .select('id, target_areas')
    .eq('is_published', true) as { data: { id: string; target_areas: string[] | null }[] | null }

  const { data: workersForCompliance } = await adminClient
    .from('profiles')
    .select('id, area_trabajo')
    .eq('role', 'trabajador')
    .eq('status', 'activo') as { data: { id: string; area_trabajo: string[] }[] | null }

  const { data: completedProgress } = await adminClient
    .from('course_progress')
    .select('user_id, course_id')
    .eq('is_completed', true) as { data: { user_id: string; course_id: string }[] | null }

  let assignmentsTotal = 0
  let assignmentsCompleted = 0
  for (const w of workersForCompliance ?? []) {
    const wAreas = (w.area_trabajo as string[]) ?? []
    for (const c of coursesForCompliance ?? []) {
      const tAreas = (c.target_areas as string[] | null) ?? []
      const visible = tAreas.length === 0 || tAreas.some(a => wAreas.includes(a))
      if (!visible) continue
      assignmentsTotal++
      if (completedProgress?.some(p => p.user_id === w.id && p.course_id === c.id)) {
        assignmentsCompleted++
      }
    }
  }
  const approvalRate = assignmentsTotal > 0
    ? Math.round((assignmentsCompleted / assignmentsTotal) * 100)
    : 0

  const { data: workersData } = await adminClient
    .from('profiles')
    .select('id, full_name, sede, area_trabajo')
    .eq('role', 'trabajador')
    .eq('status', 'activo')
    .order('full_name') as { data: { id: string; full_name: string; sede: string; area_trabajo: string[] }[] | null }

  const { data: allProgress } = await adminClient
    .from('course_progress')
    .select('user_id, course_id, is_completed, completed_at, updated_at') as { data: { user_id: string; course_id: string; is_completed: boolean; completed_at: string | null; updated_at: string | null }[] | null }

  const { data: allCertificates } = await adminClient
    .from('certificates')
    .select('user_id, issued_at') as { data: { user_id: string; issued_at: string }[] | null }

  const { data: coursesForStatus } = await adminClient
    .from('courses')
    .select('id, deadline, target_areas')
    .eq('is_published', true) as { data: { id: string; deadline: string | null; target_areas: string[] | null }[] | null }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const workerProgress: WorkerProgress[] = (workersData ?? []).map((worker) => {
    const workerProgressList = allProgress?.filter(p => p.user_id === worker.id) ?? []
    const completed = workerProgressList.filter(p => p.is_completed).length
    const inProgressCount = workerProgressList.filter(p => !p.is_completed).length

    const workerAreas = (worker.area_trabajo as string[]) ?? []
    const completedCourseIds = new Set(workerProgressList.filter(p => p.is_completed).map(p => p.course_id))

    const relevantCourses = (coursesForStatus ?? []).filter(c => {
      const targetAreas = (c.target_areas as string[] | null) ?? []
      return targetAreas.length === 0 || targetAreas.some(a => workerAreas.includes(a))
    })

    const hasOverdue = relevantCourses.some(c => {
      if (!c.deadline) return false
      const dl = new Date(c.deadline as string)
      dl.setHours(0, 0, 0, 0)
      return dl < today && !completedCourseIds.has(c.id as string)
    })

    let status: 'al_dia' | 'en_progreso' | 'atrasado' = 'al_dia'
    if (hasOverdue) status = 'atrasado'
    else if (inProgressCount > 0) status = 'en_progreso'
    else if (workerProgressList.length === 0 && relevantCourses.length > 0) status = 'atrasado'

    const lastProgress = workerProgressList
      .map(p => p.completed_at ?? p.updated_at)
      .filter(Boolean)
      .sort()
      .at(-1)

    const lastCert = allCertificates
      ?.filter(c => c.user_id === worker.id)
      .map(c => c.issued_at)
      .sort()
      .at(-1)

    const lastActivityRaw = [lastProgress, lastCert]
      .filter(Boolean)
      .sort()
      .at(-1)

    let lastActivity = 'Sin actividad'
    if (lastActivityRaw) {
      const diff = Math.floor(
        (Date.now() - new Date(lastActivityRaw).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diff === 0) lastActivity = 'Hoy'
      else if (diff === 1) lastActivity = 'Ayer'
      else if (diff < 7) lastActivity = `Hace ${diff} días`
      else lastActivity = new Intl.DateTimeFormat('es-CL', {
        day: '2-digit', month: 'short'
      }).format(new Date(lastActivityRaw))
    }

    return {
      id: worker.id,
      full_name: worker.full_name,
      sede: worker.sede === 'sede_1' ? 'SEDE 1' : 'SEDE 2',
      area_trabajo: (worker.area_trabajo as string[]) ?? [],
      courses_completed: completed,
      status,
      last_activity: lastActivity,
    }
  })

  const { data: allCourses } = await adminClient
    .from('courses')
    .select('id, title')
    .eq('is_published', true) as { data: { id: string; title: string }[] | null }

  const { data: allCourseProgress } = await adminClient
    .from('course_progress')
    .select('course_id, is_completed, user_id') as { data: { course_id: string; is_completed: boolean; user_id: string }[] | null }

  const topCourses: CourseCompletion[] = (allCourses ?? [])
    .map((course) => {
      const courseProgressList = allCourseProgress?.filter(
        p => p.course_id === course.id
      ) ?? []
      const completedCount = courseProgressList.filter(p => p.is_completed).length
      const totalWorkerCount = activeWorkers?.length ?? 1
      const completion_rate = totalWorkerCount > 0
        ? Math.round((completedCount / totalWorkerCount) * 100)
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

  const { data: monthCertificates } = await adminClient
    .from('certificates')
    .select('id')
    .gte('issued_at', startOfMonth.toISOString()) as { data: { id: string }[] | null }

  const certificatesThisMonth = monthCertificates?.length ?? 0

  // Derived stats (no new queries)
  const publishedCourses = allCourses?.length ?? 0
  const totalCertificates = allCertificates?.length ?? 0

  const sede1Workers = workersData?.filter(w => w.sede === 'sede_1') ?? []
  const sede2Workers = workersData?.filter(w => w.sede === 'sede_2') ?? []

  const getSedeRate = (sedeWorkers: { id: string }[]) => {
    if (sedeWorkers.length === 0) return 0
    const ids = new Set(sedeWorkers.map(w => w.id))
    const rel = allCourseProgress?.filter(p => ids.has(p.user_id)) ?? []
    if (rel.length === 0) return 0
    return Math.round((rel.filter(p => p.is_completed).length / rel.length) * 100)
  }

  const sede1Rate = getSedeRate(sede1Workers)
  const sede2Rate = getSedeRate(sede2Workers)

  const recentActivity = (allProgress ?? [])
    .map(p => ({
      ...p,
      worker: workersData?.find(w => w.id === p.user_id),
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
        initials: name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
      }
    })

  const workersWithNoProgress = (workersData ?? []).filter(w =>
    !allProgress?.some(p => p.user_id === w.id)
  ).length

  const heroBannerTitle = workersWithNoProgress > 0
    ? `Capacita a tu equipo, ${firstName}.`
    : 'Cuidados con empatía, equipos con propósito.'

  return (
    <div className="bg-[#F8F9FA] min-h-screen">

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1A2F6B] to-[#2B4FA0] h-48 lg:h-56 flex items-center px-6 lg:px-10">
        {/* Decorative circles */}
        <div className="absolute right-0 top-0 w-full h-full pointer-events-none">
          <div className="absolute right-[-60px] top-[-60px] w-64 h-64 rounded-full bg-[#F5A623] opacity-10" />
          <div className="absolute right-[60px] top-[20px] w-44 h-44 rounded-full bg-[#2B4FA0] opacity-20 border-2 border-white/10" />
          <div className="absolute right-[20px] bottom-[-40px] w-48 h-48 rounded-full bg-[#E74C3C] opacity-10" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold mb-2">Progreso semanal</p>
          <h1 className="text-2xl lg:text-4xl font-extrabold text-white leading-tight mb-2">
            {heroBannerTitle}
          </h1>
          <p className="text-white/75 text-sm mb-5">
            {totalWorkers} colaboradores activos · {coursesCompleted} cursos completados esta semana.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/admin/cursos/nuevo"
              className="px-5 py-2.5 bg-[#F5A623] text-[#1A2F6B] font-bold rounded-lg text-sm hover:bg-[#e0961a] transition-colors"
            >
              Nueva capacitación →
            </Link>
            <Link
              href="/admin/reportes"
              className="px-5 py-2.5 bg-white/10 text-white border border-white/20 font-semibold rounded-lg text-sm hover:bg-white/20 transition-colors"
            >
              Ver reportes
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 space-y-8">

        <div className="flex items-center justify-end gap-4 flex-wrap">
          <p className="text-[#6B7280] text-xs">Actualizado hace 0 minutos</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">

          {/* Card 1 — Blue */}
          <div className="bg-[#2B4FA0] text-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Colaboradores activos</p>
            <p className="text-3xl font-extrabold">{totalWorkers}</p>
          </div>

          {/* Card 2 — White */}
          <div className="bg-white border border-slate-200 text-[#1A1A2E] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
            <div className="w-10 h-10 rounded-full bg-[#E6F1FB] flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5 text-[#2B4FA0]" aria-hidden="true" />
            </div>
            <p className="text-[#1A1A2E]/70 text-xs font-semibold uppercase tracking-wider mb-1">Capacitaciones publicadas</p>
            <p className="text-3xl font-extrabold">{publishedCourses}</p>
          </div>

          {/* Card 3 — Soft green */}
          <div className="bg-[#EDFAF3] text-[#1A6B3A] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
            <div className="w-10 h-10 rounded-full bg-[#27AE60]/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-[#27AE60]" aria-hidden="true" />
            </div>
            <p className="text-[#1A6B3A]/70 text-xs font-semibold uppercase tracking-wider mb-1">Cumplimiento</p>
            <p className="text-3xl font-extrabold text-[#1A6B3A]">{approvalRate}%</p>
          </div>

          {/* Card 4 — Amber tint */}
          <div className="bg-[#FFF8EC] text-[#92600A] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
            <div className="w-10 h-10 rounded-full bg-[#F5A623]/20 flex items-center justify-center mb-4">
              <Award className="w-5 h-5 text-[#F5A623]" aria-hidden="true" />
            </div>
            <p className="text-[#92600A]/70 text-xs font-semibold uppercase tracking-wider mb-1">Certificados emitidos</p>
            <p className="text-3xl font-extrabold text-[#92600A]">{totalCertificates}</p>
          </div>
        </div>

        {/* Bottom section — 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">

          {/* Col 1: Comparativa por sede (4/10) */}
          <div className="lg:col-span-4 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
            <h3 className="font-bold text-[#1A1A2E] text-base mb-6">Comparativa por sede</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-[#1A1A2E]">Sede Hualpén</span>
                  <span className="text-sm font-bold text-[#2B4FA0]">{sede1Rate}%</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-[#2B4FA0] h-full rounded-full transition-all duration-500"
                    style={{ width: `${sede1Rate}%` }}
                  />
                </div>
                <p className="text-xs text-[#6B7280] mt-1">{sede1Workers.length} trabajadores</p>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-[#1A1A2E]">Sede Coyhaique</span>
                  <span className="text-sm font-bold text-[#F5A623]">{sede2Rate}%</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-[#F5A623] h-full rounded-full transition-all duration-500"
                    style={{ width: `${sede2Rate}%` }}
                  />
                </div>
                <p className="text-xs text-[#6B7280] mt-1">{sede2Workers.length} trabajadores</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-[#6B7280]">
                Meta trimestral:{' '}
                <span className="font-bold text-[#1A1A2E]">90% de cumplimiento</span>
              </p>
            </div>
          </div>

          {/* Col 2: Actividad reciente (3/10) */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
            <h3 className="font-bold text-[#1A1A2E] text-base mb-6">Actividad reciente</h3>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-[#6B7280]">Sin actividad reciente.</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div key={`${item.userId}-${item.courseId}-${item.updatedAt}`} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#2B4FA0] flex items-center justify-center shrink-0">
                      <span className="text-white text-[10px] font-bold">{item.initials}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1A1A2E] truncate">{item.name}</p>
                      <p className="text-xs text-[#6B7280]">{item.action}</p>
                    </div>
                    <span className="text-[10px] text-[#6B7280] shrink-0 mt-0.5">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Col 3: Cursos + Certificados (3/10) */}
          <div className="lg:col-span-3 space-y-6">

            {/* Cursos más completados */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
              <h3 className="font-bold text-[#1A1A2E] text-base mb-5">Cursos más completados</h3>
              <div className="space-y-4">
                {topCourses.length === 0 ? (
                  <p className="text-sm text-[#6B7280]">Sin datos aún.</p>
                ) : topCourses.map(course => (
                  <div key={course.course_name}>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-[#1A1A2E] truncate pr-2">{course.course_name}</span>
                      <span className="text-[#2B4FA0] shrink-0">{course.completion_rate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2B4FA0] h-full rounded-full transition-all duration-500"
                        style={{ width: `${course.completion_rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificados este mes */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#1A2F6B] to-[#2B4FA0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
              <div className="absolute -right-6 -top-6 opacity-15 pointer-events-none">
                <Award className="w-28 h-28 text-white" aria-hidden="true" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Medal className="w-4 h-4 text-[#F5A623]" aria-hidden="true" />
                  <p className="text-white/80 text-xs font-semibold">Certificados este mes</p>
                </div>
                <p className="text-5xl font-black text-white mb-1">{certificatesThisMonth}</p>
                <p className="text-white/50 text-[10px] uppercase tracking-widest mb-5">Emitidos</p>
                <Link
                  href="/admin/reportes"
                  className="block w-full py-2.5 bg-[#F5A623] hover:bg-[#e0961a] text-[#1A2F6B] font-bold rounded-lg text-sm text-center transition-colors"
                >
                  Ver todos los certificados
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla: Progreso por trabajador */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-5 lg:px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-[#1A1A2E] text-base">Progreso por trabajador</h3>
            <button className="text-[#2B4FA0] text-sm font-semibold hover:underline">Ver todos</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-widest text-[#6B7280] font-bold">
                <tr>
                  <th className="px-5 lg:px-6 py-3">Trabajador</th>
                  <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">Sede</th>
                  <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">Área</th>
                  <th className="px-5 lg:px-6 py-3 text-center hidden lg:table-cell">Completados</th>
                  <th className="px-5 lg:px-6 py-3">Estado</th>
                  <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">Última actividad</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {workerProgress.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 lg:px-6 py-4 font-semibold text-[#1A1A2E]">{worker.full_name}</td>
                    <td className="px-5 lg:px-6 py-4 hidden lg:table-cell">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        worker.sede === 'SEDE 1'
                          ? 'bg-[#E6F1FB] text-[#2B4FA0]'
                          : 'bg-[#EAF3DE] text-[#27500A]'
                      }`}>
                        {worker.sede === 'SEDE 1' ? 'Hualpén' : 'Coyhaique'}
                      </span>
                    </td>
                    <td className="px-5 lg:px-6 py-4 text-[#6B7280] hidden lg:table-cell">
                      {worker.area_trabajo.length > 0 ? worker.area_trabajo.join(', ') : 'Sin asignar'}
                    </td>
                    <td className="px-5 lg:px-6 py-4 text-center font-medium hidden lg:table-cell">{worker.courses_completed}</td>
                    <td className="px-5 lg:px-6 py-4">
                      <StatusBadge status={worker.status} />
                    </td>
                    <td className="px-5 lg:px-6 py-4 text-[#6B7280] text-xs hidden lg:table-cell">{worker.last_activity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'al_dia' | 'en_progreso' | 'atrasado' }) {
  const config = {
    al_dia: { color: '#27AE60', label: 'Al día' },
    en_progreso: { color: '#F5A623', label: 'En progreso' },
    atrasado: { color: '#E74C3C', label: 'Atrasado' },
  }
  const { color, label } = config[status]
  return (
    <span className="flex items-center gap-1.5 font-bold text-xs" style={{ color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
