import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
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

  const { data: stats } = await supabase.from('reporte_avance').select('*')

  const totalWorkers = stats?.length || 0
  const coursesCompleted = stats?.reduce((acc, s) => acc + (s.cursos_completados || 0), 0) || 0
  const inProgress = stats?.filter(s => s.cursos_en_progreso > 0).length || 0
  const approvalRate = totalWorkers > 0
    ? Math.round((stats!.filter(s => s.tasa_aprobacion > 70).length / totalWorkers) * 100)
    : 0

  const workerProgress: WorkerProgress[] = [
    { id: '1', full_name: 'Juan Pablo Silva', sede: 'SEDE 1', area_trabajo: 'Logística', courses_completed: 8, status: 'al_dia', last_activity: 'Hace 2 horas' },
    { id: '2', full_name: 'María José Castro', sede: 'SEDE 2', area_trabajo: 'Operaciones', courses_completed: 5, status: 'en_progreso', last_activity: 'Ayer' },
    { id: '3', full_name: 'Andrés Fuenzalida', sede: 'SEDE 1', area_trabajo: 'Bodega', courses_completed: 2, status: 'atrasado', last_activity: 'Hace 5 días' },
    { id: '4', full_name: 'Carolina Herrera', sede: 'SEDE 2', area_trabajo: 'Administración', courses_completed: 12, status: 'al_dia', last_activity: 'Hoy, 09:15' },
    { id: '5', full_name: 'Diego Valenzuela', sede: 'SEDE 1', area_trabajo: 'Transporte', courses_completed: 4, status: 'en_progreso', last_activity: 'Ayer' },
  ]

  const topCourses: CourseCompletion[] = [
    { course_name: 'Cuidado Integral', completion_rate: 95 },
    { course_name: 'Primeros Auxilios', completion_rate: 80 },
    { course_name: 'Comunicación', completion_rate: 70 },
  ]

  return (
    <>
      {/* TopAppBar */}
      <header className="w-full bg-[#f7f9fb] flex justify-between items-center px-8 py-6 sticky top-0 z-40 border-b border-[#e8eff3]/50">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1A2E]">
            Hola, {firstName}!
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Resumen de capacitaciones · Todas las sedes</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 bg-[#e8eff3] p-1 rounded-lg">
            <button className="px-4 py-1.5 text-xs font-semibold bg-white shadow-sm rounded-md text-[#2B4FA0]">Sede</button>
            <button className="px-4 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200/50 rounded-md transition-colors">Área de trabajo</button>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-200/50 rounded-full text-slate-500 transition-colors">
              <Calendar className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-slate-200/50 rounded-full text-slate-500 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-xs font-bold text-[#2a3439]">Admin User</p>
                <p className="text-[10px] text-[#566166] uppercase tracking-tighter">Gestión Central</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-[#2B4FA0] flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Canvas */}
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#c9d3ff]/30 p-2 rounded-lg"><User className="w-6 h-6 text-[#334d9d]" /></div>
              <span className="text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded">+12%</span>
            </div>
            <p className="text-[#566166] text-xs font-semibold uppercase tracking-wider">Trabajadores activos</p>
            <h3 className="text-3xl font-extrabold text-[#2B4FA0] mt-1">{totalWorkers}</h3>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-[#c9d3ff]/30 p-2 rounded-lg"><CheckCircle className="w-6 h-6 text-[#334d9d]" /></div>
              <span className="text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded">Meta 90%</span>
            </div>
            <p className="text-[#566166] text-xs font-semibold uppercase tracking-wider">Cursos completados</p>
            <h3 className="text-3xl font-extrabold text-[#2B4FA0] mt-1">{coursesCompleted}</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-orange-50 p-2 rounded-lg"><Clock className="w-6 h-6 text-[#F5A623]" /></div>
            </div>
            <p className="text-[#566166] text-xs font-semibold uppercase tracking-wider">En progreso</p>
            <h3 className="text-3xl font-extrabold text-[#2B4FA0] mt-1">{inProgress}</h3>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] transition-transform hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-emerald-50 p-2 rounded-lg"><TrendingUp className="w-6 h-6 text-emerald-600" /></div>
            </div>
            <p className="text-[#566166] text-xs font-semibold uppercase tracking-wider">Tasa de aprobación</p>
            <h3 className="text-3xl font-extrabold text-[#2B4FA0] mt-1">{approvalRate}%</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
          <div className="xl:col-span-6 bg-white rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] overflow-hidden">
            <div className="p-6 border-b border-[#e8eff3] flex justify-between items-center">
              <h4 className="font-bold text-lg text-[#2a3439]">Progreso por trabajador</h4>
              <button className="text-[#4059aa] text-sm font-semibold hover:underline">Ver todos</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#e8eff3]/50 text-[11px] uppercase tracking-widest text-[#566166] font-bold">
                  <tr>
                    <th className="px-6 py-4">Trabajador</th>
                    <th className="px-6 py-4 text-center">Sede</th>
                    <th className="px-6 py-4">Área</th>
                    <th className="px-6 py-4 text-center">Completados</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Última actividad</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#e8eff3]">
                  {workerProgress.map((worker) => (
                    <tr key={worker.id} className="hover:bg-[#f0f4f7] transition-colors">
                      <td className="px-6 py-4 font-semibold text-[#2a3439]">{worker.full_name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${worker.sede === 'SEDE 1' ? 'bg-blue-100 text-[#4059aa]' : 'bg-[#1A2F6B]/10 text-[#1A2F6B]'}`}>
                          {worker.sede}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#566166]">{worker.area_trabajo}</td>
                      <td className="px-6 py-4 text-center font-medium">{worker.courses_completed}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={worker.status} />
                      </td>
                      <td className="px-6 py-4 text-[#566166] text-xs italic">{worker.last_activity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)]">
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
                  <span className="text-5xl font-black text-white">12</span>
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