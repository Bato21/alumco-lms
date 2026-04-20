import type { Metadata } from 'next'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { 
  Calendar, Filter, User, CheckCircle, Clock, TrendingUp, 
  MoreVertical, Award, Medal 
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard Administrador | Alumco LMS',
}

interface WorkerProgress {
  id: string
  full_name: string
  sede: string
  area_trabajo: string
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
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Bienvenido'

// Trabajadores activos (solo role=trabajador y status=activo)
const adminClient = await createAdminClient()
const { data: activeWorkers } = await adminClient
  .from('profiles')
  .select('id')
  .eq('role', 'trabajador')
  .eq('status', 'activo')

const totalWorkers = activeWorkers?.length ?? 0

// Progreso de cursos
const { data: progressData } = await supabase
  .from('course_progress')
  .select('is_completed, user_id')

const completedProgress = progressData?.filter(p => p.is_completed) ?? []
const coursesCompleted = completedProgress.length

// Trabajadores con al menos un curso en progreso
const { data: inProgressData } = await supabase
  .from('course_progress')
  .select('user_id')
  .eq('is_completed', false)

const uniqueInProgress = new Set(inProgressData?.map(p => p.user_id) ?? [])
const inProgress = uniqueInProgress.size

// Tasa de aprobación global de quizzes
const { data: allAttempts } = await supabase
  .from('quiz_attempts')
  .select('status')

const totalAttempts = allAttempts?.length ?? 0
const approvedAttempts = allAttempts?.filter(a => a.status === 'aprobado').length ?? 0
const approvalRate = totalAttempts > 0
  ? Math.round((approvedAttempts / totalAttempts) * 100)
  : 0

// Obtener trabajadores activos con su progreso real
const { data: workersData } = await adminClient
  .from('profiles')
  .select('id, full_name, sede, area_trabajo')
  .eq('role', 'trabajador')
  .eq('status', 'activo')
  .order('full_name')

const { data: allProgress } = await adminClient
  .from('course_progress')
  .select('user_id, is_completed, completed_at, updated_at')

const { data: allCertificates } = await adminClient
  .from('certificates')
  .select('user_id, issued_at')

const workerProgress: WorkerProgress[] = (workersData ?? []).map((worker) => {
  const workerProgressList = allProgress?.filter(p => p.user_id === worker.id) ?? []
  const completed = workerProgressList.filter(p => p.is_completed).length
  const inProgressCount = workerProgressList.filter(p => !p.is_completed).length

  let status: 'al_dia' | 'en_progreso' | 'atrasado' = 'al_dia'
  if (inProgressCount > 0) status = 'en_progreso'
  if (workerProgressList.length === 0) status = 'atrasado'

  // Última actividad — más reciente entre progress y certificates
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
    area_trabajo: worker.area_trabajo,
    courses_completed: completed,
    status,
    last_activity: lastActivity,
  }
})

// Cursos más completados
const { data: allCourses } = await adminClient
  .from('courses')
  .select('id, title')
  .eq('is_published', true)

const { data: allCourseProgress } = await adminClient
  .from('course_progress')
  .select('course_id, is_completed, user_id')

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

// Certificados emitidos este mes
const startOfMonth = new Date()
startOfMonth.setDate(1)
startOfMonth.setHours(0, 0, 0, 0)

const { data: monthCertificates } = await adminClient
  .from('certificates')
  .select('id')
  .gte('issued_at', startOfMonth.toISOString())

const certificatesThisMonth = monthCertificates?.length ?? 0

  return (
    <>
      {/* TopAppBar */}
      <header className="w-full bg-[#f7f9fb] flex justify-between items-center px-4 lg:px-8 py-4 lg:py-6 sticky top-0 z-40 border-b border-[#e8eff3]/50 gap-4">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-3xl font-extrabold tracking-tight text-[#1A1A2E] truncate">
            Hola, {firstName}!
          </h1>
          <p className="text-slate-500 text-xs lg:text-sm mt-0.5 hidden sm:block">Resumen de capacitaciones · Todas las sedes</p>
        </div>
        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
          <div className="hidden lg:flex gap-2 bg-[#e8eff3] p-1 rounded-lg">
            <button className="px-4 py-1.5 text-xs font-semibold bg-white shadow-sm rounded-md text-[#2B4FA0]">Sede</button>
            <button className="px-4 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200/50 rounded-md transition-colors">Área de trabajo</button>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden lg:block p-2 hover:bg-slate-200/50 rounded-full text-slate-500 transition-colors">
              <Calendar className="w-5 h-5" />
            </button>
            <button className="hidden lg:block p-2 hover:bg-slate-200/50 rounded-full text-slate-500 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
            <div className="hidden lg:block h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-2 lg:gap-3 lg:pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-[#2a3439]">Admin User</p>
                <p className="text-[10px] text-[#566166] uppercase tracking-tighter">Gestión Central</p>
              </div>
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full border-2 border-white shadow-sm bg-[#2B4FA0] flex items-center justify-center shrink-0">
                <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Canvas */}
      <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white p-4 lg:p-6 rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#c9d3ff]/30 p-2 rounded-lg"><User className="w-6 h-6 text-[#334d9d]" /></div>
              <span className="text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded">+12%</span>
            </div>
            <p className="text-[#566166] text-xs font-semibold uppercase tracking-wider">Trabajadores activos</p>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#2B4FA0] mt-1">{totalWorkers}</h3>
          </div>
          
          <div className="bg-white p-4 lg:p-6 rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#c9d3ff]/30 p-2 rounded-lg"><CheckCircle className="w-6 h-6 text-[#334d9d]" /></div>
              <span className="text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded">Meta 90%</span>
            </div>
            <p className="text-[#566166] text-xs font-semibold uppercase tracking-wider">Cursos completados</p>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#2B4FA0] mt-1">{coursesCompleted}</h3>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-orange-50 p-2 rounded-lg"><Clock className="w-6 h-6 text-[#F5A623]" /></div>
            </div>
            <p className="text-[#566166] text-xs font-semibold uppercase tracking-wider">En progreso</p>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#2B4FA0] mt-1">{inProgress}</h3>
          </div>

          <div className="bg-white p-4 lg:p-6 rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-50 p-2 rounded-lg"><TrendingUp className="w-6 h-6 text-emerald-600" /></div>
            </div>
            <p className="text-[#566166] text-xs font-semibold uppercase tracking-wider">Tasa de aprobación</p>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-[#2B4FA0] mt-1">{approvalRate}%</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 lg:gap-8">
          <div className="xl:col-span-6 bg-white rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-[#e8eff3] flex justify-between items-center">
              <h4 className="font-bold text-lg text-[#2a3439]">Progreso por trabajador</h4>
              <button className="text-[#4059aa] text-sm font-semibold hover:underline">Ver todos</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#e8eff3]/50 text-[11px] uppercase tracking-widest text-[#566166] font-bold">
                  <tr>
                    <th className="px-4 lg:px-6 py-4">Trabajador</th>
                    <th className="px-4 lg:px-6 py-4 text-center hidden lg:table-cell">Sede</th>
                    <th className="px-4 lg:px-6 py-4 hidden lg:table-cell">Área</th>
                    <th className="px-4 lg:px-6 py-4 text-center hidden lg:table-cell">Completados</th>
                    <th className="px-4 lg:px-6 py-4">Estado</th>
                    <th className="px-4 lg:px-6 py-4 hidden lg:table-cell">Última actividad</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#e8eff3]">
                  {workerProgress.map((worker) => (
                    <tr key={worker.id} className="hover:bg-[#f0f4f7] transition-colors">
                      <td className="px-4 lg:px-6 py-4 font-semibold text-[#2a3439]">{worker.full_name}</td>
                      <td className="px-4 lg:px-6 py-4 text-center hidden lg:table-cell">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${worker.sede === 'SEDE 1' ? 'bg-blue-100 text-[#4059aa]' : 'bg-[#1A2F6B]/10 text-[#1A2F6B]'}`}>
                          {worker.sede}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-[#566166] hidden lg:table-cell">{worker.area_trabajo}</td>
                      <td className="px-4 lg:px-6 py-4 text-center font-medium hidden lg:table-cell">{worker.courses_completed}</td>
                      <td className="px-4 lg:px-6 py-4">
                        <StatusBadge status={worker.status} />
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-[#566166] text-xs italic hidden lg:table-cell">{worker.last_activity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-6 lg:space-y-8">
            <div className="bg-white p-4 lg:p-6 rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-lg text-[#2a3439]">Cursos más completados</h4>
                <MoreVertical className="w-5 h-5 text-[#566166]" />
              </div>
              <div className="space-y-6">
                {topCourses.map(course => (
                  <div key={course.course_name}>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-[#2a3439]">{course.course_name}</span>
                      <span className="text-[#4059aa]">{course.completion_rate}%</span>
                    </div>
                    <div className="w-full bg-[#e8eff3] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#4059aa] h-full rounded-full transition-all duration-500" style={{ width: `${course.completion_rate}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1A2F6B] to-[#2B4FA0] p-6 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <Award className="w-[120px] h-[120px] text-white" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Medal className="w-5 h-5 text-[#F5A623]" />
                  <h4 className="text-white/80 font-semibold text-sm tracking-wide">Certificados este mes</h4>
                </div>
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-5xl font-black text-white">{certificatesThisMonth}</span>
                  <span className="text-white/60 text-xs font-medium uppercase tracking-widest">Emitidos</span>
                </div>
                <button className="w-full py-3 bg-[#F5A623] hover:bg-[#e0961a] text-[#1A2F6B] font-bold rounded-lg text-sm shadow-md transition-all active:scale-[0.98]">
                  Ver todos los certificados
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
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
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span> 
      {label}
    </span>
  )
}