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
  area_trabajo: string
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
      if (area !== 'todas' && w.area_trabajo !== area) return false
      if (estado === 'compliant' && w.progressPct !== 100) return false
      if (estado === 'pendiente' && w.pendingCourses.length === 0) return false
      if (estado === 'riesgo' && w.progressPct >= 50) return false
      if (search && !w.full_name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }).sort((a, b) => a.progressPct - b.progressPct)
  }, [workers, sede, area, estado, search])

  // Stats filtradas
  const filteredStats = useMemo(() => {
    const total = filtered.length
    const compliant = filtered.filter(w => w.progressPct === 100).length
    const risk = filtered.filter(w => w.progressPct < 50 && w.pendingCourses.length > 0).length
    const avg = total > 0
      ? Math.round(filtered.reduce((acc, w) => acc + w.progressPct, 0) / total)
      : 0
    return { total, compliant, risk, avg }
  }, [filtered])

  function handleExport() {
    const headers = ['Nombre', 'Sede', 'Área', 'Cursos totales', 'Completados', 'Pendientes', 'Progreso %', 'Cursos pendientes']
    const rows = filtered.map(w => [
      w.full_name,
      w.sede === 'sede_1' ? 'Sede Hualpén' : 'Sede Coyhaique',
      w.area_trabajo,
      w.totalCourses,
      w.completedCourses,
      w.pendingCourses.length,
      `${w.progressPct}%`,
      w.pendingCourses.map(p => p.course_title).join(' | '),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
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
    if (pct === 100) return { bg: 'bg-[#EAF3DE]', text: 'text-[#27500A]', label: 'Completado', bar: 'bg-[#27AE60]' }
    if (pct < 50 && pending > 0) return { bg: 'bg-[#FAECE7]', text: 'text-[#E74C3C]', label: 'En riesgo', bar: 'bg-[#E74C3C]' }
    return { bg: 'bg-[#FFF8E7]', text: 'text-[#854F0B]', label: 'En progreso', bar: 'bg-[#F5A623]' }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#1A1A2E]">Reportes de cumplimiento</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Seguimiento de capacitaciones por trabajador, sede y área
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#2B4FA0] text-[#2B4FA0] text-sm font-semibold hover:bg-[#2B4FA0]/5 transition-colors min-h-[48px] shrink-0"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Exportar CSV
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#2B4FA0] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Trabajadores</p>
          </div>
          <p className="text-3xl font-extrabold">{filteredStats.total}</p>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-[#EAF3DE] flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-[#27AE60]" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Al día</p>
          </div>
          <p className="text-3xl font-extrabold text-[#1A1A2E]">{filteredStats.compliant}</p>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-[#FAECE7] flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-[#E74C3C]" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">En riesgo</p>
          </div>
          <p className="text-3xl font-extrabold text-[#E74C3C]">{filteredStats.risk}</p>
        </div>

        <div className="bg-white rounded-2xl border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-xl bg-[#FFF8E7] flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-[#F5A623]" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cumplimiento</p>
          </div>
          <p className="text-3xl font-extrabold text-[#1A1A2E]">{filteredStats.avg}%</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-[#1A1A2E]">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Búsqueda */}
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
          />

          {/* Sede */}
          <select
            value={sede}
            onChange={e => setSede(e.target.value as typeof sede)}
            className="h-10 px-3 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors bg-background"
          >
            <option value="todas">Todas las sedes</option>
            <option value="sede_1">Sede Hualpén</option>
            <option value="sede_2">Sede Coyhaique</option>
          </select>

          {/* Área */}
          <select
            value={area}
            onChange={e => setArea(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors bg-background"
          >
            <option value="todas">Todas las áreas</option>
            {AREAS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Estado */}
          <select
            value={estado}
            onChange={e => setEstado(e.target.value as typeof estado)}
            className="h-10 px-3 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors bg-background"
          >
            <option value="todos">Todos los estados</option>
            <option value="compliant">Al día (100%)</option>
            <option value="pendiente">Con pendientes</option>
            <option value="riesgo">En riesgo (&lt;50%)</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="px-4 lg:px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-[#1A1A2E]">
            Trabajadores
          </h2>
          <span className="text-sm text-muted-foreground">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No hay trabajadores con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map(worker => {
              const color = statusColor(worker.progressPct, worker.pendingCourses.length)
              const isExpanded = expandedWorker === worker.user_id

              return (
                <div key={worker.user_id}>
                  {/* Fila principal */}
                  <div
                    className="px-4 lg:px-6 py-4 hover:bg-[#F5F5F5]/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedWorker(isExpanded ? null : worker.user_id)}
                  >
                    <div className="flex items-center gap-4">

                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center text-[#2B4FA0] font-bold text-sm shrink-0">
                        {worker.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-[#1A1A2E] text-sm truncate">
                            {worker.full_name}
                          </p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${color.bg} ${color.text}`}>
                            {color.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{sedeLabel(worker.sede)}</span>
                          <span>·</span>
                          <span>{worker.area_trabajo}</span>
                          <span>·</span>
                          <span>{worker.completedCourses}/{worker.totalCourses} cursos</span>
                        </div>
                      </div>

                      {/* Progreso */}
                      <div className="hidden sm:flex items-center gap-3 shrink-0">
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progreso</span>
                            <span className="font-semibold">{worker.progressPct}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${color.bar}`}
                              style={{ width: `${worker.progressPct}%` }}
                            />
                          </div>
                        </div>
                        {worker.pendingCourses.length > 0 && (
                          <span className="text-xs font-semibold text-[#E74C3C] bg-[#FAECE7] px-2 py-0.5 rounded-full">
                            {worker.pendingCourses.length} pendiente{worker.pendingCourses.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Expandir */}
                      {worker.pendingCourses.length > 0 && (
                        <button
                          className="p-1 rounded text-muted-foreground hover:text-[#2B4FA0] transition-colors shrink-0"
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

                  {/* Cursos pendientes expandidos */}
                  {isExpanded && worker.pendingCourses.length > 0 && (
                    <div className="px-4 lg:px-6 pb-4 bg-[#F5F5F5]/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Cursos pendientes
                      </p>
                      <div className="space-y-2">
                        {worker.pendingCourses.map(course => (
                          <div
                            key={course.course_id}
                            className="flex items-center gap-3 bg-white rounded-lg px-4 py-2.5 border"
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