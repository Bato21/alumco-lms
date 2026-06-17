'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AREAS_TRABAJO } from '@/lib/types/database'
import { WorkerEditPanel } from '@/components/alumco/admin/WorkerEditPanel'
import { Avatar, Badge, Icono } from '@/components/alumco/ds'

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
    <div className="fila" style={{ flexWrap: 'wrap', gap: 6 }}>
      {visible.map(a => (
        <Badge key={a} tono="info" punto={false}>{a}</Badge>
      ))}
      {extra > 0 && <Badge tono="neutro" punto={false}>+{extra} más</Badge>}
    </div>
  )
}

export function WorkersTable({ workers, sedes }: { workers: Worker[]; sedes: { id: string; nombre: string }[] }) {
  const [search, setSearch] = useState('')
  const [sede, setSede] = useState<string>('todas')
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
    if (sede === 'sin_sede' && w.sede) return false
    if (sede !== 'todas' && sede !== 'sin_sede' && w.sede !== sede) return false
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
          sedes={sedes}
          onClose={() => setSelectedWorker(null)}
        />
      )}

      <div className="col" style={{ gap: 16 }}>
        {/* Filtros */}
        <div className="card card-pad grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="input-busqueda">
            <Icono n="lupa" s={18} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre…"
              aria-label="Buscar trabajador"
            />
          </div>
          <select className="select" value={sede} onChange={e => setSede(e.target.value)} aria-label="Filtrar por sede">
            <option value="todas">Todas las sedes</option>
            {sedes.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
            <option value="sin_sede">Sin sede asignada</option>
          </select>
          <select className="select" value={area} onChange={e => setArea(e.target.value)} aria-label="Filtrar por área">
            <option value="todas">Todas las áreas</option>
            {AREAS_TRABAJO.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Tabla */}
        <div className="card tabla-envoltura min-w-0">
            <table className="tabla">
              <thead>
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
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="silencio" style={{ textAlign: 'center', padding: '48px 16px' }}>
                      No se encontraron trabajadores con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  sorted.map(worker => (
                    <tr key={worker.id}>
                      <td>
                        <div className="fila" style={{ gap: 12 }}>
                          <Avatar nombre={worker.full_name} s={38} />
                          <div style={{ minWidth: 0 }}>
                            <div className="recorte" style={{ fontWeight: 600, fontSize: 14.5 }}>{worker.full_name}</div>
                            <div className="texto-s silencio-3 lg:hidden recorte">{worker.area_trabajo[0] ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="silencio texto-s hidden lg:table-cell" style={{ fontFamily: 'monospace' }}>
                        {worker.rut ?? '—'}
                      </td>
                      <td className="hidden lg:table-cell">
                        {!worker.sede ? (
                          <Badge tono="aviso" punto={false}>Sin sede</Badge>
                        ) : (
                          <Badge tono="info" punto={false}>{sedes.find(s => s.id === worker.sede)?.nombre ?? worker.sede}</Badge>
                        )}
                      </td>
                      <td className="hidden lg:table-cell">
                        <AreaBadges areas={worker.area_trabajo} />
                      </td>
                      <td className="hidden lg:table-cell">
                        <Badge tono="info" punto={false}>{worker.role}</Badge>
                      </td>
                      <td>
                        <Badge tono="ok">Activo</Badge>
                      </td>
                      <td>
                        <div className="fila" style={{ justifyContent: 'flex-end', gap: 8 }}>
                          <Link
                            href={`/admin/trabajadores/${worker.id}`}
                            className="btn btn-ghost btn-sm"
                            aria-label={`Ver detalle de ${worker.full_name}`}
                            title="Ver detalle"
                          >
                            <Icono n="ojo" s={16} />
                          </Link>
                          <button
                            onClick={() => setSelectedWorker(worker)}
                            className="btn btn-secondary btn-sm"
                            aria-label={`Editar ${worker.full_name}`}
                            title="Editar"
                          >
                            <Icono n="editar" s={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
