'use client'

import { useState, useMemo } from 'react'
import {
  Users, CheckCircle, AlertTriangle, TrendingUp,
  Download, Filter, ChevronDown, ChevronUp
} from 'lucide-react'

interface Worker {
  user_id: string
  full_name: string
  sede: string
  area_trabajo: string[]
  totalCourses: number
  completedCourses: number
  pendingCourses: { course_id: string; course_title: string }[]
  progressPct: number
}

interface Course {
  id: string
  title: string
}

interface Stats {
  totalWorkers: number
  fullyCompliant: number
  atRisk: number
  avgCompliance: number
}

interface ReportesClientProps {
  workers: Worker[]
  courses: Course[]
  areas: string[]
  stats: Stats
}

const AREAS = [
  'Enfermería',
  'Auxiliar de enfermería',
  'Kinesiología',
  'Terapia ocupacional',
  'Nutrición',
  'Trabajo social',
  'Psicología',
  'Administración',
  'Dirección técnica',
  'Geriatría',
  'Sin asignar',
]

export function ReportesClient({ workers, courses, areas, stats }: ReportesClientProps) {
  const [sede, setSede] = useState<'todas' | 'sede_1' | 'sede_2'>('todas')
  const [area, setArea] = useState<string>('todas')
  const [estado, setEstado] = useState<'todos' | 'compliant' | 'pendiente' | 'riesgo'>('todos')
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return workers.filter(w => {
      if (sede !== 'todas' && w.sede !== sede) return false
      if (area !== 'todas' && !w.area_trabajo.includes(area)) return false
      if (estado === 'compliant' && w.progressPct !== 100) return false
      if (estado === 'pendiente' && w.pendingCourses.length === 0) return false
      if (estado === 'riesgo' && w.progressPct >= 50) return false
      if (search && !w.full_name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }).sort((a, b) => a.progressPct - b.progressPct)
  }, [workers, sede, area, estado, search])

  const filteredStats = useMemo(() => {
    const total = filtered.length
    const compliant = filtered.filter(w => w.progressPct === 100).length
    const risk = filtered.filter(w => w.progressPct < 50 && w.pendingCourses.length > 0).length
    const avg = total > 0
      ? Math.round(filtered.reduce((acc, w) => acc + w.progressPct, 0) / total)
      : 0
    return { total, compliant, risk, avg }
  }, [filtered])

  function csvEscape(value: string | number): string {
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  function handleExport() {
    const headers = ['Nombre', 'Sede', 'Área', 'Cursos totales', 'Completados', 'Pendientes', 'Progreso %', 'Cursos pendientes']
    const rows = filtered.map(w => [
      w.full_name,
      w.sede === 'sede_1' ? 'Sede Hualpén' : 'Sede Coyhaique',
      w.area_trabajo.join(' | '),
      w.totalCourses,
      w.completedCourses,
      w.pendingCourses.length,
      `${w.progressPct}%`,
      w.pendingCourses.map(p => p.course_title).join(' | '),
    ])
    const csv = [headers, ...rows].map(r => r.map(csvEscape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_alumco_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function sedeLabel(s: string) {
    return s === 'sede_1' ? 'Sede Hualpén' : 'Sede Coyhaique'
  }

  function statusColor(pct: number, pending: number) {
    if (pct === 100) return { bg: 'bg-[#EDFAF3]', text: 'text-[#1A6B3A]', label: 'Completado', bar: 'bg-[#27AE60]' }
    if (pct < 50 && pending > 0) return { bg: 'bg-[#FAECE7]', text: 'text-[#E74C3C]', label: 'En riesgo', bar: 'bg-[#E74C3C]' }
    return { bg: 'bg-[#FFF8EC]', text: 'text-[#92600A]', label: 'En progreso', bar: 'bg-[#F5A623]' }
  }

  return (
    <div className="min-h-screen p-4 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Reportes de cumplimiento</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">
            Seguimiento de capacitaciones por trabajador, sede y área
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2B4FA0] text-white rounded-xl font-semibold text-sm hover:bg-[#1A2F6B] transition-colors min-h-[48px] shrink-0"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Exportar CSV
        </button>
      </div>

      {/* Stats cards — mismo patrón que dashboard */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">

        <div className="bg-[#2B4FA0] text-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4">
            <Users className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Trabajadores</p>
          <p className="text-3xl font-extrabold">{filteredStats.total}</p>
        </div>

        <div className="bg-[#EDFAF3] text-[#1A6B3A] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
          <div className="w-10 h-10 rounded-full bg-[#27AE60]/10 flex items-center justify-center mb-4">
            <CheckCircle className="w-5 h-5 text-[#27AE60]" aria-hidden="true" />
          </div>
          <p className="text-[#1A6B3A]/70 text-xs font-semibold uppercase tracking-wider mb-1">Al día</p>
          <p className="text-3xl font-extrabold">{filteredStats.compliant}</p>
        </div>

        <div className="bg-[#FAECE7] text-[#E74C3C] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
          <div className="w-10 h-10 rounded-full bg-[#E74C3C]/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-5 h-5 text-[#E74C3C]" aria-hidden="true" />
          </div>
          <p className="text-[#E74C3C]/70 text-xs font-semibold uppercase tracking-wider mb-1">En riesgo</p>
          <p className="text-3xl font-extrabold">{filteredStats.risk}</p>
        </div>

        <div className="bg-[#FFF8EC] text-[#92600A] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 lg:p-6">
          <div className="w-10 h-10 rounded-full bg-[#F5A623]/20 flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-[#F5A623]" aria-hidden="true" />
          </div>
          <p className="text-[#92600A]/70 text-xs font-semibold uppercase tracking-wider mb-1">Cumplimiento</p>
          <p className="text-3xl font-extrabold">{filteredStats.avg}%</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-[#6B7280]" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-[#1A1A2E]">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
          />

          <select
            value={sede}
            onChange={e => setSede(e.target.value as typeof sede)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors bg-white"
          >
            <option value="todas">Todas las sedes</option>
            <option value="sede_1">Sede Hualpén</option>
            <option value="sede_2">Sede Coyhaique</option>
          </select>

          <select
            value={area}
            onChange={e => setArea(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors bg-white"
          >
            <option value="todas">Todas las áreas</option>
            {AREAS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={estado}
            onChange={e => setEstado(e.target.value as typeof estado)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors bg-white"
          >
            <option value="todos">Todos los estados</option>
            <option value="compliant">Al día (100%)</option>
            <option value="pendiente">Con pendientes</option>
            <option value="riesgo">En riesgo (&lt;50%)</option>
          </select>
        </div>
      </div>

      {/* Tabla de trabajadores */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-5 lg:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-[#1A1A2E]">Trabajadores</h2>
          <span className="text-sm text-[#6B7280]">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#6B7280]">No hay trabajadores con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(worker => {
              const color = statusColor(worker.progressPct, worker.pendingCourses.length)
              const isExpanded = expandedWorker === worker.user_id
              const initials = worker.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

              return (
                <div key={worker.user_id}>
                  <div
                    className="px-5 lg:px-6 py-4 hover:bg-gray-50/70 transition-colors cursor-pointer"
                    onClick={() => setExpandedWorker(isExpanded ? null : worker.user_id)}
                  >
                    <div className="flex items-center gap-4">

                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center text-[#2B4FA0] font-bold text-sm shrink-0">
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-[#1A1A2E] text-sm truncate">
                            {worker.full_name}
                          </p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${color.bg} ${color.text}`}>
                            {color.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#6B7280] flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            worker.sede === 'sede_1'
                              ? 'bg-[#E6F1FB] text-[#2B4FA0]'
                              : 'bg-[#EAF3DE] text-[#27500A]'
                          }`}>
                            {sedeLabel(worker.sede)}
                          </span>
                          <span>·</span>
                          <span>{worker.area_trabajo.join(', ')}</span>
                          <span>·</span>
                          <span>{worker.completedCourses}/{worker.totalCourses} cursos</span>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="hidden sm:flex items-center gap-3 shrink-0">
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#6B7280]">Progreso</span>
                            <span className="font-semibold text-[#1A1A2E]">{worker.progressPct}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                              style={{ width: `${worker.progressPct}%` }}
                            />
                          </div>
                        </div>
                        {worker.pendingCourses.length > 0 && (
                          <span className="text-[10px] font-bold text-[#E74C3C] bg-[#FAECE7] px-2 py-0.5 rounded-full">
                            {worker.pendingCourses.length} pendiente{worker.pendingCourses.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {worker.pendingCourses.length > 0 && (
                        <button
                          className="p-1 rounded text-[#6B7280] hover:text-[#2B4FA0] transition-colors shrink-0"
                          aria-label={isExpanded ? 'Colapsar' : 'Ver cursos pendientes'}
                        >
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4" aria-hidden="true" />
                            : <ChevronDown className="h-4 w-4" aria-hidden="true" />
                          }
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && worker.pendingCourses.length > 0 && (
                    <div className="px-5 lg:px-6 pb-4 bg-gray-50/50">
                      <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-2">
                        Cursos pendientes
                      </p>
                      <div className="space-y-2">
                        {worker.pendingCourses.map(course => (
                          <div
                            key={course.course_id}
                            className="flex items-center gap-3 bg-white rounded-lg px-4 py-2.5 border border-gray-100"
                          >
                            <div className="h-2 w-2 rounded-full bg-[#E74C3C] shrink-0" aria-hidden="true" />
                            <p className="text-sm text-[#1A1A2E]">{course.course_title}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
