import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'

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

  // Fetch admin stats
  const { data: stats } = await supabase
    .from('reporte_avance')
    .select('*')

  // Calculate metrics
  const totalWorkers = stats?.length || 0
  const coursesCompleted = stats?.reduce((acc, s) => acc + (s.cursos_completados || 0), 0) || 0
  const inProgress = stats?.filter(s => s.cursos_en_progreso > 0).length || 0
  const approvalRate = totalWorkers > 0
    ? Math.round((stats!.filter(s => s.tasa_aprobacion > 70).length / totalWorkers) * 100)
    : 0

  // Mock worker progress data (replace with actual query)
  const workerProgress: WorkerProgress[] = [
    {
      id: '1',
      full_name: 'Juan Pablo Silva',
      sede: 'SEDE 1',
      area_trabajo: 'Logística',
      courses_completed: 8,
      status: 'al_dia',
      last_activity: 'Hace 2 horas',
    },
    {
      id: '2',
      full_name: 'María José Castro',
      sede: 'SEDE 2',
      area_trabajo: 'Operaciones',
      courses_completed: 5,
      status: 'en_progreso',
      last_activity: 'Ayer',
    },
    {
      id: '3',
      full_name: 'Andrés Fuenzalida',
      sede: 'SEDE 1',
      area_trabajo: 'Bodega',
      courses_completed: 2,
      status: 'atrasado',
      last_activity: 'Hace 5 días',
    },
    {
      id: '4',
      full_name: 'Carolina Herrera',
      sede: 'SEDE 2',
      area_trabajo: 'Administración',
      courses_completed: 12,
      status: 'al_dia',
      last_activity: 'Hoy, 09:15',
    },
    {
      id: '5',
      full_name: 'Diego Valenzuela',
      sede: 'SEDE 1',
      area_trabajo: 'Transporte',
      courses_completed: 4,
      status: 'en_progreso',
      last_activity: 'Ayer',
    },
  ]

  const topCourses: CourseCompletion[] = [
    { course_name: 'Cuidado Integral', completion_rate: 95 },
    { course_name: 'Primeros Auxilios', completion_rate: 80 },
    { course_name: 'Comunicación', completion_rate: 70 },
  ]

  return (
    <>
      {/* TopAppBar */}
      <header className="w-full bg-[var(--md-surface)] flex justify-between items-center px-8 py-6 sticky top-0 z-40">
        <div>
          <h2 className="text-2xl font-bold text-[#2B4FA0] tracking-tight">Dashboard</h2>
          <p className="text-slate-500 text-sm mt-0.5">Resumen de capacitaciones · Todas las sedes</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Filter Tabs */}
          <div className="flex gap-2 bg-[var(--md-surface-container)] p-1 rounded-lg">
            <button className="px-4 py-1.5 text-xs font-semibold bg-white shadow-sm rounded-md text-[#2B4FA0]">
              Sede
            </button>
            <button className="px-4 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-200/50 rounded-md transition-colors">
              Área de trabajo
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-200/50 rounded-full text-slate-500 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
            <button className="p-2 hover:bg-slate-200/50 rounded-full text-slate-500 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </button>

            <div className="h-8 w-px bg-slate-200 mx-2"></div>

            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-xs font-bold text-[var(--md-on-surface)]">Admin User</p>
                <p className="text-[10px] text-[var(--md-on-surface-variant)] uppercase tracking-tighter">Gestión Central</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-[#2B4FA0] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <div className="p-8 space-y-8">
        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon="person"
            label="Trabajadores activos"
            value={totalWorkers.toString()}
            badge={{ text: '+12%', color: 'emerald' }}
            iconBg="bg-[var(--md-primary-fixed-dim)]/30"
            iconColor="text-[var(--md-primary-dim)]"
          />
          <MetricCard
            icon="verified"
            label="Cursos completados"
            value={coursesCompleted.toString()}
            badge={{ text: 'Meta 90%', color: 'emerald' }}
            iconBg="bg-[var(--md-primary-fixed-dim)]/30"
            iconColor="text-[var(--md-primary-dim)]"
          />
          <MetricCard
            icon="pending_actions"
            label="En progreso"
            value={inProgress.toString()}
            iconBg="bg-orange-50"
            iconColor="text-[#F5A623]"
          />
          <MetricCard
            icon="trending_up"
            label="Tasa de aprobación"
            value={`${approvalRate}%`}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
        </div>

        {/* Two Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* Left: Worker Progress Table (60%) */}
          <div className="lg:col-span-6 bg-[var(--md-surface-container-lowest)] rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] overflow-hidden">
            <div className="p-6 border-b border-[var(--md-surface-container)] flex justify-between items-center">
              <h4 className="font-bold text-lg text-[var(--md-on-surface)]">Progreso por trabajador</h4>
              <Link
                href="/admin/trabajadores"
                className="text-[var(--md-primary)] text-sm font-semibold hover:underline"
              >
                Ver todos
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[var(--md-surface-container)]/50 text-[11px] uppercase tracking-widest text-[var(--md-on-surface-variant)] font-bold">
                  <tr>
                    <th className="px-6 py-4">Trabajador</th>
                    <th className="px-6 py-4 text-center">Sede</th>
                    <th className="px-6 py-4">Área</th>
                    <th className="px-6 py-4 text-center">Completados</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4">Última actividad</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[var(--md-surface-container)]">
                  {workerProgress.map((worker, index) => (
                    <tr
                      key={worker.id}
                      className={index % 2 === 1 ? 'bg-[var(--md-surface-container)]/30' : ''}
                    >
                      <td className="px-6 py-4 font-semibold text-[var(--md-on-surface)]">
                        {worker.full_name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={cn(
                            'px-2 py-1 rounded text-[10px] font-bold',
                            worker.sede === 'SEDE 1'
                              ? 'bg-blue-100 text-[#4059aa]'
                              : 'bg-[#1A2F6B]/10 text-[#1A2F6B]'
                          )}
                        >
                          {worker.sede}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[var(--md-on-surface-variant)]">{worker.area_trabajo}</td>
                      <td className="px-6 py-4 text-center font-medium">{worker.courses_completed}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={worker.status} />
                      </td>
                      <td className="px-6 py-4 text-[var(--md-on-surface-variant)] text-xs italic">
                        {worker.last_activity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Analytics Panels (40%) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Top Panel: Cursos más completados */}
            <div className="bg-[var(--md-surface-container-lowest)] p-6 rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-lg text-[var(--md-on-surface)]">Cursos más completados</h4>
                <button className="text-[var(--md-on-surface-variant)]">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {topCourses.map((course) => (
                  <div key={course.course_name}>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-[var(--md-on-surface)]">{course.course_name}</span>
                      <span className="text-[var(--md-primary)]">{course.completion_rate}%</span>
                    </div>
                    <div className="w-full bg-[var(--md-surface-container)] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#4059aa] h-full rounded-full transition-all"
                        style={{ width: `${course.completion_rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Panel: Certificados */}
            <div className="bg-gradient-to-br from-[#1A2F6B] to-[#2B4FA0] p-6 rounded-xl shadow-lg relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 text-white/10 opacity-20 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <svg className="w-[120px] h-[120px]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-[#F5A623]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
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

// Helper Components
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

interface MetricCardProps {
  icon: string
  label: string
  value: string
  badge?: { text: string; color: 'emerald' | 'blue' | 'orange' }
  iconBg: string
  iconColor: string
}

function MetricCard({ icon, label, value, badge, iconBg, iconColor }: MetricCardProps) {
  return (
    <div className="bg-[var(--md-surface-container-lowest)] p-6 rounded-xl shadow-[0_4px_20px_rgba(42,52,57,0.04)] transition-transform hover:scale-[1.02]">
      <div className="flex justify-between items-start mb-4">
        <span className={cn('material-symbols-outlined p-2 rounded-lg', iconBg, iconColor)}>
          {icon}
        </span>
        {badge && (
          <span
            className={cn(
              'text-xs font-bold px-2 py-1 rounded',
              badge.color === 'emerald' && 'text-emerald-500 bg-emerald-50'
            )}
          >
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-[var(--md-on-surface-variant)] text-xs font-semibold uppercase tracking-wider">{label}</p>
      <h3 className="text-3xl font-extrabold text-[#2B4FA0] mt-1">{value}</h3>
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
