'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EncabezadoPagina, Avatar, Badge, Icono } from '@/components/alumco/ds'

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
    <div data-screen-label="Admin · Certificados">
      <EncabezadoPagina titulo="Certificados emitidos" sub="Registro completo para auditorías normativas SENAMA">
        <button onClick={handleExport} className="btn btn-secondary">
          <Icono n="descargar" s={18} /> Exportar CSV
        </button>
        <span className="badge badge-info">{total} {total === 1 ? 'certificado' : 'certificados'}</span>
      </EncabezadoPagina>

      {/* Filtros */}
      <div className="card card-pad entra entra-1" style={{ marginBottom: 20 }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="input-busqueda">
            <Icono n="lupa" s={18} />
            <input type="text" placeholder="Buscar por nombre o curso…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar" />
          </div>
          <div className="campo">
            <label htmlFor="cert-desde">Desde</label>
            <input id="cert-desde" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input" />
          </div>
          <div className="campo">
            <label htmlFor="cert-hasta">Hasta</label>
            <input id="cert-hasta" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input" />
          </div>
        </div>
        <div className="fila" style={{ marginTop: 12 }}>
          <p className="texto-s silencio-3 crece">{filtered.length} de {total} certificado{total !== 1 ? 's' : ''}</p>
          {(search || dateFrom || dateTo) && (
            <button onClick={() => { setSearch(''); setDateFrom(''); setDateTo('') }} className="btn btn-ghost btn-sm">
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="card entra entra-2 tabla-envoltura">
        <table className="tabla">
          <thead>
            <tr>
              <th>Trabajador</th>
              <th className="hidden sm:table-cell">Curso</th>
              <th className="hidden lg:table-cell">Sede</th>
              <th className="hidden lg:table-cell">Fecha emisión</th>
              <th className="hidden lg:table-cell">Folio</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="silencio" style={{ textAlign: 'center', padding: '48px 16px' }}>
                  No hay certificados con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filtered.map(cert => {
                const issuedDate = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(cert.issued_at))
                return (
                  <tr key={cert.id}>
                    <td>
                      <div className="fila" style={{ gap: 12 }}>
                        <Avatar nombre={cert.profile?.full_name ?? '?'} s={36} />
                        <div style={{ minWidth: 0 }}>
                          <div className="recorte" style={{ fontWeight: 600, fontSize: 14.5 }}>{cert.profile?.full_name ?? '—'}</div>
                          <div className="texto-s silencio-3 recorte">
                            {Array.isArray(cert.profile?.area_trabajo) ? cert.profile.area_trabajo.join(', ') : (cert.profile?.area_trabajo ?? '')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell silencio texto-s">{cert.courses?.title ?? '—'}</td>
                    <td className="hidden lg:table-cell">
                      {cert.profile?.sede ? (
                        <Badge tono="info" punto={false}>{cert.profile.sede === 'sede_1' ? 'Hualpén' : 'Coyhaique'}</Badge>
                      ) : (
                        <span className="silencio-3 texto-s">—</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell silencio texto-s">{issuedDate}</td>
                    <td className="hidden lg:table-cell silencio texto-s" style={{ fontFamily: 'monospace' }}>
                      ALC-{cert.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/certificado/${cert.id}`} className="btn btn-ghost btn-sm">
                        <Icono n="ojo" s={16} /> Ver
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
  )
}
