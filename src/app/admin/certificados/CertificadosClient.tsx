'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Certificate {
  id: string
  issued_at: string
  user_id: string
  course_id: string
  courses: { title: string } | null
  profile: {
    full_name: string
    sede: string
    area_trabajo: string[]
  } | null
}

interface CertificadosClientProps {
  certificates: Certificate[]
  total: number
}

export default function CertificadosClient({ certificates, total }: CertificadosClientProps) {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = certificates.filter(cert => {
    if (search) {
      const q = search.toLowerCase()
      const nameMatch = cert.profile?.full_name.toLowerCase().includes(q)
      const courseMatch = cert.courses?.title.toLowerCase().includes(q)
      if (!nameMatch && !courseMatch) return false
    }
    if (dateFrom) {
      const [fromY, fromM, fromD] = dateFrom.split('-').map(Number)
      const certDate = new Date(cert.issued_at)
      const certY = certDate.getFullYear()
      const certM = certDate.getMonth() + 1
      const certD = certDate.getDate()
      const certNum = certY * 10000 + certM * 100 + certD
      const fromNum = fromY * 10000 + fromM * 100 + fromD
      if (certNum < fromNum) return false
    }
    if (dateTo) {
      const [toY, toM, toD] = dateTo.split('-').map(Number)
      const certDate = new Date(cert.issued_at)
      const certY = certDate.getFullYear()
      const certM = certDate.getMonth() + 1
      const certD = certDate.getDate()
      const certNum = certY * 10000 + certM * 100 + certD
      const toNum = toY * 10000 + toM * 100 + toD
      if (certNum > toNum) return false
    }
    return true
  })

  function handleExport() {
    const headers = ['Trabajador', 'Curso', 'Sede', 'Fecha', 'ID']
    const rows = filtered.map(cert => [
      cert.profile?.full_name ?? '—',
      cert.courses?.title ?? '—',
      cert.profile?.sede === 'sede_1' ? 'Hualpén' : 'Coyhaique',
      new Intl.DateTimeFormat('es-CL', {
        day: '2-digit', month: 'short', year: 'numeric',
      }).format(new Date(cert.issued_at)),
      cert.id.slice(0, 8).toUpperCase(),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `certificados-alumco-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Certificados emitidos</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">Registro completo para auditorías normativas SENAMA</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#2B4FA0] text-[#2B4FA0] text-sm font-semibold hover:bg-[#2B4FA0]/5 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar CSV
          </button>
          <span className="bg-[#2B4FA0]/10 text-[#2B4FA0] text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap">
            {total} {total === 1 ? 'certificado' : 'certificados'}
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* Búsqueda */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre o curso..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-10 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
            />
          </div>

          {/* Desde */}
          <div className="relative">
            <label className="absolute -top-2 left-3 text-[10px] font-semibold text-[#6B7280] bg-white px-1">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 h-10 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
            />
          </div>

          {/* Hasta */}
          <div className="relative">
            <label className="absolute -top-2 left-3 text-[10px] font-semibold text-[#6B7280] bg-white px-1">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 h-10 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-[#2B4FA0]/20 focus:border-[#2B4FA0] transition-colors"
            />
          </div>
        </div>

        {/* Contador y reset */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-[#6B7280]">
            {filtered.length} de {total} certificado{total !== 1 ? 's' : ''}
          </p>
          {(search || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }}
              className="text-xs text-[#2B4FA0] font-semibold hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-widest text-[#6B7280] font-bold">
              <tr>
                <th className="px-5 lg:px-6 py-3">Trabajador</th>
                <th className="px-5 lg:px-6 py-3 hidden sm:table-cell">Curso</th>
                <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">Sede</th>
                <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">Fecha emisión</th>
                <th className="px-5 lg:px-6 py-3 hidden lg:table-cell">ID</th>
                <th className="px-5 lg:px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-[#6B7280]">
                    No hay certificados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map(cert => {
                  const initials = cert.profile?.full_name
                    ? cert.profile.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                    : '?'

                  const issuedDate = new Intl.DateTimeFormat('es-CL', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  }).format(new Date(cert.issued_at))

                  return (
                    <tr key={cert.id} className="hover:bg-gray-50/70 transition-colors">

                      {/* Trabajador */}
                      <td className="px-5 lg:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#2B4FA0]/10 flex items-center justify-center text-[#2B4FA0] font-bold text-sm shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1A1A2E] truncate max-w-[160px]">
                              {cert.profile?.full_name ?? '—'}
                            </p>
                            <p className="text-xs text-[#6B7280] truncate">
                              {Array.isArray(cert.profile?.area_trabajo)
                                ? cert.profile.area_trabajo.join(', ')
                                : (cert.profile?.area_trabajo ?? '')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Curso */}
                      <td className="px-5 lg:px-6 py-4 hidden sm:table-cell">
                        <p className="text-sm font-medium text-[#1A1A2E] max-w-[180px] truncate">
                          {cert.courses?.title ?? '—'}
                        </p>
                      </td>

                      {/* Sede */}
                      <td className="px-5 lg:px-6 py-4 hidden lg:table-cell">
                        {cert.profile?.sede ? (
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            cert.profile.sede === 'sede_1'
                              ? 'bg-[#E6F1FB] text-[#2B4FA0]'
                              : 'bg-[#EAF3DE] text-[#27500A]'
                          }`}>
                            {cert.profile.sede === 'sede_1' ? 'Hualpén' : 'Coyhaique'}
                          </span>
                        ) : (
                          <span className="text-[#6B7280] text-xs">—</span>
                        )}
                      </td>

                      {/* Fecha */}
                      <td className="px-5 lg:px-6 py-4 text-sm text-[#6B7280] hidden lg:table-cell">
                        {issuedDate}
                      </td>

                      {/* ID */}
                      <td className="px-5 lg:px-6 py-4 hidden lg:table-cell">
                        <span className="text-xs font-mono text-[#6B7280]">
                          {cert.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-5 lg:px-6 py-4 text-right">
                        <Link
                          href={`/certificado/${cert.id}`}
                          className="inline-flex items-center px-4 py-2 text-sm text-[#2B4FA0] font-semibold hover:bg-[#2B4FA0]/5 rounded-lg transition-colors min-h-[44px]"
                        >
                          Ver
                        </Link>
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
  )
}
