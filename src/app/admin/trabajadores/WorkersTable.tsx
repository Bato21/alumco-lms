'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AREAS_TRABAJO } from '@/lib/types/database'
import { WorkerEditPanel } from '@/components/alumco/WorkerEditPanel'

interface Worker {
  id: string
  full_name: string
  rut: string | null
  sede: string
  area_trabajo: string[]
  role: string
  status: string
}

type SortField = 'full_name' | 'sede' | 'area_trabajo' | 'role' | 'status'
type SortDir = 'asc' | 'desc'

function AreaBadges({ areas }: { areas: string[] }) {
  const visible = areas.slice(0, 2)
  const extra = areas.length - 2
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map(a => (
        <span key={a} className="text-[10px] bg-[#E6F1FB] text-[#2B4FA0] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
          {a}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-[10px] bg-gray-100 text-[#6B7280] px-2 py-0.5 rounded-full font-semibold">
          +{extra} más
        </span>
      )}
    </div>
  )
}

export function WorkersTable({ workers }: { workers: Worker[] }) {
  const [search, setSearch] = useState('')
  const [sede, setSede] = useState<'todas' | 'sede_1' | 'sede_2'>('todas')
  const [area, setArea] = useState('todas')
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [sortField, setSortField] = useState<SortField>('full_name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = workers.filter(w => {
    if (sede !== 'todas' && w.sede !== sede) return false
    if (area !== 'todas' && !w.area_trabajo.includes(area)) return false
    if (search && !w.full_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    let valA: string
    let valB: string

    switch (sortField) {
      case 'full_name':
        valA = a.full_name.toLowerCase()
        valB = b.full_name.toLowerCase()
        break
      case 'sede':
        valA = a.sede
        valB = b.sede
        break
      case 'area_trabajo':
        valA = a.area_trabajo[0]?.toLowerCase() ?? ''
        valB = b.area_trabajo[0]?.toLowerCase() ?? ''
        break
      case 'role':
        valA = a.role
        valB = b.role
        break
      case 'status':
        valA = a.status
        valB = b.status
        break
      default:
        return 0
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1
    if (valA > valB) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  return (
    <>
      {selectedWorker && (
        <WorkerEditPanel
          profileId={selectedWorker.id}
          fullName={selectedWorker.full_name}
          rut={selectedWorker.rut}
          sede={selectedWorker.sede}
          areas={selectedWorker.area_trabajo}
          onClose={() => setSelectedWorker(null)}
        />
      )}

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0]"
          />
          <select
            value={sede}
            onChange={e => setSede(e.target.value as 'todas' | 'sede_1' | 'sede_2')}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0]"
          >
            <option value="todas">Todas las sedes</option>
            <option value="sede_1">Sede Hualpén</option>
            <option value="sede_2">Sede Coyhaique</option>
          </select>
          <select
            value={area}
            onChange={e => setArea(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0]"
          >
            <option value="todas">Todas las áreas</option>
            {AREAS_TRABAJO.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-widest text-[#6B7280] font-bold">
                <tr>
                  <th className="px-5 lg:px-6 py-3 cursor-pointer select-none">
                    <button
                      onClick={() => handleSort('full_name')}
                      className="flex items-center gap-1 group text-[11px] uppercase tracking-widest text-[#6B7280] font-bold hover:text-[#1A1A2E] transition-colors"
                    >
                      Trabajador
                      <SortIcon field="full_name" currentField={sortField} direction={sortDir} />
                    </button>
                  </th>
                  <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">RUT</th>
                  <th className="px-5 lg:px-6 py-3 text-center hidden lg:table-cell cursor-pointer select-none">
                    <button
                      onClick={() => handleSort('sede')}
                      className="flex items-center gap-1 group text-[11px] uppercase tracking-widest text-[#6B7280] font-bold hover:text-[#1A1A2E] transition-colors"
                    >
                      Sede
                      <SortIcon field="sede" currentField={sortField} direction={sortDir} />
                    </button>
                  </th>
                  <th className="px-5 lg:px-6 py-3 hidden lg:table-cell cursor-pointer select-none">
                    <button
                      onClick={() => handleSort('area_trabajo')}
                      className="flex items-center gap-1 group text-[11px] uppercase tracking-widest text-[#6B7280] font-bold hover:text-[#1A1A2E] transition-colors"
                    >
                      Áreas
                      <SortIcon field="area_trabajo" currentField={sortField} direction={sortDir} />
                    </button>
                  </th>
                  <th className="px-5 lg:px-6 py-3 text-center hidden lg:table-cell cursor-pointer select-none">
                    <button
                      onClick={() => handleSort('role')}
                      className="flex items-center gap-1 group text-[11px] uppercase tracking-widest text-[#6B7280] font-bold hover:text-[#1A1A2E] transition-colors"
                    >
                      Rol
                      <SortIcon field="role" currentField={sortField} direction={sortDir} />
                    </button>
                  </th>
                  <th className="px-5 lg:px-6 py-3 cursor-pointer select-none">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-1 group text-[11px] uppercase tracking-widest text-[#6B7280] font-bold hover:text-[#1A1A2E] transition-colors"
                    >
                      Estado
                      <SortIcon field="status" currentField={sortField} direction={sortDir} />
                    </button>
                  </th>
                  <th className="px-5 lg:px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 lg:px-6 py-16 text-center text-[#6B7280]">
                      No se encontraron trabajadores con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  sorted.map(worker => {
                    const initials = worker.full_name
                      .split(' ')
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()

                    return (
                      <tr key={worker.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-5 lg:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center text-[#2B4FA0] font-bold text-sm shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#1A1A2E] truncate max-w-[160px]">
                                {worker.full_name}
                              </p>
                              <p className="text-xs text-[#6B7280] lg:hidden truncate">
                                {worker.area_trabajo[0] ?? '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 lg:px-6 py-4 text-[#6B7280] font-mono text-xs hidden lg:table-cell">
                          {worker.rut ?? '—'}
                        </td>
                        <td className="px-5 lg:px-6 py-4 text-center hidden lg:table-cell">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            worker.sede === 'sede_1'
                              ? 'bg-[#E6F1FB] text-[#2B4FA0]'
                              : 'bg-[#EAF3DE] text-[#27500A]'
                          }`}>
                            {worker.sede === 'sede_1' ? 'Hualpén' : 'Coyhaique'}
                          </span>
                        </td>
                        <td className="px-5 lg:px-6 py-4 hidden lg:table-cell">
                          <AreaBadges areas={worker.area_trabajo} />
                        </td>
                        <td className="px-5 lg:px-6 py-4 text-center hidden lg:table-cell">
                          <span className="capitalize bg-[#E6F1FB] text-[#2B4FA0] px-2.5 py-1 rounded-full text-[10px] font-bold">
                            {worker.role}
                          </span>
                        </td>
                        <td className="px-5 lg:px-6 py-4">
                          <span className="flex items-center gap-1.5 font-semibold text-xs text-[#27AE60]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#27AE60]" aria-hidden="true" />
                            Activo
                          </span>
                        </td>
                        <td className="px-5 lg:px-6 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/admin/trabajadores/${worker.id}`}
                              className="text-[#2B4FA0] text-sm font-semibold hover:underline whitespace-nowrap"
                            >
                              Ver detalle
                            </Link>
                            <button
                              onClick={() => setSelectedWorker(worker)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-[#2B4FA0] text-[#2B4FA0] text-sm font-semibold hover:bg-[#2B4FA0]/5 transition-colors min-h-[36px]"
                              aria-label={`Editar ${worker.full_name}`}
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

function SortIcon({
  field,
  currentField,
  direction,
}: {
  field: SortField
  currentField: SortField
  direction: SortDir
}) {
  const isActive = field === currentField
  return (
    <span className="inline-flex flex-col ml-1 opacity-40 group-hover:opacity-100 transition-opacity">
      <svg
        className={`h-3 w-3 -mb-1 ${isActive && direction === 'asc' ? 'text-[#2B4FA0] opacity-100' : ''}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
      >
        <path d="M18 15l-6-6-6 6"/>
      </svg>
      <svg
        className={`h-3 w-3 ${isActive && direction === 'desc' ? 'text-[#2B4FA0] opacity-100' : ''}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
      >
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </span>
  )
}
