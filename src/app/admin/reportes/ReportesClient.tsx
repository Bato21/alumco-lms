'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Download, ChevronDown, ChevronUp } from 'lucide-react'
import { EncabezadoPagina, TarjetaStat, Avatar, Badge, Progreso, Icono } from '@/components/alumco/ds'

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

type Tono = 'ok' | 'peligro' | 'aviso'

export function ReportesClient({ workers, courses }: ReportesClientProps) {
  const searchParams = useSearchParams()
  const cursoParam = searchParams.get('curso')
  const initialSearch = cursoParam ? (courses.find((c) => c.id === cursoParam)?.title ?? '') : ''

  const [sede, setSede] = useState<'todas' | 'sede_1' | 'sede_2'>('todas')
  const [area, setArea] = useState<string>('todas')
  const [estado, setEstado] = useState<'todos' | 'compliant' | 'pendiente' | 'riesgo'>('todos')
  const [expandedWorker, setExpandedWorker] = useState<string | null>(null)
  const [search, setSearch] = useState(initialSearch)

  const filtered = useMemo(() => {
    return workers
      .filter((w) => {
        if (sede !== 'todas' && w.sede !== sede) return false
        if (area !== 'todas' && !w.area_trabajo.includes(area)) return false
        if (estado === 'compliant' && w.progressPct !== 100) return false
        if (estado === 'pendiente' && w.pendingCourses.length === 0) return false
        if (estado === 'riesgo' && w.progressPct >= 50) return false
        if (search) {
          const q = search.toLowerCase()
          const matchesName = w.full_name.toLowerCase().includes(q)
          const matchesCourse = w.pendingCourses.some((c) => c.course_title.toLowerCase().includes(q))
          if (!matchesName && !matchesCourse) return false
        }
        return true
      })
      .sort((a, b) => a.progressPct - b.progressPct)
  }, [workers, sede, area, estado, search])

  const filteredStats = useMemo(() => {
    const total = filtered.length
    const compliant = filtered.filter((w) => w.progressPct === 100).length
    const risk = filtered.filter((w) => w.progressPct < 50 && w.pendingCourses.length > 0).length
    const avg = total > 0 ? Math.round(filtered.reduce((acc, w) => acc + w.progressPct, 0) / total) : 0
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
    const rows = filtered.map((w) => [
      w.full_name,
      w.sede === 'sede_1' ? 'Sede Hualpén' : 'Sede Coyhaique',
      w.area_trabajo.join(' | '),
      w.totalCourses,
      w.completedCourses,
      w.pendingCourses.length,
      `${w.progressPct}%`,
      w.pendingCourses.map((p) => p.course_title).join(' | '),
    ])
    const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_alumco_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function sedeLabel(s: string) {
    return s === 'sede_1' ? 'Hualpén' : 'Coyhaique'
  }

  function estadoTono(pct: number, pending: number): [Tono, string] {
    if (pct === 100) return ['ok', 'Completado']
    if (pct < 50 && pending > 0) return ['peligro', 'En riesgo']
    return ['aviso', 'En progreso']
  }

  return (
    <div data-screen-label="Admin · Reportes">
      <EncabezadoPagina titulo="Reportes" sub="Cumplimiento de capacitaciones por trabajador, sede y área">
        <button onClick={handleExport} className="btn btn-primary">
          <Download className="h-4 w-4" aria-hidden="true" /> Exportar CSV
        </button>
      </EncabezadoPagina>

      {/* Stats */}
      <div
        className="entra entra-1"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}
      >
        <TarjetaStat etiqueta="Trabajadores" valor={filteredStats.total} icono="usuarios" />
        <TarjetaStat etiqueta="Al día" valor={filteredStats.compliant} icono="check" />
        <TarjetaStat etiqueta="En riesgo" valor={filteredStats.risk} icono="alerta" tono="peligro" />
        <TarjetaStat etiqueta="Cumplimiento" valor={`${filteredStats.avg}%`} icono="reportes" tono="ambar" />
      </div>

      {/* Filtros */}
      <div className="card card-pad entra entra-2" style={{ marginBottom: 20 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="input-busqueda">
            <Icono n="lupa" s={18} />
            <input type="text" placeholder="Buscar por nombre…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar" />
          </div>
          <select className="select" value={sede} onChange={(e) => setSede(e.target.value as typeof sede)} aria-label="Sede">
            <option value="todas">Todas las sedes</option>
            <option value="sede_1">Sede Hualpén</option>
            <option value="sede_2">Sede Coyhaique</option>
          </select>
          <select className="select" value={area} onChange={(e) => setArea(e.target.value)} aria-label="Área">
            <option value="todas">Todas las áreas</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select className="select" value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)} aria-label="Estado">
            <option value="todos">Todos los estados</option>
            <option value="compliant">Al día (100%)</option>
            <option value="pendiente">Con pendientes</option>
            <option value="riesgo">En riesgo (&lt;50%)</option>
          </select>
        </div>
      </div>

      {/* Lista de trabajadores */}
      <div className="card entra entra-3">
        <div className="fila card-pad" style={{ paddingBottom: 12 }}>
          <h2 className="crece" style={{ fontSize: 16.5 }}>Trabajadores</h2>
          <span className="texto-s silencio-3">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="card-pad" style={{ textAlign: 'center', padding: '48px 16px' }}>
            <p className="silencio">No hay trabajadores con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="col" style={{ gap: 0 }}>
            {filtered.map((worker) => {
              const [tono, label] = estadoTono(worker.progressPct, worker.pendingCourses.length)
              const isExpanded = expandedWorker === worker.user_id
              return (
                <div key={worker.user_id} style={{ borderTop: '1px solid var(--borde-suave)' }}>
                  {/* El control accesible del plegado es el <button> del
                      chevron (abajo): tiene foco, aria-expanded y
                      aria-controls. El clic sobre la fila entera se conserva
                      como atajo de ratón y por eso no necesita rol ni tabindex
                      propios — duplicarlo crearía una parada de tabulación
                      redundante que envuelve a otros controles. */}
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                  <div
                    className="fila"
                    style={{ gap: 16, padding: '14px 22px', cursor: 'pointer', flexWrap: 'wrap' }}
                    onClick={() => setExpandedWorker(isExpanded ? null : worker.user_id)}
                  >
                    <Avatar nombre={worker.full_name} s={40} />
                    <div className="crece" style={{ minWidth: 200 }}>
                      <div className="fila" style={{ gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: 14.5 }}>{worker.full_name}</strong>
                        <Badge tono={tono} punto={false}>{label}</Badge>
                      </div>
                      <div className="texto-s silencio-3 fila" style={{ gap: 8, flexWrap: 'wrap' }}>
                        <Badge tono="info" punto={false}>{sedeLabel(worker.sede)}</Badge>
                        <span>{worker.area_trabajo.join(', ') || 'Sin área'}</span>
                        <span>· {worker.completedCourses}/{worker.totalCourses} cursos</span>
                      </div>
                    </div>
                    <div className="fila" style={{ gap: 12, minWidth: 180 }}>
                      <div style={{ width: 130 }}>
                        <div className="fila texto-s" style={{ marginBottom: 4 }}>
                          <span className="crece silencio-3">Progreso</span>
                          <strong>{worker.progressPct}%</strong>
                        </div>
                        <Progreso pct={worker.progressPct} azul={worker.progressPct >= 50} alto={7} />
                      </div>
                      {worker.pendingCourses.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          aria-label={`${isExpanded ? 'Ocultar' : 'Ver'} cursos pendientes de ${worker.full_name}`}
                          aria-expanded={isExpanded}
                          aria-controls={`pendientes-${worker.user_id}`}
                          onClick={(e) => {
                            // Sin esto el clic burbujea a la fila y el
                            // plegado se dispara dos veces (queda igual).
                            e.stopPropagation()
                            setExpandedWorker(isExpanded ? null : worker.user_id)
                          }}
                        >
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4" aria-hidden="true" />
                            : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && worker.pendingCourses.length > 0 && (
                    <div id={`pendientes-${worker.user_id}`} style={{ padding: '0 22px 16px', background: 'var(--crema)' }}>
                      <p className="texto-s silencio-3" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, padding: '12px 0 8px' }}>
                        Cursos pendientes
                      </p>
                      <div className="col" style={{ gap: 8 }}>
                        {worker.pendingCourses.map((course) => (
                          <div
                            key={course.course_id}
                            className="fila"
                            style={{ gap: 12, background: 'var(--blanco)', borderRadius: 'var(--radio-m)', padding: '10px 14px', border: '1px solid var(--borde-suave)' }}
                          >
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--peligro)', flex: 'none' }} aria-hidden="true" />
                            <p className="texto-s">{course.course_title}</p>
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
