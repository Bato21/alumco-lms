'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { updateProfileAction, uploadFirmaAction, deleteFirmaAction } from '@/lib/actions/trabajadores'
import { Mail, MapPin, Calendar, CreditCard } from 'lucide-react'
import { TarjetaStat, Badge } from '@/components/alumco/ds'

interface ProfileClientProps {
  userId: string
  fullName: string
  rut: string | null
  email: string
  sede: string
  areas: string[]
  role: string
  status: string
  fechaNacimiento: string | null
  avatarUrl: string | null
  firmaUrl: string | null
  createdAt: string
  approvedAt: string | null
  completedCount: number
  inProgressCount: number
  notStartedCount: number
  certsCount: number
  totalCreated?: number
  capacitatedWorkers?: number
  approvalRate?: number
  totalCerts?: number
}

const roleLabel: Record<string, string> = {
  admin: 'Administrador',
  profesor: 'Profesor',
  trabajador: 'Trabajador',
}

const sedeLabel: Record<string, string> = {
  sede_1: 'Sede Hualpén',
  sede_2: 'Sede Coyhaique',
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function ProfileClient({
  userId,
  fullName,
  rut,
  email,
  sede,
  areas,
  role,
  status,
  fechaNacimiento,
  avatarUrl,
  firmaUrl: initialFirmaUrl,
  createdAt,
  completedCount,
  inProgressCount,
  notStartedCount,
  certsCount,
  totalCreated,
  capacitatedWorkers,
  approvalRate,
  totalCerts,
}: ProfileClientProps) {
  const initial = fechaNacimiento ?? ''
  const [fechaNac, setFechaNac] = useState(initial)
  const today = new Date().toISOString().split('T')[0]
  const [isPending, startTransition] = useTransition()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [firmaUrl, setFirmaUrl] = useState(initialFirmaUrl)
  const [firmaFile, setFirmaFile] = useState<File | null>(null)
  const [firmaPreview, setFirmaPreview] = useState<string | null>(initialFirmaUrl)
  const [isFirmaPending, startFirmaTransition] = useTransition()
  const [firmaError, setFirmaError] = useState<string | null>(null)
  const [firmaSuccess, setFirmaSuccess] = useState(false)

  const hasChanges = fechaNac !== initial

  function handleFirmaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFirmaFile(file)
    const reader = new FileReader()
    reader.onload = () => setFirmaPreview(reader.result as string)
    reader.readAsDataURL(file)
    setFirmaError(null)
  }

  function handleUploadFirma() {
    if (!firmaFile) return
    setFirmaError(null)
    setFirmaSuccess(false)
    startFirmaTransition(async () => {
      const fd = new FormData()
      fd.append('firma', firmaFile)
      const result = await uploadFirmaAction(userId, fd)
      if (result.success) {
        setFirmaSuccess(true)
        setFirmaFile(null)
        if (result.url) setFirmaUrl(result.url)
        setTimeout(() => setFirmaSuccess(false), 3000)
      } else {
        setFirmaError(result.error ?? 'Error al subir la firma')
      }
    })
  }

  function handleDeleteFirma() {
    if (!confirm('¿Eliminar tu firma digital?')) return
    setFirmaError(null)
    startFirmaTransition(async () => {
      const result = await deleteFirmaAction(userId)
      if (result.success) {
        setFirmaUrl(null)
        setFirmaPreview(null)
        setFirmaFile(null)
      } else {
        setFirmaError(result.error ?? 'Error al eliminar la firma')
      }
    })
  }

  function handleSave() {
    startTransition(async () => {
      setSuccessMsg(null)
      setErrorMsg(null)
      const fd = new FormData()
      fd.append('fecha_nacimiento', fechaNac)
      const result = await updateProfileAction(userId, fd)
      if (result.success) {
        setSuccessMsg('Perfil actualizado correctamente')
        setTimeout(() => setSuccessMsg(null), 3000)
      } else {
        setErrorMsg(result.error ?? 'Error al guardar')
      }
    })
  }

  const initial2 = fullName.charAt(0).toUpperCase()

  return (
    <div className="space-y-6">

      {/* ── Card perfil ─────────────────────────────────────── */}
      <div className="card card-pad">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Avatar + nombre + badges */}
          <div className="flex flex-col items-center lg:items-start gap-3 lg:w-56 shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-[var(--ambar-50)] text-[var(--ambar)] text-3xl font-bold flex items-center justify-center">
                {initial2}
              </div>
            )}
            <p className="text-center lg:text-left" style={{ fontWeight: 700, fontSize: 20 }}>
              {fullName}
            </p>
            <Badge tono="info" punto={false}>{roleLabel[role] ?? role}</Badge>
            {status === 'activo' && <Badge tono="ok">Activo</Badge>}
          </div>

          {/* Datos de solo lectura */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--tinta-3)] uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                Correo electrónico
              </p>
              <p className="text-sm font-medium text-[var(--tinta)] break-all">{email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--tinta-3)] uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                RUT
              </p>
              <p className="text-sm font-medium text-[var(--tinta)]">
                {rut ?? <span className="text-[var(--tinta-3)] italic">No registrado</span>}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--tinta-3)] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                Sede
              </p>
              <p className="text-sm font-medium text-[var(--tinta)]">
                {sedeLabel[sede] ?? sede}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--tinta-3)] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                Fecha de ingreso
              </p>
              <p className="text-sm font-medium text-[var(--tinta)]">
                {createdAt ? formatDate(createdAt) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Áreas de trabajo ────────────────────────────────── */}
      <div className="card card-pad space-y-3">
        <div>
          <h2 className="text-base font-bold text-[var(--tinta)]">Áreas de trabajo asignadas</h2>
          <p className="text-xs text-[var(--tinta-3)] mt-0.5">Asignado por tu administrador</p>
        </div>

        {areas.length === 0 ? (
          <p className="silencio texto-s" style={{ fontStyle: 'italic' }}>Sin área asignada</p>
        ) : (
          <div className="fila" style={{ flexWrap: 'wrap', gap: 8 }}>
            {areas.map(area => (
              <Badge key={area} tono="info" punto={false}>{area}</Badge>
            ))}
          </div>
        )}

        <p className="text-xs text-[var(--tinta-3)]">
          Para modificar tus áreas de trabajo, contacta a tu administrador.
        </p>
      </div>

      {/* ── Formulario editable ─────────────────────────────── */}
      <div className="card card-pad space-y-4">
        <h2 className="text-base font-bold text-[var(--tinta)]">Información personal editable</h2>

        <div className="space-y-1.5">
          <label htmlFor="fecha_nacimiento" className="block text-xs font-semibold text-[var(--tinta-3)] uppercase tracking-wider">
            Fecha de nacimiento
          </label>
          <input
            id="fecha_nacimiento"
            type="date"
            value={fechaNac}
            onChange={e => setFechaNac(e.target.value)}
            max={today}
            className="input"
            style={{ width: 260, maxWidth: '100%' }}
          />
        </div>

        {successMsg && <p className="texto-s" style={{ fontWeight: 600, color: 'var(--ok)' }}>{successMsg}</p>}
        {errorMsg && <p className="texto-s" style={{ fontWeight: 600, color: 'var(--peligro)' }}>{errorMsg}</p>}

        <button type="button" onClick={handleSave} disabled={isPending || !hasChanges} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>

      {/* ── Firma digital (solo admin / profesor) ───────────── */}
      {(role === 'admin' || role === 'profesor') && (
        <div className="card card-pad space-y-4">
          <div>
            <h2 className="font-bold text-[var(--tinta)]">Firma digital</h2>
            <p className="text-sm text-[var(--tinta-3)] mt-1">
              Tu firma se incluirá automáticamente en los certificados
              de los cursos que has creado.
            </p>
          </div>

          {firmaPreview ? (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-[var(--borde)] rounded-xl p-4 flex items-center justify-center bg-[var(--arena-100)] min-h-[120px]">
                <Image
                  src={firmaPreview}
                  alt="Tu firma digital"
                  width={240}
                  height={96}
                  className="max-h-24 max-w-full object-contain"
                  unoptimized
                />
              </div>
              <div className="fila" style={{ gap: 10 }}>
                <label className="btn btn-secondary crece" style={{ cursor: 'pointer' }}>
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFirmaChange} />
                  Cambiar firma
                </label>
                <button onClick={handleDeleteFirma} disabled={isFirmaPending} className="btn btn-peligro-ghost">
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[var(--borde)] rounded-xl p-8 cursor-pointer hover:border-[var(--ambar)] hover:bg-[var(--ambar-50)] transition-colors min-h-[140px]">
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleFirmaChange}
              />
              <div className="h-10 w-10 rounded-full bg-[var(--arena-100)] flex items-center justify-center">
                <svg className="h-5 w-5 text-[var(--tinta-3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[var(--tinta)]">Subir firma digital</p>
                <p className="text-xs text-[var(--tinta-3)] mt-1">PNG o JPG · Fondo transparente recomendado · Máx 2MB</p>
              </div>
            </label>
          )}

          {firmaFile && (
            <div className="fila" style={{ gap: 12, padding: 12, background: 'var(--ambar-50)', borderRadius: 'var(--radio-m)' }}>
              <p className="texto-s crece recorte" style={{ fontWeight: 600, color: 'var(--azul-800)' }}>{firmaFile.name}</p>
              <button onClick={handleUploadFirma} disabled={isFirmaPending} className="btn btn-primary btn-sm">
                {isFirmaPending ? 'Guardando…' : 'Guardar firma'}
              </button>
            </div>
          )}

          {firmaError && (
            <p className="text-sm text-[#E74C3C] font-medium">{firmaError}</p>
          )}
          {firmaSuccess && (
            <p className="text-sm text-[#27AE60] font-medium">✓ Firma guardada correctamente</p>
          )}
        </div>
      )}

      {/* ── Stats rápidas ────────────────────────────────────── */}
      {(role === 'admin' || role === 'profesor') ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <TarjetaStat etiqueta="Cursos creados" valor={totalCreated ?? 0} icono="cursos" />
          <TarjetaStat etiqueta="Trabajadores capacitados" valor={capacitatedWorkers ?? 0} icono="usuarios" />
          <TarjetaStat etiqueta="Aprobación" valor={`${approvalRate ?? 0}%`} icono="reportes" tono="ambar" />
          <TarjetaStat etiqueta="Certificados emitidos" valor={totalCerts ?? 0} icono="certificado" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <TarjetaStat etiqueta="Completados" valor={completedCount} icono="check" />
          <TarjetaStat etiqueta="En progreso" valor={inProgressCount} icono="reloj" />
          <TarjetaStat etiqueta="Sin iniciar" valor={notStartedCount} icono="cursos" />
          <TarjetaStat etiqueta="Certificados" valor={certsCount} icono="certificado" tono="ambar" />
        </div>
      )}

    </div>
  )
}
